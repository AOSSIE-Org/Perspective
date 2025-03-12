import Link from "next/link";
import { Brain } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const Navbar = () => {

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-teal-600 to-emerald-500 shadow-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Brain className="w-8 h-8 text-white" />
            <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
          </div>
          <Link
            href="/"
            className="text-xl font-bold text-white tracking-tight"
          >
            Perspective AI
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-white hover:text-white/80 transition-colors"
          >
            HOME
          </Link>
          <Link
            href="https://github.com/AOSSIE-Org/Perspective"
            className="text-sm font-medium text-white hover:text-white/80 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GITHUB
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
