import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const dataDirectory = join(import.meta.dirname, '..', '..', "data"); // Directory where configuration and other data files are stored
const configPath = join(dataDirectory, "config.json");

let CONFIG_CACHE;

/**
  Configuration management for the server.
  Provides functions to load, save, and manipulate the visual and authentication configuration.
*/
export const defaultVisualConfig = {
  theme: "dark",
  customer_logo: { src: "", x: 50, y: 18, size: 24, fit: "contain" },
  background_media: { type: "image", src: "" },
  chevrons: {
    "chevron-leitor-facial": { x: 10, y: 45, size: 42, direction: "right", enabled: true },
    "chevron-leitor-ticket": { x: 88, y: 45, size: 42, direction: "left", enabled: true },
    "chevron-pinpad": { x: 76, y: 72, size: 42, direction: "up", enabled: true },
    "chevron-impressora": { x: 24, y: 72, size: 42, direction: "up", enabled: true },
  },
};

/**
  Hashes a password using scrypt with a random salt.
  Returns the salt and hash in the format "salt:hash".
*/
export async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString("hex")}`;
}

/**
  Verifies a password against a stored password hash.
  Returns true if the password matches, false otherwise.
*/
export async function verifyPassword(password, password_hash) {
  const [salt, expectedHex] = password_hash.split(":");
  if (!salt || !expectedHex) return false;
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
  Loads the configuration from the file system.
  If the configuration file does not exist, creates a default configuration.
  Returns the loaded or default configuration.
*/
export async function loadConfig() {
  try {
    if (CONFIG_CACHE) return CONFIG_CACHE;
    CONFIG_CACHE = JSON.parse(await readFile(configPath, "utf8"));
    return CONFIG_CACHE;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const config = {
      ...defaultVisualConfig,
      auth: { password_hash: await hashPassword("1234") },
      services: {  }, 
    };
    await saveConfig(config);
    return config;
  }
}


/**
  Saves the configuration to the file system.
  Creates the necessary directories if they do not exist.
  Writes the configuration to a temporary file and then renames it to ensure atomicity.
*/
export async function saveConfig(config) {
  await mkdir(dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  await rename(temporaryPath, configPath);
  CONFIG_CACHE = config;
}

/**
  Returns a public version of the configuration, excluding sensitive information such as authentication details.
*/
export function publicConfig(config) {
  const { auth, services, ...visualConfig } = config;
  return visualConfig;
}

/**
  Merges the current visual configuration with an update.
  Returns the resulting merged configuration.
*/
export function mergeVisualConfig(current, update) {
  const { theme, customer_logo, background_media, chevrons } = update;
  return {
    ...current,
    theme: theme === "dark" ? "dark" : "light",
    customer_logo: { ...current.customer_logo, ...customer_logo },
    background_media: { ...current.background_media, ...background_media },
    chevrons: { ...current.chevrons, ...chevrons },
  };
}
