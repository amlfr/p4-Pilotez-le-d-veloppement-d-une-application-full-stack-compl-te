import { Outlet, Route, Routes } from "react-router";
import { Header, RequireAuth } from "./components";
import { Home, Login, MyFiles, Register, Upload } from "./pages";
import styles from "./App.module.css";

/** Default shell: header + gradient body + footer. "Mon espace" has its own. */
function SiteLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p className={styles.copyright}>Copyright DataShare© 2025</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/upload" element={<Upload />} />
        </Route>
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/files" element={<MyFiles />} />
      </Route>
    </Routes>
  );
}

export default App;
