type SOSControlsProps = {
  emergencyContacts: string[];
  startTracking: () => void;
  stopTracking: () => void;
};

const SOSControls = ({
  emergencyContacts,
  startTracking,
  stopTracking,
}: SOSControlsProps) => {
  return (
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
  );
};

export default SOSControls;
