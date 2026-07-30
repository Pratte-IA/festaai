import { useState } from "react";

import { cn } from "@/lib/utils";

interface ContactAvatarProps {
  avatarUrl?: string | null;
  className?: string;
  initials: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClass: Record<NonNullable<ContactAvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export const ContactAvatar = ({
  avatarUrl,
  className,
  initials,
  name,
  size = "md",
}: ContactAvatarProps) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !failed;

  if (showImage) {
    return (
      <img
        alt={name}
        className={cn(
          "shrink-0 rounded-full object-cover bg-[#dfe5e7]",
          sizeClass[size],
          className,
        )}
        referrerPolicy="no-referrer"
        src={avatarUrl as string}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] font-semibold text-[#54656f]",
        sizeClass[size],
        className,
      )}
    >
      {initials}
    </div>
  );
};
