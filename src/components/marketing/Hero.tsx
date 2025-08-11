import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-fitness.jpg";
import { CalendarDays, QrCode, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Hero = () => {
  const handleCopyEmbed = async () => {
    const origin = window.location.origin;
    const snippet = `<iframe src="${origin}/embed/demo" style="border:0;width:100%;height:620px" loading="lazy" title="PunchPass Pro Booking Widget"></iframe>`;
    await navigator.clipboard.writeText(snippet);
    toast({
      title: "Embed code copied",
      description: "Paste it into your website to preview the widget.",
    });
  };

  return (
    <header className="relative overflow-hidden signature-glow">
      <div className="container mx-auto grid md:grid-cols-2 gap-10 items-center py-16 md:py-24">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
            Boutique Fitness Manager built to scale with your studio
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-prose">
            Embeddable booking widgets, QR check-in, punch passes and memberships—without per-user fees. Pricing based on class volume, not headcount.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="hero" size="lg" onClick={() => toast({ title: "Sign up", description: "Connect Supabase to enable auth and onboarding." })}>
              Start free
            </Button>
            <Button variant="outline" size="lg" onClick={handleCopyEmbed}>
              Copy embed code
            </Button>
          </div>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CalendarDays className="opacity-80" /> Embeddable booking</li>
            <li className="flex items-center gap-2"><QrCode className="opacity-80" /> QR check-in</li>
            <li className="flex items-center gap-2"><CreditCard className="opacity-80" /> Stripe-ready</li>
          </ul>
        </div>
        <div className="relative">
          <img
            src={heroImage}
            alt="Modern boutique fitness studio with class in session"
            loading="lazy"
            className="w-full rounded-xl border shadow-xl"
          />
        </div>
      </div>
    </header>
  );
};

export default Hero;
