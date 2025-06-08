import { cn } from "@/lib/utils"

/**
 * Renders a placeholder div with a pulsing animation, rounded corners, and muted background for use as a loading skeleton.
 *
 * Additional HTML div attributes and custom class names can be provided for further customization.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
