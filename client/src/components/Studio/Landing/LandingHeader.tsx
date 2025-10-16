import { useEffect, useState } from "react";
import ContactModal from "./ContactModal"; // make sure the path is correct

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`w-full text-neutral-900 border-gray-200 sticky top-0 z-50 transition-colors duration-100 ${
          scrolled ? "bg-[#fffef5]" : ""
        }`}
      >
        <div className="mx-auto flex flex-col md:flex-row items-center justify-between px-6 py-3 space-y-4 md:space-y-0">
          <a href="/">
            <div className="h-9">
              {scrolled ? (
                <img
                  src="/itotem-studio-logo.svg"
                  alt="iTOTEM Logo Icon"
                  className="mt-2 h-7 w-auto transition-opacity duration-300"
                />
              ) : (
                <div className="text-[25px] font-sans font-bold tracking-tight transition-opacity duration-300">
                  <span className="text-blue-900 font-bold">iTOTEM</span>
                  <span className="text-teal-600 font-bold"> Studio</span>
                </div>
              )}
            </div>
          </a>
          <nav className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-12 text-md font-medium text-center md:text-left">
            <a href="https://itotem.io" target="_blank" className="hover:text-teal-700">Company</a>
            <a href="/models" className="cursor-pointer hover:text-teal-700">Models</a>
            <a href="/solutions" className="cursor-pointer hover:text-teal-700">Solutions</a>
            <button onClick={() => setContactOpen(true)} className="cursor-pointer hover:text-teal-700">Contact</button>
            <a
              href="/login"
              className="text-lg ml-0 md:ml-2 px-6 py-2 rounded-lg border-1 bg-teal-700 text-white hover:bg-teal-600"
            >
              Try Demos
            </a>
          </nav>
        </div>
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
