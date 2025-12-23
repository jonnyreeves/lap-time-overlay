export function getOverlayMediaId(mediaId: string): string {
  const lastSlash = mediaId.lastIndexOf("/");
  const dir = lastSlash >= 0 ? mediaId.slice(0, lastSlash) : "";
  const fileName = lastSlash >= 0 ? mediaId.slice(lastSlash + 1) : mediaId;
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex) : "";
  const overlayFile = `${baseName}-overlay${extension || ".mp4"}`;
  return dir ? `${dir}/${overlayFile}` : overlayFile;
}
