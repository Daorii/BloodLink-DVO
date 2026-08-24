import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Cinematic scroll-zoom hero.
 *
 * @param {object} props
 * @param {string} props.image - Background image URL
 * @param {string} props.title - Large impact headline (e.g. "BLOODLINK")
 * @param {string} props.subtitle - Supporting line under the headline
 * @param {string} [props.imageAlt=''] - Alt text for the background image
 * @param {() => void} [props.onLogin] - Optional portal login handler
 */
export default function ScrollZoomHero({
  image,
  title,
  subtitle,
  imageAlt = '',
  onLogin,
}) {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Short, snappy zoom transforms over 130vh scroll height (eliminates layout void)
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.8]);
  const blur = useTransform(scrollYProgress, [0, 1], [0, 10]);
  const filter = useTransform(blur, (value) => `blur(${value}px)`);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.6, 0]);

  const headlineScale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 0.35, 0]);

  return (
    <section ref={sectionRef} className="relative h-[130vh] bg-slate-950 w-full overflow-hidden">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale, opacity: imageOpacity, filter }}
        >
          <img
            src={image}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Ambient Gradient Overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.75)_100%)]" />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto">
          <motion.div
            style={{
              scale: headlineScale,
              y: headlineY,
              opacity: headlineOpacity,
            }}
            className="flex flex-col items-center"
          >
            <h1
              className="text-[20vw] leading-[0.88] tracking-tight text-white md:text-[16vw] lg:text-[14vw]"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              <span className="text-[#730404]">BLOOD</span>LINK
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-200 md:text-base font-medium">
              {subtitle}
            </p>
            {onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="mt-8 inline-flex items-center gap-2 bg-[#C21C24] hover:bg-[#8A1015] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg rounded-full cursor-pointer hover:scale-[1.03]"
              >
                Portal login
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
