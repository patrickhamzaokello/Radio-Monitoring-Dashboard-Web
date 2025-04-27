"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AudioContextState, AudioState, RadioStation, StreamStatus } from "@/lib/types";

const defaultAudioState: AudioState = {
  volume: 0.5,
  status: "loading",
  isFocused: false,
};

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

  // Initialize audio states and elements
  useEffect(() => {
    const initialAudioStates: Record<string, AudioState> = {};
    const initialAudioElements: Record<string, HTMLAudioElement> = {};

    stations.forEach((station) => {
      initialAudioStates[station.id] = { ...defaultAudioState };
      
      // Create audio element with proper configuration
      const audio = new Audio();
      audio.volume = defaultAudioState.volume;
      audio.preload = "none"; // Don't preload until play is requested
      audio.crossOrigin = "anonymous";
      
      // Set up event listeners
      audio.addEventListener("playing", () => updateStatus(station.id, "playing"));
      audio.addEventListener("pause", () => updateStatus(station.id, "paused"));
      audio.addEventListener("error", () => {
        console.error(`Error loading stream for ${station.name}:`, audio.error);
        updateStatus(station.id, "error");
      });
      audio.addEventListener("waiting", () => updateStatus(station.id, "loading"));
      audio.addEventListener("loadstart", () => updateStatus(station.id, "loading"));
      
      // Set the source after adding event listeners
      audio.src = station.streamUrl;
      
      initialAudioElements[station.id] = audio;
    });

    setAudioStates(initialAudioStates);
    setAudioElements(initialAudioElements);

    // Start playing all streams
    Object.entries(initialAudioElements).forEach(([id, audio]) => {
      void audio.play().catch((error) => {
        console.error(`Failed to play ${id}:`, error);
        updateStatus(id, "error");
      });
    });

    // Clean up on unmount
    return () => {
      Object.values(initialAudioElements).forEach((audio) => {
        audio.pause();
        audio.src = "";
        audio.load(); // Clear the source buffer
      });
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
    // If already focused, unfocus all (play all)
    if (audioStates[id]?.isFocused) {
      await playAll();
      return;
    }

    // Focus on selected station
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

  const stopAll = () => {
    Object.entries(audioElements).forEach(([id, audio]) => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
      updateStatus(id, "paused");
    });
  };

  const pauseAll = () => {
    Object.values(audioElements).forEach((audio) => {
      audio.pause();
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
        stopAll
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};