import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * The design delta's three-tier button system (delta 03).
 *
 * Primary is an ink fill — Stone 900 on light, and Stone 300 in dark mode,
 * where Stone 900 ink on a Stone 900 ground would be invisible. That inversion
 * lives in the `--button-primary-*` tokens, not here, so this file has no
 * mode-specific branch. Stone 600 keeps its jobs as the focus ring and the
 * progress fill and is deliberately absent as a button fill.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

// `transition-colors` would not animate `disabled:opacity-50` below — Tailwind's
// colour set excludes opacity — so the disabled state snapped while hovers
// eased. Worst on the budget screen, where the button enables at the instant the
// last point lands, alongside the "All allocated" fade. The named list covers
// every property the three variants actually animate (background-color on
// primary/secondary, color on tertiary) plus opacity, and deliberately drops
// `outline-color`: with it in the list the focus ring faded in over 150ms, which
// made every measurement of it read `currentColor` for the first frame.
const BASE =
  "inline-block text-center transition-[color,background-color,opacity] duration-150 " +
  "focus-ring " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "aria-disabled:opacity-50 aria-disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "control rounded-sharp bg-button-primary text-button-primary-fg " +
    "px-[34px] py-[15px] hover:bg-button-primary-hover",
  secondary:
    "control rounded-sharp border border-border-primary text-text-secondary " +
    "px-[26px] py-[15px] hover:bg-surface-2",
  tertiary:
    "label-nav text-text-secondary border-b border-border-primary pb-[3px] " +
    "hover:text-text-primary",
};

export function buttonClasses(variant: ButtonVariant): string {
  return `${BASE} ${VARIANTS[variant]}`;
}

/**
 * Compose variant classes with caller classes.
 *
 * `className` is appended, but appending does NOT make it win — Tailwind's
 * emitted order decides, and the variant utilities land later in the sheet
 * than common ones like `block` or `px-6`. So `className` is only for
 * properties no variant sets: margin, width, position. Anything touching
 * display, padding, or colour needs a variant, not a class. `w-full` is
 * verified conflict-free and is how a caller goes full-width.
 */
function withVariant(variant: ButtonVariant, className?: string): string {
  return `${buttonClasses(variant)}${className ? ` ${className}` : ""}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({
  variant = "primary",
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return <button type={type} className={withVariant(variant, className)} {...rest} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant };

export function ButtonLink({ variant = "primary", className, ...rest }: ButtonLinkProps) {
  return <Link className={withVariant(variant, className)} {...rest} />;
}
