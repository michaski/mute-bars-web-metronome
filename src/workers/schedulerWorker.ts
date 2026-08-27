import { SCHEDULER_TICK_MS } from '../utils/constants.js';

let timerID: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  if (e.data === 'start') {
    if (timerID !== null) clearInterval(timerID);
    timerID = setInterval(() => {
      self.postMessage('tick');
    }, SCHEDULER_TICK_MS);
  } else if (e.data === 'stop') {
    if (timerID !== null) {
      clearInterval(timerID);
      timerID = null;
    }
  }
};
