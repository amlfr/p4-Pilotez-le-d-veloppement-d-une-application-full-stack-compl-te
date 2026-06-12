import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth";
import Button from "../Button";
import styles from "./Header.module.css";

export default function Header() {
  const navigate = useNavigate();
  const { name, token, logout } = useAuthStore();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          DataShare
        </Link>
        {token ? (
          <div className={styles.session}>
            <span className={styles.user}>{name}</span>
            <Button variant="dark" onClick={() => logout()}>
              Se déconnecter
            </Button>
          </div>
        ) : (
          <Button variant="dark" onClick={() => navigate("/login")}>
            Se connecter
          </Button>
        )}
      </div>
    </header>
  );
}
