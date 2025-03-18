type LocationDisplayProps = {
  location: { lat: number; lon: number } | null;
};

const LocationDisplay = ({ location }: LocationDisplayProps) => {
  return location ? (
    <p className="mt-4 text-sm text-gray-700">
      Current Location: {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
    </p>
  ) : null;
};

export default LocationDisplay;
