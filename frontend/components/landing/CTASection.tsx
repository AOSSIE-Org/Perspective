import React from "react";
import Button from "./Button";

export default function CTASection() {
  return (
    <section className="w-full flex flex-col items-center justify-center py-20 px-6 text-center gap-8">
      <div className="flex flex-col gap-4 max-w-2xl">
        <h3 className="font-semibold text-3xl md:text-4xl text-white">
          Ready to See Every Side of the Story?
        </h3>
        
        <p className="font-normal text-lg text-gray-300 leading-relaxed">
          Join thousands of readers who are already discovering balanced perspectives and combating bias in online content.
        </p>
      </div>
      
      <div className="mt-4">
        <Button size="large">Try now</Button>
      </div>
    </section>
  );
}
