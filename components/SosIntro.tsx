"use client";

import Link from "next/link";
import Image from "next/image";

const SOSIntro = () => {
  return (
    <section className="relative flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-24 bg-gradient-to-r from-pink-100 to-pink-50">
      {/* Text Section */}
      <div className="max-w-xl text-center md:text-left z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-pink-600 leading-tight mb-4">
          Empowering Safety, One Tap at a Time 💖
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          Our SOS feature lets you instantly share your live location with
          trusted contacts through WhatsApp during emergencies. Because your
          safety matters, always. 🚨
        </p>
        <Link
          href="/sos"
          className="inline-block bg-pink-600 text-white px-6 py-3 rounded-full text-lg hover:bg-pink-700 transition"
        >
          I am in Danger 🆘
        </Link>
      </div>

      {/* Image */}
      <Image
        src="/danger.png" // Make sure to place an image like this in your public folder
        alt="SOS Emergency Illustration"
        width={380}
        height={380}
        className="w-72 md:w-96 object-contain drop-shadow-lg"
      />

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-slow -top-10 left-10" />
        <div className="absolute w-60 h-60 bg-red-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float-slower bottom-0 right-0" />
      </div>
    </section>
  );
};

export default SOSIntro;
