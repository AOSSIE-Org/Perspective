import React from "react";
import FeatureCard from "./FeatureCard";
import BiasDetectionImg from "@/assets/BiasDetectionBG.png";
import OwnKeysImg from "@/assets/OwnKeysBG.png";
import DeepResearchImg from "@/assets/DeepResearchBG.png";
import FactCheckImg from "@/assets/FactCheckBG.png";

const features = [
  {
    image: BiasDetectionImg,
    title: "Uncover Agendas\nand Leanings",
    description: "Instantly analyze the political slant and emotional language of any article.",
  },
  {
    image: OwnKeysImg,
    title: "Bring Your Own Keys,\nYour Privacy, Your Control",
    description: "Connect your own API keys. You keep full control over your data usage and billing.",
  },
  {
    image: DeepResearchImg,
    title: "Deep Research,\nDone in seconds",
    description: "An intelligent agent that reads, digests, and summarizes multiple viewpoints to give you the complete picture",
  },
  {
    image: FactCheckImg,
    title: "Verify Claims with\nWeb-Search",
    description: "Don't trust blindly. Cross-checks article claims against the live internet.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative w-full max-w-[1400px] mx-auto px-6 py-20 flex flex-col items-center gap-16">
      <div className="flex flex-col items-center gap-4 text-center max-w-3xl">
        <h3 className="font-semibold text-4xl md:text-5xl text-white">
          The Perspective Engine
        </h3>
        
        <p className="font-normal text-lg text-gray-300 leading-relaxed">
          Our advanced AI pipeline processes articles through multiple stages to deliver balanced, fact-checked perspectives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            image={feature.image}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}
