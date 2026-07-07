"use client"


/**
 * @file collapsible.tsx
 * @path apps/frontend/src/components/ui/collapsible.tsx
 * @description Komponen UI shadcn/ui: collapsible.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
