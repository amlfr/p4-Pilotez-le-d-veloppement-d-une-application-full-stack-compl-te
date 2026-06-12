import type { FormEvent, ReactNode } from "react";
import styles from "./AuthCard.module.css";

interface AuthCardProps {
  title: string;
  error?: string;
  onSubmit: (event: FormEvent) => void;
  /** Form fields. */
  children: ReactNode;
  /** Buttons rendered below the fields. */
  actions: ReactNode;
}

/** White card shared by the Connexion / Créer un compte pages. */
export default function AuthCard({
  title,
  error,
  onSubmit,
  children,
  actions,
}: AuthCardProps) {
  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.fields}>{children}</div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>{actions}</div>
    </form>
  );
}
