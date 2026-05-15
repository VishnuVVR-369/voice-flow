import { Choices } from "@/components/Choices";
import { Demo } from "@/components/Demo";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Demo />
        <Choices />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
