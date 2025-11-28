import type React from "react";
import { useState } from "react";
import { useMutation } from "react-relay";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LoginMutation } from "../../__generated__/LoginMutation.graphql.js";
import LoginMutationNode from "../../__generated__/LoginMutation.graphql.js";
import { AuthForm } from "../../components/AuthForm.js";
import { Card } from "../../components/Card.js";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | undefined)?.from ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commitLogin, isLoginInFlight] = useMutation<LoginMutation>(LoginMutationNode);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (isLoginInFlight) return;

    const variables = { input: { username: username.trim(), password } };

    commitLogin({
      variables,
      onCompleted: (data, errors) => {
        if (errors?.length) {
          setError(errors[0]?.message ?? "Something went wrong.");
          return;
        }
        if (!data?.login?.user) {
          setError("Invalid username or password.");
          return;
        }
        navigate(from || "/", { replace: true });
      },
      onError: () => {
        setError("Unable to reach the server.");
      },
    });
  };

  const title = "Log in";

  return (
    <Card title={title}>
      <AuthForm
        handleSubmit={handleSubmit}
        username={{ value: username, onChange: (e) => setUsername(e.target.value) }}
        password={{ value: password, onChange: (e) => setPassword(e.target.value) }}
        error={error}
        isInFlight={isLoginInFlight}
        title={title}
      />
      <p className="lede">
        Need an account? <Link to="/auth/register">Go here.</Link>
      </p>
    </Card>
  );
}
