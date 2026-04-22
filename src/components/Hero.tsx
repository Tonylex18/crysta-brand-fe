import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImageOne from '../assets/hero-image-one.jpeg';
import heroImageTwo from '../assets/hero-image-two.jpg';
import heroImageThree from '../assets/hero-image-three.jpg';

const slides = [
  {
    id: 'slide-1',
    image: heroImageOne,
    eyebrow: 'Fresh arrivals',
    title: 'Elevated essentials for every day',
    accent: 'New-season fashion, styled with confidence.',
    description: 'Discover standout pieces curated for work, weekends, and everything between.',
    ctaLabel: 'Shop Collection',
    ctaLink: '/products',
  },
  {
    id: 'slide-2',
    image: heroImageTwo,
    eyebrow: 'Member savings',
    title: 'Smart deals on premium looks',
    accent: 'Save more on the styles you actually want.',
    description: 'From timeless staples to statement picks, unlock better value across the catalogue.',
    ctaLabel: 'Browse Deals',
    ctaLink: '/products?q=deal',
  },
  {
    id: 'slide-3',
    image: heroImageThree,
    eyebrow: 'Brand story',
    title: 'Built for modern shoppers',
    accent: 'Style, trust, and smooth delivery in one store.',
    description: 'Shop pieces designed to move fast, wear well, and keep your wardrobe current.',
    ctaLabel: 'About Crysta',
    ctaLink: '/about',
  },
];

const AUTO_SLIDE_MS = 5500;

export default function HeroSection() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_SLIDE_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(245,244,255,0.55)_38%,_rgba(18,16,139,0.12)_100%)]" /> */}

      <div className="relative mx-auto max-w-full">
        <div className="relative min-h-[520px] overflow-hidden border border-white/60 bg-white/20 shadow-[0_35px_120px_-45px_rgba(17,24,39,0.55)] backdrop-blur-sm">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-700 ${
                  isActive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!isActive}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_34%,rgba(255,255,255,0.18)_68%,rgba(17,24,39,0.12)_100%)]" />

                <div className="relative max-w-7xl mx-auto flex min-h-[520px] items-center px-6 py-10 sm:px-10 lg:px-16">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[#12108b]/75">
                      {slide.eyebrow}
                    </p>
                    <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                      {slide.title}
                    </h1>
                    <p className="mt-4 text-xl font-medium text-[#12108b] sm:text-2xl">{slide.accent}</p>
                    <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">{slide.description}</p>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => navigate(slide.ctaLink)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#12108b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#211eb0]"
                      >
                        {slide.ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="rounded-full border border-gray-300 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-white"
                      >
                        Explore Products
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/70 px-4 py-2 shadow-lg backdrop-blur">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isActive ? 'w-10 bg-[#12108b]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
