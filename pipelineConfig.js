export const pipelineConfig = {
  jobsPerScene: 6, // how many different jobs to divide a scene's frames amongst
  concurrency: 6, // number of jobs the cluster will accept at once
  clusterMonitor: false
};
