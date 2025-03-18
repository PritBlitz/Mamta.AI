type ContactListProps = {
  emergencyContacts: string[];
};

const ContactList = ({ emergencyContacts }: ContactListProps) => {
  return emergencyContacts.length > 0 ? (
    <div className="text-left mt-[-1.5rem] mb-6">
      <h2 className="font-semibold text-pink-700 mb-2">Emergency Contacts:</h2>
      <ul className="list-disc list-inside text-gray-700">
        {emergencyContacts.map((contact, index) => (
          <li key={index}>{contact}</li>
        ))}
      </ul>
    </div>
  ) : null;
};

export default ContactList;
