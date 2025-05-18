let mediaRecorder;
let recordedChunks = [];
let startTime;
let timerInterval;

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const statusText = document.getElementById("status");
const qualitySelector = document.getElementById("quality");

startBtn.addEventListener("click", async () => {
  try {
    const selectedQuality = parseInt(qualitySelector.value);
    const resolution = {
      width: selectedQuality === 1080 ? 1920 :
             selectedQuality === 720 ? 1280 :
             selectedQuality === 480 ? 854 : 640,
      height: selectedQuality === 1080 ? 1080 :
              selectedQuality === 720 ? 720 :
              selectedQuality === 480 ? 480 : 360
    };

    // Get screen media
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    const originalVideoTrack = stream.getVideoTracks()[0];

    // Prepare canvas-based resizing
    const processor = new MediaStreamTrackProcessor({ track: originalVideoTrack });
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });

    const transformer = new TransformStream({
      async transform(videoFrame, controller) {
        const canvas = new OffscreenCanvas(resolution.width, resolution.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoFrame, 0, 0, resolution.width, resolution.height);
        const newFrame = new VideoFrame(canvas, { timestamp: videoFrame.timestamp });
        controller.enqueue(newFrame);
        videoFrame.close();
      }
    });

    processor.readable
      .pipeThrough(transformer)
      .pipeTo(generator.writable);

    // Create new stream with resized video and original audio
    const processedStream = new MediaStream();
    processedStream.addTrack(generator);
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      processedStream.addTrack(audioTracks[0]);
    }

    mediaRecorder = new MediaRecorder(processedStream, { mimeType: "video/webm" });
    recordedChunks = [];

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

      stopTimer();
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
  }
});

stopBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    stopBtn.disabled = true;
    startBtn.disabled = false;
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
