import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/auth";
import { uploadFile, type UploadResponse } from "../../api/files";
import { useAuthStore } from "../../store/auth";
import {
  Button,
  FileIcon,
  InputField,
  SelectField,
  TagInput,
} from "../../components";
import { formatSize } from "../../utils/format";
import styles from "./Upload.module.css";

interface UploadFormProps {
  file: File;
  fileError: string;
  onRemove: () => void;
  onSuccess: (response: UploadResponse, days: number) => void;
}

/** Step 2 of the upload flow: a file is picked, choose the options and send it. */
export default function UploadForm({
  file,
  fileError,
  onRemove,
  onSuccess,
}: UploadFormProps) {
  const token = useAuthStore((state) => state.token);
  // US07: upload is open to anonymous visitors, so `token` may be null here.
  const isLoggedIn = token !== null;

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (fileError || submitting) return;
    if (password && password.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setError("");
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
      onSuccess(response, expiresInDays);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Session expirée, veuillez vous reconnecter");
      } else if (err instanceof ApiError) {
        // Backend messages (413, 415, 422...) are already in French.
        setError(err.message);
      } else {
        setError("Une erreur est survenue, réessayez plus tard");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            onClick={onRemove}
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
            setPasswordError("");
          }}
        />
        <SelectField
          label="Durée de conservation"
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((days) => (
            <option key={days} value={days}>
              {days === 1 ? "1 jour" : `${days} jours`}
            </option>
          ))}
        </SelectField>
        {isLoggedIn && <TagInput tags={tags} onTagsChange={setTags} />}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <Button
        variant="tonal"
        type="submit"
        className={styles.submit}
        disabled={submitting || Boolean(fileError)}
      >
        {submitting ? "Téléversement..." : "Téléverser"}
      </Button>
    </form>
  );
}
