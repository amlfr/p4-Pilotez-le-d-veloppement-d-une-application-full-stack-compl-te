import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth";
import { CloudButton } from "../../components";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.token !== null);

  // Upload requires an account: anonymous visitors go to the login page first.
  const handleUploadClick = () => {
    navigate(isLoggedIn ? "/upload" : "/login");
  };

  return (
    <div className={styles.home}>
      <p className={styles.question}>Tu veux partager un fichier ?</p>
      <CloudButton onClick={handleUploadClick} />
    </div>
  );
}
