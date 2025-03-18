type ContactFormProps = {
  emergencyNumber: string;
  setEmergencyNumber: (value: string) => void;
  handleAddContact: () => void;
};

const ContactForm = ({
  emergencyNumber,
  setEmergencyNumber,
  handleAddContact,
}: ContactFormProps) => {
  return (
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
    </div>
  );
};

export default ContactForm;
