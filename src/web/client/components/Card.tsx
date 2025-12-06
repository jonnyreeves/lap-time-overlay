import { css } from "@emotion/react";
import type { ReactNode } from "react";
import { ledeStyles, valueStyles } from "../styles/typography.js";

interface CardProps {
  title?: string;
  className?: string;
  children: ReactNode;
  rightComponent?: ReactNode;
}

const cardStyles = css`
  background: #fff;
  border: 1px solid #e2e8f4;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 10px 35px rgba(26, 32, 44, 0.08);

  .title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .value {
    ${valueStyles}
  }

  .lede {
    ${ledeStyles}
  }

  @media (max-width: 640px) {
    padding: 18px 20px;
  }
`;

const cardHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export function Card({
  title,
  className,
  children,
  rightComponent,
}: CardProps) {
  const classes = ["card", className].filter(Boolean).join(" ");
  const hasHeader = title || rightComponent;

  return (
    <section className={classes} css={cardStyles}>
      {hasHeader && (
        <div css={cardHeaderStyles}>
          {title ? <p className="title">{title}</p> : <div />}
          {rightComponent}
        </div>
      )}
      {children}
    </section>
  );
}
