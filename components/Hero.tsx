"use client";

import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-28 bg-gradient-to-br from-pink-50 to-white">
      {/* Text Section */}
      <div className="max-w-xl text-center md:text-left z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-black leading-tight mb-4">
          Meet <span className="text-pink-600">Mamta.AI</span>
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Your personalized Period and Pregnancy companion, providing care,
          guidance, and calmness during your beautiful journey. 🌷
        </p>
        <Link
          href="/ai_assistant"
          className="inline-block bg-pink-600 text-white px-6 py-3 rounded-full text-lg hover:bg-pink-700 transition"
        >
          Talk to your Soulmate 💗
        </Link>
      </div>

      {/* Optional Image or Illustration */}
      <Image
        src={"/motherhood.png"}
        alt={"Pregnant Woman"}
        width={384}
        height={384}
        className="w-72 md:w-96 object-contain drop-shadow-lg"
      ></Image>

      {/* Background Floating Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-slow -top-20 left-10" />
        <div className="absolute w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slower top-0 right-0" />
        <div className="absolute w-60 h-60 bg-rose-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-float-slower bottom-0 left-[40%]" />
      </div>
    </section>
  );
};

export default Hero;
