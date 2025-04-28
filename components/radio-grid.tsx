"use client";

import { RadioStation } from "@/lib/types";
import { RadioCard } from "@/components/radio-card";
import { useState,useEffect } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";

interface RadioGridProps {
  stations: RadioStation[];
}

export function RadioGrid({ stations }: RadioGridProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);


  useEffect(() => {
    // Set the last updated time after the component mounts
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);
  
  const filteredStations = stations.filter(station => 
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (station.description && station.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="space-y-4">
  
      
      {/* Controls bar */}
      <div className="bg-card shadow-sm p-3 rounded-lg flex flex-wrap gap-2 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Search stations..." 
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted border-none rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-muted rounded overflow-hidden">
            <button
              onClick={() => setView("grid")} 
              className={`p-2 ${view === "grid" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")} 
              className={`p-2 ${view === "list" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
            >
              <List size={16} />
            </button>
          </div>
          
          <button className="p-2 bg-muted rounded hover:bg-muted/80 text-muted-foreground">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      
      
      {/* Stations display */}
      {filteredStations.length === 0 ? (
        <div className="flex items-center justify-center h-40 bg-card rounded-lg">
          <p className="text-muted-foreground">No stations found</p>
        </div>
      ) : view === "grid" ? (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStations.map((station) => (
            <RadioCard key={station.id} station={station} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          {filteredStations.map((station) => (
            <div key={station.id} className="h-24">
              <RadioCard station={station} />
            </div>
          ))}
        </div>
      )}
      
          {/* Status bar */}
          <div className="p-3 bg-card rounded-lg text-xs text-muted-foreground flex justify-between">
        <span>Displaying {filteredStations.length} of {stations.length} stations</span>
        <span>Last updated: {lastUpdated || "Loading..."}</span>
      </div>
    </div>
  );
}