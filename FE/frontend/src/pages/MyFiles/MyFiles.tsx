import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import {
  buildShareLink,
  deleteFile,
  listMyFiles,
  type FileListItem,
} from "../../api/files";
import { useAuthStore } from "../../store/auth";
import { Button, FileIcon, SpaceLayout } from "../../components";
import styles from "./MyFiles.module.css";

type Filter = "tous" | "actifs" | "expires";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "actifs", label: "Actifs" },
  { value: "expires", label: "Expirés" },
];

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

/** "Expire dans 2 jours" / "Expire demain" / "Expiré", like the mockups. */
function expiryLabel(item: FileListItem): string {
  if (item.is_expired) return "Expiré";
  const msLeft = new Date(item.expires_at).getTime() - Date.now();
  const days = Math.ceil(msLeft / 86_400_000);
  if (days <= 0) return "Expiré";
  if (days === 1) return "Expire demain";
  return `Expire dans ${days} jours`;
}

export default function MyFiles() {
  const token = useAuthStore((state) => state.token);

  const [files, setFiles] = useState<FileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("actifs");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const openMenuRef = useRef<HTMLDivElement | null>(null);

  // Close the mobile row menu on outside click or Escape.
  useEffect(() => {
    if (!openMenuId) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!openMenuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listMyFiles(token)
      .then((response) => {
        if (!cancelled) setFiles(response.data);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Impossible de charger vos fichiers, réessayez plus tard");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCopy = async (item: FileListItem) => {
    try {
      const link = buildShareLink(item.token);
      await navigator.clipboard.writeText(link);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard unavailable; nothing to do.
    }
  };

  const handleDelete = async (item: FileListItem) => {
    if (!token) return;
    try {
      await deleteFile(item.id, token);
      setFiles((current) => current.filter((f) => f.id !== item.id));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "La suppression a échoué, réessayez plus tard",
      );
    }
  };

  const visible = files.filter((item) => {
    if (filter === "actifs") return !item.is_expired;
    if (filter === "expires") return item.is_expired;
    return true;
  });

  return (
    <SpaceLayout>
      <section className={styles.card}>
        <h1 className={styles.title}>Mes fichiers</h1>
        <div
          className={styles.filters}
          role="tablist"
          aria-label="Filtrer les fichiers"
        >
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={`${styles.filter} ${filter === value ? styles.filterActive : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className={styles.empty} role="status">
            Chargement...
          </p>
        ) : visible.length === 0 ? (
          <p className={styles.empty}>
            {files.length === 0
              ? "Aucun fichier pour le moment"
              : "Aucun fichier dans cette catégorie"}
          </p>
        ) : (
          <ul className={styles.list}>
            {visible.map((item) => (
              <li key={item.id} className={styles.row}>
                <span className={styles.fileIcon}>
                  <FileIcon />
                </span>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{item.original_name}</span>
                  <span
                    className={`${styles.fileExpiry} ${item.is_expired ? styles.expired : ""}`}
                  >
                    {expiryLabel(item)}
                  </span>
                  {item.tags.length > 0 && (
                    <span className={styles.tags}>
                      {item.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <div className={styles.actions}>
                  {item.password_protected && (
                    <span
                      className={styles.lock}
                      title="Protégé par mot de passe"
                      role="img"
                      aria-label="Protégé par mot de passe"
                    >
                      <LockIcon />
                    </span>
                  )}
                  {item.is_expired ? (
                    <span className={styles.expiredNote}>
                      Ce fichier a expiré, il n'est plus stocké chez nous
                    </span>
                  ) : (
                    <>
                      <Button
                        variant="tonal"
                        type="button"
                        className={styles.rowButton}
                        aria-label={
                          copiedId === item.id
                            ? `Lien de ${item.original_name} copié`
                            : `Copier le lien de ${item.original_name}`
                        }
                        aria-live="polite"
                        onClick={() => handleCopy(item)}
                      >
                        {copiedId === item.id ? "Copié !" : "Copier le lien"}
                      </Button>
                      <Button
                        variant="dark"
                        type="button"
                        className={styles.rowButton}
                        aria-label={`Supprimer ${item.original_name}`}
                        onClick={() => handleDelete(item)}
                      >
                        Supprimer
                      </Button>
                      {/* Same two actions, collapsed for mobile (CSS swaps them). */}
                      <div
                        className={styles.rowMenu}
                        ref={openMenuId === item.id ? openMenuRef : null}
                      >
                        <button
                          type="button"
                          className={styles.menuButton}
                          aria-label={`Actions pour ${item.original_name}`}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === item.id}
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === item.id ? null : item.id,
                            )
                          }
                        >
                          <MoreIcon />
                        </button>
                        {openMenuId === item.id && (
                          <div className={styles.menu} role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.menuItem}
                              onClick={() => {
                                setOpenMenuId(null);
                                handleCopy(item);
                              }}
                            >
                              Copier le lien
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.menuItem}
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(item);
                              }}
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SpaceLayout>
  );
}
