import * as React from "react"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const inputVariants = cva(
  "flex w-full rounded-md border-2 bg-background px-4 py-2 text-base shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-input hover:border-primary/50",
        error: "border-destructive hover:border-destructive focus-visible:border-destructive",
        success: "border-green-500 hover:border-green-600 focus-visible:border-green-500",
      },
      inputSize: {
        default: "h-11",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: "default" | "error" | "success"
  inputSize?: "default" | "sm" | "lg"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", inputSize = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, inputSize }),
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
