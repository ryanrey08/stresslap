import { SoundToggle } from "./SoundController";

export function Logo() {
  return (
    <a href="#home" className="flex items-center gap-2" aria-label="StressLap, back to the game">
      <svg viewBox="0 0 48 48" width="40" height="40" className="size-10 -rotate-12 drop-shadow-[0_3px_0_rgba(0,0,0,0.3)]" aria-hidden>
        <polygon points="24,2 29,16 44,12 34,24 46,34 30,32 26,46 20,33 6,40 13,26 2,16 18,16" fill="#fde047" stroke="#3b1d0e" strokeWidth="2.5" strokeLinejoin="round" />
        <text x="24" y="29" textAnchor="middle" fontSize="13" fontWeight="900" fill="#be185d" fontFamily="sans-serif">
          SL
        </text>
      </svg>
      <span className="font-display text-3xl tracking-wide">
        Stress<span className="text-yellow-300">Lap</span>
      </span>
    </a>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-purple-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-bold md:flex" aria-label="Main">
          <a href="#home" className="nav-link">Home</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </nav>
        <SoundToggle />
      </div>
      <nav className="flex justify-center gap-6 pb-2 text-xs font-bold md:hidden" aria-label="Main mobile">
        <a href="#home" className="nav-link">Home</a>
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#about" className="nav-link">About</a>
        <a href="#faq" className="nav-link">FAQ</a>
      </nav>
    </header>
  );
}
