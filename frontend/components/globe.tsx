"use client"

import { useEffect, useRef } from "react"
import createGlobe, { type COBEOptions } from "cobe"
import { useMotionValue, useSpring } from "motion/react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

const MOVEMENT_DAMPING = 1400

const GLOBE_CONFIG: COBEOptions = {
  width: 600,
  height: 600,
  onRender: () => {},
  devicePixelRatio: 1,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 6000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.08 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.08 },
    { location: [19.4326, -99.1332], size: 0.08 },
    { location: [40.7128, -74.006], size: 0.08 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
}

export function Globe({
  className,
  config,
}: {
  className?: string
  config?: COBEOptions
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const isTabVisible = useRef(true)
  const { resolvedTheme } = useTheme()

  const isLight = resolvedTheme === "light"

  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  useEffect(() => {
    let phi = 0
    let width = 0

    const handleVisibility = () => {
      isTabVisible.current = !document.hidden
    }
    document.addEventListener("visibilitychange", handleVisibility)

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }

    window.addEventListener("resize", onResize)
    onResize()

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1
    const currentWidth = width || 600

    const activeConfig: COBEOptions = config || {
      ...GLOBE_CONFIG,
      devicePixelRatio: dpr,
      mapSamples: 2500,
      dark: isLight ? 1 : 0,
      baseColor: isLight ? [0.15, 0.22, 0.35] : [1, 1, 1],
      glowColor: isLight ? [0.95, 0.9, 0.8] : [1, 1, 1],
      context: {
        powerPreference: "high-performance",
        antialias: false,
      },
    }

    let globeInstance: ReturnType<typeof createGlobe> | null = null

    try {
      globeInstance = createGlobe(canvasRef.current!, {
        ...activeConfig,
        width: currentWidth * dpr,
        height: currentWidth * dpr,
        onRender: (state) => {
          if (!isTabVisible.current) return
          if (!pointerInteracting.current) {
            phi += 0.003
          }
          state.phi = phi + rs.get()
        },
      })

      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1"
      }
    } catch (e) {
      console.error("Globe init error:", e)
    }

    return () => {
      if (globeInstance) {
        try {
          globeInstance.destroy()
        } catch {
          // safe cleanup
        }
      }
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [rs, config, isLight])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = e.clientX
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing"
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        const delta = ev.clientX - pointerInteracting.current
        pointerInteractionMovement.current = delta
        r.set(r.get() + delta / MOVEMENT_DAMPING)
      }
    }

    const onPointerUp = () => {
      pointerInteracting.current = null
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grab"
      }
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-square size-full flex items-center justify-center",
        className
      )}
    >
      <canvas
        className="w-full h-full opacity-0 transition-opacity duration-500 cursor-grab will-change-transform"
        ref={canvasRef}
        onPointerDown={onPointerDown}
      />
    </div>
  )
}
