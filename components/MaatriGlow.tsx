export default function MaatriGlow() {
  return (
    <div className="relative w-6 h-6 animate-float">
      <div className="absolute inset-0 rounded-full blur-xl opacity-60 bg-pink-400 animate-pulse-slow" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-6 h-6 text-pink-600"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M15.75 4.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9.75 9A3.75 3.75 0 0013.5 12.75V21h3v-5.25h.75a.75.75 0 00.75-.75v-1.5a4.5 4.5 0 00-4.5-4.5H9.75z" />
      </svg>
    </div>
  );
}
