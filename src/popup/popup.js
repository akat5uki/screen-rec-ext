let mediaRecorder;
let recordedChunks = [];
let processor;
let generator;
let videoTrack;
let audioTrack;
let processedStream;
let timerInterval;
let startTime;

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const statusText = document.getElementById("status");
const qualitySelector = document.getElementById("quality");

startBtn.addEventListener("click", async () => {
  try {
    const selectedQuality = parseInt(qualitySelector.value);
    const width = selectedQuality === 1080 ? 1920 : selectedQuality === 720 ? 1280 : selectedQuality === 480 ? 854 : 640;
    const height = selectedQuality === 1080 ? 1080 : selectedQuality === 720 ? 720 : selectedQuality === 480 ? 480 : 360;

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

    videoTrack = stream.getVideoTracks()[0];
    audioTrack = stream.getAudioTracks()[0] || null;

    // Set up resizing with OffscreenCanvas
    processor = new MediaStreamTrackProcessor({ track: videoTrack });
    generator = new MediaStreamTrackGenerator({ kind: 'video' });

    const transformer = new TransformStream({
      async transform(videoFrame, controller) {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoFrame, 0, 0, width, height);
        const newFrame = new VideoFrame(canvas, { timestamp: videoFrame.timestamp });
        controller.enqueue(newFrame);
        videoFrame.close();
      }
    });

    processor.readable
      .pipeThrough(transformer)
      .pipeTo(generator.writable)
      .catch((err) => console.error("Pipeline error:", err));

    processedStream = new MediaStream();
    processedStream.addTrack(generator);
    if (audioTrack) processedStream.addTrack(audioTrack);

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(processedStream, { mimeType: "video/webm" });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      cleanup();
      statusText.textContent = "Recording saved.";
    };

    mediaRecorder.start();
    startTime = Date.now();
    startTimer();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusText.textContent = "Recording...";
  } catch (err) {
    console.error("Error starting recording:", err);
    statusText.textContent = "Recording failed to start.";
    cleanup();
  }
});

stopBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    stopBtn.disabled = true;
    statusText.textContent = "Stopping...";
  }
});

function startTimer() {
  timerInterval = setInterval(() => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    statusText.textContent = `Recording... ${duration}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function cleanup() {
  stopTimer();

  // Stop all tracks
  if (videoTrack) videoTrack.stop();
  if (audioTrack) audioTrack.stop();
  if (processedStream) processedStream.getTracks().forEach(t => t.stop());

  // Abort processor/generator if needed
  try {
    if (processor?.readable) processor.readable.cancel();
  } catch (e) {}
  try {
    if (generator?.writable) generator.writable.abort();
  } catch (e) {}

  // Reset variables
  mediaRecorder = null;
  recordedChunks = [];
  processor = null;
  generator = null;
  videoTrack = null;
  audioTrack = null;
  processedStream = null;

  startBtn.disabled = false;
  stopBtn.disabled = true;
}
