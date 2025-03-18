"use client";

import Link from "next/link";
import Image from "next/image";

const Emergency = () => {
  return (
    <section className="relative flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-28 bg-gradient-to-br from-red-50 to-white">
      {/* Text Section */}
      <div className="max-w-xl text-center md:text-left z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-black leading-tight mb-4">
          Nearest Help, <span className="text-pink-600">One Tap Away</span>
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          Quickly navigate to nearby hospitals, clinics, or gynecologists when
          in need. Your health is our priority. ❤️‍🩹
        </p>
        <Link
          href="/emergency"
          className="inline-block bg-pink-600 text-white px-6 py-3 rounded-full text-lg hover:bg-pink-800 transition"
        >
          Find Nearby Help 🚑
        </Link>
      </div>

      {/* Image Section */}
      <Image
        src="/emergency.png" // Replace this with a fitting image like a map marker, hospital sign, or doctor illustration
        alt="Emergency Motherhood"
        width={384}
        height={384}
        className="w-72 md:w-96 object-contain drop-shadow-lg"
      />

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-slow -top-20 left-10" />
        <div className="absolute w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slower top-0 right-0" />
        <div className="absolute w-60 h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-float-slower bottom-0 left-[40%]" />
      </div>
    </section>
  );
};

export default Emergency;
