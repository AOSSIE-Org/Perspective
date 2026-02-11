import React from "react";

export default function Footer() {
  return (
    <footer className="w-full max-w-[1400px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 mt-auto">
      <p className="font-semibold text-xl text-white">
        perspective
      </p>
      
      <p className="font-medium text-sm text-gray-400 text-center md:text-right">
        © 2026 AOSSIE. Combating bias through AI-powered perspective analysis.
      </p>
    </footer>
  );
}
