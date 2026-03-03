"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, AlertCircle } from "lucide-react";

const providers = [
  { id: "gemini", name: "Gemini" },
  { id: "groq", name: "Groq" },
];

export default function SearchBar() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(providers[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    if (inputUrl.length > 0) {
      setIsValidUrl(validateUrl(inputUrl));
    } else {
      setIsValidUrl(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl && url) {
     
      sessionStorage.removeItem("analysisResult");
      sessionStorage.removeItem("BiasScore");
      
      sessionStorage.setItem("articleUrl", url);
      sessionStorage.setItem("selectedProvider", selectedProvider.id);
      
      router.push("/perspective");
    }
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-2">
      <form 
        onSubmit={handleSearch} 
        className={`relative w-full flex items-center px-4 py-2 rounded-search bg-white/5 border transition-all duration-300 focus-within:bg-white/10 ${
          url && !isValidUrl 
            ? "border-red-500/50 focus-within:border-red-500" 
            : "border-white/10 focus-within:border-white/30"
        }`}
      >
        {/* Input Field */}
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://example.com/article"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 font-light text-[15px] mr-2"
        />
        
        {/* Validation Indicator */}
        {url && (
          <div className="mr-3">
            {isValidUrl ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-6 w-[1px] bg-white/10 mr-3"></div>

        {/* Provider Dropdown Trigger */}
        <div className="relative mr-3">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-white/80 text-sm hover:text-white transition-colors"
          >
            <span className="font-medium">{selectedProvider.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-3 bg-[#1B1F24] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${
                    selectedProvider.id === provider.id ? "text-blue-400" : "text-white/80"
                  }`}
                >
                  {provider.name}
                  {selectedProvider.id === provider.id && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Icon Button */}
        <button 
          type="submit" 
          disabled={!isValidUrl || !url}
          className={`p-2 rounded-full transition-all group ${
            isValidUrl && url
              ? "text-white hover:bg-white/10 cursor-pointer"
              : "text-white/30 cursor-not-allowed"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:scale-110 transition-transform"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>
      
      {/* Error message */}
      {url && !isValidUrl && (
        <p className="text-red-400 text-xs ml-4">
          Please enter a valid URL
        </p>
      )}
    </div>
  );
}
