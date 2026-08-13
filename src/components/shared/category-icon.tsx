import { CATEGORY_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  icon?: string | null;
  color?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 rounded-md",
  md: "h-9 w-9 rounded-lg",
  lg: "h-12 w-12 rounded-xl",
};

const ICON_CLASSES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export function CategoryIcon({
  icon,
  color,
  className,
  size = "md",
}: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[icon ?? "tag"] ?? CATEGORY_ICONS.tag;
  const bgColor = color ?? "#6366f1";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-white",
        SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundColor: bgColor }}
      aria-hidden
    >
      <Icon className={ICON_CLASSES[size]} />
    </span>
  );
}
