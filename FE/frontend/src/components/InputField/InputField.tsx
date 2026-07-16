import type { InputHTMLAttributes } from "react";
import styles from "./InputField.module.css";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function InputField({
  label,
  error,
  id,
  ...props
}: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={`${styles.input} ${error ? styles.inputError : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
