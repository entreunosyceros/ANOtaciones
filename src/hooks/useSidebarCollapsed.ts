import { useEffect, useState } from 'react'

const KEY = 'anotacion-sidebar-collapsed'

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  return {
    collapsed,
    toggle: () => setCollapsed((v) => !v),
    setCollapsed,
  }
}
