"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { AudioContextState, AudioState, RadioStation, StreamStatus } from "@/lib/types";
import { submitAudio } from "@/app/actions/sendAudioData";

const defaultAudioState: AudioState = {
  volume: 0.5,
  status: "loading",
  isFocused: false,
};

// Constants for audio sampling
const SAMPLE_DURATION = 6000; // 6 seconds in milliseconds
const BUFFER_SIZE = 2; // Number of samples to buffer before sending
const SAMPLE_INTERVAL = 3000; // Sample every 3 seconds for smoother transitions

const AudioContext = createContext<AudioContextState | null>(null);

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudioContext must be used within an AudioProvider");
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
  stations: RadioStation[];
}

export const AudioProvider = ({ children, stations }: AudioProviderProps) => {
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});
  const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
  const recordingIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const audioBuffersRef = useRef<Record<string, Blob[]>>({});

  // Initialize Web Audio API context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const sendAudioData = async (stationId: string, audioBlob: Blob) => {
    submitAudio(stationId, audioBlob)
  };

  const startRecording = async (stationId: string, audioElement: HTMLAudioElement) => {
    if (!audioContextRef.current) return;

    try {
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      const destination = audioContextRef.current.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContextRef.current.destination);

      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });

      mediaRecordersRef.current[stationId] = mediaRecorder;
      audioBuffersRef.current[stationId] = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffers = audioBuffersRef.current[stationId];
          buffers.push(event.data);

          // When we have enough samples, combine and send them
          if (buffers.length >= BUFFER_SIZE) {
            const combinedBlob = new Blob(buffers, { type: 'audio/webm' });
            await sendAudioData(stationId, combinedBlob);
            audioBuffersRef.current[stationId] = [];
          }
        }
      };

      // Start recording with smaller chunks for more frequent samples
      mediaRecorder.start(SAMPLE_INTERVAL);

      // Set up interval to ensure continuous recording
      recordingIntervalsRef.current[stationId] = setInterval(() => {
        if (mediaRecorder.state === 'inactive') {
          mediaRecorder.start(SAMPLE_INTERVAL);
        }
      }, SAMPLE_DURATION);

    } catch (error) {
      console.error(`Error setting up recording for ${stationId}:`, error);
    }
  };

  const stopRecording = (stationId: string) => {
    const mediaRecorder = mediaRecordersRef.current[stationId];
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    clearInterval(recordingIntervalsRef.current[stationId]);
    delete mediaRecordersRef.current[stationId];
    delete recordingIntervalsRef.current[stationId];
    delete audioBuffersRef.current[stationId];
  };

  // Initialize audio states and elements
  useEffect(() => {
    const initialAudioStates: Record<string, AudioState> = {};
    const initialAudioElements: Record<string, HTMLAudioElement> = {};

    stations.forEach((station) => {
      initialAudioStates[station.id] = { ...defaultAudioState };
      
      const audio = new Audio();
      audio.volume = defaultAudioState.volume;
      audio.preload = "none";
      audio.crossOrigin = "anonymous";
      
      audio.addEventListener("playing", () => {
        updateStatus(station.id, "playing");
        startRecording(station.id, audio);
      });
      
      audio.addEventListener("pause", () => {
        updateStatus(station.id, "paused");
        stopRecording(station.id);
      });
      
      audio.addEventListener("error", () => {
        console.error(`Error loading stream for ${station.name}:`, audio.error);
        updateStatus(station.id, "error");
        stopRecording(station.id);
      });
      
      audio.addEventListener("waiting", () => updateStatus(station.id, "loading"));
      audio.addEventListener("loadstart", () => updateStatus(station.id, "loading"));
      
      audio.src = station.streamUrl;
      
      initialAudioElements[station.id] = audio;
    });

    setAudioStates(initialAudioStates);
    setAudioElements(initialAudioElements);

    Object.entries(initialAudioElements).forEach(([id, audio]) => {
      void audio.play().catch((error) => {
        console.error(`Failed to play ${id}:`, error);
        updateStatus(id, "error");
      });
    });

    return () => {
      Object.entries(mediaRecordersRef.current).forEach(([stationId]) => {
        stopRecording(stationId);
      });
      Object.values(initialAudioElements).forEach((audio) => {
        audio.pause();
        audio.src = "";
        audio.load();
      });
      Object.values(recordingIntervalsRef.current).forEach(clearInterval);
    };
  }, [stations]);

  const updateStatus = (id: string, status: StreamStatus) => {
    setAudioStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status },
    }));
  };

  const togglePlay = async (id: string) => {
    const audio = audioElements[id];
    if (!audio) return;

    try {
      if (audio.paused) {
        updateStatus(id, "loading");
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error(`Error toggling playback for ${id}:`, error);
      updateStatus(id, "error");
    }
  };

  const setVolume = (id: string, volume: number) => {
    const audio = audioElements[id];
    if (!audio) return;

    audio.volume = volume;
    setAudioStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume },
    }));
  };

  const toggleFocus = async (id: string) => {
    if (audioStates[id]?.isFocused) {
      await playAll();
      return;
    }

    await Promise.all(Object.entries(audioElements).map(async ([stationId, audio]) => {
      const isFocused = stationId === id;
      
      try {
        if (isFocused) {
          audio.volume = audioStates[stationId]?.volume || 0.5;
          if (audio.paused) {
            await audio.play();
          }
        } else {
          audio.volume = 0;
        }

        setAudioStates((prev) => ({
          ...prev,
          [stationId]: { ...prev[stationId], isFocused },
        }));
      } catch (error) {
        console.error(`Error focusing station ${stationId}:`, error);
        updateStatus(stationId, "error");
      }
    }));
  };

  const playAll = async () => {
    await Promise.all(Object.entries(audioElements).map(async ([id, audio]) => {
      try {
        audio.volume = audioStates[id]?.volume || 0.5;
        if (audio.paused) {
          await audio.play();
        }
        
        setAudioStates((prev) => ({
          ...prev,
          [id]: { ...prev[id], isFocused: false },
        }));
      } catch (error) {
        console.error(`Error playing station ${id}:`, error);
        updateStatus(id, "error");
      }
    }));
  };

  const pauseAll = () => {
    Object.values(audioElements).forEach((audio) => {
      audio.pause();
    });
  };

  const stopAll = () => {
    Object.entries(audioElements).forEach(([id, audio]) => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
      updateStatus(id, "paused");
    });
  };

  return (
    <AudioContext.Provider
      value={{
        audioStates,
        togglePlay,
        setVolume,
        toggleFocus,
        playAll,
        pauseAll,
        stopAll,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};