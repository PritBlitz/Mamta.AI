// app/emergency/EmergencyMapLoader.tsx
"use client"; // <-- Crucial: This component handles the dynamic import

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the actual map component within this Client Component
const EmergencyMap = dynamic(
  () => import("./EmergencyMapClient"), // Path to your map logic component
  {
    ssr: false, // OK here because EmergencyMapLoader is a Client Component
    loading: () => (
      // Optional loading state
      <div className="flex justify-center items-center h-screen p-4">
        <p className="text-xl text-gray-600 animate-pulse">Loading map...</p>
      </div>
    ),
  }
);

// This loader component simply renders the dynamically loaded map
const EmergencyMapLoader: React.FC = () => {
  return <EmergencyMap />;
};

export default EmergencyMapLoader;
