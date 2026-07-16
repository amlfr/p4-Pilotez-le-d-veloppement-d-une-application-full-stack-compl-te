import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth";
import Button from "../Button/Button";
import styles from "./Header.module.css";

export default function Header() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          DataShare
        </Link>
        {token ? (
          <Button variant="dark" onClick={() => navigate("/files")}>
            Mon Espace
          </Button>
        ) : (
          <Button variant="dark" onClick={() => navigate("/login")}>
            Se connecter
          </Button>
        )}
      </div>
    </header>
  );
}
