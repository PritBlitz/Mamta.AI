// app/emergency/page.tsx
// This remains a Server Component (no "use client")

import React from "react";
import EmergencyMapLoader from "./EmergencyMapLoader"; // Import the Client Component loader

// The page component now renders the loader, which handles the dynamic/SSR part
const EmergencyPage = () => {
  return <EmergencyMapLoader />;
};

export default EmergencyPage;
