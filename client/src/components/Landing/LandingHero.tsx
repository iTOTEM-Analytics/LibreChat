export default function LandingHero() {
  return (
    <section className="flex flex-col justify-center items-center text-center px-6 py-32">
      <div className="max-w-4xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
          Deploy intelligent Agentic AI experiences with <br /> iTOTEM Studio
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Build, test, and release powerful AI tools for supply chain visibility, advocacy, and lead generation, designed for trust, speed, and precision.
        </p>
        <a href="/login">
          <button className="cursor-pointer text-lg sm:text-xl px-16 py-4 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-all">
            Try Demos
          </button>
        </a>
      </div>
    </section>
  );
}
