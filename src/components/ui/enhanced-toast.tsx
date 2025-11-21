"use client";

import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { useToast as useToastOriginal } from "@/hooks/use-toast";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface EnhancedToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

const toastIcons = {
  success: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
  loading: <Loader2 className="h-5 w-5 text-gray-600 dark:text-gray-400 animate-spin" />,
};

export function useEnhancedToast() {
  const { toast: originalToast } = useToastOriginal();

  const toast = ({ title, description, type = "info", duration = 3000 }: EnhancedToastOptions) => {
    const icon = toastIcons[type];
    const variant = type === "error" ? "destructive" : "default";

    return originalToast({
      title: (
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
      ) as any,
      description,
      variant,
      duration,
    });
  };

  return {
    toast,
    success: (title: string, description?: string, duration?: number) => toast({ title, description, type: "success", duration }),
    error: (title: string, description?: string, duration?: number) => toast({ title, description, type: "error", duration }),
    warning: (title: string, description?: string, duration?: number) => toast({ title, description, type: "warning", duration }),
    info: (title: string, description?: string, duration?: number) => toast({ title, description, type: "info", duration }),
    loading: (title: string, description?: string) => toast({ title, description, type: "loading", duration: Infinity }),
  };
}
