import { Link, useNavigate } from 'react-router'
import { useAuthStore } from '../store/auth'
import Button from './Button'
import './Header.css'

export default function Header() {
  const navigate = useNavigate()
  const { name, token, logout } = useAuthStore()

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand">
          DataShare
        </Link>
        {token ? (
          <div className="header__session">
            <span className="header__user">{name}</span>
            <Button variant="dark" onClick={() => logout()}>
              Se déconnecter
            </Button>
          </div>
        ) : (
          <Button variant="dark" onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        )}
      </div>
    </header>
  )
}
