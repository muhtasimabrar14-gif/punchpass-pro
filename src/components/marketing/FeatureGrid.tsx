import { Dumbbell, Users, QrCode, CreditCard } from "lucide-react";

const features = [
  {
    icon: <Dumbbell />,
    title: "Embeddable Widgets",
    desc: "Drop-in booking widgets for any website with a single iframe.",
  },
  {
    icon: <Users />,
    title: "Punch Pass & Memberships",
    desc: "Flexible passes and recurring memberships with caps & expiries.",
  },
  {
    icon: <QrCode />,
    title: "QR Check-in",
    desc: "Fast front-desk and coach check-ins with device-friendly QR.",
  },
  {
    icon: <CreditCard />,
    title: "Stripe-Ready",
    desc: "One-off or subscription payments once Stripe is connected.",
  },
];

const FeatureGrid = () => {
  return (
    <section className="container py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-semibold mb-8">Everything you need to run classes</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <article key={i} className="card-elevated rounded-xl p-5">
            <div className="mb-3 opacity-80">{f.icon}</div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeatureGrid;
