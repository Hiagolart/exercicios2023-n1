import { readFile } from "node:fs/promises";

const MAX_BYTES = 200 * 1024 * 1024;
const HTTP_TIMEOUT_MS = 120_000;

export function fileReader(path: string) {
  return () => readFile(path, "utf8");
}

export function httpReader(url: string) {
  return async () => {
    const response = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}.`);
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) throw new Error(`Arquivo maior que o limite (${MAX_BYTES} bytes).`);
    return response.text();
  };
}
