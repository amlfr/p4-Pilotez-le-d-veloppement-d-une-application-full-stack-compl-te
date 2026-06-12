import { Route, Routes } from "react-router";
import { Header } from "./components";
import { Home, Login, Register, Upload } from "./pages";
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
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </main>
      <footer className={styles.footer}>
        <p className={styles.copyright}>Copyright DataShare© 2025</p>
      </footer>
    </div>
  );
}

export default App;
