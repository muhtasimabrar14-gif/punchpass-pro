import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    subtitle: "Up to 50 bookings/mo",
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$29",
    subtitle: "Up to 500 bookings/mo",
    cta: "Choose Growth",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$99",
    subtitle: "Up to 2,000 bookings/mo",
    cta: "Talk to us",
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section className="section-muted">
      <div className="container py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold mb-2">Pricing that scales with class volume</h2>
        <p className="text-muted-foreground mb-8">No per-coach or per-member fees. Pay for bookings, not headcount.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <article key={t.name} className={`rounded-xl border p-6 ${t.highlight ? 'card-elevated' : 'bg-card'}`}>
              <h3 className="text-lg font-semibold mb-1">{t.name}</h3>
              <div className="text-3xl font-bold mb-1">{t.price}<span className="text-base font-medium text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-6">{t.subtitle}</p>
              <Button variant={t.highlight ? 'hero' : 'secondary'} className="w-full" onClick={() => {
                if (t.name === 'Growth') {
                  console.log('Stripe checkout will open once connected.');
                }
              }}>{t.cta}</Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
