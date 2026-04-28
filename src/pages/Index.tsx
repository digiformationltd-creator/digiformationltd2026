import DigiNav from "@/components/DigiNav";
import DigiHero from "@/components/DigiHero";
import DigiTrustBar from "@/components/DigiTrustBar";
import DigiServicesSlider from "@/components/DigiServicesSlider";
import DigiStats from "@/components/DigiStats";
import DigiServices from "@/components/DigiServices";
import DigiCTA from "@/components/DigiCTA";
import DigiFooter from "@/components/DigiFooter";

const Index = () => (
  <div className="min-h-screen bg-background overflow-x-hidden">
    <DigiNav />
    <main>
      <DigiHero />
      <DigiTrustBar />
      <DigiServicesSlider />
      <DigiStats />
      <DigiServices />
      <DigiCTA />
    </main>
    <DigiFooter />
  </div>
);

export default Index;
