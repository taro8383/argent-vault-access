import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NarrativeSection from "@/components/NarrativeSection";
import WineVault from "@/components/WineVault";
import GlobalMap from "@/components/GlobalMap";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <NarrativeSection />
      <WineVault />
      <GlobalMap />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
