import Link from "next/link";
import type { MouseEventHandler } from "react";

interface QuickAccessCardProps {
  title: string;
  description: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const CARD_CLASSNAME =
  "flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 text-left transition-shadow hover:shadow-md";

export default function QuickAccessCard({ title, description, href, onClick }: QuickAccessCardProps) {
  const content = (
    <>
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs text-muted">{description}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={CARD_CLASSNAME}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={CARD_CLASSNAME}>
      {content}
    </button>
  );
}
