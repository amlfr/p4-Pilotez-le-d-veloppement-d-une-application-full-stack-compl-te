import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "dark" | "tonal" | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "dark",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
