import { useEffect, useRef, useState } from 'react';
import type { Beat, NoteValue } from '../types/index.js';
import type { ClickType } from '../utils/audioUtils.js';
import { AudioEngine } from '../utils/audioUtils.js';
import { NOTE_VALUE_MULTIPLIERS, PULSES_PER_BEAT } from '../utils/constants.js';

interface UseMetronomeProps {
  bpm: number;
  noteValue: NoteValue;
  beats: Beat[];
  barsOn: number;
  barsOff: number;
  useGapClick: boolean;
}

interface UseMetronomeReturn {
  isPlaying: boolean;
  currentBeat: number;
  currentBar: number;
  isInGap: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useMetronome({
  bpm,
  noteValue,
  beats,
  barsOn,
  barsOff,
  useGapClick,
}: UseMetronomeProps): UseMetronomeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [isInGap, setIsInGap] = useState(false);

  // Refs for values that need to be accessed in scheduler without re-creating it
  const beatsRef = useRef<Beat[]>(beats);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const nextClickTimeRef = useRef<number>(0);
  const currentPulseRef = useRef<number>(0);
  const currentBarRef = useRef<number>(0);
  const isInGapRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const schedulerRef = useRef<() => void>(() => {});

  // Keep beatsRef in sync with latest beats prop
  useEffect(() => {
    beatsRef.current = beats;
  }, [beats]);

  // Initialize audio engine and worker
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();

    const worker = new Worker(
      new URL('../workers/schedulerWorker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = () => {
      schedulerRef.current();
    };
    workerRef.current = worker;

    const handleVisibilityChange = () => {
      if (!document.hidden && isPlayingRef.current && audioEngineRef.current) {
        audioEngineRef.current.ensureRunning();
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      worker.terminate();
      workerRef.current = null;
      releaseWakeLock();
      if (audioEngineRef.current) {
        audioEngineRef.current.close();
      }
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

  // The scheduler function - runs frequently to schedule audio ahead of time
  const scheduler = () => {
    if (!audioEngineRef.current) return;

    const audioEngine = audioEngineRef.current;

    // Check AudioContext state - try to resume if suspended
    const state = audioEngine.getState();
    if (state === 'suspended' || state === 'interrupted') {
      audioEngine.ensureRunning().then(wasResumed => {
        if (wasResumed) {
          // Reset timing to prevent burst of queued clicks after resume
          nextClickTimeRef.current = audioEngine.getCurrentTime() + 0.05;
        }
      });
      return;
    }

    const currentTime = audioEngine.getCurrentTime();
    const scheduleAheadTime = 0.2; // Schedule 200ms ahead (mobile-safe)
    const clickInterval = getClickInterval();
    const totalPulses = getTotalPulsesPerBar();

    // Re-sync if we fell too far behind (e.g. after tab background / screen lock)
    if (nextClickTimeRef.current < currentTime - 0.5) {
      const missedTime = currentTime - nextClickTimeRef.current;
      const missedPulses = Math.floor(missedTime / clickInterval);
      currentPulseRef.current += missedPulses;
      currentBarRef.current = Math.floor(currentPulseRef.current / totalPulses);
      // Jump to slightly in the future to prevent burst playback
      nextClickTimeRef.current = currentTime + 0.05;
    }

    // Schedule all clicks that should happen in the next 200ms
    let lastScheduledBeat = -1;
    let lastScheduledBar = -1;
    let lastScheduledGap = isInGapRef.current;

    while (nextClickTimeRef.current < currentTime + scheduleAheadTime) {
      const pulseIndex = currentPulseRef.current % totalPulses;
      const shouldPlay = shouldPlaySound(currentBarRef.current);
      const inGap = !shouldPlay;

      // Track gap status
      isInGapRef.current = inGap;
      lastScheduledGap = inGap;

      // Play click if not in gap and beat is active
      if (shouldPlay) {
        const clickType = getPulseClickType(pulseIndex);
        if (clickType !== null) {
          audioEngine.playClick(clickType, nextClickTimeRef.current);
        }
      }

      // Track last scheduled beat/bar for UI update
      lastScheduledBeat = getMainBeatIndex(pulseIndex);
      lastScheduledBar = currentBarRef.current;

      // Move to next pulse
      currentPulseRef.current++;

      // Check if we completed a bar
      if (currentPulseRef.current % totalPulses === 0) {
        currentBarRef.current++;
      }

      nextClickTimeRef.current += clickInterval;
    }

    // Update UI state once per scheduler tick (not per beat)
    if (lastScheduledBeat >= 0) {
      setCurrentBeat(lastScheduledBeat);
      setCurrentBar(lastScheduledBar);
      setIsInGap(lastScheduledGap);
    }
  };

  // Keep schedulerRef pointing to the latest scheduler closure
  schedulerRef.current = scheduler;

  // Wake Lock helpers
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Non-critical — can fail on low battery, etc.
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Start the metronome
  const start = async () => {
    if (!audioEngineRef.current) return;

    // Resume audio context (required by browsers, triggers lazy init)
    await audioEngineRef.current.resume();
    audioEngineRef.current.startKeepAlive();

    // Initialize timing
    const currentTime = audioEngineRef.current.getCurrentTime();
    nextClickTimeRef.current = currentTime + 0.05; // Start slightly in the future
    currentPulseRef.current = 0;
    currentBarRef.current = 0;
    isInGapRef.current = false;

    setCurrentBeat(0);
    setCurrentBar(0);
    setIsInGap(false);
    setIsPlaying(true);
    isPlayingRef.current = true;

    // Start the worker-based scheduler
    workerRef.current?.postMessage('start');

    requestWakeLock();
  };

  // Stop the metronome
  const stop = () => {
    workerRef.current?.postMessage('stop');
    audioEngineRef.current?.stopKeepAlive();

    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentBeat(0);
    setCurrentBar(0);
    setIsInGap(false);

    currentPulseRef.current = 0;
    currentBarRef.current = 0;
    isInGapRef.current = false;

    releaseWakeLock();
  };

  // Toggle play/pause
  const toggle = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  // Stop when component unmounts
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  // Update interval when BPM or note value changes (even while playing)
  useEffect(() => {
    if (isPlayingRef.current) {
      // Reset scheduler with new settings
      stop();
      start();
    }
  }, [bpm, noteValue, barsOn, barsOff, useGapClick]);

  return {
    isPlaying,
    currentBeat,
    currentBar,
    isInGap,
    start,
    stop,
    toggle,
  };
}
