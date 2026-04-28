import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import PartnersBar from "@/components/home/PartnersBar";
import ServicesSlider from "@/components/home/ServicesSlider";
import Stats from "@/components/home/Stats";
import CTASection from "@/components/home/CTASection";

const Index = () => (
  <Layout>
    <Hero />
    <PartnersBar />
    <ServicesSlider />
    <Stats />
    <CTASection />
  </Layout>
);

export default Index;
