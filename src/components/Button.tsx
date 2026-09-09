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

const BASE =
  "inline-block text-center transition-colors duration-150 " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

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

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return (
    <button
      className={`${buttonClasses(variant)}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant };

export function ButtonLink({ variant = "primary", className, ...rest }: ButtonLinkProps) {
  return (
    <Link
      className={`${buttonClasses(variant)}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}
