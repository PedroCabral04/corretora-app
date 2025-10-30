import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ChevronRight } from "lucide-react";
import { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "info";
  isInteractive?: boolean;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  isInteractive = false,
  onClick,
}: MetricCardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
      case "warning":
      case "info":
      case "default":
        return "border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100";
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "info":
        return "text-info";
      default:
        return "text-primary-600";
    }
  };

  const canInteract = Boolean(isInteractive && onClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canInteract) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-transform duration-200 ease-out",
        getVariantClasses(),
        canInteract
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 hover:shadow-lg"
          : "hover:shadow-md"
      )}
      onClick={canInteract ? onClick : undefined}
      role={canInteract ? "button" : undefined}
      tabIndex={canInteract ? 0 : undefined}
      onKeyDown={canInteract ? handleKeyDown : undefined}
      aria-label={canInteract ? `${title} - ver detalhes` : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconClasses()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}
        {canInteract ? (
          <div className="mt-4 flex items-center text-sm font-medium text-primary-600 transition-transform duration-200 group-hover:translate-x-1">
            <span className="mr-2">Ver detalhes</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : (
          <div className="mt-4 h-5" aria-hidden />
        )}
      </CardContent>
    </Card>
  );
};