import React from "react";
import Image, { StaticImageData } from "next/image";

interface FeatureCardProps {
  image: string | StaticImageData;
  title: string;
  description: string;
}

export default function FeatureCard({
  image,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="relative group w-full h-full bg-card-gradient rounded-card p-[6px] transition-transform hover:-translate-y-1 duration-300">
       <div className="absolute inset-0 bg-card-gradient opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
      <div className="relative w-full h-full bg-background-card border border-border-light rounded-[calc(22px-6px)] flex flex-col items-center justify-start p-4 text-center z-10 overflow-hidden">
        
        <div className="relative w-full h-[200px] mb-4 flex-shrink-0 flex items-center justify-center">
             <Image
            src={image}
            alt={title}
            className="object-contain max-h-full max-w-full"
          />
        </div>
        
        <div className="flex flex-col gap-2 mt-auto pb-4">
             <h3 className="font-bold text-lg md:text-xl text-white leading-tight">
            {title}
            </h3>
            <p className="font-normal text-sm text-gray-300 leading-relaxed px-2">
            {description}
            </p>
        </div>
      </div>
    </div>
  );
}
