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
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const schedulerIdRef = useRef<number | null>(null);
  const nextClickTimeRef = useRef<number>(0);
  const currentPulseRef = useRef<number>(0);
  const currentBarRef = useRef<number>(0);
  const isInGapRef = useRef<boolean>(false);

  // Initialize audio engine once
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();

    return () => {
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
    return beats.length * PULSES_PER_BEAT[noteValue];
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
      const beat = beats[mainBeatIndex];
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
    const currentTime = audioEngine.getCurrentTime();
    const scheduleAheadTime = 0.1; // Schedule 100ms ahead
    const clickInterval = getClickInterval();
    const totalPulses = getTotalPulsesPerBar();

    // Schedule all clicks that should happen in the next 100ms
    while (nextClickTimeRef.current < currentTime + scheduleAheadTime) {
      const pulseIndex = currentPulseRef.current % totalPulses;
      const shouldPlay = shouldPlaySound(currentBarRef.current);
      const inGap = !shouldPlay;

      // Update gap status
      if (isInGapRef.current !== inGap) {
        isInGapRef.current = inGap;
        setIsInGap(inGap);
      }

      // Play click if not in gap and beat is active
      if (shouldPlay) {
        const clickType = getPulseClickType(pulseIndex);
        if (clickType !== null) {
          audioEngine.playClick(clickType, nextClickTimeRef.current);
        }
      }

      // Expose main beat index to UI (not pulse index)
      const mainBeat = getMainBeatIndex(pulseIndex);
      setCurrentBeat(mainBeat);
      setCurrentBar(currentBarRef.current);

      // Move to next pulse
      currentPulseRef.current++;

      // Check if we completed a bar
      if (currentPulseRef.current % totalPulses === 0) {
        currentBarRef.current++;
      }

      nextClickTimeRef.current += clickInterval;
    }
  };

  // Start the metronome
  const start = async () => {
    if (!audioEngineRef.current) return;

    // Resume audio context (required by browsers)
    await audioEngineRef.current.resume();

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

    // Start the scheduler
    schedulerIdRef.current = window.setInterval(scheduler, 25); // Check every 25ms
  };

  // Stop the metronome
  const stop = () => {
    if (schedulerIdRef.current !== null) {
      clearInterval(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }

    setIsPlaying(false);
    setCurrentBeat(0);
    setCurrentBar(0);
    setIsInGap(false);

    currentPulseRef.current = 0;
    currentBarRef.current = 0;
    isInGapRef.current = false;
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
    if (isPlaying) {
      // Reset scheduler with new settings
      stop();
      start();
    }
  }, [bpm, noteValue, isPlaying, barsOn, barsOff, useGapClick]);

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
