import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ApiError, decodeToken, login } from "../../api/auth";
import { useAuthStore } from "../../store/auth";
import { AuthCard, Button, InputField } from "../../components";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { token } = await login(email, password);
      const claims = decodeToken(token);
      setSession(token, claims.name ?? claims.sub, claims.sub);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else {
        setError("Une erreur est survenue, réessayez plus tard");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Connexion"
      error={error}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button
            variant="link"
            type="button"
            onClick={() => navigate("/register")}
          >
            Créer un compte
          </Button>
          <Button variant="tonal" type="submit" disabled={submitting}>
            Connexion
          </Button>
        </>
      }
    >
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
    </AuthCard>
  );
}
