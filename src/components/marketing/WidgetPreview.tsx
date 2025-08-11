const WidgetPreview = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <section className="container py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">Embed anywhere</h2>
      <p className="text-muted-foreground mb-6">Preview the booking widget exactly as it appears when embedded on your site.</p>
      <div className="rounded-xl border overflow-hidden">
        <iframe
          src={`${origin}/embed/demo`}
          title="PunchPass Pro Booking Widget Preview"
          loading="lazy"
          className="w-full h-[620px] bg-background"
        />
      </div>
    </section>
  );
};

export default WidgetPreview;
