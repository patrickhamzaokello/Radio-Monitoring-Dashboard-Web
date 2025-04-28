"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RadioStation, StreamStatus } from "@/lib/types";
import { useAudioContext } from "@/hooks/use-audio-context";
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Radio,
  Headphones,
  AlertTriangle,
  Signal,
  Clock,
  BarChart3,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RadioCardProps {
  station: RadioStation;
}

export function RadioCard({ station }: RadioCardProps) {
  const { audioStates, togglePlay, setVolume, toggleFocus } = useAudioContext();
  const audioState = audioStates[station.id] || { volume: 0.5, status: "loading", isFocused: false };
  const [showVolume, setShowVolume] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Audio visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const { status, volume, isFocused } = audioState;

  // Mock metrics for dashboard display
  const [metrics, setMetrics] = useState({
    listeners: Math.floor(Math.random() * 1000),
    peakHour: `${Math.floor(Math.random() * 12 + 1)}${Math.random() > 0.5 ? 'AM' : 'PM'}`,
    uptime: `${Math.floor(Math.random() * 99 + 1)}%`,
  });

  useEffect(() => {
    // Set the last updated time after the component mounts
    setLastUpdated(new Date().toLocaleTimeString());
  }, [new Date().toLocaleTimeString()]);

  // Update random metrics periodically to simulate live data
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        listeners: prev.listeners + Math.floor(Math.random() * 11) - 5,
        peakHour: prev.peakHour,
        uptime: `${Math.floor(Math.random() * 3 + 97)}%`,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

    // Clear previous animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Only animate if playing and not muted
    if (status === 'playing' && volume > 0) {
      // Create gradient for active visualization
      const gradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
      gradient.addColorStop(0, isFocused ? '#10b981' : '#01aa5f');
      gradient.addColorStop(1, isFocused ? '#059669' : '#01aa03');

      let particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * WIDTH,
        y: HEIGHT / 2,
        radius: Math.random() * 1.5 + 0.5,
        vx: Math.random() * 1 - 0.5,
        vy: Math.random() * 1 - 0.5,
        amplitude: Math.random() * 15 + 5
      }));

      const render = () => {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Draw base line
        ctx.beginPath();
        ctx.moveTo(0, HEIGHT / 2);
        ctx.lineTo(WIDTH, HEIGHT / 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw waveform
        ctx.beginPath();

        const time = Date.now() / 1000;

        // Plot smooth wave using bezier curves
        let points = [];
        const segments = 12;

        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * WIDTH;
          // Create more complex wave by combining multiple frequencies
          const amplitude = HEIGHT * 0.3 * volume;
          const y = HEIGHT / 2 +
            Math.sin(time * 3 + i / segments * Math.PI * 2) * amplitude * 0.5 +
            Math.sin(time * 2 + i / segments * Math.PI * 4) * amplitude * 0.3 +
            Math.sin(time * 5 + i / segments * Math.PI) * amplitude * 0.2;
          points.push({ x, y });
        }

        // Draw smooth curve through points
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animate particles
        particles.forEach(particle => {
          // Get y-position on the curve for this x-position
          const curvePosition = HEIGHT / 2 +
            Math.sin(time * 3 + (particle.x / WIDTH) * Math.PI * 2) * particle.amplitude * volume * 0.5 +
            Math.sin(time * 2 + (particle.x / WIDTH) * Math.PI * 4) * particle.amplitude * volume * 0.3 +
            Math.sin(time * 5 + (particle.x / WIDTH) * Math.PI) * particle.amplitude * volume * 0.2;

          // Move particle along the curve with some randomness
          particle.x += particle.vx;
          particle.y = curvePosition + (Math.random() - 0.5) * 2;

          // If particle leaves canvas, reset it
          if (particle.x < 0 || particle.x > WIDTH) {
            particle.x = Math.random() * WIDTH;
            particle.vx = Math.random() * 1 - 0.5;
          }

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius * volume, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        });

        animationRef.current = requestAnimationFrame(render);
      };

      animationRef.current = requestAnimationFrame(render);
    } else {
      // Draw minimalist inactive state
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Draw elegant flat line with subtle gradient
      const gradient = ctx.createLinearGradient(0, HEIGHT / 2, WIDTH, HEIGHT / 2);
      gradient.addColorStop(0, '#333');
      gradient.addColorStop(0.5, '#01aa5f');
      gradient.addColorStop(1, '#333');

      ctx.beginPath();
      ctx.moveTo(0, HEIGHT / 2);
      ctx.lineTo(WIDTH, HEIGHT / 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add subtle dots along the line for visual interest
      for (let i = 0; i < 10; i++) {
        const x = (WIDTH / 10) * i + (WIDTH / 20);
        ctx.beginPath();
        ctx.arc(x, HEIGHT / 2, 1, 0, Math.PI * 2);
        ctx.fillStyle = status === "paused" ? '#f59e0b' : '#01aa03';
        ctx.fill();
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, volume, isFocused]);

  return (
    <TooltipProvider>
      <Card className={cn(
        "transition-all duration-300 hover:shadow-md overflow-hidden h-full",
        isFocused ? "ring-2 ring-primary" : "",
        status === "error" ? "border-destructive" : "",
        "flex flex-col"
      )}>
        <div className="relative h-20 sm:h-24 w-full overflow-hidden flex bg-primary-foreground">
          {/* Left side with logo */}
          <div className="relative h-full aspect-square">
            {station.logo ? (
              <Image
                src={station.logo}
                alt={station.name}
                className="object-cover"
                fill
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Radio size={32} className="text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right side with station details */}
          <div className="flex-1 p-3 pl-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-primary truncate">
                  {station.name}
                </h3>
                {station.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {station.description}
                  </p>
                )}
              </div>

            
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  status === "playing" ? "bg-green-500/20 text-green-500" :
                    status === "paused" ? "bg-yellow-500/20 text-yellow-500" :
                      status === "error" ? "bg-red-500/20 text-red-500" :
                        "bg-blue-500/20 text-blue-500"
                )}>
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full mr-1",
                    getStatusColor(status)
                  )} />
                  {getStatusText(status)}
                </span>
              </div>

              {status === "error" && (
                <div className="bg-destructive/20 text-destructive text-xs rounded px-1.5 py-0.5 flex items-center">
                  <AlertTriangle size={10} className="mr-1" />
                  Stream Error
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-3 flex-1">
          {/* Dashboard Metrics Area */}
          {showInfo ? (
            <div className="grid grid-cols-3 gap-2 h-full">
              <div className="flex flex-col items-center justify-center bg-muted p-2 rounded">
                <Signal size={16} className="text-primary mb-1" />
                <span className="text-xs font-medium">{metrics.listeners}</span>
                <span className="text-[10px] text-muted-foreground">Listeners</span>
              </div>

              <div className="flex flex-col items-center justify-center bg-muted p-2 rounded">
                <Clock size={16} className="text-primary mb-1" />
                <span className="text-xs font-medium">{metrics.peakHour}</span>
                <span className="text-[10px] text-muted-foreground">Peak Hour</span>
              </div>

              <div className="flex flex-col items-center justify-center bg-muted p-2 rounded">
                <BarChart3 size={16} className="text-primary mb-1" />
                <span className="text-xs font-medium">{metrics.uptime}</span>
                <span className="text-[10px] text-muted-foreground">Uptime</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between">
              <div className="mb-2">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={40}
                  className="w-full h-[40px] rounded bg-muted/20"
                />
              </div>

              <div className="relative flex items-center"
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
              >
                <div className="w-full flex items-center rounded py-1.5">
                  <button
                    onClick={handlePlayPause}
                    className={cn(
                      "p-1.5 rounded mr-2",
                      status === "playing"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    )}
                    disabled={status === "error" || status === "loading"}
                  >
                    {status === "playing" ? <Pause size={14} /> : <Play size={14} />}
                  </button>

                  <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleFocus}
                      className={cn(
                        "p-1.5 rounded transition-colors mr-2",
                        isFocused
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      )}
                    >
                      <Headphones size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFocused ? "Currently focused" : "Focus on this station"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowInfo(!showInfo)}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        showInfo
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      )}
                    >
                      <Info size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Station details
                  </TooltipContent>
                </Tooltip>

                  <div className="flex-1 mx-2">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="h-1"
                    />
                  </div>

                  <button
                    onClick={() => setVolume(station.id, volume > 0 ? 0 : 0.5)}
                    className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  >
                    {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground flex justify-between">
          <span>ID: {station.id}</span>
          <span>{lastUpdated || "Loading..."}</span>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}