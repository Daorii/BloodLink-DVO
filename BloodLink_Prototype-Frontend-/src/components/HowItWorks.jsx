import React from 'react';
import { motion } from 'framer-motion';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'SMS Gateway Ledger',
    desc: 'Semaphore PH gateway transaction log tracking delivery failures & instant donor alerts.',
    arcClass: 'sm:ml-12',
  },
  {
    step: '02',
    title: 'MLR Demand Forecast',
    desc: 'Predicts future blood bag demand using Multiple Linear Regression OLS models.',
    arcClass: 'sm:ml-4',
  },
  {
    step: '03',
    title: 'Equity Allocation',
    desc: 'Computes proportional blood distribution weights for partner hospitals.',
    arcClass: 'sm:ml-0',
  },
  {
    step: '04',
    title: 'Donor Recall Engine',
    desc: 'Auto-flags eligible voluntary donors after their 90-day rest interval.',
    arcClass: 'sm:ml-0',
  },
  {
    step: '05',
    title: 'Hospital Blood Requests',
    desc: 'Pre-submission system with physician signature verification and urgency tiers.',
    arcClass: 'sm:ml-4',
  },
  {
    step: '06',
    title: 'Donor Management Unit',
    desc: 'Searchable Davao City donor database with full profile management.',
    arcClass: 'sm:ml-12',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white text-slate-900 py-20 md:py-28 px-6 md:px-12 border-b border-slate-100 overflow-hidden relative">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* LEFT COLUMN: Headline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
            6 EASY STEPS
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-slate-900">
            How BloodLink Works in <span className="text-[#C21C24]">Six Steps</span>
          </h2>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-md font-medium">
            An integrated 3-tier blood donor mobilization and transfer routing system tailored for Davao City’s hospital network.
          </p>
        </div>

        {/* RIGHT COLUMN: Curved Arc Timeline Steps */}
        <div className="lg:col-span-7 relative py-4">
          
          {/* Prominent SVG Curved Arc Line in Background */}
          <div className="absolute left-0 top-0 bottom-0 w-32 pointer-events-none hidden sm:block">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 120 600" fill="none">
              <path
                d="M 72 25 C 0 160, 0 440, 72 575"
                stroke="rgba(15, 23, 42, 0.22)"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="space-y-8 md:space-y-10 relative z-10">
            {WORKFLOW_STEPS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`flex items-start gap-5 sm:gap-7 group cursor-default transition-all duration-300 ${item.arcClass}`}
              >
                {/* Number Circle Badge */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-slate-900 group-hover:scale-110 group-hover:bg-[#C21C24] group-hover:border-[#C21C24] transition-all duration-300 z-10">
                  {item.step}
                </div>

                {/* Content */}
                <div className="pt-1 space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-[#C21C24] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
