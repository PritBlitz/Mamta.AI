"use client";

import { useState, useEffect, useRef } from "react";

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

  // Alert sound (max 3 times)
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

  // Auto click all contacts within 3 seconds
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

  // Auto re-send every 5 seconds to all contacts
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
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => {
          alert("Unable to retrieve location: " + err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );
      setWatchId(id);

      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
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
      <h1 className="text-4xl font-bold text-pink-700 mb-6">Emergency SOS</h1>
      <p className="text-lg mb-4">
        With one tap, share your live location via WhatsApp.
      </p>

      {/* Emergency Contacts Section */}
      <div className="w-full max-w-md mb-6">
        <input
          type="tel"
          placeholder="Add emergency contact number"
          value={emergencyNumber}
          onChange={(e) => setEmergencyNumber(e.target.value)}
          className="px-4 py-2 mb-2 border border-pink-400 rounded-md w-full"
        />
        <button
          onClick={handleAddContact}
          className="bg-pink-500 text-white px-4 py-2 rounded-full w-full hover:bg-pink-600 mb-2"
        >
          Add Contact
        </button>

        {emergencyContacts.length > 0 && (
          <div className="text-left mt-4">
            <h2 className="font-semibold text-pink-700 mb-2">
              Emergency Contacts:
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              {emergencyContacts.map((contact, index) => (
                <li key={index}>{contact}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SOS Control Buttons */}
      <div className="space-x-4 mb-6">
        <button
          onClick={() => {
            if (emergencyContacts.length > 0) {
              startTracking();
            } else {
              alert("Please add at least one emergency contact.");
            }
          }}
          className="bg-pink-600 text-white px-6 py-3 rounded-full hover:bg-pink-700"
        >
          Start Sharing Location
        </button>
        <button
          onClick={stopTracking}
          className="bg-gray-300 text-black px-6 py-3 rounded-full hover:bg-gray-400"
        >
          Stop Sharing
        </button>
      </div>

      {/* Manual Send Button */}
      {location && emergencyContacts.length > 0 && (
        <div className="flex flex-col gap-2">
          {getWhatsAppLinks().map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700"
            >
              Send Location to {emergencyContacts[index]}
            </a>
          ))}
        </div>
      )}

      {/* Current Location Display */}
      {location && (
        <p className="mt-4 text-sm text-gray-700">
          Current Location: {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default SOSPage;
