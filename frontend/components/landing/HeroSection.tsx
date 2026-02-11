import React from "react";
import SearchBar from "./SearchBar";

export default function HeroSection() {
  return (
    <section className="w-full flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-5xl md:text-7xl lg:text-[64px] text-white leading-tight">
          Uncover Hidden
          <br />
          Perspectives
        </h2>
        
        <p className="font-semibold text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
          Combat bias and one-sided narratives with AI-researched alternative perspectives.
        </p>
      </div>

      <div className="w-full flex justify-center mt-4">
        <SearchBar />
      </div>
    </section>
  );
}
