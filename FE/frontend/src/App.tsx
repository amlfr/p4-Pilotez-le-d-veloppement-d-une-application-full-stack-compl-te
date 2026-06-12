import { Route, Routes } from 'react-router'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

function App() {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <footer className="layout__footer">
        <p className="layout__copyright">Copyright DataShare© 2025</p>
      </footer>
    </div>
  )
}

export default App
