"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioStation, StreamStatus } from "@/lib/types";
import { useAudioContext } from "@/hooks/use-audio-context";
import { 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Radio, 
  Headphones,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface RadioCardProps {
  station: RadioStation;
}

export function RadioCard({ station }: RadioCardProps) {
  const { audioStates, togglePlay, setVolume, toggleFocus } = useAudioContext();
  const audioState = audioStates[station.id] || { volume: 0.5, status: "loading", isFocused: false };
  const [showVolume, setShowVolume] = useState(false);
  
  // Audio visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const { status, volume, isFocused } = audioState;
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(station.id, value[0]);
  };
  
  const handlePlayPause = () => {
    togglePlay(station.id);
  };
  
  const handleFocus = () => {
    toggleFocus(station.id);
  };

  // Status indicator colors
  const getStatusColor = (status: StreamStatus): string => {
    switch (status) {
      case "playing":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      case "loading":
        return "bg-blue-500 animate-pulse";
      default:
        return "bg-gray-500";
    }
  };

  // Status text
  const getStatusText = (status: StreamStatus): string => {
    switch (status) {
      case "playing":
        return "Live";
      case "paused":
        return "Paused";
      case "error":
        return "Error";
      case "loading":
        return "Loading...";
      default:
        return "Unknown";
    }
  };

  // Simulate audio visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // Only animate if playing and not muted
    if (status === 'playing' && volume > 0) {
      const render = () => {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Draw waveform
        ctx.fillStyle = isFocused ? '#10b981' : '#3b82f6';
        
        // Simple animation based on time
        const time = Date.now() / 1000;
        const barCount = 30;
        
        for (let i = 0; i < barCount; i++) {
          const x = (i / barCount) * WIDTH;
          const barWidth = WIDTH / barCount - 2;
          
          // Create a dynamic height based on time and position
          const height = ((Math.sin(time * 5 + i * 0.2) + 1) / 2) * HEIGHT * volume;
          
          ctx.fillRect(x, HEIGHT - height, barWidth, height);
        }
        
        animationRef.current = requestAnimationFrame(render);
      };
      
      animationRef.current = requestAnimationFrame(render);
    } else {
      // Draw flat line for paused or muted
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, HEIGHT - 2, WIDTH, 2);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, volume, isFocused]);

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-md overflow-hidden",
      isFocused ? "ring-2 ring-primary" : "",
      status === "error" ? "border-red-500" : ""
    )}>
      <div className="relative h-40 w-full overflow-hidden">
        {station.logo ? (
          <Image
            src={station.logo}
            alt={station.name}
            className={cn(
              "object-cover transition-opacity",
              status === "playing" ? "opacity-100" : "opacity-70"
            )}
            fill
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Radio size={48} className="text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        <div className="absolute bottom-2 left-2 flex items-center space-x-2">
          <div className={cn(
            "h-3 w-3 rounded-full animate-pulse",
            getStatusColor(status)
          )} />
          <span className="text-xs font-medium text-white">{getStatusText(status)}</span>
        </div>
        
        <div className="absolute top-2 right-2">
          {status === "error" && (
            <div className="bg-destructive text-xs rounded-md px-2 py-1 flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              Stream Error
            </div>
          )}
        </div>
      </div>
      
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex justify-between items-center">
          <span className="truncate text-sm sm:text-base">{station.name}</span>
          <button 
            onClick={handleFocus} 
            className={cn(
              "p-1 rounded-full transition-colors",
              isFocused 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
            title={isFocused ? "Playing only this station" : "Focus on this station"}
          >
            <Headphones size={16} />
          </button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {station.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
            {station.description}
          </p>
        )}
        
        <div className="flex flex-col space-y-3">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={30} 
            className="w-full h-[30px] rounded"
          />
          
          <div className="flex items-center justify-between">
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={status === "error" || status === "loading"}
            >
              {status === "playing" ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button 
                onClick={() => setVolume(station.id, volume > 0 ? 0 : 0.5)}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              
              {showVolume && (
                <div className="absolute right-full mr-2 w-24 bg-background border rounded-md p-2 shadow-md z-10">
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}