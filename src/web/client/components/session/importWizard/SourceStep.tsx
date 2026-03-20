import { sourceBodyStyles, sourceCardStyles, sourceGridStyles, sourceTitleStyles } from "./styles.js";

interface SourceStepProps {
  selectedSource: "email" | "daytona" | null;
  onSelectSource: (source: "email" | "daytona") => void;
}

export function SourceStep({ selectedSource, onSelectSource }: SourceStepProps) {
  return (
    <div css={sourceGridStyles}>
      <button type="button" css={sourceCardStyles(selectedSource === "email")} onClick={() => onSelectSource("email")}>
        <span css={sourceTitleStyles}>Import via Email</span>
        <span css={sourceBodyStyles}>
          Paste TeamSport or Daytona email contents, or paste an Alpha Timing URL.
        </span>
      </button>
      <button
        type="button"
        css={sourceCardStyles(selectedSource === "daytona")}
        onClick={() => onSelectSource("daytona")}
      >
        <span css={sourceTitleStyles}>Import from Daytona Club Speed</span>
        <span css={sourceBodyStyles}>
          Sign in on the backend, fetch recent Daytona Sandown Park sessions, then choose one to review.
        </span>
      </button>
    </div>
  );
}
