import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ApiError, decodeToken, register } from "../../api/auth";
import { useAuthStore } from "../../store/auth";
import { AuthCard, Button, InputField } from "../../components";

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // Register returns a token directly: the account is logged in on creation.
      const { token } = await register(name, email, password);
      const claims = decodeToken(token);
      setSession(token, claims.name ?? claims.sub, claims.sub);
      navigate("/files");
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 409 || err.status === 422)
      ) {
        // Backend messages are already in French (409 conflict, 422 validation).
        setError(err.message);
      } else {
        setError("Une erreur est survenue, réessayez plus tard");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Créer un compte"
      error={error}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button
            variant="link"
            type="button"
            onClick={() => navigate("/login")}
          >
            J'ai déjà un compte
          </Button>
          <Button variant="tonal" type="submit" disabled={submitting}>
            Créer mon compte
          </Button>
        </>
      }
    >
      <InputField
        label="Nom"
        type="text"
        placeholder="Saisissez votre nom..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
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
