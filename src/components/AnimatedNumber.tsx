import * as React from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

const AnimatedNumber = React.forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  ({ value, duration = 800, className }, ref) => {
    const count = useAnimatedCounter(value, duration);
    return <span ref={ref} className={className}>{count}</span>;
  }
);

AnimatedNumber.displayName = "AnimatedNumber";

export { AnimatedNumber };
