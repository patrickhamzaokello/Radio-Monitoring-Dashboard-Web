export interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  logo?: string;
  description?: string;
}

export type StreamStatus = 'playing' | 'paused' | 'error' | 'loading';

export interface AudioState {
  volume: number;
  status: StreamStatus;
  isFocused: boolean;
}

export interface AudioContextState {
  audioStates: Record<string, AudioState>;
  togglePlay: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  toggleFocus: (id: string) => void;
  playAll: () => void;
  pauseAll: () => void;
  stopAll: () => void;
}