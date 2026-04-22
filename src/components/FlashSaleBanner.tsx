import { useEffect, useMemo, useState } from 'react';
import { Bolt, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { flashSalesAPI, FlashSale } from '../pages/lib/api';

const formatDate = (value?: string) => {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function FlashSaleBanner() {
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await flashSalesAPI.getActive();
        if (mounted) {
          setFlashSale(response?.data || null);
        }
      } catch {
        if (mounted) {
          setFlashSale(null);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const saleWindow = useMemo(() => {
    if (!flashSale) return '';
    return `${formatDate(flashSale.startsAt)} - ${formatDate(flashSale.endsAt)}`;
  }, [flashSale]);

  if (!flashSale) {
    return null;
  }

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(120deg,#1f2937_0%,#991b1b_55%,#f97316_100%)] px-6 py-8 text-white shadow-2xl sm:px-10">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-yellow-300/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                <Bolt className="h-4 w-4" />
                Flash Sale
              </div>
              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                {flashSale.title}
              </h2>
              {flashSale.subtitle && (
                <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
                  {flashSale.subtitle}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-4 rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur-sm lg:min-w-[320px]">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Discount</p>
                <p className="mt-2 text-4xl font-semibold">{flashSale.discountPercentage}% OFF</p>
              </div>
              <div className="flex items-start gap-3 text-sm text-white/85">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{saleWindow}</span>
              </div>
              <button
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-100"
                onClick={() => navigate('/products')}
              >
                {flashSale.ctaLabel || 'Shop Flash Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
