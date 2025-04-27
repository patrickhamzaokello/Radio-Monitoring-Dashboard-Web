"use client";

import { RadioStation } from "@/lib/types";
import { RadioCard } from "@/components/radio-card";

interface RadioGridProps {
  stations: RadioStation[];
}

export function RadioGrid({ stations }: RadioGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {stations.map((station) => (
        <RadioCard key={station.id} station={station} />
      ))}
    </div>
  );
}