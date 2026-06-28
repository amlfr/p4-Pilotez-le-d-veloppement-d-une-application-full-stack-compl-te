import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { ApiError } from '../../api/auth';
import { buildShareLink, uploadFile, type UploadResponse } from '../../api/files';
import { useAuthStore } from '../../store/auth';
import { clearPendingFile, peekPendingFile } from '../../store/pendingUpload';
import {
  Button,
  CloudButton,
  FileIcon,
  InputField,
  SelectField,
} from '../../components';
import { formatSize } from '../../utils/format';
import styles from './Upload.module.css';

const MAX_SIZE_BYTES = 1024 ** 3; // 1 Go, same limit as the backend
const MAX_TAG_LENGTH = 30; // same limit as the backend (US08)
const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.bat',
  '.sh',
  '.ps1',
  '.msi',
  '.dll',
  '.vbs',
  '.cmd',
];

function validateFile(file: File): string {
  if (file.size > MAX_SIZE_BYTES) {
    return 'La taille des fichiers est limitée à 1 Go';
  }
  const dot = file.name.lastIndexOf('.');
  const extension = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
  if (FORBIDDEN_EXTENSIONS.includes(extension)) {
    return "Ce type de fichier n'est pas autorisé";
  }
  return '';
}

function retentionLabel(days: number): string {
  if (days === 7) return 'une semaine';
  return days === 1 ? '1 jour' : `${days} jours`;
}

export default function Upload() {
  const token = useAuthStore((state) => state.token);

  const inputRef = useRef<HTMLInputElement>(null);
  // A file picked on the Home page arrives through the pendingUpload handoff.
  const [file, setFile] = useState<File | null>(() => peekPendingFile());
  const [fileError, setFileError] = useState(() => {
    const pending = peekPendingFile();
    return pending ? validateFile(pending) : '';
  });
  useEffect(() => {
    clearPendingFile();
  }, []);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // US07: upload is open to anonymous visitors, so `token` may be null here.
  const isLoggedIn = token !== null;

  const selectFile = (selected: File) => {
    setFile(selected);
    setFileError(validateFile(selected));
    setError('');
    setResult(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) selectFile(selected);
    // Reset so picking the same file again still fires a change event.
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  };

  const handleRemove = () => {
    setFile(null);
    setFileError('');
    setError('');
  };

  // Tag rules mirror the backend: trimmed, non-empty, <= 30 chars, no
  // case-insensitive duplicates (US08).
  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (tag.length > MAX_TAG_LENGTH) {
      setTagError('Un tag ne peut pas dépasser 30 caractères');
      return;
    }
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setTagError('Ce tag est déjà ajouté');
      return;
    }
    setTags([...tags, tag]);
    setTagInput('');
    setTagError('');
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (target: string) => {
    setTags(tags.filter((tag) => tag !== target));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || fileError || submitting) return;
    if (password && password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await uploadFile(
        file,
        {
          expiresInDays,
          password: password || undefined,
          // Tags are a connected-user feature (US08); skip them when anonymous.
          tags: isLoggedIn ? tags : undefined,
        },
        token,
      );
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
      } else if (err instanceof ApiError) {
        // Backend messages (413, 415, 422...) are already in French.
        setError(err.message);
      } else {
        setError('Une erreur est survenue, réessayez plus tard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(buildShareLink(result.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context); the link stays selectable.
    }
  };

  // Success: share link + copy button.
  if (result && file) {
    return (
      <div className={styles.page}>
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
            Félicitations, ton fichier sera conservé chez nous pendant{' '}
            {retentionLabel(expiresInDays)}&nbsp;!
          </p>
          <p className={styles.linkBox}>{buildShareLink(result.token)}</p>
          <Button variant="tonal" type="button" onClick={handleCopy}>
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </Button>
        </section>
      </div>
    );
  }

  // Form: file picked, choose options then upload.
  if (file) {
    return (
      <div className={styles.page}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Ajouter un fichier</h1>
          <div>
            <div className={styles.fileRow}>
              <span className={styles.fileIcon}>
                <FileIcon />
              </span>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatSize(file.size)}</span>
              </div>
              <Button
                variant="tonal"
                type="button"
                className={styles.remove}
                onClick={handleRemove}
              >
                Retirer
              </Button>
            </div>
            {fileError && <p className={styles.fileError}>{fileError}</p>}
          </div>
          <div className={styles.fields}>
            <InputField
              label="Mot de passe (optionnel)"
              type="password"
              placeholder="Protégez votre fichier..."
              value={password}
              error={passwordError}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
            />
            <SelectField
              label="Durée de conservation"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                <option key={days} value={days}>
                  {days === 1 ? '1 jour' : `${days} jours`}
                </option>
              ))}
            </SelectField>
            {isLoggedIn && (
            <div className={styles.tagField}>
              <label className={styles.tagLabel} htmlFor="tag-input">
                Tags (optionnel)
              </label>
              <div className={styles.tagBox}>
                {tags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    {tag}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      aria-label={`Retirer le tag ${tag}`}
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  className={styles.tagInput}
                  type="text"
                  placeholder={tags.length ? '' : 'Ajoutez un tag puis Entrée...'}
                  value={tagInput}
                  maxLength={MAX_TAG_LENGTH}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setTagError('');
                  }}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                />
              </div>
              {tagError && <p className={styles.tagError}>{tagError}</p>}
            </div>
            )}
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <Button
            variant="tonal"
            type="submit"
            className={styles.submit}
            disabled={submitting || Boolean(fileError)}
          >
            {submitting ? 'Téléversement...' : 'Téléverser'}
          </Button>
        </form>
      </div>
    );
  }

  // Idle: pick (or drop) a file.
  return (
    <div className={styles.page}>
      <p className={styles.question}>Tu veux partager un fichier ?</p>
      <CloudButton
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      <input
        ref={inputRef}
        type="file"
        className={styles.fileInput}
        onChange={handleInputChange}
      />
    </div>
  );
}
