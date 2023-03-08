import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn, exec } from 'child_process';
import { Cluster } from 'puppeteer-cluster';
import { createLogger, format, transports } from 'winston';
import moment from 'moment';

import { pipelineConfig } from './pipelineConfig.js';
import { screens } from './src/utils/screens.js';
import { getFinalOutputName } from './src/utils/finalOutputNames.js';

// create output directory
let outputRoot = `./pipelineOutput`;
if (!fs.existsSync(outputRoot)) {
  fs.mkdirSync(`${outputRoot}/frames`, { recursive: true });
}

// remove any existing frame directories
// console.log('deleting existing frame output directories');
// fs.readdirSync(`${outputRoot}/frames`, { withFileTypes: true })
//   .filter((d) => d.isDirectory())
//   .map((d) => d.name)
//   .forEach((dir) => {
//     fs.rmSync(`${outputRoot}/frames/${dir}`, { recursive: true });
//   });

// --- STATUS --------------------------------
let sceneTitlesRaw = fs.readFileSync('./src/data/processed/sceneTitles.json');
let scenes = JSON.parse(sceneTitlesRaw).map((d) => d.shortName);
let formats = Object.keys(screens);
let pipelineStatus = []; // array of all scenes/format combos
for (let s of scenes) {
  for (let f of formats) {
    pipelineStatus.push({
      scene: s,
      format: f,
      id: `${s}-${f}`, // combine scene and format into unique ID
      state: 'idle',
      startedAt: null,
      completedAt: null,
      clients: [],
      frames: []
    });
  }
}

const getSceneStatus = (scene, format) => {
  // return the status of the current scene/format combo
  return pipelineStatus.find((d) => d.scene === scene && d.format === format);
};

// --- Logging stuff -------------------------------
const tsFormat = () => moment().format('YYYY-MM-DD HH:mm:ss').trim();
let logger = createLogger({
  transports: [
    new transports.File({
      level: 'debug',
      filename: `${outputRoot}/pipelineLog.log`,
      maxsize: 5242880, // 5MB
      format: format.combine(format.timestamp({ format: tsFormat }), format.json())
    }),
    new transports.Console({
      level: 'info',
      format: format.simple()
    })
  ],
  exitOnError: false // do not exit on handled exceptions
});

// --- Multithreading stuff -----------------------
const jobsPerScene = pipelineConfig.jobsPerScene; // how many different jobs to divide a scene's frames amongst
const concurrency = pipelineConfig.concurrency; // number of scenes at once is concurrency / jobsPerScene
const startCluster = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,
    maxConcurrency: pipelineConfig.concurrency,
    monitor: pipelineConfig.clusterMonitor,
    workerCreationDelay: 100, // put a slight delay in to avoid network spikes
    puppeteerOptions: {
      headless: false,
      args: [
        '--window-size=400,200',
        // '--enable-webgl',
        '--use-cmd-decoder=passthrough'
      ]
    },
    timeout: (3600 / 0.1) * 1000 // set really long timeout so job doesnt cancel (.1 fps)
  });

  cluster.on('taskerror', (err, data) => {
    console.log(`Error ${data}: ${err.message}`);
  });

  // define the task
  await cluster.task(async ({ page, data: { scene, format, startFrame, endFrame } }) => {
    let url = `http://localhost:8080/?scene=${scene}&format=${format}&startFrame=${startFrame}&endFrame=${endFrame}`;
    await page.goto(url, { timeout: 0 });

    // waiting until the done tag appears
    await page.waitForSelector('#done-tag', { timeout: 0 });
    await page.close();
  });

  return cluster;
};
const renderingPool = await startCluster();

// --- WEBSERVER ----------------------------
const hostedDir = 'src';
const port = 8080;

// create server
const app = express();

// multer form parsing for handling files sent to the server
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let { scene, format } = req.body;
    let outputDir = `${outputRoot}/frames/${scene}/${format}`;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    cb(null, outputDir);
  },
  filename: (req, file, cb) => {
    let frameNum = req.body.frameNum;
    cb(null, `${frameNum.padStart(5, '0')}.png`);
  }
});
const upload = multer({ storage: storage });
app.use(upload.single('image'));

app.use(express.static(hostedDir)); // host files in src;
const server = createServer(app);
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});

// --- ROUTES ---------------------------------
// handle frame image upload (request will be processed via multer)
app.post('/image', (req, res) => {
  // update status doc
  const { scene, format, frameNum } = req.body;
  const status = getSceneStatus(scene, format);
  status.frames[frameNum - 1] = 1;
  res.json({ resp: `POST request for ${req.body.name} received` });

  // send status to pipeline manager client
  sendStatusToPipelineRoom();
  logger.debug(`${scene}-${format}: frame ${frameNum} received`);
  // if all images are received, trigger ffmpeg step to convert to movie
  if (status.frames.every((d) => d)) {
    convertFramesToVideo(scene, format);
  }
});

// --- SOCKET SERVER ---------------------------
const io = new Server(server);

io.on('connection', (socket) => {
  let id = socket.id;
  let scene = null;
  let format = null;

  // --- Incomming messages on this connection
  // put this socket on the "pipeline" channel
  socket.on('connectToPipelineRoom', () => {
    logger.info(`${id} joining pipeline room`);
    socket.join('pipeline');
  });

  // send the latest pipeline status to pipeline room
  socket.on('requestStatus', () => {
    sendStatusToPipelineRoom();
  });

  // start the set of scenes rendering  (this msg comes from pipelineManager.html)
  socket.on('render-scenes', (msg) => {
    let { scenes } = msg;
    scenes.forEach((s) => {
      let { scene, format, totalFrames } = s;

      // delete any existing scene frames
      let frameDir = `${outputRoot}/frames/${scene}/${format}`;
      if (fs.existsSync(`${frameDir}`)) {
        fs.rmSync(`${frameDir}`, { recursive: true });
      }

      // update states for this scene-format
      let status = getSceneStatus(scene, format);
      status.state = 'queued';
      status.startedAt = null;
      status.completedAt = null; // reset in case this scene has already run
      status.totalFrames = totalFrames;
      status.frames = [...Array(totalFrames)].map((d) => null);
      sendStatusToPipelineRoom();

      // split each scene's frames into parallel jobs
      let framesPerJob = Math.floor(totalFrames / jobsPerScene);
      for (let i = 0; i < jobsPerScene; i++) {
        let startFrame = 1 + i * framesPerJob;
        let endFrame = startFrame + framesPerJob - 1;
        endFrame = endFrame > totalFrames ? totalFrames : endFrame;

        // add to rendering pool
        logger.info(
          `Adding job to rendering pool: ${scene}-${format} frames ${startFrame}-${endFrame}`
        );
        renderingPool.queue({ scene, format, startFrame, endFrame });
      }
    });
  });

  // rendering client just checked in (this msg comes from browser running THREE scene, puppeteer or not)
  socket.on('rendering-client', (msg) => {
    scene = msg.scene;
    format = msg.format;
    let totalFrames = msg.totalFrames;
    logger.info(`new rendering client for ${scene}-${format}: ${id}`);

    // update status
    let status = getSceneStatus(scene, format);
    status.totalFrames = totalFrames;
    status.clients.push(id);
    if (status.frames.length === 0) {
      status.frames = [...Array(totalFrames)].map((d) => null);
    }
    status.state = 'rendering';
    if (!status.startedAt) {
      status.startedAt = new Date().getTime();
    }
    sendStatusToPipelineRoom();
  });

  // rendering client just saved a frame
  socket.on('saved-frame', (msg) => {
    let { scene, format, frameNum } = msg;

    // update status
    let status = getSceneStatus(scene, format);
    status.frames[frameNum - 1] = 1;
    sendStatusToPipelineRoom();
  });

  // if the socket was a rendering client, remove from the list of active clients
  socket.on('disconnect', () => {
    if (scene && format) {
      let status = getSceneStatus(scene, format);
      status.clients = status.clients.filter((d) => d !== id);
      logger.info(`disconnected rendering client ${id} for ${scene}-${format}`);
      sendStatusToPipelineRoom();
    }
  });
});

// outgoing socket messages
const sendStatusToPipelineRoom = () => {
  // broadcast the current pipeline status to all browsers in the pipeline room
  io.to('pipeline').emit('status', { scenes: pipelineStatus });
};

// --- VIDEO CONVERSION ----------------------------
const getFFMPEG = (mode, frameDir, outputName) => {
  switch (mode) {
    // H.264 25fps
    case 'H264-25':
      return `ffmpeg -framerate 60 -i ${frameDir}/%05d.png -vcodec libx264 -pix_fmt yuv420p -r 25 -y ${outputName} -loglevel info`;
    // H.264 60fps
    case 'H264-60':
      return `ffmpeg -framerate 60 -i ${frameDir}/%05d.png -vcodec libx264 -pix_fmt yuv420p -y ${outputName} -loglevel info`;
    // ProRes LT 422 29.97fps
    case 'ProResLt-29.97':
      return `ffmpeg -framerate 60 -i ${frameDir}/%05d.png -c:v prores_ks -profile:v 1 -vendor ap10 -bits_per_mb 8000 -pix_fmt yuv422p -timecode "00:00:00;00" -r 29.97 -y ${outputName} -loglevel info`;
    default:
      console.log(`Unrecognized mode ${mode}`);
  }
};

const convertFramesToVideo = (scene, format) => {
  let status = getSceneStatus(scene, format);
  status.state = 'converting to video';
  logger.info(`${scene}-${format} converting frames to video`);
  sendStatusToPipelineRoom();

  try {
    // get final RAA output name (if name there be)
    let outputFileName = getFinalOutputName(scene, format);

    // input/output diretories
    let frameDir = `${outputRoot}/frames/${scene}/${format}`;
    let outputDir = `${outputRoot}/finalVideos`;
    let outputName = `${outputDir}/${outputFileName}`;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // get the appropriate ffmpeg command
    let cmd;
    if (format === 'HD') {
      outputName = `${outputName}.mp4`;
      cmd = getFFMPEG('H264-60', frameDir, outputName); // H.264 60fps
    } else if (format === 'fourK' || format === 'foyer') {
      outputName = `${outputName}.mp4`;
      cmd = getFFMPEG('H264-25', frameDir, outputName); // H.264 25fps
    } else if (format === 'plenary') {
      let proResOutputName = `${outputName}.mov`;
      let H264OutputName = `${outputName}.mp4`;
      cmd = `${getFFMPEG('ProResLt-29.97', frameDir, proResOutputName)} && ${getFFMPEG(
        'H264-60',
        frameDir,
        H264OutputName
      )}`; // ProResLt 422 & H.264 60fps
    }

    const process = spawn(cmd, { shell: true });
    process.stdout.on('data', (data) => console.log('stdout', data));
    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    }); // prints out ffmpeg logs
    process.on('error', (error) => console.log('error', error));
    process.on('close', (code) => {
      console.log(`${scene}-${format} video process exited with code ${code}`);
      status.state = 'completed';
      status.completedAt = new Date().getTime();
      status.frames = [...Array(status.totalFrames)].map((d) => null); // reset totalFrames
      logger.info(`${scene}-${format} final video finished`);
      sendStatusToPipelineRoom();
    });
  } catch (error) {
    console.log('error', error);
  }
};
