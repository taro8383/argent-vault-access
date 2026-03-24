import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center font-sans-nav text-[10px] tracking-[0.2em] uppercase px-2.5 py-1",
  {
    variants: {
      status: {
        pending:   "border border-primary/60 text-primary/80",
        confirmed: "bg-primary/20 border border-primary text-primary",
        shipped:   "bg-[hsl(var(--accent))] text-foreground border border-[hsl(var(--accent))]",
        delivered: "bg-foreground/10 text-foreground border border-foreground/20",
        invoiced:  "text-muted-foreground border border-border",
        approved:  "bg-primary/20 border border-primary text-primary",
        rejected:  "bg-destructive/20 border border-destructive text-destructive",
        upcoming:  "border border-primary/40 text-primary/70",
        waitlist:  "text-muted-foreground border border-border",
        open:      "border border-primary/60 text-primary/80",
        in_progress: "bg-primary/10 border border-primary/50 text-primary",
        closed:    "text-muted-foreground border border-border",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

type StatusValue =
  | "pending" | "confirmed" | "shipped" | "delivered" | "invoiced"
  | "approved" | "rejected" | "upcoming" | "waitlist"
  | "open" | "in_progress" | "closed";

interface StatusPillProps {
  status: StatusValue;
  className?: string;
}

export const StatusPill = ({ status, className }: StatusPillProps) => {
  const labels: Record<StatusValue, string> = {
    pending:     "Pending",
    confirmed:   "Confirmed",
    shipped:     "Shipped",
    delivered:   "Delivered",
    invoiced:    "Invoiced",
    approved:    "Approved",
    rejected:    "Rejected",
    upcoming:    "Upcoming",
    waitlist:    "Waitlist",
    open:        "Open",
    in_progress: "In Progress",
    closed:      "Closed",
  };

  return (
    <span className={cn(statusPillVariants({ status: status as any }), className)}>
      {labels[status]}
    </span>
  );
};
