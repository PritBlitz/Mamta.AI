type WhatsAppLinksProps = {
  links: string[];
  emergencyContacts: string[];
};

const WhatsAppLinks = ({ links, emergencyContacts }: WhatsAppLinksProps) => {
  if (links.length === 0 || emergencyContacts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, index) => (
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
  );
};

export default WhatsAppLinks;
