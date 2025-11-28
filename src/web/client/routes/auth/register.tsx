import type React from "react";
import { useState } from "react";
import { useMutation } from "react-relay";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { RegisterMutation } from "../../__generated__/RegisterMutation.graphql.js";
import RegisterMutationNode from "../../__generated__/RegisterMutation.graphql.js";
import { AuthForm } from "../../components/AuthForm.js";
import { Card } from "../../components/Card.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | undefined)?.from ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commitRegister, isRegisterInFlight] =
    useMutation<RegisterMutation>(RegisterMutationNode);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (isRegisterInFlight) return;

    if (password !== confirm) {
      setError("Passwords must match.");
      return;
    }

    const variables = { input: { username: username.trim(), password } };

    commitRegister({
      variables,
      onCompleted: (data, errors) => {
        if (errors?.length) {
          setError(errors[0]?.message ?? "Something went wrong.");
          return;
        }
        if (!data?.register?.user) {
          setError("Unable to create the account.");
          return;
        }
        navigate(from || "/", { replace: true });
      },
      onError: () => setError("Unable to reach the server."),
    });
  };

  const title = "Create account";

  return (
    <Card title={title}>
      <AuthForm
        handleSubmit={handleSubmit}
        username={{ value: username, onChange: (e) => setUsername(e.target.value) }}
        password={{ value: password, onChange: (e) => setPassword(e.target.value) }}
        confirm={{ value: confirm, onChange: (e) => setConfirm(e.target.value) }}
        error={error}
        isInFlight={isRegisterInFlight}
        title={title}
      />
      <p className="lede">
        Already have an account? <Link to="/auth/login">Login here.</Link>
      </p>
    </Card>
  );
}
