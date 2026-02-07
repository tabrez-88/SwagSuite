import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.ComponentProps<"input">, 'prefix'> {
  prefix?: React.ReactNode;
  postfix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, postfix, ...props }, ref) => {
    // If no prefix or postfix, return simple input
    if (!prefix && !postfix) {
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }

    // With prefix/postfix, wrap in a container
    return (
      <div className="relative flex items-center w-full">
        {prefix && (
          <span className="absolute left-3 text-sm text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            prefix ? "pl-8" : "pl-3",
            postfix ? "pr-8" : "pr-3",
            className
          )}
          ref={ref}
          {...props}
        />
        {postfix && (
          <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none">
            {postfix}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
