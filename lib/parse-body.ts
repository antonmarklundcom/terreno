/**
 * Parse a JSON payload from the raw text body. navigator.sendBeacon() sends the
 * body as text/plain (or a Blob), so we cannot rely on req.json(). Reading the
 * raw text and parsing it ourselves works for both fetch() and sendBeacon().
 */
export async function parseJsonBody(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
