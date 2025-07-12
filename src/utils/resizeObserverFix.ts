// Fix for ResizeObserver error that commonly occurs with Monaco Editor and resizable panels
// This is a known issue and doesn't affect functionality - we just suppress the warning

// Store the original ResizeObserver error handler
const originalError = console.error

// Override console.error to filter out ResizeObserver warnings
console.error = (...args: any[]) => {
  // Check if the error is the ResizeObserver warning
  if (
    args.length > 0 && 
    typeof args[0] === 'string' && 
    args[0].includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    // Suppress this specific error as it's a known issue that doesn't affect functionality
    return
  }
  
  // Let all other errors through
  originalError.apply(console, args)
}

// Also handle as window error event for runtime errors
window.addEventListener('error', (event) => {
  if (
    event.message && 
    event.message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    // Prevent this error from being reported
    event.preventDefault()
    return false
  }
})

export const suppressResizeObserverErrors = () => {
  // This function exists to indicate that the fix has been applied
  // The actual fix is applied when this module is imported
  return true
}