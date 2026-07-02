import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import type { UploadResponse } from '../../api/files';
import { clearPendingFile, peekPendingFile } from '../../store/pendingUpload';
import { CloudButton } from '../../components';
import UploadForm from './UploadForm';
import UploadSuccess from './UploadSuccess';
import styles from './Upload.module.css';

const MAX_SIZE_BYTES = 1024 ** 3; // 1 Go, same limit as the backend
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

/**
 * The 3-state upload flow: pick (or drop) a file, fill the form (UploadForm),
 * get the share link (UploadSuccess). This page only owns the file selection
 * and which step is shown.
 */
export default function Upload() {
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
  const [result, setResult] = useState<{
    response: UploadResponse;
    days: number;
  } | null>(null);

  const selectFile = (selected: File) => {
    setFile(selected);
    setFileError(validateFile(selected));
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
  };

  // Success: share link + copy button.
  if (result && file) {
    return (
      <div className={styles.page}>
        <UploadSuccess
          file={file}
          token={result.response.token}
          days={result.days}
        />
      </div>
    );
  }

  // Form: file picked, choose options then upload.
  if (file) {
    return (
      <div className={styles.page}>
        <UploadForm
          file={file}
          fileError={fileError}
          onRemove={handleRemove}
          onSuccess={(response, days) => setResult({ response, days })}
        />
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
