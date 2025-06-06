import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Determines if the current viewport width is below the mobile breakpoint.
 *
 * @returns `true` if the viewport width is less than 768 pixels, otherwise `false`.
 *
 * @remark Returns `false` during initial render on the server or before the effect runs.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
