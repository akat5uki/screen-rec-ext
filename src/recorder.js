let mediaRecorder;
let recordedChunks = [];

export async function startRecording() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `recording_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    recordedChunks = [];
  };

  mediaRecorder.start();
}

export function stopRecording() {
  mediaRecorder.stop();
}


