"use client";

import { useEffect, useRef, useState } from "react";
import SOSHeading from "@/components/SOSHeading";
import ContactForm from "@/components/ContactForm";
import ContactList from "@/components/ContactList";
import SOSControls from "@/components/SOSControls";
import WhatsAppLinks from "@/components/WhatsAppLinks";
import LocationDisplay from "@/components/LocationDisplay";

const SOSPage = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [watchId, setWatchId] = useState<number | null>(null);
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<string[]>([]);
  const [sosStarted, setSosStarted] = useState(false);
  const [initialClickDone, setInitialClickDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- getWhatsAppLinks function (remains unchanged) ---
  const getWhatsAppLinks = () => {
    // Ensure location is not null before accessing lat/lon
    if (!location || emergencyContacts.length === 0) return [];
    const message = `🚨 Emergency! I am in danger. Here's my live location: https://maps.google.com/?q=${location.lat},${location.lon}`;
    return emergencyContacts.map(
      (number) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    );
  };
  // --- End getWhatsAppLinks function ---

  useEffect(() => {
    // ... (audio logic remains the same) ...
    let audio: HTMLAudioElement | null = null;
    let playTimeoutId: NodeJS.Timeout | null = null;
    let playCount = 0;
    const maxPlays = 3;

    const playAudio = () => {
      if (audio && playCount < maxPlays) {
        audio.currentTime = 0;
        audio.play().catch((e) => console.error("Audio play failed:", e));
        playCount++;
        const durationMs =
          audio.duration && isFinite(audio.duration)
            ? audio.duration * 1000
            : 1500;
        playTimeoutId = setTimeout(playAudio, durationMs + 200);
      }
    };

    if (sosStarted) {
      audio = new Audio("/alert.mp3");
      audioRef.current = audio;
      playAudio();
    }

    return () => {
      if (playTimeoutId) clearTimeout(playTimeoutId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [sosStarted]);

  useEffect(() => {
    if (
      sosStarted &&
      location &&
      emergencyContacts.length > 0 &&
      !initialClickDone
    ) {
      const timeout = setTimeout(() => {
        // Check condition inside timeout
        if (
          sosStarted &&
          location &&
          emergencyContacts.length > 0 &&
          !initialClickDone
        ) {
          getWhatsAppLinks().forEach((link) => {
            window.open(link, "_blank");
          });
          setInitialClickDone(true);
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sosStarted, location, emergencyContacts, initialClickDone]); // <-- Added eslint-disable-next-line

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      initialClickDone &&
      sosStarted &&
      location &&
      emergencyContacts.length > 0
    ) {
      interval = setInterval(() => {
        // Check condition inside interval
        if (
          initialClickDone &&
          sosStarted &&
          location &&
          emergencyContacts.length > 0
        ) {
          getWhatsAppLinks().forEach((link) => {
            window.open(link, "_blank");
          });
        }
        // Your interval for repeating the WhatsApp action
      }, 5000); // 5 seconds interval

      return () => {
        if (interval) clearInterval(interval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClickDone, sosStarted, location, emergencyContacts]); // <-- Added eslint-disable-next-line

  const startTracking = () => {
    if ("geolocation" in navigator) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      setSosStarted(true);
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          console.log(
            "Location updated:",
            pos.coords.latitude,
            pos.coords.longitude
          );
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          console.error("Geolocation watch error:", err);
          alert("Unable to retrieve location updates: " + err.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      setWatchId(id);
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
    } else {
      alert("Geolocation is not supported by your browser.");
      setSosStarted(false);
    }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setSosStarted(false);
    setLocation(null);
    setInitialClickDone(false);
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  // getWhatsAppLinks defined above useEffects

  const handleAddContact = () => {
    const cleanedNumber = emergencyNumber.replace(/\D/g, "");
    if (cleanedNumber && !emergencyContacts.includes(cleanedNumber)) {
      setEmergencyContacts((prev) => [...prev, cleanedNumber]);
      setEmergencyNumber("");
    } else if (!cleanedNumber) {
      alert("Please enter a valid number.");
    } else {
      alert("Contact already added.");
      setEmergencyNumber("");
    }
  };

  // --- Component return section ---
  // Using EXACTLY the props from your last provided code snippet
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-white to-pink-50 text-center">
      <SOSHeading />
      <ContactForm
        emergencyNumber={emergencyNumber}
        setEmergencyNumber={setEmergencyNumber}
        handleAddContact={handleAddContact}
      />
      {/* ContactList only gets emergencyContacts */}
      <ContactList emergencyContacts={emergencyContacts} />
      <SOSControls
        emergencyContacts={emergencyContacts}
        startTracking={startTracking}
        stopTracking={stopTracking}
        // NO sosStarted here
      />
      <WhatsAppLinks
        links={getWhatsAppLinks()}
        emergencyContacts={emergencyContacts}
        // NO sosStarted here
      />
      <LocationDisplay location={location} />
    </div>
  );
};

export default SOSPage;
