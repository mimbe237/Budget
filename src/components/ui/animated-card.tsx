"use client";

import { motion } from "framer-motion";
import { type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends Omit<React.ComponentProps<typeof motion.div>, 'ref'> {
  children: ReactNode;
  delay?: number;
  hover?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, delay = 0, hover = true, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        whileHover={hover ? { y: -4, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" } : undefined}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";
