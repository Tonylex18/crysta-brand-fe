import heroImage from '../assets/hero4.png';

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{
          background: `url(${heroImage}) no-repeat right bottom`,
          backgroundSize: 'cover',
          backgroundPosition: 'right bottom',
          opacity: 1,
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative min-h-[600px] z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <p className="text-gray-600 text-sm font-medium tracking-wide uppercase">
                Trade-in-offer
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gray-900">Super value deals</span>
                <br />
                <span className="text-teal-600">On all products</span>
              </h1>
            </div>

            <p className="text-gray-500 text-lg">
              Save more with coupons & up to 70% off!
            </p>

            <button className="px-10 py-4 bg-yellow-100 text-teal-600 font-semibold rounded-full hover:bg-yellow-200 transition-all shadow-sm border-2 border-yellow-200">
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}