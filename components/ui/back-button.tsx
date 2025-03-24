"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  className?: string
}

export function BackButton({ 
  label = "Go back", 
  className,
  ...props 
}: BackButtonProps) {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.back()}
      className={cn(
        "h-12 w-12 rounded-full hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "transition-colors duration-200",
        className
      )}
      aria-label={label}
      {...props}
    >
      <ArrowLeft className="h-6 w-6" />
    </Button>
  )
} 