/**
 * Utilidades de descarga de archivos en el navegador.
 */

/** Extrae `filename="..."` de la cabecera Content-Disposition, o devuelve `fallback`. */
export function filenameFromContentDisposition(header: string | null | undefined, fallback: string): string {
  if (header) {
    const match = header.match(/filename="(.+)"/);
    if (match) {
      return match[1];
    }
  }
  return fallback;
}

/** Descarga un blob como archivo mediante un enlace temporal. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
