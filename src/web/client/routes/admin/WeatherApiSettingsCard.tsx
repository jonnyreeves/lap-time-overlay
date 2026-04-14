import { css } from "@emotion/react";
import { useEffect, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { adminToolsQuery } from "../../__generated__/adminToolsQuery.graphql.js";
import type { WeatherApiSettingsCardUpdateWeatherApiKeyMutation } from "../../__generated__/WeatherApiSettingsCardUpdateWeatherApiKeyMutation.graphql.js";
import { Card } from "../../components/Card.js";

const UpdateWeatherApiKeyMutation = graphql`
  mutation WeatherApiSettingsCardUpdateWeatherApiKeyMutation(
    $input: UpdateWeatherApiKeyInput!
  ) {
    updateWeatherApiKey(input: $input) {
      settings {
        configured
        updatedAt
      }
    }
  }
`;

type WeatherApiSettings = adminToolsQuery["response"]["adminWeatherApiSettings"];

interface WeatherApiSettingsCardProps {
  settings: WeatherApiSettings;
}

const formStyles = css`
  display: grid;
  gap: 12px;
`;

const fieldStyles = css`
  display: grid;
  gap: 6px;

  input {
    max-width: 420px;
  }
`;

const statusStyles = css`
  color: #475569;
  font-size: 0.95rem;
`;

const actionRowStyles = css`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

function formatUpdatedAt(value?: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

export function WeatherApiSettingsCard({ settings }: WeatherApiSettingsCardProps) {
  const [apiKey, setApiKey] = useState("");
  const [currentSettings, setCurrentSettings] = useState(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commitUpdate, isSaving] =
    useMutation<WeatherApiSettingsCardUpdateWeatherApiKeyMutation>(
      UpdateWeatherApiKeyMutation
    );

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  const saveKey = (nextApiKey: string) => {
    setMessage(null);
    setError(null);
    commitUpdate({
      variables: { input: { apiKey: nextApiKey } },
      onCompleted: (response) => {
        const nextSettings = response.updateWeatherApiKey.settings;
        setCurrentSettings(nextSettings);
        setApiKey("");
        setMessage(nextSettings.configured ? "Weather API key saved." : "Weather API key cleared.");
      },
      onError: (mutationError) => {
        setError(mutationError.message);
      },
    });
  };

  const handleSave = () => {
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey) {
      setError("Enter an API key, or use Clear key to remove the saved key.");
      setMessage(null);
      return;
    }
    saveKey(trimmedApiKey);
  };

  const handleClear = () => {
    saveKey("");
  };

  return (
    <Card title="Weather API">
      <div css={formStyles}>
        <p css={css`margin: 0; color: #3e4b6d;`}>
          Used for historical weather when creating and importing outdoor sessions.
        </p>
        <div css={statusStyles}>
          <strong>Status:</strong>{" "}
          {currentSettings.configured ? "Configured" : "Not configured"}
          <br />
          <strong>Last changed:</strong> {formatUpdatedAt(currentSettings.updatedAt)}
        </div>
        <label css={fieldStyles}>
          <span>WeatherAPI.com API key</span>
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            placeholder={currentSettings.configured ? "Enter a new key to replace it" : "Paste API key"}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>
        {message ? <p css={css`margin: 0; color: #166534;`}>{message}</p> : null}
        {error ? <p className="lede">{error}</p> : null}
        <div css={actionRowStyles}>
          <button type="button" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save key"}
          </button>
          <button
            type="button"
            disabled={isSaving || (!currentSettings.configured && !apiKey.trim())}
            onClick={handleClear}
          >
            Clear key
          </button>
        </div>
      </div>
    </Card>
  );
}
