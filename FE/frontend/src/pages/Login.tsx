import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ApiError, login } from '../api/auth';
import { useAuthStore } from '../store/auth';
import Button from '../components/Button';
import InputField from '../components/InputField';
import './AuthCard.css';

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = await login(email, password);
      setSession(session.token, session.name, session.email);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError('Une erreur est survenue, réessayez plus tard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1 className="auth-card__title">Connexion</h1>
      <div className="auth-card__fields">
        <InputField
          label="Email"
          type="email"
          placeholder="Saisissez votre email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <InputField
          label="Mot de passe"
          type="password"
          placeholder="Saisissez votre mot de passe..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="auth-card__error">{error}</p>}
      <div className="auth-card__actions">
        <Button
          variant="link"
          type="button"
          onClick={() => navigate('/register')}
        >
          Créer un compte
        </Button>
        <Button variant="tonal" type="submit" disabled={submitting}>
          Connexion
        </Button>
      </div>
    </form>
  );
}
