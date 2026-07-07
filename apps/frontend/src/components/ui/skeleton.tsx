/**
 * @file skeleton.tsx
 * @path apps/frontend/src/components/ui/skeleton.tsx
 * @description Komponen UI shadcn/ui: skeleton.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
