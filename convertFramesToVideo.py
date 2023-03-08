import os
from os.path import join
import argparse
import glob

pipelineDir = './pipelineOutput'
outputDir = join(pipelineDir, 'finalVideos')

finalNameMap = {
  # --- fourk ---
  'biodiversity-fourK': '701_Schema_Edit_1_169',
  'methane-fourK': '702_Schema_Edit_2_169',
  'globalTrade-fourK': '703_Schema_Edit_3_169',
  'gmo-fourK': '704_Schema_Edit_4_169',
  'ventureCapital-fourK': '705_Schema_Edit_5_169',
  'sustainableFinance-fourK': '706_Schema_Edit_6_169',
  'battery-fourK': '707_Schema_Edit_7_169',
  'carbonCapture-fourK': '708_Schema_Edit_8_169',
  'energyDependence-fourK': '709_Schema_Edit_9_169',
  'cyberAttacks-fourK': '710_Schema_Edit_10_169',

  # --- foyer ---
  'biodiversity-foyer': '720_Schema_Edit_1_LED',
  'methane-foyer': '721_Schema_Edit_2_LED',
  'globalTrade-foyer': '722_Schema_Edit_3_LED',
  'gmo-foyer': '723_Schema_Edit_4_LED',
  'ventureCapital-foyer': '724_Schema_Edit_5_LED',
  'sustainableFinance-foyer': '725_Schema_Edit_6_LED',
  'battery-foyer': '726_Schema_Edit_7_LED',
  'carbonCapture-foyer': '727_Schema_Edit_8_LED',
  'energyDependence-foyer': '728_Schema_Edit_9_LED',
  'cyberAttacks-foyer': '729_Schema_Edit_10_LED',

  # --- plenary ---
  'biodiversity-plenary': '220_Schema_Edit_1_Plenary',
  'methane-plenary': '221_Schema_Edit_2_Plenary',
  'globalTrade-plenary': '222_Schema_Edit_3_Plenary',
  'gmo-plenary': '223_Schema_Edit_4_Plenary',
  'ventureCapital-plenary': '224_Schema_Edit_5_Plenary',
  'sustainableFinance-plenary': '225_Schema_Edit_6_Plenary',
  'battery-plenary': '226_Schema_Edit_7_Plenary',
  'carbonCapture-plenary': '227_Schema_Edit_8_Plenary',
  'energyDependence-plenary': '228_Schema_Edit_9_Plenary',
  'cyberAttacks-plenary': '229_Schema_Edit_10_Plenary'
}

def convertFramesToVideo(scene, format):
  """ use ffmpeg to convert frames to H.264 and 25fps """
  inputDir = join(pipelineDir, 'frames', scene, format);
  outputName =  finalNameMap[f'{scene}-{format}']
  outputPath = join(outputDir, f'{outputName}_{scene}.mp4')
  cmd_str = f'ffmpeg -framerate 60 -i {inputDir}/%05d.png -vcodec libx264 -pix_fmt yuv420p -r 25 -y {outputPath} -loglevel info'
  
  print(f'==== Converting {scene}-{format} to H.264 at 25fps =====')
  os.system(cmd_str)


def convertFramesToPlenary(scene):
  """ Special processing for plenary scenes """
  # convert to ProRes first
  inputDir = join(pipelineDir, 'frames', scene, 'plenary');
  outputName =  finalNameMap[f'{scene}-plenary']
  outputPath = join(outputDir, f'{outputName}_{scene}.mov')
  cmd_str = f'ffmpeg -framerate 60 -i {inputDir}/%05d.png -c:v prores_ks -profile:v 1 -vendor ap10 -bits_per_mb 8000 -pix_fmt yuv422p -timecode "00:00:00;00" -r 29.97 -y {outputPath} -loglevel info'
  
  print(f'==== Converting {scene}-plenary to ProRes Lt 422 at 29.97fps =====')
  os.system(cmd_str)

  # convert to H264
  outputPath = join(outputDir, f'{outputName}_{scene}.mp4')
  cmd_str = f'ffmpeg -framerate 60 -i {inputDir}/%05d.png -vcodec libx264 -pix_fmt yuv420p -r 25 -y {outputPath} -loglevel info'
  
  print(f'==== Converting {scene}-plenary to H.264 at 60fps =====')
  os.system(cmd_str)


def checkInputs(scene, format):
  """Check to ensure the frames folder exists and has the proper number of frames"""
  inputDir = join(pipelineDir, 'frames', scene, format);

  # confirm input dir exists
  assert os.path.exists(inputDir), f'Frame directory {inputDir} does not exist!'

  # confirm the correct number of frames
  nFrames = 3600
  files = glob.glob(join(inputDir, '*.png'))
  assert len(files) == nFrames, f'Expected {nFrames} frames in {inputDir} but found {len(files)}'



if __name__ == "__main__":
  # parse input arguments
  parser = argparse.ArgumentParser()
  parser.add_argument("-s", "--scene", required=True, help="shortname of the scene you want to convert (e.g. sustainableFinance)")
  parser.add_argument("-f", "--format", required=True, help="format (e.g. fourK)")
  args = parser.parse_args()

  # validate inputs
  checkInputs(args.scene, args.format)

  # call the appropriate function based on format
  if args.format in ['fourK', 'foyer', 'HD']:
    convertFramesToVideo(args.scene, args.format)
  elif args.format == 'plenary':
    convertFramesToPlenary(args.scene)
  else:
    print(f'Unrecognized format: {format}')

  