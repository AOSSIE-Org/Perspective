"use client";

import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  size?: "default" | "large";
  onClick?: () => void;
}

export default function Button({ children, size = "default", onClick }: ButtonProps) {
  const sizeClasses = size === "large" 
    ? "px-[27.197px] py-[6.217px] text-[18.65px] tracking-[-0.9325px]"
    : "px-[35px] py-[8px] text-[24px] tracking-tighter";

  return (
    <button
      onClick={onClick}
      className={`bg-background-button rounded-button text-white font-normal ${sizeClasses} flex items-center justify-end`}
    >
      {children}
    </button>
  );
}
