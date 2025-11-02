import { useEffect, useRef, useState } from 'react';
import type { Beat, NoteValue } from '../types/index.js';
import type { ClickType } from '../utils/audioUtils.js';
import { AudioEngine } from '../utils/audioUtils.js';

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
  const currentBeatRef = useRef<number>(0);
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

  // Note value to beat multiplier (relative to quarter note)
  const getNoteValueMultiplier = (note: NoteValue): number => {
    const multipliers: Record<NoteValue, number> = {
      whole: 4,
      half: 2,
      quarter: 1,
      eighth: 0.5,
      sixteenth: 0.25,
      'triplet-eighth': 1 / 3,
    };
    return multipliers[note];
  };

  // Calculate interval between clicks in seconds
  const getClickInterval = (): number => {
    const multiplier = getNoteValueMultiplier(noteValue);
    const quarterNoteSeconds = 60 / bpm;
    return quarterNoteSeconds * multiplier;
  };

  // Determine click type based on beat pattern and current position
  const getClickType = (beatIndex: number): ClickType => {
    const beat = beats[beatIndex];
    if (!beat) return 'regular';
    
    return beat.type;
  };

  // Check if we should play sound based on gap click settings
  const shouldPlaySound = (barNumber: number): boolean => {
    if ((barsOn === 0 && barsOff === 0) || useGapClick === false) return true; // Gap click disabled
    
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

    // Schedule all clicks that should happen in the next 100ms
    while (nextClickTimeRef.current < currentTime + scheduleAheadTime) {
      const beatIndex = currentBeatRef.current % beats.length;
      const shouldPlay = shouldPlaySound(currentBarRef.current);
      const inGap = !shouldPlay;

      // Update gap status
      if (isInGapRef.current !== inGap) {
        isInGapRef.current = inGap;
        setIsInGap(inGap);
      }

      // Play click if not in gap
      if (shouldPlay) {
        const clickType = getClickType(beatIndex);
        audioEngine.playClick(clickType, nextClickTimeRef.current);
      }

      // Update beat position for UI
      setCurrentBeat(beatIndex);
      setCurrentBar(currentBarRef.current);

      // Move to next click
      currentBeatRef.current++;
      
      // Check if we completed a bar
      if (currentBeatRef.current % beats.length === 0) {
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
    currentBeatRef.current = 0;
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

    currentBeatRef.current = 0;
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
      // Reset sceduler with new settings
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
