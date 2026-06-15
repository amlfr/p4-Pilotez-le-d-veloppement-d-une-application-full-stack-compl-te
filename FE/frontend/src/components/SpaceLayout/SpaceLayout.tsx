import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth";
import Button from "../Button/Button";
import styles from "./SpaceLayout.module.css";

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * The logged-in "Mon espace" shell: sidebar with brand + nav on desktop,
 * slide-in drawer behind a hamburger on mobile, actions in the top bar.
 */
export default function SpaceLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const name = useAuthStore((state) => state.name);
  const logout = useAuthStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      {menuOpen && (
        <div
          className={styles.scrim}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHead}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.closeButton}`}
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
          >
            <CloseIcon />
          </button>
          <Link to="/files" className={styles.brand}>
            DataShare
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link
            to="/files"
            className={styles.navItem}
            onClick={() => setMenuOpen(false)}
          >
            Mes fichiers
          </Link>
        </nav>
        <p className={styles.copyright}>Copyright DataShare© 2025</p>
      </aside>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.menuButton}`}
            aria-label="Ouvrir le menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <div className={styles.user}>
            <span className={styles.avatar} aria-hidden="true">
              {(name ?? "?").charAt(0).toUpperCase()}
            </span>
            <span className={styles.userName}>{name}</span>
          </div>
          <div className={styles.actions}>
            <Button
              variant="dark"
              type="button"
              className={styles.actionButton}
              onClick={() => navigate("/upload")}
            >
              Téléverser un fichier
            </Button>
            <Button
              variant="tonal"
              type="button"
              className={styles.actionButton}
              onClick={() => logout()}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
