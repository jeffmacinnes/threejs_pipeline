# RAA FII Miami 2023

## Setup

`npm i` to install all dependencies.

The rendering pipeline requires `ffmpeg`. If this is not already installed on your system, open a terminal and:

- `brew install ffmpeg`
- `brew install libvips`

## Development

- Start a webserver (e.g. `python3 -m http.server 3000`) in repo root, open browser and navigate to `localhost:3000/src/index.html`

- Most relevent files are in the `src` directory. Notably:
  - Current scene and format are set by `config.js`
  - `main.js`: entry point, loads any necessary assets and launches Three.js `world`
  - `data/`: subdirs for `/raw` and `/processed` versions of the supporting datasets, and scripts for processing data.
  - `pipelineManager/`: src files specific to the pipeline manger dashboard site
  - `scenes/`: Individual classes (and any supporting files) for each unique scene
  - `world/`: Main `world` class, and classes for environmental items that are shared across all data scenes (e.g. Lights, Labels, etc...)

### Updating Colors

Add/edit colors in `src/utils/color.js` to create a shared color dictionary that can be imported in individual scenes.

### Updating titles

Add/edit titles in shared [google sheet](https://docs.google.com/spreadsheets/d/11NxowTSF5wiuAmZbPjD1KWtsf3awBuP1DWsZReD051k/edit#gid=0)

After editing, pull the data from the google sheet by:

- `cd src/data`
- `node getTitles.js`
- The google sheet will be written to `src/data/processed/sceneTitles.json` and automatically pulled into the `world`

### Editing Camera Paths

If `editor: true` in `config.js`, when you launch your development browser you'll see camera path editor tools along the bottom.

- Use these tools to create key frames for the camera movement
- When you're done, click `export` and save the file to `src/cameraPaths` with the naming convention `[SCENE_SHORTNAME]_[FORMAT].json` (e.g. `sample-HD.json`)

#### Editing Keyframes:

(keyboard)

- I: insert key frame
- W/A/S/D/Q/E: move forward/left/back/right/up/down
- Left arrow: move back one second
- Option left arrow: move to beginning
- Right arrow: move forward one second
- Backspace: deletes selected keyframe
- Space: play/pause

(mouse)

- Drag in the scene to look.
- Click or drag in the "frames" strip to move the playback head.
- Click a keyframe to select it.
- Drag a keyframe to move it.
- Option + drag a keyframe to duplicate it.
- Click frames or seconds to enter a new value.

## Rendering Output Videos via Pipeline Manager

Run the pipeline server whenever you want to create output videos. To launch (from root of repo):

- `node pipelineServer.js`
- Open browser to `localhost:8080/pipelineManager.html`

You should see the pipeline manager dashboard with the option to select the scenes and formats you wish to render. Choose your options and hit `submit`

Once submitted, you'll see a set of puppeteer instances appear as your scene(s) begin to render. Don't close these windows. The number of windows that will open is based on how many jobs are running in parallel and can be modified by adjusting the `pipelineConfig.js` file in the repo root.

As the scenes are rendering, the output frames will appear in `pipelineOutput/frames`. Upon completion, the final output video will appear in `pipelineOutput/finalVideos`. The final output videos have a default filename based on the scene and format, but you can override this with a custom named entered in `src/utils/finalOutputNames.js`
