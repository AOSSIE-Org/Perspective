import React from "react";
import Button from "./Button";

export default function Navbar() {
  return (
    <div className="w-full flex justify-center pt-6 px-4 z-50">
      <nav className="w-full max-w-[1400px] flex items-center justify-between px-6 py-4 md:px-[60px] md:py-[19px] rounded-nav bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
        <h1 className="font-semibold text-2xl md:text-[36px] leading-normal tracking-tight text-white cursor-pointer select-none">
          perspective
        </h1>
        <Button>Try now</Button>
      </nav>
    </div>
  );
}
