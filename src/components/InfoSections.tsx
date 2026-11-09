import { Download, Footprints, Grab, Hand, Lock, ScanFace, Upload, Volume2 } from "lucide-react";

const sectionTitle = "font-display text-5xl tracking-wide";
const paragraph = "text-white/80";

export function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14">
      <div className="card grid gap-6 p-8 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <h2 className={sectionTitle}>What Is <span className="text-yellow-300">StressLap?</span></h2>
          <p className={paragraph}>
            StressLap is a free online stress relief game and interactive photo editor. Upload a photo, let the app detect the
            face, then slap, punch or kick it with cartoon animations while the face wobbles, squints and gasps.
          </p>
          <p className={paragraph}>
            Everything here is make-believe: open-palm boops, squishy boxing gloves and flying sneakers, with comic sound effects
            and over-the-top reactions. No one gets hurt, except maybe your stress.
          </p>
          <p className={paragraph}>
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

const STEPS = [
  { Icon: Upload, title: "Upload a photo", text: "Drag in or browse a JPG, PNG or WEBP with a face in it." },
  { Icon: ScanFace, title: "We find the face", text: "Face detection runs in your browser. If there are several faces, pick your target." },
  { Icon: Hand, title: "Slap, punch or kick", text: "Pick a move, hit Random, or tap the face. Every hit leaves a cartoon mark that stays." },
  { Icon: Download, title: "Download the result", text: "Happy with the chaos? Save your funny edited photo as a PNG." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16">
      <h2 className={`${sectionTitle} mb-8 text-center`}>How to Use <span className="text-yellow-300">StressLap</span></h2>
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

export function FaceDetection() {
  return (
    <section id="face-detection" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16">
      <div className="card flex flex-col gap-3 p-8">
        <h2 className={sectionTitle}>How Face Detection <span className="text-yellow-300">Works</span></h2>
        <p className={paragraph}>
          StressLap uses MediaPipe Face Landmarker, a machine-learning model that runs inside your browser with WebAssembly. It
          finds each face in your picture and maps landmarks such as the eyes, cheeks, nose and mouth, so hits land on the right
          spot and the face reaction effects line up with the features they animate.
        </p>
        <p className={paragraph}>
          StressLap only locates faces. It does not identify who is in a photo, and the picture stays on your device the whole
          time. Clear, front-facing photos work best. If no face is found, you will be asked to try another image.
        </p>
      </div>
    </section>
  );
}

const MOVES = [
  { Icon: Hand, title: "Slap", text: "A cartoon hand swings in and the head snaps to the side, leaving a red hand-shaped mark on the cheek." },
  { Icon: Grab, title: "Punch", text: "A squishy boxing glove lands with stars and shockwaves, leaving a silly cartoon bruise where it hit." },
  { Icon: Footprints, title: "Kick", text: "A flying sneaker enters the scene with the biggest recoil and screen shake, plus its own comic impact mark." },
];

export function Actions() {
  return (
    <section id="actions" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16">
      <h2 className={`${sectionTitle} mb-8 text-center`}>Available Actions: <span className="text-yellow-300">Slap, Punch, and Kick</span></h2>
      <div className="grid gap-4 md:grid-cols-3">
        {MOVES.map(({ Icon, title, text }) => (
          <article key={title} className="card flex flex-col gap-2 p-6">
            <Icon className="size-7 text-yellow-300" aria-hidden />
            <h3 className="text-lg font-extrabold">{title}</h3>
            <p className="text-sm text-white/80">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DownloadGuide() {
  return (
    <section id="download" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16">
      <div className="card flex flex-col gap-3 p-8">
        <h2 className={sectionTitle}>How to Download Your <span className="text-yellow-300">Edited Photo</span></h2>
        <p className={paragraph}>
          Every slap, punch and kick adds to the same picture, and the Your masterpiece panel shows the running result. When you
          like it, press DOWNLOAD FINAL IMAGE to save a PNG with all of your marks, built at up to the original resolution of
          your photo.
        </p>
        <p className={paragraph}>
          Changed your mind? Undo Last Action removes only the latest mark, and Clear All Effects takes you back to the original
          photo. The file is created on your own device, so nothing is uploaded when you download it.
        </p>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is StressLap free to play?",
    a: "Yes. StressLap is a free entertainment game that runs in your web browser. There is nothing to install and no account to create.",
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
  {
    q: "Can I keep my funny edited photo?",
    a: "Yes. Press DOWNLOAD FINAL IMAGE to save your photo with all of its cartoon effects as a PNG file.",
  },
  {
    q: "Can I use a photo of someone else?",
    a: "Only with their blessing. StressLap is meant for laughs, so stick to photos of yourself or friends who are happy to join in.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16" aria-labelledby="faq-title">
      <h2 id="faq-title" className={`${sectionTitle} mb-8 text-center`}>
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
        <a href="#how-it-works" className="nav-link">How to use StressLap</a>
        <a href="#face-detection" className="nav-link">How face detection works</a>
        <a href="#actions" className="nav-link">Slap, punch and kick actions</a>
        <a href="#download" className="nav-link">Download your edited photo</a>
        <a href="#faq" className="nav-link">Privacy and FAQ</a>
      </nav>
      <p>StressLap · Made for laughs · Your photos stay with you</p>
    </footer>
  );
}
