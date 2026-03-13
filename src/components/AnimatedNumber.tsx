import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, duration = 800, className }: AnimatedNumberProps) {
  const count = useAnimatedCounter(value, duration);
  return <span className={className}>{count}</span>;
}
