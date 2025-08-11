import Hero from "@/components/marketing/Hero";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import PricingSection from "@/components/marketing/PricingSection";
import WidgetPreview from "@/components/marketing/WidgetPreview";

const Index = () => {
  return (
    <main>
      <Hero />
      <FeatureGrid />
      <WidgetPreview />
      <PricingSection />
      <footer className="container py-10 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} PunchPass Pro. Built for independent trainers and growing studios.</p>
      </footer>
    </main>
  );
};

export default Index;
