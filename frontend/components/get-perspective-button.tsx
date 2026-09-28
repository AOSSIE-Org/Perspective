"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PerspectiveLogo } from "@/components/perspective-logo";
import { cn } from "@/lib/utils";

export interface GetPerspectiveButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit" | "reset";
  size?: "default" | "sm" | "lg";
  variant?: "default" | "topic";
  className?: string;
  children?: React.ReactNode;
  showLogo?: boolean;
  logoClassName?: string;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  "aria-label"?: string;
  isLoading?: boolean;
  loadingStepText?: string;
}

const sizeStyles: Record<"default" | "sm" | "lg", string> = {
  default: "px-6 py-3.5 text-xs lg:text-base",
  sm: "px-4 py-2.5 text-xs",
  lg: "py-4 px-5 text-sm lg:text-base w-[240px] lg:w-[250px] h-[58px] shrink-0",
};

export function GetPerspectiveButton({
  href,
  onClick,
  type = "button",
  size = "default",
  variant = "default",
  className,
  children,
  showLogo = true,
  logoClassName,
  iconRight,
  disabled = false,
  target,
  rel,
  prefetch = true,
  "aria-label": ariaLabel,
  isLoading = false,
  loadingStepText,
  ...props
}: GetPerspectiveButtonProps) {
  const t = useTranslations("Common");

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-[4px] font-medium transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed disabled:transform-none select-none relative overflow-hidden";

  const variantStyles: Record<"default" | "topic", string> = {
    default: "bg-primary text-primary-foreground hover:opacity-95 shadow",
    topic:
      "border border-topic-border-soft bg-topic-bg text-foreground hover:bg-topic-bg/85 hover:border-topic-border-soft-hover shadow-md hover:shadow-lg",
  };

  const defaultLogoClass = size === "sm" ? "h-3 w-auto" : "h-3.5 w-auto";

  const mergedClass = cn(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  );

  const content = isLoading ? (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Fluid shimmer light sweep across button */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Spinner + smooth step text */}
      <div className="flex items-center justify-center gap-2.5 z-10">
        <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground/30 opacity-75" />
          <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
        </span>
        <span
          key={loadingStepText}
          className="animate-step-in font-semibold text-xs sm:text-sm tracking-wide whitespace-nowrap"
        >
          {loadingStepText || "Analysing..."}
        </span>
      </div>
    </div>
  ) : (
    <>
      {showLogo && (
        <PerspectiveLogo
          variant={variant === "topic" ? "topic" : "auto"}
          className={cn(defaultLogoClass, logoClassName)}
        />
      )}
      <span>{children ?? t("getPerspective")}</span>
      {iconRight}
    </>
  );

  if (href && !isLoading) {
    return (
      <Link
        href={href}
        prefetch={prefetch}
        onClick={onClick}
        className={mergedClass}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={mergedClass}
      aria-label={ariaLabel}
      {...props}
    >
      {content}
    </button>
  );
}

export default GetPerspectiveButton;
