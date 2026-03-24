import { cn } from "@/lib/utils";

interface PriceInclusiveNoteProps {
  className?: string;
  variant?: "inline" | "banner";
}

export const PriceInclusiveNote = ({ className, variant = "inline" }: PriceInclusiveNoteProps) => {
  if (variant === "banner") {
    return (
      <div className={cn(
        "border border-primary/30 bg-primary/5 px-4 py-3 text-center",
        className
      )}>
        <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
          Pricing
        </p>
        <p className="font-serif text-sm text-foreground/80 italic">
          Your allocation is fully inclusive of international freight, customs duties,
          excise taxes, and final delivery to your door.
        </p>
        <p className="font-sans-nav text-xs tracking-[0.15em] text-primary mt-2">
          ✦ There is nothing to pay on delivery.
        </p>
      </div>
    );
  }

  return (
    <p className={cn(
      "font-sans-nav text-[10px] tracking-[0.15em] uppercase text-primary/80",
      className
    )}>
      ✦ There is nothing to pay on delivery.
    </p>
  );
};
