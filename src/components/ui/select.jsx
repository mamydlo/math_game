import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = "Select"

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  // For the simple HTML select approach, SelectContent isn't needed but we'll keep it for compatibility
  return <>{children}</>
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  return (
    <option
      value={value}
      ref={ref}
      {...props}
    >
      {children}
    </option>
  )
})
SelectItem.displayName = "SelectItem"

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  // For the simple HTML select approach, SelectTrigger isn't needed but we'll keep it for compatibility
  return <>{children}</>
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef(({ className, placeholder, ...props }, ref) => {
  // For the simple HTML select approach, SelectValue isn't needed but we'll keep it for compatibility
  return null
})
SelectValue.displayName = "SelectValue"

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
