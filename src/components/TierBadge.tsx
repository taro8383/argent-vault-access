import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tierBadgeVariants = cva(
  "inline-flex items-center font-sans-nav text-[10px] tracking-[0.25em] uppercase px-2.5 py-1",
  {
    variants: {
      tier: {
        founding: "border border-primary text-primary",
        private:  "bg-primary text-primary-foreground",
        collector: "bg-[hsl(var(--accent))] text-foreground",
      },
    },
    defaultVariants: {
      tier: "founding",
    },
  }
);

interface TierBadgeProps extends VariantProps<typeof tierBadgeVariants> {
  className?: string;
}

export const TierBadge = ({ tier, className }: TierBadgeProps) => {
  const labels: Record<string, string> = {
    founding:  "Founding",
    private:   "Private",
    collector: "Collector",
  };

  return (
    <span className={cn(tierBadgeVariants({ tier }), className)}>
      {labels[tier ?? "founding"]}
    </span>
  );
};
