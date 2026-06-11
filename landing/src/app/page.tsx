import { Choices } from "@/components/Choices";
import { Everywhere } from "@/components/Everywhere";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Everywhere />
        <HowItWorks />
        <Choices />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
