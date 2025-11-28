import type React from "react";

export type AuthFormProps = {
  handleSubmit: (event: React.FormEvent) => void;
  username: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  password: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  confirm?: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  error: string | null;
  isInFlight: boolean;
  title: string;
};

export function AuthForm({
  handleSubmit,
  username,
  password,
  confirm,
  error,
  isInFlight,
  title,
}: AuthFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <label className="label">
        Username
        <input
          name="username"
          value={username.value}
          onChange={username.onChange}
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
          value={password.value}
          onChange={password.onChange}
          autoComplete={confirm ? "new-password" : "current-password"}
          required
          minLength={3}
        />
      </label>
      {confirm ? (
        <label className="label">
          Confirm password
          <input
            type="password"
            name="confirm"
            value={confirm.value}
            onChange={confirm.onChange}
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
  );
}
