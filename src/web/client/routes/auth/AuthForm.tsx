import type React from "react";
import { useState } from "react";
import { useMutation } from "react-relay";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LoginMutation } from "../../__generated__/LoginMutation.graphql.js";
import LoginMutationNode from "../../__generated__/LoginMutation.graphql.js";
import type { RegisterMutation } from "../../__generated__/RegisterMutation.graphql.js";
import RegisterMutationNode from "../../__generated__/RegisterMutation.graphql.js";
import { Card } from "../../components/Card.js";

export type AuthMode = "login" | "register";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | undefined)?.from ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commitLogin, isLoginInFlight] = useMutation<LoginMutation>(LoginMutationNode);
  const [commitRegister, isRegisterInFlight] =
    useMutation<RegisterMutation>(RegisterMutationNode);

  const isInFlight = mode === "login" ? isLoginInFlight : isRegisterInFlight;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (isInFlight) return;

    if (mode === "register" && password !== confirm) {
      setError("Passwords must match.");
      return;
    }

    const variables = { input: { username: username.trim(), password } };

    if (mode === "login") {
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
      return;
    }

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

  const title = mode === "login" ? "Log in" : "Create account";
  const switchText =
    mode === "login" ? "Need an account?" : "Already have an account?";
  const switchHref = mode === "login" ? "/register" : "/login";

  return (
    <Card title={title}>
      <form onSubmit={handleSubmit}>
        <label className="label">
          Username
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
          />
        </label>
        <label className="label">
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={3}
          />
        </label>
        {mode === "register" ? (
          <label className="label">
            Confirm password
            <input
              type="password"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={3}
            />
          </label>
        ) : null}
        {error ? (
          <p className="lede" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={isInFlight}>
          {isInFlight ? "Please wait…" : title}
        </button>
      </form>
      <p className="lede">
        {switchText} <Link to={switchHref}>Go here.</Link>
      </p>
    </Card>
  );
}
