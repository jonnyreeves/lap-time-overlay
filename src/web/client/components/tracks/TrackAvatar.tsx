import { css } from "@emotion/react";

type Props = {
  name: string;
  heroImage?: string | null;
  size?: number;
  className?: string;
};

const avatarStyles = (size: number) => css`
  width: ${size}px;
  height: ${size}px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e2e8f4;
  color: #6366f1;
  font-size: ${Math.max(18, Math.round(size * 0.35))}px;
  font-weight: 700;
  border: 1px solid #e0e0e0;
  flex-shrink: 0;
`;

const imageStyles = css`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const initialsStyles = css`
  letter-spacing: 0.04em;
`;

function getInitials(name: string): string {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  return words
    .filter((word) => word.length > 0)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function TrackAvatar({
  name,
  heroImage,
  size = 64,
  className,
}: Props) {
  const initials = getInitials(name);

  return (
    <div css={avatarStyles(size)} className={className} title={name}>
      {heroImage ? (
        <img css={imageStyles} src={heroImage} alt={name} />
      ) : (
        <span css={initialsStyles}>{initials}</span>
      )}
    </div>
  );
}
