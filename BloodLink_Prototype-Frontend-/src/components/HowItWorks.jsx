import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Bell, Activity, Database, ShieldCheck, FileText, Search } from 'lucide-react';

const CARDS_DATA = [
  {
    title: 'SMS Gateway Ledger',
    desc: 'Semaphore PH gateway transaction log tracking delivery failures.',
    icon: Bell,
    step: '01'
  },
  {
    title: 'MLR Demand Forecast',
    desc: 'Predicts future blood bag demand using Multiple Linear Regression OLS.',
    icon: Activity,
    step: '02'
  },
  {
    title: 'Equity Allocation',
    desc: 'Computes proportional blood distribution weights for hospitals.',
    icon: Database,
    step: '03'
  },
  {
    title: 'Donor Recall Engine',
    desc: 'Auto-flags eligible donors after their 90-day rest interval.',
    icon: ShieldCheck,
    step: '04'
  },
  {
    title: 'Blood Requests',
    desc: 'Hospital pre-submission system with physician signature verification.',
    icon: FileText,
    step: '05'
  },
  {
    title: 'Donor Registry',
    desc: 'Searchable Davao City donor database with full profile management.',
    icon: Search,
    step: '06'
  }
];

function StackingCard({ card, index, total, progress }) {
  const Icon = card.icon;
  const isLast = index === total - 1;

  const start = index / total;
  const end = (index + 0.85) / total;

  // Previous cards ONLY scale down — NO opacity change. 
  // Opacity stays 1 so bg-white remains fully opaque and hides text behind.
  const scale = useTransform(progress, [0, start, end, 1], isLast ? [1, 1, 1, 1] : [1, 1, 0.92, 0.92]);

  return (
    <div
      className="sticky top-0 h-screen w-full flex items-start justify-center pt-[18vh] px-2"
      style={{
        zIndex: index + 1
      }}
    >
      <motion.div
        style={{
          scale,
          willChange: 'transform'
        }}
        className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-8 min-h-[180px] origin-top"
      >
        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">
            Module {card.step}
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-2.5">{card.title}</h3>
          <p className="mt-1.5 text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{card.desc}</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function HowItWorks() {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const step = Math.min(
      CARDS_DATA.length - 1,
      Math.floor(latest * CARDS_DATA.length)
    );
    setActiveStep(step);
  });

  // Fade out and translate the left panel as the last card finishes stacking (progress goes 0.9 -> 1.0)
  const leftOpacity = useTransform(scrollYProgress, [0, 0.9, 1], [1, 1, 0]);
  const leftY = useTransform(scrollYProgress, [0, 0.9, 1], [0, 0, -24]);
  const leftScale = useTransform(scrollYProgress, [0, 0.9, 1], [1, 1, 0.96]);

  if (isMobile) {
    return (
      <section className="bg-slate-50/50 py-20 px-6 border-b border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              How BloodLink DVO works
            </h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed max-w-md mx-auto font-medium">
              Six operational modules from SMS dispatch to hospital requests, built for Davao's blood network.
            </p>
          </div>
          <div className="space-y-6">
            {CARDS_DATA.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.48, delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col gap-4 shadow-sm"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                      Module {card.step}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2">{card.title}</h3>
                    <p className="mt-1.5 text-slate-500 text-[13px] leading-relaxed font-medium">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-50/50 border-b border-slate-200"
      style={{
        height: `${CARDS_DATA.length * 100}vh`
      }}
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-12 h-full py-20">
        <div className="grid grid-cols-12 gap-12 lg:gap-16 items-start h-full">
          
          {/* LEFT COLUMN: Sticky Progress Tracker */}
          <motion.div
            style={{
              opacity: leftOpacity,
              y: leftY,
              scale: leftScale,
              pointerEvents: activeStep === CARDS_DATA.length - 1 ? 'none' : 'auto'
            }}
            className="col-span-5 sticky top-[18vh] py-10 flex flex-col justify-between min-h-[60vh] origin-top"
          >  <div>
              <span className="text-[10px] font-black text-[#C21C24] uppercase tracking-wider bg-rose-50 border border-rose-100/60 px-3 py-1 rounded-full">
                Core Workflow
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mt-5 leading-tight">
                How BloodLink DVO works
              </h2>
              <p className="mt-4 text-slate-550 text-sm lg:text-base leading-relaxed font-medium">
                Six operational modules from SMS dispatch to hospital requests, built for Davao's blood network.
              </p>
            </div>

            {/* Vertical Interactive Progress Timeline */}
            <div className="relative flex flex-col gap-4 pl-6 mt-10 border-l-2 border-slate-200 py-2">
              <motion.div
                style={{ scaleY: scrollYProgress, originY: 0 }}
                className="absolute left-[-2px] top-0 bottom-0 w-[2px] bg-[#C21C24]"
              />

              {CARDS_DATA.map((card, idx) => {
                const isActive = activeStep === idx;
                const isCompleted = activeStep > idx;
                return (
                  <div key={card.title} className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 -ml-[31px] z-10 transition-all duration-300 ${
                        isActive
                          ? 'bg-[#C21C24] border-[#C21C24] scale-125 shadow-[0_0_8px_rgba(194,28,36,0.3)]'
                          : isCompleted
                          ? 'bg-[#C21C24] border-[#C21C24]'
                          : 'bg-white border-slate-300'
                      }`}
                    />
                    <span
                      className={`text-[12px] font-bold tracking-tight transition-all duration-300 cursor-default ${
                        isActive 
                          ? 'text-[#C21C24] translate-x-1 font-black' 
                          : isCompleted
                          ? 'text-slate-750 font-semibold'
                          : 'text-slate-400 font-medium'
                      }`}
                    >
                      {card.step}. {card.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Scrolling Cards */}
          <div className="col-span-7 relative pb-[15vh]">
            {CARDS_DATA.map((card, index) => (
              <StackingCard
                key={card.title}
                card={card}
                index={index}
                total={CARDS_DATA.length}
                progress={scrollYProgress}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}