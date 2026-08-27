import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Beat, NoteValue, SoundPack } from '../types/index.js';
import type { ClickType } from '../utils/audioUtils.js';
import { AudioEngine } from '../utils/audioUtils.js';
import {
  ANCHOR_OFFSET,
  LATENCY_SAFETY,
  MAX_PULSES_PER_TICK,
  MIN_SCHEDULE_AHEAD,
  NOTE_VALUE_MULTIPLIERS,
  PULSES_PER_BEAT,
  RESYNC_THRESHOLD_MARGIN,
  RESYNC_THRESHOLD_MIN,
  SCHEDULER_TICK_MS,
  STALE_RETENTION,
} from '../utils/constants.js';

interface UseMetronomeProps {
  bpm: number;
  noteValue: NoteValue;
  beats: Beat[];
  barsOn: number;
  barsOff: number;
  useGapClick: boolean;
  soundPack: SoundPack;
}

interface UseMetronomeReturn {
  isPlaying: boolean;
  currentBeat: number;
  currentBar: number;
  isInGap: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  warmup: () => void;
  setTempoScrubbing: (active: boolean) => void;
}

/** One scheduled pulse, kept so the UI can be driven at the time it is *heard*. */
interface ScheduledEvent {
  pulse: number;
  bar: number;
  beatIndex: number;
  inGap: boolean;
  time: number;
}

export function useMetronome({
  bpm,
  noteValue,
  beats,
  barsOn,
  barsOff,
  useGapClick,
  soundPack,
}: UseMetronomeProps): UseMetronomeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [isInGap, setIsInGap] = useState(false);

  // Refs for values that need to be accessed in scheduler without re-creating it
  const beatsRef = useRef<Beat[]>(beats);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextClickTimeRef = useRef<number>(0);
  const currentPulseRef = useRef<number>(0);
  const currentBarRef = useRef<number>(0);
  const isInGapRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isScrubbingRef = useRef<boolean>(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const schedulerRef = useRef<() => void>(() => {});
  const unsubDeviceChangeRef = useRef<(() => void) | null>(null);
  const pendingEventsRef = useRef<ScheduledEvent[]>([]);
  const rafRef = useRef<number | null>(null);
  // Bumped on every transport change so stale async continuations can bail out.
  const transportGenRef = useRef<number>(0);
  const invalidateTransport = () => {
    transportGenRef.current++;
  };

  // --- Tick transport -------------------------------------------------------
  // A worker timer is preferred (it is not throttled when the tab is hidden),
  // but the lookahead design tolerates a main-thread timer, so worker failure
  // degrades instead of silently killing playback.

  const startTicking = () => {
    if (workerRef.current) {
      workerRef.current.postMessage('start');
      return;
    }
    if (fallbackTimerRef.current !== null) return;
    fallbackTimerRef.current = setInterval(() => {
      schedulerRef.current();
    }, SCHEDULER_TICK_MS);
  };

  const stopTicking = () => {
    workerRef.current?.postMessage('stop');
    if (fallbackTimerRef.current !== null) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  // --- UI loop --------------------------------------------------------------
  // The beat indicator is driven at the moment a pulse is *heard*, not when it
  // was scheduled, so the dot stays in sync with the click even over Bluetooth.

  const runUiLoop = () => {
    rafRef.current = requestAnimationFrame(runUiLoop);

    const engine = audioEngineRef.current;
    if (!engine) return;

    const heard = engine.getCurrentTime() - engine.getTotalLatency();
    const events = pendingEventsRef.current;

    // Apply only the most recent due event: after the tab returns to the
    // foreground a backlog collapses into a single state update.
    let due = -1;
    for (let i = 0; i < events.length; i++) {
      if (events[i].time > heard) break;
      due = i;
    }
    if (due < 0) return;

    const event = events[due];
    setCurrentBeat(event.beatIndex);
    setCurrentBar(event.bar);
    setIsInGap(event.inGap);
  };

  const startUiLoop = () => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(runUiLoop);
  };

  const stopUiLoop = () => {
    if (rafRef.current === null) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  // Initialize audio engine and tick transport
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();

    try {
      const worker = new Worker(
        new URL('../workers/schedulerWorker.ts', import.meta.url),
        { type: 'module' }
      );
      worker.onmessage = () => {
        schedulerRef.current();
      };
      worker.onerror = () => {
        // Module workers are unavailable or blocked. Fall back to a main-thread
        // timer rather than leaving the play button doing nothing.
        worker.terminate();
        workerRef.current = null;
        if (isPlayingRef.current && !isScrubbingRef.current) startTicking();
      };
      workerRef.current = worker;
    } catch {
      workerRef.current = null; // startTicking() will use the fallback timer
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && isPlayingRef.current && audioEngineRef.current) {
        audioEngineRef.current.ensureRunning();
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      invalidateTransport();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubDeviceChangeRef.current?.();
      unsubDeviceChangeRef.current = null;
      stopUiLoop();
      stopTicking();
      workerRef.current?.terminate();
      workerRef.current = null;
      isPlayingRef.current = false;
      isScrubbingRef.current = false;
      pendingEventsRef.current = [];
      releaseWakeLock();
      audioEngineRef.current?.close(); // cancels anything still queued
      audioEngineRef.current = null;
    };
  }, []);

  // Calculate interval between pulses in seconds
  // For half/whole notes, cap at quarter-note speed (beats skip instead of slowing)
  const getClickInterval = (): number => {
    const multiplier = Math.min(NOTE_VALUE_MULTIPLIERS[noteValue], 1);
    const quarterNoteSeconds = 60 / bpm;
    return quarterNoteSeconds * multiplier;
  };

  // Total number of pulses (main beats + subdivisions) in one bar
  const getTotalPulsesPerBar = (): number => {
    return beatsRef.current.length * PULSES_PER_BEAT[noteValue];
  };

  // Convert pulse index to main beat index
  const getMainBeatIndex = (pulseIndex: number): number => {
    const pulsesPerBeat = PULSES_PER_BEAT[noteValue];
    return Math.floor(pulseIndex / pulsesPerBeat);
  };

  // Determine click type based on pulse position within the bar
  // Returns null for inactive beats (no sound)
  const getPulseClickType = (pulseIndex: number): ClickType | null => {
    const pulsesPerBeat = PULSES_PER_BEAT[noteValue];
    const mainBeatIndex = Math.floor(pulseIndex / pulsesPerBeat);
    const subPulseIndex = pulseIndex % pulsesPerBeat;

    if (subPulseIndex === 0) {
      const beat = beatsRef.current[mainBeatIndex];
      if (beat?.type === 'inactive') return null;
      return beat?.type === 'accent' ? 'accent' : 'regular';
    }
    return 'subdivision';
  };

  // Check if we should play sound based on gap click settings
  const shouldPlaySound = (barNumber: number): boolean => {
    if ((barsOn === 0 && barsOff === 0) || useGapClick === false) return true;

    const totalCycle = barsOn + barsOff;
    if (totalCycle === 0) return true;

    const positionInCycle = barNumber % totalCycle;
    return positionInCycle < barsOn;
  };

  // The scheduler function - runs frequently to schedule audio ahead of time.
  // It must never call reanchor() synchronously: reanchor() ends by calling the
  // scheduler, so that would recurse without bound.
  const scheduler = () => {
    const audioEngine = audioEngineRef.current;
    if (!audioEngine) return;

    // Check AudioContext state - try to resume if suspended
    const state = audioEngine.getState();
    if (state === 'suspended' || state === 'interrupted') {
      const gen = transportGenRef.current;
      audioEngine.ensureRunning().then(wasResumed => {
        if (!wasResumed || gen !== transportGenRef.current) return;
        if (!isPlayingRef.current || isScrubbingRef.current) return;
        reanchor('restart');
      });
      return;
    }

    const currentTime = audioEngine.getCurrentTime();
    const totalLatency = audioEngine.getTotalLatency();
    const scheduleAheadTime = Math.max(MIN_SCHEDULE_AHEAD, totalLatency + LATENCY_SAFETY);
    const clickInterval = getClickInterval();
    const totalPulses = getTotalPulsesPerBar();

    // A bar with no pulses would make every modulo below NaN, silently corrupting
    // the bar counter and the gap-click cycle.
    if (totalPulses < 1) return;
    if (!Number.isFinite(clickInterval) || clickInterval <= 0) return;

    // Re-sync if we fell too far behind (e.g. after tab background / screen lock)
    const resyncThreshold = Math.max(
      RESYNC_THRESHOLD_MIN,
      scheduleAheadTime + RESYNC_THRESHOLD_MARGIN
    );
    if (nextClickTimeRef.current < currentTime - resyncThreshold) {
      const missedTime = currentTime - nextClickTimeRef.current;
      const missedPulses = Math.floor(missedTime / clickInterval);
      // Advance the bar by the boundaries actually crossed. Deriving it as
      // floor(pulse / totalPulses) would be wrong whenever the beat count has
      // changed since playback began, jumping the mute-bars cycle.
      const barsBefore = Math.floor(currentPulseRef.current / totalPulses);
      const barsAfter = Math.floor((currentPulseRef.current + missedPulses) / totalPulses);
      currentPulseRef.current += missedPulses;
      currentBarRef.current += barsAfter - barsBefore;

      audioEngine.cancelPending();
      pendingEventsRef.current = [];
      // Jump to slightly in the future to prevent burst playback
      nextClickTimeRef.current = currentTime + ANCHOR_OFFSET;
    }

    // Schedule every pulse falling inside the lookahead window
    let iterations = 0;
    while (nextClickTimeRef.current < currentTime + scheduleAheadTime) {
      // Bounded so a pathological interval degrades instead of freezing the tab
      if (++iterations > MAX_PULSES_PER_TICK) break;

      const pulseIndex = currentPulseRef.current % totalPulses;
      const shouldPlay = shouldPlaySound(currentBarRef.current);
      const inGap = !shouldPlay;

      isInGapRef.current = inGap;

      // Play click if not in gap and beat is active
      if (shouldPlay) {
        const clickType = getPulseClickType(pulseIndex);
        if (clickType !== null) {
          audioEngine.playClick(clickType, nextClickTimeRef.current);
        }
      }

      // Log silent pulses too, so the indicator keeps moving through muted bars
      pendingEventsRef.current.push({
        pulse: currentPulseRef.current,
        bar: currentBarRef.current,
        beatIndex: getMainBeatIndex(pulseIndex),
        inGap,
        time: nextClickTimeRef.current,
      });

      // Move to next pulse
      currentPulseRef.current++;

      // Check if we completed a bar
      if (currentPulseRef.current % totalPulses === 0) {
        currentBarRef.current++;
      }

      nextClickTimeRef.current += clickInterval;
    }

    // Prune here rather than in the UI loop: rAF does not run while hidden.
    const staleBefore = currentTime - STALE_RETENTION;
    if (pendingEventsRef.current.length > 0 && pendingEventsRef.current[0].time < staleBefore) {
      pendingEventsRef.current = pendingEventsRef.current.filter(e => e.time >= staleBefore);
    }
  };

  // Keep schedulerRef pointing to the latest scheduler closure
  schedulerRef.current = scheduler;

  /**
   * The only sanctioned way to move the click grid.
   *
   * Retracts everything still queued, then re-anchors — either from beat 1
   * ('restart') or at the exact times the cancelled pulses already had
   * ('inPlace', for changes like sound pack that should not disturb the rhythm).
   *
   * Must stay fully synchronous. The cutoff returned by cancelPending() is
   * reused below rather than re-reading the clock: rewinding to an earlier
   * point would re-queue a pulse that was left playing, and it would be heard
   * twice.
   */
  const reanchor = (mode: 'restart' | 'inPlace') => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    const cutoff = engine.cancelPending();
    // 0 means there is no AudioContext. Without this bail, 'inPlace' would match
    // the oldest logged event and rewind the anchor into the past.
    if (cutoff <= 0) return;

    if (mode === 'inPlace') {
      const first = pendingEventsRef.current.find(e => e.time >= cutoff);
      pendingEventsRef.current = pendingEventsRef.current.filter(e => e.time < cutoff);
      if (first) {
        currentPulseRef.current = first.pulse;
        currentBarRef.current = first.bar;
        nextClickTimeRef.current = first.time;
        schedulerRef.current();
        return;
      }
      // Nothing was pending (e.g. straight after a suspend) — restart instead.
    }

    pendingEventsRef.current = [];
    currentPulseRef.current = 0;
    currentBarRef.current = 0;
    isInGapRef.current = false;
    nextClickTimeRef.current = cutoff + ANCHOR_OFFSET;
    // Queue beat 1 now instead of waiting up to a full tick for it.
    schedulerRef.current();
  };

  // Wake Lock helpers
  const requestWakeLock = async () => {
    try {
      if (!('wakeLock' in navigator)) return;
      // Overwriting a live sentinel leaks it — it could never be released.
      if (wakeLockRef.current && !wakeLockRef.current.released) return;
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Non-critical — can fail on low battery, etc.
    }
  };

  const releaseWakeLock = async () => {
    const sentinel = wakeLockRef.current;
    wakeLockRef.current = null;
    if (sentinel && !sentinel.released) {
      try {
        await sentinel.release();
      } catch {
        // Already released by the browser (e.g. on tab hide).
      }
    }
  };

  // Start the metronome
  const start = async () => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    const gen = ++transportGenRef.current;

    // Resume audio context (required by browsers, triggers lazy init)
    await engine.resume();
    // A stop / another start landed while we were awaiting — abandon this one.
    if (gen !== transportGenRef.current || !audioEngineRef.current) return;

    engine.setSoundPack(soundPack);
    engine.startKeepAlive();

    // Register device change listener (BT connect/disconnect) if not already registered
    if (!unsubDeviceChangeRef.current) {
      unsubDeviceChangeRef.current = engine.onDeviceChange(() => {
        const deviceGen = transportGenRef.current;
        audioEngineRef.current?.ensureRunning().then(() => {
          if (deviceGen !== transportGenRef.current) return;
          if (!isPlayingRef.current || isScrubbingRef.current) return;
          // The clock is continuous across a device change; only latency moved,
          // so keep the musical position and just re-queue.
          reanchor('inPlace');
        });
      });
    }

    setCurrentBeat(0);
    setCurrentBar(0);
    setIsInGap(false);
    setIsPlaying(true);
    isPlayingRef.current = true;

    startTicking();
    reanchor('restart');
    startUiLoop();

    requestWakeLock();
  };

  // Stop the metronome
  const stop = () => {
    invalidateTransport();
    stopTicking();
    stopUiLoop();

    audioEngineRef.current?.cancelPending();
    audioEngineRef.current?.stopKeepAlive();
    pendingEventsRef.current = [];
    isScrubbingRef.current = false;

    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentBeat(0);
    setCurrentBar(0);
    setIsInGap(false);

    currentPulseRef.current = 0;
    currentBarRef.current = 0;
    isInGapRef.current = false;
    nextClickTimeRef.current = 0;

    releaseWakeLock();
  };

  // Toggle play/pause
  const toggle = () => {
    if (isPlayingRef.current) {
      stop();
    } else {
      start();
    }
  };

  // Build the AudioContext and pre-render click buffers before the first play,
  // so pressing play is not delayed by nine offline renders.
  const warmup = () => {
    audioEngineRef.current?.warmup();
  };

  /**
   * Silences playback for the duration of a tempo-slider drag.
   *
   * The transport stays "playing" throughout — the wake lock and keep-alive
   * oscillator are untouched — so only the ticking pauses. Without this, a drag
   * would fire one beat-1 restart per pixel.
   */
  const setTempoScrubbing = (active: boolean) => {
    if (active === isScrubbingRef.current) return;
    isScrubbingRef.current = active;

    if (!isPlayingRef.current) return;

    if (active) {
      stopTicking();
      audioEngineRef.current?.cancelPending();
      pendingEventsRef.current = [];
      setCurrentBeat(0);
    } else {
      startTicking();
      reanchor('restart');
    }
  };

  // Apply setting changes to live playback.
  //
  // This is deliberately ONE effect. Applying a searched tempo sets bpm,
  // noteValue and beats in a single commit; with separate effects that would
  // fire two transitions and the second would rewind into what the first had
  // just queued.
  //
  // useLayoutEffect is load-bearing. schedulerRef is reassigned during render,
  // but a passive effect runs after paint — a tick landing in that window would
  // queue clicks at the new tempo from the old anchor, and any falling inside
  // the cancel guard would flam against the new beat 1.
  const prevSettingsRef = useRef({
    bpm,
    noteValue,
    barsOn,
    barsOff,
    useGapClick,
    beatCount: beats.length,
  });

  useLayoutEffect(() => {
    beatsRef.current = beats;
    audioEngineRef.current?.setSoundPack(soundPack);

    const prev = prevSettingsRef.current;
    // Beat *count* changes restart: currentPulse is an absolute counter, so once
    // the bar length changes a rewound pulse no longer maps to the same position.
    const needsRestart =
      prev.bpm !== bpm ||
      prev.noteValue !== noteValue ||
      prev.barsOn !== barsOn ||
      prev.barsOff !== barsOff ||
      prev.useGapClick !== useGapClick ||
      prev.beatCount !== beats.length;

    prevSettingsRef.current = {
      bpm,
      noteValue,
      barsOn,
      barsOff,
      useGapClick,
      beatCount: beats.length,
    };

    if (!isPlayingRef.current || isScrubbingRef.current) return;
    // 'inPlace' covers sound pack and accent-type edits: applied instantly
    // without disturbing the beat grid.
    reanchor(needsRestart ? 'restart' : 'inPlace');
  }, [bpm, noteValue, barsOn, barsOff, useGapClick, soundPack, beats]);

  return {
    isPlaying,
    currentBeat,
    currentBar,
    isInGap,
    start,
    stop,
    toggle,
    warmup,
    setTempoScrubbing,
  };
}
