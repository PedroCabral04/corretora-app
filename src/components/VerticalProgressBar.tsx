import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface VerticalProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  color?: string;
  showPercentage?: boolean;
  animated?: boolean;
  height?: string;
  width?: string;
}

export const VerticalProgressBar = ({
  value,
  max = 100,
  label = "Progresso Total",
  className,
  color = "#8b5cf6",
  showPercentage = true,
  animated = true,
  height = "h-64",
  width = "w-12",
}: VerticalProgressBarProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (animated && isVisible) {
      const timer = setTimeout(() => {
        setDisplayValue(percentage);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!animated) {
      setDisplayValue(percentage);
    }
  }, [percentage, animated, isVisible]);

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("relative bg-muted/30 rounded-full overflow-hidden shadow-inner", width, height)}>
        {/* Efeito de brilho no fundo */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        
        {/* Barra de progresso com animação suave */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full shadow-lg"
          style={{
            height: `${displayValue}%`,
            background: `linear-gradient(to top, ${color}, ${color}dd, ${color}99)`,
            boxShadow: `0 0 20px ${color}40, inset 0 0 10px ${color}30`,
            transition: animated ? "height 600ms cubic-bezier(.2,.8,.2,1)" : "none",
          }}
        >
          {/* Efeito de brilho na parte superior da barra */}
          <div
            className="absolute top-0 left-0 right-0 h-4 rounded-t-full opacity-70"
            style={{
              background: `linear-gradient(to top, transparent, ${color}cc, white)`,
            }}
          />
        </div>
        
        {/* Container do percentual com fundo semi-transparente */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-md border border-border/20">
            <span
              className="text-xs font-bold"
              style={{ color }}
            >
              {Math.round(displayValue)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Etiqueta descritiva */}
      {label && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {showPercentage && (
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(value)} de {max}
            </p>
          )}
        </div>
      )}
    </div>
  );
};