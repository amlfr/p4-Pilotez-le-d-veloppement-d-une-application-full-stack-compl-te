import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { ApiError } from '../../api/auth';
import {
  fetchFileBlob,
  getFileMetadata,
  type FileMetadata,
} from '../../api/files';
import { Button, InputField } from '../../components';
import styles from './Download.module.css';

function FileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function formatSize(bytes: number): string {
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded =
    unit === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  return `${rounded.replace('.', ',')} ${units[unit]}`;
}

function expiryLabel(expiresAt: string): string {
  const date = new Date(expiresAt);
  return `Expire le ${date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
}

/** Saves a blob to disk under the original filename via a transient anchor. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Download() {
  const { token = '' } = useParams();

  const [meta, setMeta] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFileMetadata(token)
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? "Ce lien est invalide ou le fichier n'est plus disponible"
            : 'Une erreur est survenue, réessayez plus tard',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleDownload = async (event: FormEvent) => {
    event.preventDefault();
    if (!meta || downloading) return;
    if (meta.password_protected && !password) {
      setDownloadError('Ce fichier est protégé, saisissez le mot de passe');
      return;
    }
    setDownloadError('');
    setDownloading(true);
    try {
      const blob = await fetchFileBlob(token, password || undefined);
      saveBlob(blob, meta.original_name);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDownloadError('Mot de passe incorrect');
      } else if (err instanceof ApiError && err.status === 410) {
        setDownloadError("Ce fichier a expiré, il n'est plus disponible");
      } else if (err instanceof ApiError && err.status === 404) {
        setDownloadError('Ce lien est invalide');
      } else {
        setDownloadError('Le téléchargement a échoué, réessayez plus tard');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.status}>Chargement...</p>
      </div>
    );
  }

  if (loadError || !meta) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.title}>Lien indisponible</h1>
          <p className={styles.status}>{loadError}</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleDownload}>
        <h1 className={styles.title}>Télécharger un fichier</h1>
        <div className={styles.fileRow}>
          <span className={styles.fileIcon}>
            <FileIcon />
          </span>
          <div className={styles.fileInfo}>
            <span className={styles.fileName}>{meta.original_name}</span>
            <span className={styles.fileSize}>
              {formatSize(meta.size_bytes)} · {meta.mime_type}
            </span>
          </div>
        </div>
        <p className={styles.expiry}>{expiryLabel(meta.expires_at)}</p>
        {meta.password_protected && (
          <InputField
            label="Mot de passe"
            type="password"
            placeholder="Saisissez le mot de passe"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setDownloadError('');
            }}
          />
        )}
        {downloadError && <p className={styles.error}>{downloadError}</p>}
        {done && (
          <p className={styles.success}>Téléchargement lancé&nbsp;!</p>
        )}
        <Button
          variant="tonal"
          type="submit"
          className={styles.submit}
          disabled={downloading}
        >
          {downloading ? 'Téléchargement...' : 'Télécharger'}
        </Button>
      </form>
    </div>
  );
}
