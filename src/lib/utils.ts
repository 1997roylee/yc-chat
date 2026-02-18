import { type ClassValue, clsx } from "clsx";
import type { ReactNode } from "react";
import { createElement } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Splits text into segments of plain text and clickable links.
 * Returns an array of React nodes.
 */
const URL_REGEX = /(https?:\/\/[^\s<>)"']+)/g;

export function linkify(text: string): ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return createElement(
        "a",
        {
          key: i,
          href: part,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-blue-500 underline hover:text-blue-600 break-all",
        },
        part,
      );
    }
    return part;
  });
}
