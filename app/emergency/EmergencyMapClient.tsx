// app/emergency/EmergencyMapClient.tsx
"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";

// Import static image assets
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

// Use the .src property from the imported image objects
const DefaultIcon = L.icon({
  iconUrl: iconUrl.src,
  shadowUrl: iconShadowUrl.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Optional: Set the default icon for all markers globally if desired
// L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
  lat: number;
  lng: number;
}

interface MedicalPlace {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags: {
    name?: string;
    amenity?: string;
    healthcare?: string;
    speciality?: string; // Corrected: specialty
    phone?: string;
    opening_hours?: string;
  };
}

// Corrected Overpass query tags
const MEDICAL_TYPES = [
  {
    type: "hospital",
    displayName: "Hospitals",
    icon: "https://cdn-icons-png.flaticon.com/512/3448/3448513.png",
    queryTags: [`["amenity"="hospital"]`], // Encapsulate in []
  },
  {
    type: "clinic",
    displayName: "Clinics",
    icon: "https://cdn-icons-png.flaticon.com/512/2966/2966492.png",
    queryTags: [`["amenity"="clinic"]`, `["healthcare"="clinic"]`],
  },
  {
    type: "doctor",
    displayName: "Doctors",
    icon: "https://cdn-icons-png.flaticon.com/512/387/387561.png",
    queryTags: [`["amenity"="doctors"]`, `["healthcare"="doctor"]`],
  },
  {
    type: "gynecologist",
    displayName: "Gynecologists",
    icon: "https://cdn-icons-png.flaticon.com/512/1908/1908088.png",
    queryTags: [
      `["healthcare"="doctor"]["speciality"="gynecology"]`, // Corrected query syntax
      `["amenity"="doctors"]["speciality"="gynecology"]`,
      `["healthcare"="clinic"]["speciality"="gynecology"]`,
    ],
  },
  {
    type: "pharmacy",
    displayName: "Pharmacies",
    icon: "https://cdn-icons-png.flaticon.com/512/3022/3022827.png",
    queryTags: [`["amenity"="pharmacy"]`],
  },
];

const DEFAULT_LOCATION: Location = { lat: 40.7128, lng: -74.006 };
const OSRM_SERVICE_URL = "https://router.project-osrm.org/route/v1";

// --- ChangeView Component (Corrected for ESLint) ---
interface ChangeViewProps {
  center: L.LatLngExpression;
  zoom: number;
}
const ChangeView: React.FC<ChangeViewProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    // Type 'coords' as 'unknown' instead of implicit 'any'
    const isValidLatLngArray = (
      coords: unknown
    ): coords is [number, number] => // FIXED: unknown type
      Array.isArray(coords) &&
      coords.length === 2 &&
      typeof coords[0] === "number" &&
      !isNaN(coords[0]) &&
      typeof coords[1] === "number" &&
      !isNaN(coords[1]);

    // Type 'coords' as 'unknown' instead of implicit 'any'
    const isValidLatLngObject = (
      coords: unknown
    ): coords is L.LatLngLiteral | L.LatLng => // FIXED: unknown type
      typeof coords === "object" &&
      coords !== null &&
      // Use type assertion within the check for safety after confirming it's an object
      typeof (coords as L.LatLngLiteral).lat === "number" &&
      !isNaN((coords as L.LatLngLiteral).lat) &&
      typeof (coords as L.LatLngLiteral).lng === "number" &&
      !isNaN((coords as L.LatLngLiteral).lng);

    if (isValidLatLngArray(center) || isValidLatLngObject(center)) {
      // Type guards ensure 'center' is now safe to pass to setView
      map.setView(center, zoom);
    } else {
      // Avoid logging if center is just null/undefined during initial renders
      if (center != null) {
        console.warn(
          "[ChangeView] Received invalid or incomplete center coordinates:",
          center
        );
      }
    }
  }, [center, zoom, map]);
  return null;
};
// --- End ChangeView Component ---

// --- MapRoutingComponent ---
interface RoutingComponentProps {
  startLocation: Location | null;
  destinationCoords: L.LatLng | null;
  selectedPlaceIcon: L.Icon;
  userIcon: L.Icon;
  onRouteError: (message: string) => void;
  onRouteClear: () => void;
}

const MapRoutingComponent: React.FC<RoutingComponentProps> = ({
  startLocation,
  destinationCoords,
  selectedPlaceIcon,
  userIcon,
  onRouteError,
  onRouteClear,
}) => {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    // --- Cleanup Function ---
    const previousControl = routingControlRef.current;
    if (previousControl) {
      console.log(
        "[MapRoutingComponent] Cleanup: Attempting to remove previous routing control."
      );
      try {
        if (map && map.removeControl) {
          map.removeControl(previousControl);
        }
      } catch (e) {
        console.warn(
          "[MapRoutingComponent] Error removing previous routing control during cleanup:",
          e
        );
      }
      routingControlRef.current = null;
    }

    // --- Effect Logic ---
    if (!map || !startLocation || !destinationCoords) {
      return;
    }

    // --- Create New Route ---
    const startLatLng = L.latLng(startLocation.lat, startLocation.lng);

    if (
      isNaN(startLatLng.lat) ||
      isNaN(startLatLng.lng) ||
      isNaN(destinationCoords.lat) ||
      isNaN(destinationCoords.lng)
    ) {
      console.error(
        "[MapRoutingComponent] Invalid coordinates for routing.",
        startLatLng,
        destinationCoords
      );
      onRouteError("Invalid start or destination coordinates.");
      return;
    }

    if (startLatLng.distanceTo(destinationCoords) < 1) {
      onRouteError("Start and destination points are too close.");
      return;
    }

    console.log("[MapRoutingComponent] Effect: Creating new routing control.");
    const instance = L.Routing.control({
      waypoints: [startLatLng, destinationCoords],
      routeWhileDragging: true,
      show: true,
      addWaypoints: false,
      draggableWaypoints: false,
      // lineOptions only contains styling options
      lineOptions: {
        // <-- Fixed structure
        styles: [{ color: "red", opacity: 0.8, weight: 6 }],
      },
      // These likely belong at the top level of control options
      extendToWaypoints: true, // <-- Moved here
      missingRouteTolerance: undefined, // <-- Moved here (use undefined for library default)
      createMarker: (i: number, waypoint: L.Routing.Waypoint, n: number) => {
        if (!waypoint || !waypoint.latLng) return false;
        if (i === 0) {
          return L.marker(waypoint.latLng, {
            icon: userIcon,
            draggable: false,
          }).bindPopup("Your Location (Start)");
        } else if (i === n - 1) {
          return L.marker(waypoint.latLng, {
            icon: selectedPlaceIcon,
            draggable: false,
          }).bindPopup("Destination");
        }
        return false;
      },
      router: L.Routing.osrmv1({
        serviceUrl: OSRM_SERVICE_URL,
        profile: "driving",
      }),
      showAlternatives: false,
    })
      .on("routingerror", (e: unknown) => {
        console.error("[MapRoutingComponent] Routing Error Event:", e);
        const errorEvent = e as L.ErrorEvent & {
          error?: { message?: string; status?: number };
        };
        const message = errorEvent?.error?.message || "Unknown routing error";
        const status = errorEvent?.error?.status;

        let userMessage = `Routing failed: ${message}.`;
        if (
          message.toLowerCase().includes("could not find route") ||
          status === 207
        ) {
          userMessage =
            "Could not find a route between these locations. The destination might be unreachable by car or too far.";
        } else if (message.toLowerCase().includes("bounds are not valid")) {
          userMessage =
            "Routing failed (Invalid Bounds). This might happen if no route exists or due to a server issue.";
        }

        onRouteError(`${userMessage} Please try again or check connection.`);
      })
      .on("routesfound", (e: unknown) => {
        console.log("[MapRoutingComponent] Routes Found Event.");
        const eventData = e as L.Routing.RoutesFoundEvent;
        const routes = eventData.routes;

        if (routes?.[0]?.coordinates?.length > 0) {
          const routePath = routes[0].coordinates.map((coord) =>
            L.latLng(coord.lat, coord.lng)
          );
          const routeBounds = L.latLngBounds(routePath);

          if (routeBounds?.isValid()) {
            setTimeout(() => {
              try {
                map.fitBounds(routeBounds, { padding: [50, 50], maxZoom: 16 });
              } catch (fitBoundsError) {
                console.error(
                  "[MapRoutingComponent] Error calling fitBounds on route:",
                  fitBoundsError
                );
                map.fitBounds(L.latLngBounds(startLatLng, destinationCoords), {
                  padding: [70, 70],
                  maxZoom: 16,
                });
              }
            }, 100);
          } else {
            console.warn(
              "[MapRoutingComponent] Calculated route bounds invalid."
            );
            map.fitBounds(L.latLngBounds(startLatLng, destinationCoords), {
              padding: [70, 70],
              maxZoom: 16,
            });
          }
        } else {
          console.error(
            "[MapRoutingComponent] Routes found but no coordinate data."
          );
          onRouteError("Routing engine returned an incomplete route.");
        }
      })
      .addTo(map);

    routingControlRef.current = instance;
  }, [
    map,
    startLocation,
    destinationCoords,
    selectedPlaceIcon,
    userIcon,
    onRouteError,
    onRouteClear,
  ]);

  return null;
};

// --- Main EmergencyMapClient Component ---
const EmergencyMapClient: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [places, setPlaces] = useState<MedicalPlace[]>([]);
  const [selectedType, setSelectedType] = useState<string>(
    MEDICAL_TYPES[0].type
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingPlaces, setFetchingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRouteError, setLastRouteError] = useState<string | null>(null);
  const [mapZoom] = useState(14);
  const [routingDestination, setRoutingDestination] = useState<L.LatLng | null>(
    null
  );

  // Memoized custom icons
  const customIcons = useMemo(() => {
    const icons: { [key: string]: L.Icon } = {};
    MEDICAL_TYPES.forEach((mt) => {
      if (mt.icon?.startsWith("http")) {
        try {
          icons[mt.type] = L.icon({
            iconUrl: mt.icon,
            iconSize: [35, 35],
            iconAnchor: [17, 35],
            popupAnchor: [0, -35],
          });
        } catch (e) {
          console.error(`Failed to create icon for type ${mt.type}:`, e);
          icons[mt.type] = DefaultIcon;
        }
      } else {
        console.warn(
          `Missing or invalid icon URL for type ${mt.type}. Using default.`
        );
        icons[mt.type] = DefaultIcon;
      }
    });
    try {
      icons["user"] = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535137.png",
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });
    } catch (e) {
      console.error("Failed to create user icon:", e);
      icons["user"] = DefaultIcon;
    }
    return icons;
  }, []);

  // Effect for initial location fetching
  useEffect(() => {
    let isMounted = true;
    setInitialLoading(true);
    setError(null);
    setLastRouteError(null);
    setRoutingDestination(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported. Showing default location.");
      if (isMounted) setLocation(DEFAULT_LOCATION);
      if (isMounted) setInitialLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null);
          setInitialLoading(false);
        }
      },
      (geoError) => {
        if (isMounted) {
          console.error("Geolocation error:", geoError);
          let errorMsg = "Could not get your location.";
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMsg += " Permission denied.";
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMsg += " Position unavailable.";
              break;
            case geoError.TIMEOUT:
              errorMsg += " Request timed out.";
              break;
            default:
              errorMsg += " An unknown error occurred.";
          }
          setError(`${errorMsg} Showing default location.`);
          setLocation(DEFAULT_LOCATION);
          setInitialLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Callback to fetch medical places
  const fetchMedicalPlaces = useCallback(async () => {
    if (!location) return;

    setFetchingPlaces(true);
    setError(null);
    setLastRouteError(null);
    setPlaces([]);
    setRoutingDestination(null);

    try {
      const typeConfig = MEDICAL_TYPES.find((t) => t.type === selectedType);
      if (!typeConfig)
        throw new Error(`Invalid type selected: ${selectedType}`);

      const radius = 10000;
      const { lat, lng } = location;
      const timeoutSeconds = 30;

      const queryParts = typeConfig.queryTags.map(
        (tagSelector) =>
          `node${tagSelector}(around:${radius},${lat},${lng});way${tagSelector}(around:${radius},${lat},${lng});relation${tagSelector}(around:${radius},${lat},${lng});`
      );
      const query = `[out:json][timeout:${timeoutSeconds}];(${queryParts.join(
        ""
      )});out center;`;

      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        query
      )}`;

      const response = await fetch(overpassUrl, {
        signal: AbortSignal.timeout(timeoutSeconds * 1000 + 2000),
      });

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "Failed to read error body");
        let detail = "";
        if (response.status === 429) detail = "Too many requests.";
        else if (response.status === 400)
          detail = "Bad request (check query syntax).";
        else if (response.status >= 500) detail = "Server error.";
        throw new Error(
          `Overpass API request failed: ${response.status} ${
            response.statusText
          }. ${detail} ${errorText.substring(0, 150)}`
        );
      }

      interface OverpassElement {
        id: number;
        type: "node" | "way" | "relation";
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags: Record<string, string>;
      }
      interface OverpassResponse {
        elements?: OverpassElement[];
      }

      const data: OverpassResponse = await response.json();

      const validPlaces =
        data.elements?.filter(
          (place: OverpassElement): place is MedicalPlace => {
            const hasValidId =
              place && place.id != null && typeof place.id === "number";
            const hasValidType =
              place &&
              place.type != null &&
              ["node", "way", "relation"].includes(place.type);
            const hasTags =
              place && place.tags != null && typeof place.tags === "object";
            const hasValidCoords =
              (place.lat != null &&
                place.lon != null &&
                typeof place.lat === "number" &&
                typeof place.lon === "number") ||
              (place.center?.lat != null &&
                place.center?.lon != null &&
                typeof place.center.lat === "number" &&
                typeof place.center.lon === "number");
            return !!(hasValidId && hasValidType && hasTags && hasValidCoords);
          }
        ) ?? [];

      const uniquePlaces = Array.from(
        new Map(validPlaces.map((p: MedicalPlace) => [p.id, p])).values()
      );
      setPlaces(uniquePlaces);

      if (uniquePlaces.length === 0) {
        setError(
          `No ${typeConfig.displayName.toLowerCase()} found within ${
            radius / 1000
          }km.`
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[fetchMedicalPlaces] Failed to load locations:", error);
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        setError("Fetching locations timed out. Please try again.");
      } else {
        setError(
          error.message || "An unknown error occurred while fetching locations."
        );
      }
      setPlaces([]);
    } finally {
      setFetchingPlaces(false);
    }
  }, [location, selectedType]);

  // Effect to trigger fetching
  useEffect(() => {
    if (location) {
      fetchMedicalPlaces();
    }
  }, [fetchMedicalPlaces]);

  // --- Route Handling Callbacks ---
  const handleShowRoute = useCallback(
    (coords: L.LatLngExpression) => {
      if (!location) {
        setError("Cannot calculate route: Your location is not available.");
        return;
      }
      let destLatLng: L.LatLng | null = null;
      try {
        destLatLng = L.latLng(coords);
        if (isNaN(destLatLng.lat) || isNaN(destLatLng.lng))
          throw new Error("Invalid coordinates");
      } catch (e) {
        console.error("Error creating LatLng for destination:", e, coords);
        setError("Cannot calculate route: Invalid destination coordinates.");
        return;
      }
      setRoutingDestination(destLatLng);
      setError(null);
      setLastRouteError(null);
    },
    [location]
  );

  const handleClearRoute = useCallback(() => {
    setRoutingDestination(null);
    setLastRouteError(null);
  }, []);

  const handleRouteError = useCallback((message: string) => {
    setLastRouteError(message);
    setRoutingDestination(null);
  }, []);

  // --- Render Logic ---
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-screen p-4">
        <div className="text-xl text-gray-600 animate-pulse">
          Getting your location...
        </div>
      </div>
    );
  }

  const mapCenter: L.LatLngExpression = location
    ? [location.lat, location.lng]
    : [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng];

  const destinationIcon = customIcons[selectedType] || DefaultIcon;
  const userIcon = customIcons["user"] || DefaultIcon;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-5 text-center text-pink-700">
        Find Nearby Medical Help
      </h1>

      {/* Error Display */}
      {(error || lastRouteError) && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 max-w-3xl mx-auto"
          role="alert"
        >
          <strong className="font-bold">Notice: </strong>
          <span className="block sm:inline">{lastRouteError || error}</span>
          {(routingDestination || lastRouteError) && (
            <button
              onClick={handleClearRoute}
              className="ml-4 mt-2 sm:mt-0 sm:ml-4 inline-block px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              aria-label="Clear route attempt"
            >
              Clear Route Attempt
            </button>
          )}
        </div>
      )}

      {/* Type Selection Buttons */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
        {MEDICAL_TYPES.map(({ type, displayName }) => (
          <button
            key={type}
            onClick={() => {
              if (selectedType !== type) setSelectedType(type);
            }}
            disabled={fetchingPlaces}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-medium transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
              ${
                selectedType === type
                  ? "bg-pink-600 text-white shadow-md ring-2 ring-offset-1 ring-pink-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              } ${
              fetchingPlaces
                ? "opacity-60 cursor-not-allowed"
                : "hover:scale-105 active:scale-100"
            }`}
            aria-pressed={selectedType === type}
          >
            {displayName}
          </button>
        ))}
      </div>

      {/* Clear Route Button */}
      {routingDestination && !lastRouteError && (
        <div className="text-center mb-4">
          <button
            onClick={handleClearRoute}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm font-medium"
          >
            Clear Current Route
          </button>
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative max-w-5xl mx-auto border border-gray-300 rounded-lg shadow-xl overflow-hidden"
        style={{ minHeight: "500px" }}
      >
        {/* Loading Overlay */}
        {fetchingPlaces && (
          <div
            className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-[1000]"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="text-lg text-pink-600 font-semibold animate-pulse">
              Searching for{" "}
              {MEDICAL_TYPES.find(
                (t) => t.type === selectedType
              )?.displayName.toLowerCase()}
              ...
            </div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: "100%", height: "70vh", minHeight: "500px" }}
          className="z-0"
        >
          {/* Update Map View */}
          {(!routingDestination || lastRouteError) && (
            <ChangeView center={mapCenter} zoom={mapZoom} />
          )}

          {/* Base Tile Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors & <a href="http://project-osrm.org/" target="_blank" rel="noopener noreferrer">OSRM</a>'
            maxZoom={19}
          />

          {/* User Marker */}
          {location && !routingDestination && (
            <Marker
              position={[location.lat, location.lng]}
              icon={userIcon}
              zIndexOffset={1000}
              alt="Your current location"
              keyboard={false}
            >
              <Popup>You are here (approximately)</Popup>
            </Marker>
          )}

          {/* Place Markers */}
          {places.map((place) => {
            const position: L.LatLngExpression | null =
              place.lat && place.lon
                ? [place.lat, place.lon]
                : place.center?.lat && place.center?.lon
                ? [place.center.lat, place.center.lon]
                : null;

            if (!position) return null;

            const placeLatLng = L.latLng(position[0], position[1]);
            const markerIcon = customIcons[selectedType] || DefaultIcon;
            const isDestination = routingDestination?.equals(placeLatLng);

            if (isDestination && !lastRouteError) return null;

            const getCoordsArray = (
              pos: L.LatLngExpression
            ): [number, number] | null => {
              try {
                const ll = L.latLng(pos);
                if (!isNaN(ll.lat) && !isNaN(ll.lng)) return [ll.lat, ll.lng];
              } catch {
                /* Ignore errors */
              }
              return null;
            };
            const coordsArray = getCoordsArray(position);
            const googleMapsUrl = coordsArray
              ? `https://www.google.com/maps/dir/?api=1&destination=${coordsArray[0]},${coordsArray[1]}`
              : "#";

            return (
              <Marker
                key={`${place.type}-${place.id}`}
                position={position}
                icon={markerIcon}
                alt={place.tags.name || `Medical Facility ${place.id}`}
                keyboard={false}
              >
                <Popup minWidth={200} maxWidth={280}>
                  <div className="text-sm">
                    <h3 className="font-bold text-base mb-1 break-words">
                      {place.tags.name || "Unnamed Location"}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 italic">
                      {place.type} ID: {place.id}
                    </p>

                    {place.tags.speciality && (
                      <p>
                        <span className="font-semibold">Specialty:</span>{" "}
                        {place.tags.speciality}
                      </p>
                    )}
                    {place.tags.healthcare && !place.tags.speciality && (
                      <p>
                        <span className="font-semibold">Type:</span>{" "}
                        {place.tags.healthcare}
                      </p>
                    )}
                    {place.tags.amenity &&
                      !place.tags.healthcare &&
                      !place.tags.speciality && (
                        <p>
                          <span className="font-semibold">Type:</span>{" "}
                          {place.tags.amenity}
                        </p>
                      )}
                    {place.tags.phone && (
                      <p>
                        <span className="font-semibold">Phone:</span>{" "}
                        <a
                          href={`tel:${place.tags.phone.replace(/\s+/g, "")}`}
                          className="text-pink-600 hover:underline"
                        >
                          {place.tags.phone}
                        </a>
                      </p>
                    )}
                    {place.tags.opening_hours && (
                      <p
                        className="mt-1 text-xs overflow-hidden overflow-ellipsis whitespace-nowrap"
                        title={place.tags.opening_hours}
                      >
                        <span className="font-semibold">Hours:</span>{" "}
                        {place.tags.opening_hours}
                      </p>
                    )}

                    {/* Popup Actions */}
                    <div className="mt-3 space-x-2 flex flex-wrap gap-y-2">
                      {location && !isDestination && (
                        <button
                          onClick={() => handleShowRoute(position)}
                          className="flex-shrink-0 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition shadow active:bg-green-800"
                        >
                          Show Route Here
                        </button>
                      )}
                      {isDestination && !lastRouteError && (
                        <button
                          onClick={handleClearRoute}
                          className="flex-shrink-0 px-3 py-1.5 bg-gray-500 text-white text-xs font-semibold rounded hover:bg-gray-600 transition shadow"
                        >
                          Clear Route
                        </button>
                      )}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-shrink-0 inline-block px-3 py-1.5 bg-pink-500 text-white text-xs font-semibold rounded hover:bg-pink-600 transition shadow active:bg-pink-700 ${
                          coordsArray ? "" : "opacity-50 cursor-not-allowed"
                        }`}
                        title={
                          coordsArray
                            ? "Open directions in Google Maps"
                            : "Cannot generate Google Maps link"
                        }
                        aria-disabled={!coordsArray}
                      >
                        Directions (Google)
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Routing Component */}
          <MapRoutingComponent
            startLocation={location}
            destinationCoords={routingDestination}
            selectedPlaceIcon={destinationIcon}
            userIcon={userIcon}
            onRouteError={handleRouteError}
            onRouteClear={handleClearRoute}
          />
        </MapContainer>
      </div>

      {/* Footer Attributions */}
      <p className="text-center text-xs text-gray-500 mt-4">
        Routing provided by{" "}
        <a
          href="http://project-osrm.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OSRM
        </a>{" "}
        public demo server. Availability not guaranteed. Map data ©
        OpenStreetMap contributors. Icons by Flaticon.
      </p>

      {/* No Results Message */}
      {!fetchingPlaces &&
        places.length === 0 &&
        location &&
        !error &&
        !lastRouteError && (
          <div className="text-center mt-6 text-gray-500">
            Finished searching. No{" "}
            {MEDICAL_TYPES.find(
              (t) => t.type === selectedType
            )?.displayName.toLowerCase()}{" "}
            found nearby.
          </div>
        )}
    </div>
  );
};

export default EmergencyMapClient;
