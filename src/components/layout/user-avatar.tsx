import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={cn("h-8 w-8 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white",
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
