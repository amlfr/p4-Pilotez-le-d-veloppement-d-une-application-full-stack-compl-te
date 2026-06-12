import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth";
import styles from "./Home.module.css";

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

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.token !== null);

  // Upload requires an account: send anonymous visitors to the login page.
  // The real upload flow comes with the File API.
  const handleUploadClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  };

  return (
    <div className={styles.home}>
      <p className={styles.question}>Tu veux partager un fichier ?</p>
      <button
        type="button"
        className={styles.upload}
        onClick={handleUploadClick}
        aria-label="Ajouter un fichier"
      >
        <span className={styles.uploadInner}>
          <UploadCloudIcon />
        </span>
      </button>
    </div>
  );
}
