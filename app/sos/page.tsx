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

  useEffect(() => {
    if (sosStarted) {
      const audio = new Audio("/alert.mp3");
      let playCount = 0;

      const playAudio = () => {
        if (playCount < 3) {
          audio.currentTime = 0;
          audio.play();
          playCount++;
          setTimeout(playAudio, audio.duration * 1000 || 1500);
        }
      };

      playAudio();
      audioRef.current = audio;
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [sosStarted]);

  useEffect(() => {
    if (
      sosStarted &&
      location &&
      emergencyContacts.length > 0 &&
      !initialClickDone
    ) {
      const timeout = setTimeout(() => {
        getWhatsAppLinks().forEach((link) => {
          window.open(link, "_blank");
        });
        setInitialClickDone(true);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [sosStarted, location, emergencyContacts, initialClickDone]);

  useEffect(() => {
    if (
      initialClickDone &&
      sosStarted &&
      location &&
      emergencyContacts.length > 0
    ) {
      const interval = setInterval(() => {
        getWhatsAppLinks().forEach((link) => {
          window.open(link, "_blank");
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [initialClickDone, sosStarted, location, emergencyContacts]);

  const startTracking = () => {
    if ("geolocation" in navigator) {
      setSosStarted(true);
      const id = navigator.geolocation.watchPosition(
        (pos) =>
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => alert("Unable to retrieve location: " + err.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      setWatchId(id);
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
    } else {
      alert("Geolocation is not supported by your browser.");
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
  };

  const getWhatsAppLinks = () => {
    if (!location || emergencyContacts.length === 0) return [];
    const message = `🚨 Emergency! I am in danger. Here's my live location: https://maps.google.com/?q=${location.lat},${location.lon}`;
    return emergencyContacts.map(
      (number) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    );
  };

  const handleAddContact = () => {
    if (emergencyNumber && !emergencyContacts.includes(emergencyNumber)) {
      setEmergencyContacts((prev) => [...prev, emergencyNumber]);
      setEmergencyNumber("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-white to-pink-50 text-center">
      <SOSHeading />
      <ContactForm
        emergencyNumber={emergencyNumber}
        setEmergencyNumber={setEmergencyNumber}
        handleAddContact={handleAddContact}
      />
      <ContactList emergencyContacts={emergencyContacts} />
      <SOSControls
        emergencyContacts={emergencyContacts}
        startTracking={startTracking}
        stopTracking={stopTracking}
      />
      <WhatsAppLinks
        links={getWhatsAppLinks()}
        emergencyContacts={emergencyContacts}
      />
      <LocationDisplay location={location} />
    </div>
  );
};

export default SOSPage;
