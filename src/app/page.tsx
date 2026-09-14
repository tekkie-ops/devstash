import { auth } from "@/auth";
import { AiSection } from "@/components/homepage/AiSection";
import { ClosingCta } from "@/components/homepage/ClosingCta";
import { FeaturesSection } from "@/components/homepage/FeaturesSection";
import { Footer } from "@/components/homepage/Footer";
import { Hero } from "@/components/homepage/Hero";
import { Navbar } from "@/components/homepage/Navbar";
import { PricingSection } from "@/components/homepage/PricingSection";

export default async function Home() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <FeaturesSection />
      <AiSection />
      <PricingSection />
      <ClosingCta />
      <Footer />
    </>
  );
}
