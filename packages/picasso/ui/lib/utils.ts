// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge extended with the IR typography composite classes
 * (`text-heading-*`, `text-body-*`, `text-label-*`, `text-metric-*`,
 * `text-code-*`) so they merge correctly against Tailwind's own `text-*`
 * size group instead of conflicting with it.
 */
const twMerge = extendTailwindMerge<"ir-typography">({
  extend: {
    classGroups: {
      "ir-typography": [
        "text-label-xs",
        "text-label-sm",
        "text-label-md",
        "text-label-lg",
        "text-heading-xs",
        "text-heading-sm",
        "text-heading-md",
        "text-heading-lg",
        "text-heading-xl",
        "text-heading-display",
        "text-body-xs",
        "text-body-sm",
        "text-body-md",
        "text-body-lg",
        "text-metric-sm",
        "text-metric-md",
        "text-metric-lg",
        "text-metric-xl",
        "text-code-xs",
        "text-code-sm",
        "text-code-md",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
