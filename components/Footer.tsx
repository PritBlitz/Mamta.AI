import Link from "next/link";
import BackgroundMusic from "./BackgroundMusic";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-slow -top-24 left-12" />
          <div className="absolute w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slower top-12 right-16" />
          <div className="absolute w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-2xl opacity-35 animate-float-slower bottom-10 left-[35%]" />
        </div>

        {/* Branding */}
        <div>
          <h2 className="text-2xl font-bold text-pink-600">
            Mamta<span className="text-black">.AI</span>
          </h2>
          <p className="mt-2 text-sm">
            Supporting women through every stage of motherhood — with care,
            privacy, and technology. 🌷
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-2">Quick Links</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/about" className="hover:text-pink-600">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/journal" className="hover:text-pink-600">
                Wellness Journal
              </Link>
            </li>
            <li>
              <Link href="/ai-assistant" className="hover:text-pink-600">
                AI Assistant
              </Link>
            </li>
            <li>
              <Link href="/sos" className="hover:text-pink-600">
                Emergency SOS
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div>
          <h3 className="font-semibold mb-2">Connect</h3>
          <p className="text-sm mb-2">Have feedback? Let’s connect.</p>
          <ul className="space-y-1 text-sm">
            <li>
              <a href="mailto:contact@Mamta.ai" className="hover:text-pink-600">
                pritblitz.work@Mamta.ai
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/pritish-biswas-pb24"
                target="_blank"
                className="hover:text-pink-600"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://github.com/PritBlitz"
                target="_blank"
                className="hover:text-pink-600"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
      <BackgroundMusic />

      <div className="border-t border-gray-300 text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} Mamta.AI — All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
