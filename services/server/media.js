import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const mediaDirectory = join(import.meta.dirname, "data", "media");
const allowed = {
  background_media: new Set(["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm"]),
  branding: new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
};
const extensionByType = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export async function saveMedia(body, folder, contentType, originalName = "") {
  if (!allowed[folder]?.has(contentType)) throw new Error("Tipo de arquivo não permitido");
  const extension = extname(originalName).toLowerCase() || extensionByType[contentType];
  const fileName = `${randomUUID()}${extension}`;
  const directory = join(mediaDirectory, folder);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, fileName), body);
  return {
    src: `/media/${folder}/${fileName}`,
    type: contentType.startsWith("video/") ? "video" : "image",
  };
}

export function mediaPath(folder, fileName) {
  if (!/^[a-f0-9-]+\.(png|jpe?g|webp|svg|mp4|webm)$/i.test(fileName)) return null;
  return join(mediaDirectory, folder, fileName);
}
