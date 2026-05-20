import { useState, useEffect, useCallback, useRef } from 'react'
import * as UTIF from 'utif2'
import { getProxiedUrl, isTiffUrl } from '@/lib/utils'

export function useTiffImage(imageUrl: string) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const loadTiffImage = useCallback(
    async (url: string) => {
      setIsConverting(true)
      setError(null)

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()

        revokeObjectUrl()

        if (isTiffBuffer(buffer)) {
          const dataUrl = decodeTiffToDataUrl(buffer)
          setDisplayUrl(dataUrl)
        } else {
          // PNG/JPEG uploaded with a .tif/.tiff URL — display fetched bytes directly
          const mimeType = detectImageMimeType(buffer)
          const blob = new Blob([buffer], { type: mimeType })
          const objectUrl = URL.createObjectURL(blob)
          objectUrlRef.current = objectUrl
          setDisplayUrl(objectUrl)
        }
      } catch (err) {
        const message = 'Failed to load image'
        setError(message)
        console.error('Image loading error:', err)
      } finally {
        setIsConverting(false)
      }
    },
    [revokeObjectUrl],
  )

  useEffect(() => {
    if (!imageUrl) {
      revokeObjectUrl()
      setDisplayUrl(null)
      setError(null)
      setIsConverting(false)
      return
    }

    const proxiedUrl = getProxiedUrl(imageUrl)
    if (isTiffUrl(imageUrl)) {
      loadTiffImage(proxiedUrl)
    } else {
      revokeObjectUrl()
      setDisplayUrl(proxiedUrl)
      setIsConverting(false)
      setError(null)
    }

    return () => {
      revokeObjectUrl()
    }
  }, [imageUrl, loadTiffImage, revokeObjectUrl])

  return { displayUrl, isConverting, error }
}

/**
 * Decodes a TIFF image buffer and returns a PNG data URL
 */
function decodeTiffToDataUrl(buffer: ArrayBuffer): string {
  const ifds = UTIF.decode(buffer)
  if (ifds.length === 0) {
    throw new Error('No pages found in TIFF file')
  }

  UTIF.decodeImage(buffer, ifds[0])
  const firstPage = ifds[0]
  const rgba = UTIF.toRGBA8(firstPage)

  const canvas = document.createElement('canvas')
  canvas.width = firstPage.width
  canvas.height = firstPage.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  const imageData = ctx.createImageData(firstPage.width, firstPage.height)
  imageData.data.set(rgba)
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/png')
}

function detectImageMimeType(buffer: ArrayBuffer): string {
  if (buffer.byteLength < 4) return 'application/octet-stream'

  const bytes = new Uint8Array(buffer, 0, 4)

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg'
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif'
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp'
  }

  return 'application/octet-stream'
}

/**
 * Detects if a buffer contains a TIFF image by checking magic bytes
 */
function isTiffBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false

  const bytes = new Uint8Array(buffer, 0, 4)

  const isLittleEndian =
    bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00

  const isBigEndian =
    bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a

  return isLittleEndian || isBigEndian
}
