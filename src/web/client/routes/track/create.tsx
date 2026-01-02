import { css } from "@emotion/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card.js";
import { CreateTrackForm } from "../../components/tracks/CreateTrackForm.js";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs.js";

const pageStyles = css`
  display: grid;
  gap: 16px;
  max-width: 720px;
  margin: 0 auto;
`;

export default function CreateTrackRoute() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Tracks", to: "/tracks" },
      { label: "Create track" },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const handleCancel = () => {
    navigate("/tracks");
  };

  const handleSuccess = (trackId: string) => {
    navigate(`/tracks/view/${trackId}`);
  };

  return (
    <div css={pageStyles}>
      <Card title="Create Track">
        <CreateTrackForm onCancel={handleCancel} onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}
