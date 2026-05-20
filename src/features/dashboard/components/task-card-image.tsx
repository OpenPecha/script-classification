import { Image as ImageIcon } from 'lucide-react'
import { useTiffImage } from '@/features/workspace/hooks'

interface TaskCardImageProps {
  imageUrl: string
  alt: string
}

export function TaskCardImage({ imageUrl, alt }: TaskCardImageProps) {
  const { displayUrl, isConverting, error } = useTiffImage(imageUrl)

  if (isConverting) {
    return (
      <div className="flex h-full items-center justify-center bg-muted animate-pulse">
        <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
      </div>
    )
  }

  if (error || !displayUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
      </div>
    )
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className="h-full w-full object-contain bg-black/5"
      loading="lazy"
    />
  )
}
