/**
 * Mensaje de error que envía el backend en el cuerpo de una respuesta fallida
 * (`{ success: false, error: '...', message?: '...' }`). Devuelve `undefined` si el cuerpo no trae
 * ninguno, para conservar el mensaje genérico de axios ("Request failed with status code N").
 */
export function serverErrorMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const { error, message } = data as { error?: unknown; message?: unknown };
  const err = typeof error === 'string' && error.trim() !== '' ? error : undefined;
  const msg = typeof message === 'string' && message.trim() !== '' ? message : undefined;
  if (err && msg) return `${err}: ${msg}`;
  return err ?? msg;
}

/**
 * Igual que `serverErrorMessage`, pero también entiende cuerpos recibidos como Blob (las
 * exportaciones piden `responseType: 'blob'`, así que un error JSON llega como Blob).
 */
export async function serverErrorMessageFrom(data: unknown): Promise<string | undefined> {
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      return serverErrorMessage(JSON.parse(await readBlobText(data)));
    } catch {
      return undefined;
    }
  }
  return serverErrorMessage(data);
}

/** `Blob.text()` no existe en todos los entornos (jsdom); FileReader sí. */
function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}
