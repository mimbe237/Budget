"use client";

import { type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-[20px] max-h-[85vh] overflow-y-auto pb-safe",
          className
        )}
      >
        {/* Indicateur de drag (comme iOS/Android) */}
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 -mt-2" />
        
        <SheetHeader className="text-left space-y-2 pb-4">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-base">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        
        <div className="space-y-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
