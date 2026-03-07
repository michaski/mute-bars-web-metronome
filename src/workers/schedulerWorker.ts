let timerID: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  if (e.data === 'start') {
    if (timerID !== null) clearInterval(timerID);
    timerID = setInterval(() => {
      self.postMessage('tick');
    }, 25);
  } else if (e.data === 'stop') {
    if (timerID !== null) {
      clearInterval(timerID);
      timerID = null;
    }
  }
};
