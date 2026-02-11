import React from "react";

interface BiasGaugeProps {
  score: number;
  gradientColors: string[];
  textColor: string;
  label: string;
}

export function BiasGauge({ score, gradientColors, textColor, label }: BiasGaugeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-[180px] h-[100px] mb-2">
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          {/* Background Track */}
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#2A2E35" strokeWidth="8" strokeLinecap="round" />
          {/* Progress Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#biasGradient-${score})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 126} 126`}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id={`biasGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="text-center">
        <div className={`text-3xl font-bold font-sora ${textColor}`}>{Math.round(score)}%</div>
        <div className="text-sm text-gray-400 font-sora">{label}</div>
      </div>
    </div>
  );
}