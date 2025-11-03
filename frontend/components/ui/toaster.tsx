"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react"

/**
 * Renders a toast notification system that displays active toast messages.
 *
 * Displays each toast with an optional title, description, action element, and a close button. Toasts are managed via the {@link useToast} hook and appear within a viewport defined by {@link ToastViewport}.
 */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // choose icon and colors per variant
        let Icon = Info
        let badgeClass = "bg-slate-700"

        if (variant === "destructive") {
          Icon = XCircle
          badgeClass = "bg-red-600"
        } else if (variant === "success") {
          Icon = CheckCircle
          // use a strong green that reads well on dark/light backgrounds
          badgeClass = "bg-emerald-500"
        } else if (variant === "info") {
          Icon = Info
          badgeClass = "bg-blue-600"
        } else {
          // default / neutral
          Icon = Info
          badgeClass = "bg-slate-700"
        }

        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {/* circular badge with subtle ring and shadow for a professional look */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${badgeClass} ring-1 ring-white/10 shadow-md`}
                  aria-hidden
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription className="text-sm text-slate-100/95">{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
