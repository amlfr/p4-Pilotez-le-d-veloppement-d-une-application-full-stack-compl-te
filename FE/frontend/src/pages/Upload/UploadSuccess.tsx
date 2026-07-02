import { useState } from "react";
import { buildShareLink } from "../../api/files";
import { Button, FileIcon } from "../../components";
import { formatSize } from "../../utils/format";
import styles from "./Upload.module.css";

interface UploadSuccessProps {
  file: File;
  token: string;
  days: number;
}

function retentionLabel(days: number): string {
  if (days === 7) return "une semaine";
  return days === 1 ? "1 jour" : `${days} jours`;
}

/** Step 3 of the upload flow: the share link, ready to copy. */
export default function UploadSuccess({ file, token, days }: UploadSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildShareLink(token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context); the link stays selectable.
    }
  };

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Ajouter un fichier</h1>
      <div className={styles.fileRow}>
        <span className={styles.fileIcon}>
          <FileIcon />
        </span>
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>{file.name}</span>
          <span className={styles.fileSize}>{formatSize(file.size)}</span>
        </div>
      </div>
      <p className={styles.congrats}>
        Félicitations, ton fichier sera conservé chez nous pendant{" "}
        {retentionLabel(days)}&nbsp;!
      </p>
      <p className={styles.linkBox}>{buildShareLink(token)}</p>
      <Button variant="tonal" type="button" onClick={handleCopy}>
        {copied ? "Lien copié !" : "Copier le lien"}
      </Button>
    </section>
  );
}
