"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const libraries: any = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "80vh",
};

const EmergencyMapPage = () => {
  const [location, setLocation] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [places, setPlaces] = useState<google.maps.PlaceResult[]>([]);
  const [selectedType, setSelectedType] = useState("hospital");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, // Set in .env
    libraries,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => alert("Failed to get location")
    );
  }, []);

  useEffect(() => {
    if (location && isLoaded) {
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );
      const request = {
        location,
        radius: 5000,
        type: selectedType as any,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPlaces(results);
        }
      });
    }
  }, [location, selectedType, isLoaded]);

  if (loadError) return <div>Failed to load map</div>;
  if (!isLoaded || !location) return <div>Loading...</div>;

  return (
    <div className="px-6 py-10">
      <h1 className="text-3xl font-bold mb-4 text-center text-pink-600">
        Nearest Medical Help
      </h1>

      <div className="flex justify-center gap-4 mb-6">
        {["hospital", "clinic", "gynecologist"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-full ${
              selectedType === type
                ? "bg-pink-600 text-white"
                : "bg-gray-200 text-gray-700"
            } transition`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={location}
      >
        <Marker
          position={location}
          icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        />
        {places.map((place, idx) => (
          <Marker
            key={idx}
            position={{
              lat: place.geometry?.location?.lat()!,
              lng: place.geometry?.location?.lng()!,
            }}
            title={place.name}
            onClick={() => {
              if (place.vicinity) {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  place.vicinity
                )}`;
                window.open(url, "_blank");
              }
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default EmergencyMapPage;
