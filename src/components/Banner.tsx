import bannerImg from '../assets/banner/b1.jpg';

const Banner = () => {
  return (
    <section className="relative w-full h-[300px] md:h-[350px] flex items-center justify-center overflow-hidden">
      <img
        src={bannerImg}
        alt="Banner"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-black/70 z-10" />
      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full text-center">
        <p className="text-white text-lg md:text-xl mb-2 font-medium">Repair Services</p>
        <h2 className="text-white text-2xl md:text-4xl font-bold mb-4">
          Up to <span className="text-red-600">70% Off</span> – All t-Shirts & Accessories
        </h2>
        <button className="px-6 py-2 bg-white text-black font-semibold rounded shadow hover:bg-gray-100 transition">
          Explore More
        </button>
      </div>
    </section>
  );
};

export default Banner;