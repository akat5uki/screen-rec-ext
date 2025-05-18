let mediaRecorder;
let recordedChunks = [];
let startTime;
let timerInterval;

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const statusText = document.getElementById("status");

startBtn.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

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

