import fs from "node:fs";
import path from "node:path";

const dataDirectory = process.env.SERVER_DATA_DIRECTORY
  ? path.resolve(process.env.SERVER_DATA_DIRECTORY)
  : path.resolve(__dirname, "../../data");

export function readJsonFile<T>(fileName: string): T | null {
  const filePath = path.join(dataDirectory, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(fileName: string, value: unknown): void {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const filePath = path.join(dataDirectory, fileName);
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2));
  fs.renameSync(temporaryPath, filePath);
}
