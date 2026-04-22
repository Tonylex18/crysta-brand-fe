export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f7ff_0%,#ffffff_38%)]">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#12108b]/70">About Crysta</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
              A modern fashion storefront built around clarity, speed, and trust.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600">
              Crysta brings curated fashion, simple checkout, and reliable delivery into one clean shopping experience.
              The focus is straightforward: quality products, clear pricing, and a store customers can return to without friction.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#12108b]/10 bg-white p-6 shadow-[0_28px_90px_-48px_rgba(18,16,139,0.4)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">What matters here</p>
            <div className="mt-5 space-y-5">
              {[
                ['Curated products', 'Focused collections instead of noisy catalog clutter.'],
                ['Smooth ordering', 'Checkout designed to keep customers moving without confusion.'],
                ['Reliable fulfilment', 'Transparent order states and shipping visibility.'],
              ].map(([title, body]) => (
                <div key={title}>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['Purpose', 'Make product discovery and purchase feel fast, clean, and dependable.'],
            ['Approach', 'Blend practical commerce flows with a visual language that feels deliberate.'],
            ['Promise', 'Keep improving the experience from browsing to delivery and after-sales support.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
