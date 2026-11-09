import { Hand, Lock, ScanFace, Smile, Upload, Volume2 } from "lucide-react";

const STEPS = [
  { Icon: Upload, title: "Upload a photo", text: "Drag in or browse a JPG, PNG or WEBP with a face in it." },
  { Icon: ScanFace, title: "We find the face", text: "Face detection runs in your browser and locks onto every face it finds." },
  { Icon: Hand, title: "Slap, punch or kick", text: "Pick a move (or tap the face) and watch the cartoon chaos unfold." },
  { Icon: Smile, title: "Feel better", text: "Watch the face react, rack up hits, and fill your stress-relief meter." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14">
      <h2 className="font-display mb-8 text-center text-5xl tracking-wide">How It <span className="text-yellow-300">Works</span></h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ Icon, title, text }, i) => (
          <li key={title} className="card relative flex flex-col gap-2 p-6 transition hover:-translate-y-1 hover:rotate-[-1deg]">
            <span className="font-display absolute top-3 right-4 text-5xl text-white/10">{i + 1}</span>
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400">
              <Icon className="size-6" />
            </div>
            <h3 className="text-lg font-extrabold">{title}</h3>
            <p className="text-sm text-white/75">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16">
      <div className="card grid gap-6 p-8 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-5xl tracking-wide">About <span className="text-yellow-300">StressLap</span></h2>
          <p className="text-white/80">
            Think of it as a virtual slap game crossed with an interactive photo game: pick a slap, punch or kick and the
            face in your picture wobbles, squints and gasps with exaggerated face reactions.
          </p>
          <p className="text-white/80">
            StressLap is a free online stress relief game with a silly, cartoon style. Everything here is make-believe: open-palm boops,
            squishy boxing gloves and flying sneakers, with comic sound effects and over-the-top reactions. No one gets hurt,
            except maybe your stress.
          </p>
          <p className="text-white/80">
            Please keep it kind: use photos of yourself, a willing friend, or your favourite celebrity-shaped cushion.
          </p>
        </div>
        <ul className="flex flex-col gap-3 text-sm">
          <li className="flex gap-3 rounded-2xl bg-white/10 p-3"><Lock className="size-5 shrink-0 text-emerald-300" /> Photos never leave your device and are never stored.</li>
          <li className="flex gap-3 rounded-2xl bg-white/10 p-3"><ScanFace className="size-5 shrink-0 text-yellow-300" /> Face detection runs locally with MediaPipe.</li>
          <li className="flex gap-3 rounded-2xl bg-white/10 p-3"><Volume2 className="size-5 shrink-0 text-pink-300" /> Sound effects are generated live in your browser.</li>
        </ul>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is StressLap free to play?",
    a: "Yes. StressLap is a free online entertainment game that runs in your web browser. There is nothing to install and no account to create.",
  },
  {
    q: "Are my photos uploaded or saved?",
    a: "No. Face detection and every animation run locally on your device. Your photo is never sent to a server, never stored, and disappears when you close or refresh the page.",
  },
  {
    q: "Which photos work best?",
    a: "A clear, front-facing photo in JPG, PNG or WEBP format works best. If the face is small, turned away or very dark, try another picture.",
  },
  {
    q: "Does it work on phones and tablets?",
    a: "Yes. StressLap works in current versions of Chrome, Safari, Firefox and Edge on desktop and mobile. On touch screens you can tap the face to punch that exact spot.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16" aria-labelledby="faq-title">
      <h2 id="faq-title" className="font-display mb-8 text-center text-5xl tracking-wide">
        Frequently Asked <span className="text-yellow-300">Questions</span>
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {FAQS.map(({ q, a }) => (
          <article key={q} className="card flex flex-col gap-2 p-6">
            <h3 className="text-lg font-extrabold">{q}</h3>
            <p className="text-sm text-white/80">{a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/70">
      <nav aria-label="Footer" className="mb-3 flex flex-wrap justify-center gap-x-6 gap-y-2 font-bold">
        <a href="#home" className="nav-link">Play StressLap</a>
        <a href="#how-it-works" className="nav-link">How the slap game works</a>
        <a href="#about" className="nav-link">About StressLap</a>
        <a href="#faq" className="nav-link">Privacy and FAQ</a>
      </nav>
      <p>StressLap · Made for laughs · Your photos stay with you</p>
    </footer>
  );
}
