/**
 * Image URL helpers for workspace TIFF loading (aligned with Image Transcription).
 */

export function isTiffUrl(url: string): boolean {
  if (!url) return false

  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return pathname.endsWith('.tiff') || pathname.endsWith('.tif')
  } catch {
    const path = url.split(/[?#]/)[0]?.toLowerCase() ?? ''
    return path.endsWith('.tiff') || path.endsWith('.tif')
  }
}

/**
 * Converts S3 URLs to Vite dev proxies so fetch() can read TIFF bytes without CORS errors.
 */
export function getProxiedUrl(url: string): string {
  if (!import.meta.env.DEV || !url) return url

  // Path-style us-east-1 (matches Image Transcription)
  if (url.includes('s3.us-east-1.amazonaws.com')) {
    return url.replace('https://s3.us-east-1.amazonaws.com', '/s3-proxy')
  }

  // BDRC / global path-style: https://s3.amazonaws.com/<bucket>/<key>
  if (url.includes('s3.amazonaws.com')) {
    return url.replace('https://s3.amazonaws.com', '/archive-proxy')
  }

  try {
    const urlObj = new URL(url)
    const { hostname, pathname, search } = urlObj

    // Virtual-hosted: https://<bucket>.s3.<region>.amazonaws.com/<key>
    const vhost = hostname.match(/^(.+?)\.s3[.-][a-z0-9-]+\.amazonaws\.com$/i)
    if (vhost?.[1]) {
      return `/s3-proxy/${vhost[1]}${pathname}${search}`
    }
  } catch {
    // ignore
  }

  return url
}

export function isTiffBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false

  const bytes = new Uint8Array(buffer, 0, 4)

  const isLittleEndian =
    bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00

  const isBigEndian =
    bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a

  return isLittleEndian || isBigEndian
}

export function bufferToObjectUrl(buffer: ArrayBuffer, contentType: string | null): string {
  const type = contentType?.split(';')[0]?.trim() || sniffImageMime(buffer) || 'image/png'
  return URL.createObjectURL(new Blob([buffer], { type }))
}

function sniffImageMime(buffer: ArrayBuffer): string | null {
  if (buffer.byteLength < 4) return null

  const b = new Uint8Array(buffer, 0, 12)

  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return 'image/webp'

  return null
}
