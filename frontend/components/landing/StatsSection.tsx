import React from "react";

interface StatProps {
  value: string;
  label: string;
}

function Stat({ value, label }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-semibold text-3xl md:text-4xl text-white text-center w-full">
        {value}
      </p>
      <p className="font-normal text-base md:text-lg text-gray-300 text-center w-full whitespace-nowrap">
        {label}
      </p>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="w-full flex flex-wrap items-center justify-center gap-12 md:gap-20 px-6 pb-20">
      <Stat value="10k+" label="Articles Analyzed" />
      <Stat value="95%" label="Bias Detected" />
      <Stat value="98%" label="Fast Accuracy" />
      <Stat value="4.3stars" label="Ratings" />
    </section>
  );
}
