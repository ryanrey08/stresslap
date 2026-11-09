import { Header } from "@/components/Header";
import { About, Faq, Footer, HowItWorks } from "@/components/InfoSections";
import { SoundProvider } from "@/components/SoundController";
import { StressLapApp } from "@/components/StressLapApp";
import { StructuredData } from "@/components/StructuredData";

// Metadata for this page comes from the root layout (single-page site; no duplication needed).
export default function Home() {
  return (
    <SoundProvider>
      <StructuredData />
      <Header />
      <main>
        <StressLapApp />
        <HowItWorks />
        <About />
        <Faq />
      </main>
      <Footer />
    </SoundProvider>
  );
}
