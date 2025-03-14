"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import MamtaGlow from "./MamtaGlow";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <MamtaGlow />
          <h1 className="text-2xl font-bold text-pink-600">
            Mamta<span className="text-black">.AI</span>
          </h1>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-6 text-gray-700 font-medium items-center">
          <Link href="/about" className="hover:text-pink-600">
            About
          </Link>
          <Link href="/journal" className="hover:text-pink-600">
            Journal
          </Link>
          <Link href="/ai_assistant" className="hover:text-pink-600">
            Mamta Assistant
          </Link>
          <Link href="/sos" className="hover:text-pink-600">
            SOS
          </Link>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="hover:bg-pink-600 hover:text-white px-4 py-1 border border-pink-600 rounded-full">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4">
          <nav className="flex flex-col space-y-3 text-gray-700 font-medium">
            <Link href="/about" onClick={toggleMenu}>
              About
            </Link>
            <Link href="/journal" onClick={toggleMenu}>
              Journal
            </Link>
            <Link href="/ai_assistant" onClick={toggleMenu}>
              Mamta Assistant
            </Link>
            <Link href="/sos" onClick={toggleMenu}>
              SOS
            </Link>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="hover:bg-pink-600 hover:text-white px-4 py-1 border border-pink-600 rounded-full">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
