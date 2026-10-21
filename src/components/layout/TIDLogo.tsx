"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface TIDLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TIDLogo({
  className,
  showText = true,
  size = "md",
}: TIDLogoProps) {
  const sizeClasses = {
    sm: "h-20 w-auto",
    md: "h-24 w-auto",
    lg: "h-32 w-auto",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Image
        src="/TID_Logo.png"
        alt="Tourism Insight Data Logo"
        width={size === "sm" ? 240 : size === "md" ? 288 : 384}
        height={size === "sm" ? 80 : size === "md" ? 96 : 128}
        className={cn(sizeClasses[size], "object-contain")}
        priority
      />
      {showText && (
        <span
          className={cn(
            "font-semibold text-primary tracking-tight",
            textSizeClasses[size]
          )}
        >
          Tourism Insight Data
        </span>
      )}
    </div>
  );
}
