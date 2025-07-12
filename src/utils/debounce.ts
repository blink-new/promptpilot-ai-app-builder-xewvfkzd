// Utility function to debounce resize operations and reduce ResizeObserver conflicts

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Specific debounce for layout operations
export const debounceLayout = (callback: () => void, delay = 150) => {
  return debounce(callback, delay)
}