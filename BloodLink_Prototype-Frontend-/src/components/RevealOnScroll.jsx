import { motion, useReducedMotion } from 'motion/react';

const motionTags = {
  div: motion.div,
  article: motion.article,
  section: motion.section,
};

/**
 * Scroll-triggered fade + slide-up reveal (Linear / Stripe style).
 */
export default function RevealOnScroll({
  children,
  className = '',
  delay = 0,
  as = 'div',
}) {
  const reduced = useReducedMotion();
  const MotionTag = motionTags[as] || motion.div;

  return (
    <MotionTag
      className={className}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -32px 0px' }}
      transition={{
        duration: 0.42,
        delay: reduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
