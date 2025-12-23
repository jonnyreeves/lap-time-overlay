import { css, keyframes } from "@emotion/react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { useLocation, useNavigate } from "react-router-dom";
import type { loginMutation } from "../../__generated__/loginMutation.graphql.js";
import type { loginUsersQuery } from "../../__generated__/loginUsersQuery.graphql.js";
import { eyebrowStyles, ledeStyles } from "../../styles/typography.js";

type UserChoice = {
  id?: string;
  username: string;
  label: string;
  gradient?: string;
};

const floatGlow = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(-14px); }
`;

const pulse = keyframes`
  0% { opacity: 0.45; }
  50% { opacity: 0.85; }
  100% { opacity: 0.45; }
`;

const gradientPalette: Array<[string, string]> = [
  ["#2d7efb", "#45c4ff"],
  ["#f5a35c", "#f56c6c"],
  ["#39d2b4", "#2f9ee4"],
  ["#ffc857", "#f77f5a"],
  ["#51d0de", "#4a8fe7"],
];

const loginMutationNode = graphql`
  mutation loginMutation($input: AuthInput!) {
    login(input: $input) {
      user {
        id
        username
      }
      sessionExpiresAt
    }
  }
`;

const loginUsersQueryNode = graphql`
  query loginUsersQuery {
    users {
      id
      username
    }
  }
`;

function usernameInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || "?";
}

function gradientForName(name: string, index: number) {
  const safeName = name || `user-${index}`;
  const hash = safeName.split("").reduce((acc, char) => acc + char.charCodeAt(0), index * 13);
  const paletteIndex = Math.abs(hash) % gradientPalette.length;
  const [from, to] = gradientPalette[paletteIndex];
  return `linear-gradient(145deg, ${from}, ${to})`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | undefined)?.from ?? "/";
  const data = useLazyLoadQuery<loginUsersQuery>(loginUsersQueryNode, {}, { fetchPolicy: "store-or-network" });
  const [selectedUser, setSelectedUser] = useState<UserChoice | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commitLogin, isLoginInFlight] = useMutation<loginMutation>(loginMutationNode);
  const passwordRef = useRef<HTMLInputElement>(null);

  const userChoices = useMemo(() => {
    const sortedUsers = [...(data.users ?? [])].sort((a, b) =>
      a.username.localeCompare(b.username, undefined, { sensitivity: "base" })
    );
    return sortedUsers.map((user, index) => ({
      id: user.id,
      username: user.username,
      label: user.username,
      gradient: gradientForName(user.username, index),
    }));
  }, [data.users]);

  const handleUserSelect = (choice: UserChoice, index: number) => {
    setSelectedUser({
      ...choice,
      gradient: choice.gradient ?? gradientForName(choice.username, index),
    });
    setPassword("");
    setError(null);
    window.setTimeout(() => {
      passwordRef.current?.focus();
    }, 240);
  };

  const handleResetSelection = () => {
    setSelectedUser(null);
    setPassword("");
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser) {
      setError("Pick a user to continue.");
      return;
    }
    const loginUsername = selectedUser.username?.trim() ?? "";
    if (!loginUsername) {
      setError("Enter a username to continue.");
      return;
    }
    setError(null);
    if (isLoginInFlight) return;

    const variables = { input: { username: loginUsername, password } };

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

  const selectedName = selectedUser?.username ?? "";

  return (
    <div css={pageStyles}>
      <div css={panelStyles}>
        <div css={glowAccent} />
        <div css={glowAccentSoft} />
        <header css={headerStyles}>
          <p css={eyebrowStyles}>Welcome back</p>
        </header>
        <div css={circleStageStyles} data-has-selection={Boolean(selectedUser)}>
          {userChoices.map((choice, index) => {
            const isSelected = selectedUser?.id === choice.id;
            const isCollapsed = Boolean(selectedUser) && !isSelected;
            return (
              <div
                key={choice.id ?? `${choice.label}-${index}`}
                css={circleWrapStyles}
                data-collapsed={isCollapsed}
              >
                <button
                  type="button"
                  css={circleButtonStyles}
                  style={{ backgroundImage: choice.gradient ?? gradientForName(choice.username, index) }}
                  data-selected={isSelected}
                  onClick={() => handleUserSelect(choice, index)}
                  aria-label={`Login as ${choice.label}`}
                >
                  <span className="initial">{usernameInitial(choice.username)}</span>
                </button>
                <p className="label">{choice.label}</p>
              </div>
            );
          })}
          <div css={circleWrapStyles} data-collapsed={Boolean(selectedUser)}>
            <button
              type="button"
              css={[circleButtonStyles, addUserCircleStyles]}
              onClick={() => navigate("/auth/register")}
              aria-label="Add a new user"
            >
              <span className="initial">+</span>
            </button>
            <p className="label">Add user</p>
          </div>
        </div>

        <form css={formStyles} data-visible={Boolean(selectedUser)} onSubmit={handleSubmit}>
          <label css={inputLabelStyles}>
            Password
            <input
              ref={passwordRef}
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              minLength={3}
              placeholder={selectedUser ? "Enter your password" : "Pick a user first"}
              disabled={!selectedUser}
            />
          </label>

          {error ? (
            <p css={errorStyles} role="alert">
              {error}
            </p>
          ) : null}

          <div css={actionsStyles}>
            <button type="button" className="ghost" onClick={handleResetSelection}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

const pageStyles = css`
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background: radial-gradient(circle at 18% 20%, #f9fbff, #e7efff 45%),
    radial-gradient(circle at 82% -6%, #f3f8ff, #e0ebff 40%),
    linear-gradient(135deg, #f7faff, #eef3ff);
`;

const panelStyles = css`
  position: relative;
  width: min(1100px, 100%);
  background: #ffffff;
  border: 1px solid #dbe6ff;
  border-radius: 28px;
  box-shadow: 0 26px 90px rgba(22, 46, 118, 0.18);
  padding: 32px 32px 38px;
  overflow: hidden;
  isolation: isolate;

  @media (max-width: 720px) {
    padding: 24px 18px 28px;
  }
`;

const glowAccent = css`
  position: absolute;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(69, 196, 255, 0.32), rgba(69, 196, 255, 0));
  filter: blur(12px);
  right: -120px;
  top: -140px;
  pointer-events: none;
  animation: ${floatGlow} 14s ease-in-out infinite alternate;
  z-index: 0;
`;

const glowAccentSoft = css`
  position: absolute;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(255, 200, 87, 0.3), rgba(255, 200, 87, 0));
  filter: blur(12px);
  left: -120px;
  bottom: -120px;
  pointer-events: none;
  animation: ${floatGlow} 16s ease-in-out infinite alternate-reverse;
  z-index: 0;
`;

const headerStyles = css`
  position: relative;
  z-index: 1;
  text-align: center;
  display: grid;
  gap: 6px;
  margin-bottom: 12px;

  h1 {
    margin: 0;
  }
`;

const headerLedeStyles = css`
  text-align: center;
  color: #2f3c5d;
  margin: 0 auto;
`;

const circleStageStyles = css`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  align-content: center;
  gap: 22px;
  padding: 22px 14px 10px;
  min-height: 240px;
  transition: gap 220ms ease;

  &[data-has-selection="true"] {
    gap: 8px;
  }
`;

const circleWrapStyles = css`
  display: grid;
  justify-items: center;
  gap: 10px;
  max-width: 180px;
  flex: 1 1 150px;
  transition: max-width 260ms ease, opacity 200ms ease, filter 200ms ease;

  &[data-collapsed="true"] {
    opacity: 0;
    max-width: 0;
    filter: blur(4px);
    pointer-events: none;
  }

  .label {
    margin: 0;
    font-weight: 700;
    color: #0f1b3d;
    letter-spacing: -0.01em;
    font-size: 0.98rem;
  }
`;

const circleButtonStyles = css`
  --ring: rgba(255, 255, 255, 0.65);
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 1px solid #e8eeff;
  display: grid;
  place-items: center;
  color: #f9fbff;
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 1.25rem;
  cursor: pointer;
  background-size: 140% 140%;
  box-shadow: 0 14px 36px rgba(28, 52, 118, 0.22);
  transition: transform 320ms ease, box-shadow 320ms ease, opacity 200ms ease;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  animation: ${pulse} 8s ease-in-out infinite;

  &:after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 60%);
    opacity: 0.65;
  }

  &:hover {
    transform: translateY(-8px) scale(1.04);
    box-shadow: 0 18px 44px rgba(28, 52, 118, 0.28);
  }

  &[data-selected="true"] {
    transform: translateY(-12px) scale(1.15);
    box-shadow: 0 26px 60px rgba(22, 46, 118, 0.32);
  }

  &:focus-visible {
    outline: 2px solid #2f7af8;
    outline-offset: 4px;
  }

  .initial {
    position: relative;
    z-index: 1;
  }
`;

const addUserCircleStyles = css`
  background-image: linear-gradient(145deg, #33d1c6, #3a7bff);

  .initial {
    font-size: 1.85rem;
  }
`;

const formStyles = css`
  position: relative;
  z-index: 1;
  margin: 8px auto 0;
  max-width: 280px;
  width: 100%;
  display: grid;
  gap: 12px;
  justify-items: center;
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 260ms ease, transform 260ms ease;

  &[data-visible="true"] {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  input {
    width: 100%;
    max-width: 220px;
    border-radius: 14px;
    border: 1px solid #dbe6ff;
    padding: 12px 14px;
    font-size: 1rem;
    font-weight: 600;
    color: #0f1b3d;
    background: #f9fbff;
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  input:focus {
    outline: none;
    border-color: #2f7af8;
    box-shadow: 0 0 0 4px rgba(47, 122, 248, 0.1);
    background: #ffffff;
  }

  button {
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 140ms ease, box-shadow 140ms ease, background 160ms ease;
  }

  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  button:not(.ghost) {
    background: linear-gradient(120deg, #2d7efb, #3ec2ff);
    color: #fff;
    box-shadow: 0 12px 30px rgba(45, 126, 251, 0.35);
  }

  button:not(.ghost):hover:enabled {
    transform: translateY(-1px);
  }

  button.ghost {
    background: transparent;
    color: #2f3c5d;
    border: 1px dashed #c5d4f7;
  }

  button.ghost:hover:enabled {
    background: #f5f7ff;
  }
`;

const inputLabelStyles = css`
  display: grid;
  gap: 6px;
  font-weight: 700;
  color: #1c2747;
  letter-spacing: -0.01em;
  font-size: 0.95rem;
`;

const selectedChipStyles = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(145deg, #f3f7ff, #e7edff);
  border: 1px solid #dbe6ff;

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: #fff;
    font-weight: 700;
    letter-spacing: 0.02em;
    box-shadow: 0 10px 24px rgba(27, 58, 124, 0.22);
    background-size: 140% 140%;
  }

  .hint {
    margin: 0;
    color: #6a7490;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .name {
    margin: 0;
    color: #0f1b3d;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .swap {
    margin-left: auto;
    background: transparent;
    border: 1px solid #c5d4f7;
    color: #2f3c5d;
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
  }

  .swap:hover {
    background: #f5f7ff;
  }
`;

const errorStyles = css`
  margin: 4px 0 2px;
  color: #c0392b;
  font-weight: 700;
  background: #ffecec;
  border: 1px solid #ffd0d0;
  padding: 10px 12px;
  border-radius: 12px;
`;

const actionsStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  align-items: center;
`;

const registerHintStyles = css`
  ${ledeStyles}
  margin: 6px 0 0;
  color: #2f3c5d;

  a {
    color: #2d7efb;
    font-weight: 700;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;
