import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Global page-entry fade-up. Respects prefers-reduced-motion.
 * Wraps a route's primary content. The hero animation inside still plays
 * independently for service-specific visuals.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
