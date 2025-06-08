'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * Provides theme context to its child components using the next-themes provider.
 *
 * Wraps children with theme management capabilities, enabling dynamic theme switching throughout the application.
 *
 * @param children - React nodes to receive theme context.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
