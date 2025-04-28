"use client";

import { useAudioContext } from "@/hooks/use-audio-context";
import { Button } from "@/components/ui/button";
import { Radio, PauseCircle, PlayCircle, Volume2, Settings, StopCircle, Speaker, MonitorSpeaker } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";

export function DashboardHeader() {
  const { audioStates, playAll, pauseAll, stopAll, toggleVolumeAll, isAllMuted } = useAudioContext();

  // Check if all streams are playing
  const allStreamsPlaying = Object.values(audioStates).every(
    (state) => state.status === "playing"
  );

  // Count active streams
  const activeStreams = Object.values(audioStates).filter(
    (state) => state.status === "playing"
  ).length;

  // Count error streams
  const errorStreams = Object.values(audioStates).filter(
    (state) => state.status === "error"
  ).length;

  // Count total streams
  const totalStreams = Object.keys(audioStates).length;

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center mr-4">
          <Radio className="h-6 w-6 mr-2" />
          <h1 className="text-lg font-medium">Radio Stream Dashboard</h1>
        </div>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={allStreamsPlaying ? pauseAll : playAll}
            className="h-8"
          >
            {allStreamsPlaying ? (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause All
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Play All
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopAll}
            className="h-8"
          >
            <StopCircle className="mr-2 h-4 w-4" />
            Stop All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleVolumeAll}
            className="h-8"
          >
            {isAllMuted ? (
              <>
                <MonitorSpeaker className="mr-2 h-4 w-4" />
                Unmute All
              </>
            ) : (
              <>
                <Speaker className="mr-2 h-4 w-4" />
                Mute All
              </>
            )}
          </Button>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Volume2 className="mr-1 h-4 w-4" />
            <span>
              {activeStreams}/{totalStreams} active
            </span>
            {errorStreams > 0 && (
              <span className="ml-2 text-destructive">
                ({errorStreams} error{errorStreams !== 1 ? "s" : ""})
              </span>
            )}
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}