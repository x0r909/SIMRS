import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default:
        "border-border bg-secondary text-secondary-foreground",
      success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-700",
      warning: "border-amber-400/40 bg-amber-500/10 text-amber-700",
      danger: "border-red-400/40 bg-red-500/10 text-red-700",
      outline: "border-border bg-transparent text-foreground"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
