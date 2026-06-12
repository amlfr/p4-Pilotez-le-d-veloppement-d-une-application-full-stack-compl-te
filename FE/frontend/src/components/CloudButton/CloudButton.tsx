import type { ButtonHTMLAttributes } from "react";
import styles from "./CloudButton.module.css";

function UploadCloudIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

export default function CloudButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      type="button"
      aria-label="Ajouter un fichier"
      className={styles.cloud}
      {...props}
    >
      <span className={styles.inner}>
        <UploadCloudIcon />
      </span>
    </button>
  );
}
