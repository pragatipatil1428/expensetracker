import * as React from "react";

import { cn } from "@/lib/utils";

export interface DateFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      type="date"
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]",
        invalid && "border-destructive focus-visible:ring-destructive",
        className,
      )}
      {...props}
    />
  ),
);
DateField.displayName = "DateField";

export { DateField };
