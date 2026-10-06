import Image from "next/image";

export function Photo({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return <img src={src} alt={alt} draggable={false} className="pointer-events-none h-full w-full object-cover" />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      quality={85}
      sizes={sizes}
      draggable={false}
      className="pointer-events-none object-cover"
    />
  );
}
