// Fixed popup.js for Firefox and Chrome compatibility
let c, g = [], i, a, m, l, s, w, v;

const b = document.getElementById("start");
const y = document.getElementById("stop");
const f = document.getElementById("status");
const k = document.getElementById("quality");

b.addEventListener("click", async () => {
  try {
    const r = parseInt(k.value);
    const d = r === 1080 ? 1920 : r === 720 ? 1280 : r === 480 ? 854 : 640;
    const p = r === 1080 ? 1080 : r === 720 ? 720 : r === 480 ? 480 : 360;

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    m = stream.getVideoTracks()[0];
    l = stream.getAudioTracks()[0] || null;

    const video = document.createElement("video");
    video.srcObject = new MediaStream([m]);
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = d;
    canvas.height = p;
    const ctx = canvas.getContext("2d");

    s = canvas.captureStream();
    if (l) s.addTrack(l);

    g = [];
    c = new MediaRecorder(s, { mimeType: "video/webm" });
    c.ondataavailable = e => {
      if (e.data.size > 0) g.push(e.data);
    };
    c.onstop = () => {
      const blob = new Blob(g, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      h();
      f.textContent = "Recording saved.";
    };

    c.start();
    v = Date.now();
    L();
    b.disabled = true;
    y.disabled = false;
    f.textContent = "Recording...";

    function drawFrame() {
      ctx.drawImage(video, 0, 0, d, p);
      if (c && c.state === "recording") {
        requestAnimationFrame(drawFrame);
      }
    }
    drawFrame();
  } catch (r) {
    console.error("Error starting recording:", r);
    f.textContent = "Recording failed to start.";
    h();
  }
});

y.addEventListener("click", () => {
  if (c && c.state === "recording") {
    c.stop();
    y.disabled = true;
    f.textContent = "Stopping...";
  }
});

function L() {
  w = setInterval(() => {
    const r = Math.floor((Date.now() - v) / 1000);
    f.textContent = `Recording... ${r}s`;
  }, 1000);
}

function E() {
  clearInterval(w);
}

function h() {
  E();
  m && m.stop();
  l && l.stop();
  s && s.getTracks().forEach(r => r.stop());
  c = null;
  g = [];
  m = null;
  l = null;
  s = null;
  b.disabled = false;
  y.disabled = true;
}
