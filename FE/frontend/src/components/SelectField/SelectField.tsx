import type { SelectHTMLAttributes } from "react";
import styles from "./SelectField.module.css";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export default function SelectField({
  label,
  id,
  children,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select id={selectId} className={styles.select} {...props}>
        {children}
      </select>
    </div>
  );
}
