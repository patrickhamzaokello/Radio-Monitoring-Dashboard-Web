"use client";

import { useEffect } from "react";
import { RADIO_STATIONS } from "@/lib/constants";
import { AudioProvider } from "@/hooks/use-audio-context";
import { RadioGrid } from "@/components/radio-grid";
import { DashboardHeader } from "@/components/dashboard-header";

export default function Home() {
  // Handle visibility change to pause when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      // You can add logic here to pause/play streams when tab visibility changes
      console.log("Visibility changed:", document.visibilityState);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <AudioProvider stations={RADIO_STATIONS}>
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1">
          <RadioGrid stations={RADIO_STATIONS} />
        </main>
      </div>
    </AudioProvider>
  );
}