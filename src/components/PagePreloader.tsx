type PagePreloaderProps = {
  fullscreen?: boolean;
  label?: string;
};

export default function PagePreloader({
  fullscreen = false,
  label = 'Preparing your experience',
}: PagePreloaderProps) {
  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#f7f1e8]'
          : 'flex min-h-[52vh] items-center justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#fcfaf5_0%,#f5ede1_100%)] px-6 py-16'
      }
      aria-live="polite"
      aria-busy="true"
    >
      <div className="preloader-glow preloader-glow-one" />
      <div className="preloader-glow preloader-glow-two" />

      <div className="relative flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="preloader-ring absolute inset-0 rounded-full border border-[#1f2937]/10" />
          <div className="preloader-ring preloader-ring-delay absolute inset-[10px] rounded-full border border-[#b45309]/20" />
          <div className="absolute inset-[22px] rounded-full bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f4d7b5_45%,_#d97706_100%)] shadow-[0_20px_40px_rgba(217,119,6,0.24)]" />
          <div className="absolute h-12 w-12 rounded-full border border-white/60 bg-white/35 backdrop-blur-md" />
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.55em] text-[#b45309]">
            Christabel
          </p>
          <h2 className="text-2xl font-semibold tracking-[0.08em] text-[#1f2937] sm:text-[2rem]">
            Curating The Store
          </h2>
          <p className="mx-auto max-w-xs text-sm leading-6 text-[#6b7280]">
            {label}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <span className="preloader-dot" />
          <span className="preloader-dot preloader-dot-delay-one" />
          <span className="preloader-dot preloader-dot-delay-two" />
        </div>
      </div>
    </div>
  );
}
