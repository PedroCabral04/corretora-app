import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}: EmptyStateProps) => {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/5">
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {illustration ? (
          <div className="mb-6">{illustration}</div>
        ) : (
          <div className="mb-6 rounded-full bg-muted p-6">
            <Icon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="mt-2">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

// Ilustração SVG personalizada para lista vazia
export const EmptyIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-50"
  >
    <circle cx="100" cy="100" r="80" fill="currentColor" className="text-muted" />
    <path
      d="M70 90 L90 110 L130 70"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
      opacity="0.3"
    />
  </svg>
);
