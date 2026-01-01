import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import type { BreadcrumbItem } from "../hooks/useBreadcrumbs.js";

type Props = {
  items: BreadcrumbItem[];
};

const homeCrumb: BreadcrumbItem = { label: "Home", to: "/" };

const breadcrumbBarStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #475569;
  font-size: 0.95rem;
  padding: 2px 2px 0;
  letter-spacing: 0.01em;
`;

const crumbLinkStyles = css`
  color: #334155;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    color: #536ad6;
  }
`;

const crumbCurrentStyles = css`
  color: #0f172a;
  font-weight: 800;
`;

const separatorStyles = css`
  color: #cbd5e1;
  font-weight: 700;
  user-select: none;
  margin: 0 8px;
  line-height: 1;
  display: inline-block;
`;

export function Breadcrumbs({ items }: Props) {
  const crumbs = [homeCrumb, ...items.filter((item) => item.label !== "Home" || item.to !== "/")];

  return (
    <nav aria-label="Breadcrumb" css={breadcrumbBarStyles}>
      {crumbs.map((item, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={`${item.label}-${index}`} css={isLast ? crumbCurrentStyles : undefined}>
            {item.to && !isLast ? (
              <Link to={item.to} css={crumbLinkStyles}>
                {item.label}
              </Link>
            ) : (
              item.label
            )}
            {!isLast && <span css={separatorStyles}>›</span>}
          </span>
        );
      })}
    </nav>
  );
}
