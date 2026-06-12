import { Route, Routes } from "react-router";
import { Header } from "./components";
import { Home, Login, Register } from "./pages";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <footer className={styles.footer}>
        <p className={styles.copyright}>Copyright DataShare© 2025</p>
      </footer>
    </div>
  );
}

export default App;
