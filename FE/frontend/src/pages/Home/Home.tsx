import { useRef, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth";
import { setPendingFile } from "../../store/pendingUpload";
import { CloudButton } from "../../components";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.token !== null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hands the picked file to the Upload page, which opens on the form card.
  const startUpload = (file: File) => {
    setPendingFile(file);
    navigate("/upload");
  };

  // Upload requires an account: anonymous visitors go to the login page first.
  const handleUploadClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    inputRef.current?.click();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) startUpload(selected);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const dropped = event.dataTransfer.files[0];
    if (dropped) startUpload(dropped);
  };

  return (
    <div className={styles.home}>
      <p className={styles.question}>Tu veux partager un fichier ?</p>
      <CloudButton
        onClick={handleUploadClick}
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
