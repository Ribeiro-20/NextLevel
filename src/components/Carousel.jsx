import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Carousel({ slides = [], interval = 4000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const announceRef = useRef(null);

  // autoplay
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    if (paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => clearInterval(t);
  }, [slides, interval, paused]);

  // keyboard on window for more reliable behavior
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setIndex(i => (i + 1) % slides.length);
      if (e.key === "ArrowLeft") setIndex(i => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides]);

  useEffect(() => {
    // announce slide change for screen readers
    if (!announceRef.current || !slides || slides.length === 0) return;
    const current = slides[index];
    announceRef.current.textContent = current ? `${current.title || 'Destaque'} — slide ${index + 1} de ${slides.length}` : "";
  }, [index, slides]);

  if (!slides || slides.length === 0) return null;

  const prev = () => setIndex(i => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex(i => (i + 1) % slides.length);

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Carrossel de destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative w-full overflow-hidden rounded-2xl h-72 md:h-96 lg:h-[450px]"
    >
      <span ref={announceRef} className="sr-only" aria-live="polite" />

      <AnimatePresence initial={false} mode="wait">
        {slides.map((s, i) =>
          i === index ? (
            <motion.div
              key={s.id || i}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.x < -50) next();
                else if (info.offset.x > 50) prev();
              }}
            >
              <img
                src={s.banner || s.image || s.cover || s.thumbnail}
                alt={s.title || s.name || 'Destaque'}
                className="w-full h-72 md:h-96 lg:h-[450px] object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute left-6 bottom-6 text-white z-10">
                <h3 className="text-2xl font-bold">{s.title || s.name}</h3>
                {s.description && <p className="max-w-md text-sm text-gray-200 mt-1 line-clamp-2">{s.description}</p>}
              </div>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      {/* Prev / Next */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/60 z-20"
            aria-label="Slide anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H4a1 1 0 110-2h11.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/60 z-20"
            aria-label="Próximo slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H4a1 1 0 110-2h11.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition focus:outline-none ring-2 ring-offset-2 ${i === index ? "bg-white ring-white" : "bg-white/40 ring-transparent"}`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
