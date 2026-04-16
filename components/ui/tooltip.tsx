"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = React.Fragment

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipPrimitive.Popup.Props & {
    side?: TooltipPrimitive.Positioner.Props["side"]
    sideOffset?: TooltipPrimitive.Positioner.Props["sideOffset"]
    align?: TooltipPrimitive.Positioner.Props["align"]
  }
>(({ className, side = "top", sideOffset = 4, align = "center", ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Positioner
      side={side}
      sideOffset={sideOffset}
      align={align}
    >
      <TooltipPrimitive.Popup
        ref={ref}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-[13px] text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-slate-900 border-0 shadow-2xl",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Popup.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
