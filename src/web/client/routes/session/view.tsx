import { css } from "@emotion/react";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useParams } from "react-router-dom";
import { type viewSessionQuery } from "../../__generated__/viewSessionQuery.graphql.js";
import { ConsistencyCard } from "../../components/session/ConsistencyCard.js";
import { LapsCard, type LapWithEvents } from "../../components/session/LapsCard.js";
import { PrimaryRecordingCard } from "../../components/session/PrimaryRecordingCard.js";
import { RecordingsCard } from "../../components/session/RecordingsCard.js";
import { SessionOverviewCard } from "../../components/session/SessionOverviewCard.js";
import { useBreadcrumbs, type BreadcrumbItem } from "../../hooks/useBreadcrumbs.js";

const pageGridStyles = css`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const columnStackStyles = css`
  display: grid;
  gap: 20px;
`;


const SessionQuery = graphql`
  query viewSessionQuery($id: ID!) {
    trackSession(id: $id) {
      id
      date
      format
      classification
      fastestLap
      conditions
      notes
      track {
        id
        name
      }
      trackLayout {
        id
        name
      }
      kart {
        id
        name
      }
      consistencyScore
      consistency {
        score
        label
        mean
        stdDev
        cvPct
        median
        windowPct
        cleanLapCount
        excludedLapCount
        totalValidLapCount
        usableLapNumbers
        excludedLaps {
          lapNumber
          reason
        }
      }
      createdAt
      updatedAt
      trackRecordings(first: 20) {
        id
        description
        mediaId
        status
        error
        sizeBytes
        overlayBurned
        isPrimary
        lapOneOffset
        durationMs
        fps
        createdAt
        combineProgress
        uploadProgress {
          uploadedBytes
          totalBytes
        }
        uploadTargets(first: 50) {
          id
          fileName
          sizeBytes
          uploadedBytes
          status
          ordinal
          uploadUrl
        }
      }
      laps(first: 50) {
        id
        lapNumber
        time
        lapEvents(first: 50) {
          id
          offset
          event
          value
        }
      }
    }
    tracks {
      id
      name
      karts {
        id
        name
      }
      trackLayouts {
        id
        name
      }
    }
  }
`;

export default function ViewSessionRoute() {
  const { sessionId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const recordingVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [jumpAnchorReady, setJumpAnchorReady] = useState(false);
  const { setBreadcrumbs } = useBreadcrumbs();

  const data = useLazyLoadQuery<viewSessionQuery>(
    SessionQuery,
    { id: sessionId ?? "" },
    {
      fetchPolicy: "store-and-network",
      UNSTABLE_renderPolicy: "full",
      fetchKey: refreshKey,
    }
  );

  const session = data.trackSession;
  const tracks = data.tracks ?? [];
  const trackRecordings = session?.trackRecordings ?? [];
  const laps = session?.laps ?? [];
  const sessionConsistency = session?.consistency ?? null;

  useEffect(() => {
    const crumbs: BreadcrumbItem[] = [{ label: "Sessions", to: "/session" }];
    if (session) {
      const trackName = session.track?.name ?? "Session";
      const formattedDate = session.date ? format(new Date(session.date), "MMM do") : null;
      const detailLabel = formattedDate ? `${trackName} • ${formattedDate}` : trackName;
      crumbs.push({ label: detailLabel });
    } else if (sessionId) {
      crumbs.push({ label: "Session not found" });
    }
    setBreadcrumbs(crumbs);
    return () => setBreadcrumbs([]);
  }, [session, sessionId, setBreadcrumbs]);

  useEffect(() => {
    const recordings = data.trackSession?.trackRecordings ?? [];
    const hasPending = recordings.some((rec) => rec.status !== "READY");
    if (!hasPending) return;
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), 3000);
    return () => window.clearInterval(timer);
  }, [data.trackSession?.trackRecordings, setRefreshKey]);

  const normalizedRecordings = useMemo(
    () =>
      trackRecordings.map((recording) => ({
        id: recording.id,
        description: recording.description ?? null,
        sizeBytes: recording.sizeBytes ?? null,
        isPrimary: recording.isPrimary ?? false,
        overlayBurned: recording.overlayBurned ?? false,
        lapOneOffset: recording.lapOneOffset ?? 0,
        durationMs: recording.durationMs ?? null,
        fps: recording.fps ?? null,
        createdAt: recording.createdAt,
        status: recording.status,
        error: recording.error ?? null,
        mediaId: recording.mediaId,
        combineProgress: recording.combineProgress ?? 0,
        uploadProgress: {
          uploadedBytes: recording.uploadProgress.uploadedBytes ?? 0,
          totalBytes: recording.uploadProgress.totalBytes ?? null,
        },
        uploadTargets: recording.uploadTargets.map((target) => ({
          id: target.id,
          fileName: target.fileName,
          sizeBytes: target.sizeBytes ?? null,
          uploadedBytes: target.uploadedBytes,
          status: target.status,
          ordinal: target.ordinal,
          uploadUrl: target.uploadUrl ?? null,
        })),
      })),
    [trackRecordings]
  );

  const lapsWithStart = useMemo<LapWithEvents[]>(() => {
    const sorted = [...laps].sort((a, b) => a.lapNumber - b.lapNumber);
    const fastestLapTime = sorted.reduce<number | null>((best, lap) => {
      const lapTime = Number.isFinite(lap.time) ? lap.time : null;
      if (lapTime == null || lapTime <= 0) {
        return best;
      }
      return best == null ? lapTime : Math.min(best, lapTime);
    }, null);

    let elapsed = 0;
    return sorted.map((lap) => {
      const start = elapsed;
      const lapTime = Number.isFinite(lap.time) ? lap.time : 0;
      elapsed += lapTime;
      const isFastest =
        fastestLapTime != null && lapTime > 0 && Math.abs(lapTime - fastestLapTime) < 1e-6;
      const deltaToFastest =
        !isFastest && fastestLapTime != null && lapTime > 0 ? lapTime - fastestLapTime : null;
      const lapEvents = [...(lap.lapEvents ?? [])]
        .sort((a, b) => a.offset - b.offset)
        .map((event) => ({
          id: event.id,
          offset: event.offset,
          event: event.event,
          value: event.value,
        }));
      return {
        id: lap.id,
        lapNumber: lap.lapNumber,
        time: lap.time,
        start,
        isFastest,
        deltaToFastest,
        lapEvents,
      };
    });
  }, [laps]);

  const primaryRecording = useMemo(
    () => normalizedRecordings.find((rec) => rec.isPrimary) ?? null,
    [normalizedRecordings]
  );

  const primaryRecordingForJump = useMemo(() => {
    if (!primaryRecording) return null;
    if (primaryRecording.status !== "READY") return null;
    if (primaryRecording.lapOneOffset <= 0) return null;
    return primaryRecording;
  }, [primaryRecording]);

  useEffect(() => {
    setJumpAnchorReady(false);
    if (!primaryRecordingForJump) return;
    const existing = recordingVideoRefs.current[primaryRecordingForJump.id];
    if (existing) {
      setJumpAnchorReady(true);
      return;
    }
    const timer = window.setInterval(() => {
      if (recordingVideoRefs.current[primaryRecordingForJump.id]) {
        setJumpAnchorReady(true);
        window.clearInterval(timer);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [primaryRecordingForJump]);

  function jumpToLapStart(lapStart: number) {
    if (!primaryRecordingForJump) return;
    const video = recordingVideoRefs.current[primaryRecordingForJump.id];
    if (!video) return;
    const target = Math.max(0, primaryRecordingForJump.lapOneOffset + lapStart);
    video.scrollIntoView({ behavior: "smooth", block: "center" });
    const seek = () => {
      video.pause();
      video.currentTime = target;
    };
    if (video.readyState >= 1) {
      seek();
    } else {
      video.addEventListener("loadedmetadata", seek, { once: true });
    }
  }

  const lapJumpAnchorLoaded = Boolean(
    primaryRecordingForJump && jumpAnchorReady
  );
  const lapJumpEnabled = lapJumpAnchorLoaded;
  const lapJumpMessages: string[] = [];
  if (!primaryRecording) {
    lapJumpMessages.push("Mark a primary recording to sync lap jumps.");
  } else if (primaryRecording.status !== "READY") {
    lapJumpMessages.push("Primary recording must finish processing to enable lap jumps.");
  } else if (primaryRecording.lapOneOffset <= 0) {
    lapJumpMessages.push("Set the Lap 1 start time on the primary recording to enable jumping.");
  }
  if (primaryRecordingForJump && !lapJumpAnchorLoaded) {
    lapJumpMessages.push("Load the video preview to enable lap jump controls.");
  }
  const lapJumpTitle =
    lapJumpEnabled || lapJumpMessages.length === 0
      ? "Jump the video to the start of this lap"
      : lapJumpMessages[0];

  if (!sessionId) {
    return <p>Missing session id.</p>;
  }

  if (!session) {
    return <p>Session not found.</p>;
  }

  return (
    <div css={pageGridStyles}>
      <div css={columnStackStyles}>
        <SessionOverviewCard
          session={session}
          laps={lapsWithStart}
          tracks={tracks}
        />

        <LapsCard
          sessionId={session.id}
          laps={lapsWithStart}
          onJumpToStart={jumpToLapStart}
          jumpEnabled={lapJumpEnabled}
          jumpTitle={lapJumpTitle}
          statusMessages={lapJumpMessages}
          onRefresh={() => setRefreshKey((key) => key + 1)}
        />
      </div>

      <div css={columnStackStyles}>
        <PrimaryRecordingCard
          recording={primaryRecording}
          laps={lapsWithStart}
          videoRefs={recordingVideoRefs}
          onRefresh={() => setRefreshKey((key) => key + 1)}
        />
        <RecordingsCard
          sessionId={session.id}
          laps={lapsWithStart}
          recordings={normalizedRecordings}
          onRefresh={() => setRefreshKey((key) => key + 1)}
        />
        <ConsistencyCard
          laps={lapsWithStart}
          consistency={sessionConsistency}
          sessionFastestLap={session.fastestLap}
        />
      </div>
    </div>
  );
}
