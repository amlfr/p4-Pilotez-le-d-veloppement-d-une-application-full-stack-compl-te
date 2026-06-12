import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ApiError, login, register } from '../api/auth';
import { useAuthStore } from '../store/auth';
import Button from '../components/Button';
import InputField from '../components/InputField';
import './AuthCard.css';

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(name, email, password);
      // Account created: log the user straight in.
      const session = await login(email, password);
      setSession(session.token, session.name, session.email);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Cet email est déjà utilisé');
      } else if (err instanceof ApiError && err.status === 400 && err.fields) {
        setFieldErrors(err.fields);
      } else {
        setError('Une erreur est survenue, réessayez plus tard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1 className="auth-card__title">Créer un compte</h1>
      <div className="auth-card__fields">
        <InputField
          label="Nom"
          type="text"
          placeholder="Saisissez votre nom..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />
        <InputField
          label="Email"
          type="email"
          placeholder="Saisissez votre email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <InputField
          label="Mot de passe"
          type="password"
          placeholder="Saisissez votre mot de passe..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />
      </div>
      {error && <p className="auth-card__error">{error}</p>}
      <div className="auth-card__actions">
        <Button variant="link" type="button" onClick={() => navigate('/login')}>
          J'ai déjà un compte
        </Button>
        <Button variant="tonal" type="submit" disabled={submitting}>
          Créer mon compte
        </Button>
      </div>
    </form>
  );
}
