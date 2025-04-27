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
const SAMPLE_DURATION = 8000; // 8 seconds in milliseconds
const SAMPLE_INTERVAL = 20000; // Sample every 20 seconds

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
  const sourceNodesRef = useRef<Record<string, MediaElementAudioSourceNode>>({});
  const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
  const recordingIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const destinationsRef = useRef<Record<string, MediaStreamAudioDestinationNode>>({});

  // Initialize Web Audio API context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const sendAudioData = async (stationId: string, audioBlob: Blob) => {
    try {
      // Create a new FormData for each submission
      const formData = new FormData();
      
      // Use a unique filename with timestamp to prevent caching issues
      const filename = `recording-${stationId}-${Date.now()}.webm`;
      formData.append("file", audioBlob, filename);
      formData.append("stationId", stationId);
      formData.append("timestamp", new Date().toISOString());
      
      await submitAudio(formData);
    } catch (error) {
      console.error(`Error sending audio for ${stationId}:`, error);
    }
  };

  const createRecordingSetup = (stationId: string, audioElement: HTMLAudioElement) => {
    if (!audioContextRef.current) return;

    try {
      // Only create a source node if it doesn't exist yet
      if (!sourceNodesRef.current[stationId]) {
        const source = audioContextRef.current.createMediaElementSource(audioElement);
        sourceNodesRef.current[stationId] = source;
        
        // Connect to audio context destination for playback
        source.connect(audioContextRef.current.destination);
      }

      // Create a new MediaStreamDestination for each recording session
      const destination = audioContextRef.current.createMediaStreamDestination();
      destinationsRef.current[stationId] = destination;
      
      // Connect the existing source to the new destination
      sourceNodesRef.current[stationId].connect(destination);
      
      return destination;
    } catch (error) {
      console.error(`Error setting up audio nodes for ${stationId}:`, error);
      return null;
    }
  };

  const startRecording = async (stationId: string, audioElement: HTMLAudioElement) => {
    // Stop any existing recording for this station
    stopRecording(stationId);
    
    const destination = createRecordingSetup(stationId, audioElement);
    if (!destination) return;

    // Schedule regular recordings
    recordingIntervalsRef.current[stationId] = setInterval(() => {
      recordSample(stationId, destination);
    }, SAMPLE_INTERVAL);
    
    // Start the first recording immediately
    recordSample(stationId, destination);
  };
  
  const recordSample = (stationId: string, destination: MediaStreamAudioDestinationNode) => {
    try {
      // Create a new MediaRecorder for each recording session
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      
      mediaRecordersRef.current[stationId] = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (chunks.length === 0) return;
        
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await sendAudioData(stationId, audioBlob);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Stop after SAMPLE_DURATION milliseconds
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, SAMPLE_DURATION);
    } catch (error) {
      console.error(`Error recording sample for ${stationId}:`, error);
    }
  };

  const stopRecording = (stationId: string) => {
    // Stop the current mediaRecorder
    const mediaRecorder = mediaRecordersRef.current[stationId];
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    // Clear the recording interval
    if (recordingIntervalsRef.current[stationId]) {
      clearInterval(recordingIntervalsRef.current[stationId]);
      delete recordingIntervalsRef.current[stationId];
    }
  };

  // Initialize audio states and elements
  useEffect(() => {
    const initialAudioStates: Record<string, AudioState> = {};
    const initialAudioElements: Record<string, HTMLAudioElement> = {};

    stations.forEach((station) => {
      initialAudioStates[station.id] = { ...defaultAudioState };

      const audio = new Audio();
      audio.volume = defaultAudioState.volume;
      audio.preload = "auto"; // Changed from "none" to "auto" for better loading
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

    // Play all stations initially
    Object.entries(initialAudioElements).forEach(([id, audio]) => {
      void audio.play().catch((error) => {
        console.error(`Failed to play ${id}:`, error);
        updateStatus(id, "error");
      });
    });

    // Cleanup function
    return () => {
      // Stop all recordings
      Object.entries(mediaRecordersRef.current).forEach(([stationId]) => {
        stopRecording(stationId);
      });
      
      // Clear all intervals
      Object.values(recordingIntervalsRef.current).forEach(clearInterval);
      
      // Stop all audio
      Object.values(initialAudioElements).forEach((audio) => {
        audio.pause();
        audio.src = "";
        audio.load();
      });
    };
  }, [stations]);

  // Rest of your code remains the same
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