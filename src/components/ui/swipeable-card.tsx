"use client";

import { useState, useRef, type ReactNode, type TouchEvent } from "react";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100; // Distance minimale pour déclencher l'action
  const MAX_TRANSLATE = 120; // Translation maximale

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || !isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limiter la translation
    const limitedDiff = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, diff));
    
    // Ne pas permettre le swipe si l'action correspondante n'existe pas
    if ((limitedDiff > 0 && !rightAction) || (limitedDiff < 0 && !leftAction)) {
      return;
    }
    
    setTranslateX(limitedDiff);
  };

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return;
    
    setIsSwiping(false);
    
    // Swipe gauche (révèle action à droite)
    if (translateX < -SWIPE_THRESHOLD && onSwipeLeft && leftAction) {
      onSwipeLeft();
    }
    // Swipe droite (révèle action à gauche)
    else if (translateX > SWIPE_THRESHOLD && onSwipeRight && rightAction) {
      onSwipeRight();
    }
    
    // Retour à la position initiale
    setTranslateX(0);
  };

  const showLeftAction = translateX < -20;
  const showRightAction = translateX > 20;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden touch-pan-y", className)}
    >
      {/* Action gauche (révélée par swipe droite) */}
      {rightAction && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 flex items-center justify-start pl-4 transition-opacity duration-200",
            rightAction.color,
            showRightAction ? "opacity-100" : "opacity-0"
          )}
          style={{ width: `${Math.abs(translateX)}px` }}
        >
          <div className="flex items-center gap-2">
            {rightAction.icon}
            {translateX > 60 && (
              <span className="text-sm font-medium">{rightAction.label}</span>
            )}
          </div>
        </div>
      )}

      {/* Action droite (révélée par swipe gauche) */}
      {leftAction && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 transition-opacity duration-200",
            leftAction.color,
            showLeftAction ? "opacity-100" : "opacity-0"
          )}
          style={{ width: `${Math.abs(translateX)}px` }}
        >
          <div className="flex items-center gap-2">
            {translateX < -60 && (
              <span className="text-sm font-medium">{leftAction.label}</span>
            )}
            {leftAction.icon}
          </div>
        </div>
      )}

      {/* Contenu swipeable */}
      <div
        className={cn(
          "relative bg-background transition-transform touch-none",
          isSwiping ? "duration-0" : "duration-300"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
