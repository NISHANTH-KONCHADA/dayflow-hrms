import { cn } from "@/lib/cn";

const PALETTE = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
} as const;

interface AvatarProps {
  firstName: string;
  lastName: string;
  profilePictureUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export default function Avatar({
  firstName,
  lastName,
  profilePictureUrl,
  size = "md",
  className,
}: AvatarProps) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const paletteIndex = (firstName.length + lastName.length) % PALETTE.length;

  if (profilePictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profilePictureUrl}
        alt={`${firstName} ${lastName}`}
        className={cn("rounded-full object-cover", SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZE_CLASSES[size],
        PALETTE[paletteIndex],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
