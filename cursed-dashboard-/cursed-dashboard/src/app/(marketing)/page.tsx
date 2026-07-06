import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { Stats } from "@/components/marketing/stats";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQ } from "@/components/marketing/faq";
import { Footer } from "@/components/marketing/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-void">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
