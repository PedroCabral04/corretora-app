import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "info";
}

export const MetricCard = ({ title, value, icon: Icon, trend, variant = "default" }: MetricCardProps) => {
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

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getVariantClasses()}`}>
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
      </CardContent>
    </Card>
  );
};