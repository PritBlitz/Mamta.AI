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

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: iconUrl.src || iconUrl,
  shadowUrl: iconShadowUrl.src || iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
    speciality?: string;
    phone?: string;
    opening_hours?: string;
  };
}

const MEDICAL_TYPES = [
  {
    type: "hospital",
    displayName: "Hospitals",
    icon: "https://cdn-icons-png.flaticon.com/512/3448/3448513.png",
    queryTags: [`["amenity"="hospital"]`],
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
      `["healthcare"="doctor"]["speciality"="gynecology"]`,
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

interface ChangeViewProps {
  center: L.LatLngExpression;
  zoom: number;
}
const ChangeView: React.FC<ChangeViewProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      typeof center[0] === "number" &&
      typeof center[1] === "number"
    ) {
      map.setView(center, zoom);
    } else {
      console.warn("[ChangeView] Received invalid center coordinates:", center);
    }
  }, [center, zoom, map]);
  return null;
};

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
    if (!map || !startLocation) {
      return;
    }

    if (routingControlRef.current && !destinationCoords) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.warn(
          "[MapRoutingComponent] Error removing control during clear:",
          e
        );
      }
      routingControlRef.current = null;
      return;
    }

    if (destinationCoords) {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.warn(
            "[MapRoutingComponent] Error removing previous control:",
            e
          );
        }
        routingControlRef.current = null;
      }

      const startLatLng = L.latLng(startLocation.lat, startLocation.lng);

      if (
        isNaN(startLatLng.lat) ||
        isNaN(startLatLng.lng) ||
        isNaN(destinationCoords.lat) ||
        isNaN(destinationCoords.lng)
      ) {
        console.error(
          "[MapRoutingComponent] Invalid coordinates provided:",
          startLatLng,
          destinationCoords
        );
        onRouteError(
          "Cannot calculate route: Invalid start or destination coordinates."
        );
        onRouteClear();
        return;
      }

      if (startLatLng.distanceTo(destinationCoords) < 1) {
        onRouteError(
          "Start and destination are too close to calculate a route."
        );
        onRouteClear();
        return;
      }

      const instance = L.Routing.control({
        waypoints: [startLatLng, destinationCoords],
        routeWhileDragging: true,
        show: true,
        addWaypoints: false,
        draggableWaypoints: false,
        lineOptions: {
          styles: [{ color: "red", opacity: 0.8, weight: 6 }],
        },
        createMarker: (i: number, waypoint: L.Routing.Waypoint, n: number) => {
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

          if (routingControlRef.current) {
            try {
              map.removeControl(routingControlRef.current);
            } catch (removeError) {
              console.warn(
                "Error removing control after routing error:",
                removeError
              );
            }
            routingControlRef.current = null;
          }
          onRouteClear();
        })
        .on("routesfound", (e: unknown) => {
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
                  map.fitBounds(routeBounds, {
                    padding: [50, 50],
                    maxZoom: 16,
                  });
                } catch (fitBoundsError) {
                  console.error(
                    "[MapRoutingComponent] Error calling fitBounds:",
                    fitBoundsError,
                    routeBounds
                  );
                  map.fitBounds(
                    L.latLngBounds(startLatLng, destinationCoords),
                    { padding: [70, 70], maxZoom: 16 }
                  );
                }
              }, 100);
            } else {
              map.fitBounds(L.latLngBounds(startLatLng, destinationCoords), {
                padding: [70, 70],
                maxZoom: 16,
              });
            }
          } else {
            onRouteError(
              "Routing engine returned an incomplete route. Cannot display."
            );
            if (routingControlRef.current) {
              try {
                map.removeControl(routingControlRef.current);
              } catch (removeError) {
                console.warn(
                  "Error removing control after incomplete route:",
                  removeError
                );
              }
              routingControlRef.current = null;
            }
            onRouteClear();
          }
        })
        .addTo(map);

      routingControlRef.current = instance;
    }

    return () => {
      if (routingControlRef.current) {
        try {
          if (map?.removeControl) {
            // Check map instance validity
            map.removeControl(routingControlRef.current);
          }
        } catch (e) {
          console.warn(
            "[MapRoutingComponent] Could not remove routing control cleanly during cleanup:",
            e
          );
        }
        routingControlRef.current = null;
      }
    };
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

const EmergencyMapPage: React.FC = () => {
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
    icons["user"] = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535137.png",
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
    return icons;
  }, []);

  useEffect(() => {
    setInitialLoading(true);
    setError(null);
    setLastRouteError(null);
    setRoutingDestination(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported. Showing default location.");
      setLocation(DEFAULT_LOCATION);
      setInitialLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
        setInitialLoading(false);
      },
      (geoError) => {
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
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const fetchMedicalPlaces = useCallback(async () => {
    if (!location) {
      return;
    }

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
      const { lat, lng: lon } = location;
      const timeout = 30;

      const queryParts = typeConfig.queryTags.map(
        (tag) =>
          `node${tag}(around:${radius},${lat},${lon});way${tag}(around:${radius},${lat},${lon});relation${tag}(around:${radius},${lat},${lon});`
      );
      const query = `[out:json][timeout:${timeout}];(${queryParts.join(
        ""
      )});out center;`;

      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        query
      )}`;
      const response = await fetch(overpassUrl, {
        signal: AbortSignal.timeout(timeout * 1000 + 2000),
      });

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "Failed to read error body");
        throw new Error(
          `Overpass API request failed: ${response.status} ${
            response.statusText
          }. ${errorText.substring(0, 150)}`
        );
      }

      interface OverpassResponse {
        elements?: Array<{
          id: number;
          type: string;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags: Record<string, string>;
        }>;
      }

      const data: OverpassResponse = await response.json();

      const validPlaces =
        data.elements?.filter((place): place is MedicalPlace => {
          // Explicitly check each condition to ensure type safety
          const hasValidId =
            place && place.id != null && typeof place.id === "number";

          const hasValidType =
            place &&
            place.type != null &&
            ["node", "way", "relation"].includes(place.type);

          const hasTags =
            place &&
            place.tags != null &&
            typeof place.tags === "object" &&
            Object.keys(place.tags).length > 0;

          const hasValidLocation = Boolean(
            (place.lat != null &&
              place.lon != null &&
              typeof place.lat === "number" &&
              typeof place.lon === "number") ||
              (place.center &&
                place.center.lat != null &&
                place.center.lon != null &&
                typeof place.center.lat === "number" &&
                typeof place.center.lon === "number")
          );

          return Boolean(
            hasValidId && hasValidType && hasTags && hasValidLocation
          );
        }) ?? [];

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

  useEffect(() => {
    fetchMedicalPlaces();
  }, [fetchMedicalPlaces]);

  const handleShowRoute = useCallback(
    (coords: L.LatLngExpression) => {
      if (!location) {
        setError("Cannot calculate route: Your location is not available.");
        return;
      }
      const destLatLng = L.latLng(coords[0], coords[1]);
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
  }, []);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-screen p-4">
        <div className="text-xl text-gray-600 animate-pulse">
          Getting your location...
        </div>
      </div>
    );
  }

  const mapCenter: L.LatLngExpression = [
    location?.lat ?? DEFAULT_LOCATION.lat,
    location?.lng ?? DEFAULT_LOCATION.lng,
  ];

  const destinationIcon = customIcons[selectedType] || DefaultIcon;
  const userIcon = customIcons["user"] || DefaultIcon;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-5 text-center text-pink-700">
        Find Nearby Medical Help
      </h1>

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

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
        {MEDICAL_TYPES.map(({ type, displayName }) => (
          <button
            key={type}
            onClick={() => {
              if (selectedType !== type) {
                setSelectedType(type);
              }
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

      <div
        className="relative max-w-5xl mx-auto border border-gray-300 rounded-lg shadow-xl overflow-hidden"
        style={{ minHeight: "500px" }}
      >
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
          {(!routingDestination || lastRouteError) && (
            <ChangeView center={mapCenter} zoom={mapZoom} />
          )}

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors & <a href="http://project-osrm.org/" target="_blank" rel="noopener noreferrer">OSRM</a>'
            maxZoom={19}
          />

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

            // Helper function for Google Maps link coordinates
            const getCoordsArray = (
              pos: L.LatLngExpression
            ): [number, number] | null => {
              if (
                Array.isArray(pos) &&
                pos.length === 2 &&
                typeof pos[0] === "number" &&
                typeof pos[1] === "number"
              )
                return [pos[0], pos[1]];
              if ("lat" in pos && "lng" in pos) return [pos.lat, pos.lng];
              return null;
            };
            const coordsArray = getCoordsArray(position);
            const googleMapsUrl = coordsArray
              ? `https://www.google.com/maps/dir/?api=1&destination=${coordsArray[0]},${coordsArray[1]}`
              : "#";

            return (
              <Marker
                key={place.id}
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
                    {place.tags.amenity && !place.tags.healthcare && (
                      <p>
                        <span className="font-semibold">Type:</span>{" "}
                        {place.tags.amenity}
                      </p>
                    )}
                    {place.tags.phone && (
                      <p>
                        <span className="font-semibold">Phone:</span>{" "}
                        <a
                          href={`tel:${place.tags.phone}`}
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

                    <div className="mt-3 space-x-2 flex flex-wrap gap-y-2">
                      {!isDestination && location && (
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
        OpenStreetMap contributors.
      </p>

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

export default EmergencyMapPage;
