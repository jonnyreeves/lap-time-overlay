import type { SerializedStyles } from "@emotion/react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  children: React.ReactNode;
  css?: SerializedStyles;
};

const iconButtonStyles = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

export function IconButton({ icon, children, ...props }: Props) {
  return (
    <button css={iconButtonStyles} {...props}>
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  );
}
