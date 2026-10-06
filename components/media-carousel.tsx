"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/format";
import { Photo } from "./photo";

export function MediaCarousel({
  images,
  alt,
  href,
  radius = "rounded-[20px]",
  ratio = "aspect-square",
  sizes = "(max-width: 768px) 100vw, 25vw",
  priority = false,
  counter = false,
  index: indexProp,
  onIndexChange,
  onOpen,
}: {
  images: string[];
  alt: string;
  href?: string;
  radius?: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  counter?: boolean;
  index?: number;
  onIndexChange?: (index: number) => void;
  onOpen?: (index: number) => void;
}) {
  const router = useRouter();
  const photos = images.filter(Boolean);
  const count = Math.max(photos.length, 1);
  const [inner, setInner] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hot, setHot] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"x" | "y" | null>(null);
  const tracking = useRef(false);
  const moved = useRef(0);
  const index = Math.min(indexProp ?? inner, count - 1);

  function commit(next: number) {
    const value = Math.max(0, Math.min(count - 1, next));
    if (indexProp === undefined) setInner(value);
    onIndexChange?.(value);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (photos.length < 2 && !href && !onOpen) return;
    tracking.current = true;
    startX.current = event.clientX;
    startY.current = event.clientY;
    axis.current = null;
    moved.current = 0;
    if (photos.length > 1) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!tracking.current || photos.length < 2) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;
    moved.current = Math.max(moved.current, Math.abs(dx), Math.abs(dy));
    if (!axis.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (axis.current !== "x") return;
    setDragging(true);
    const resist = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
    setDragX(resist ? dx * 0.32 : dx);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (axis.current === "x") {
      const width = event.currentTarget.clientWidth || 1;
      if (dragX < -width * 0.16) commit(index + 1);
      else if (dragX > width * 0.16) commit(index - 1);
    }
    tracking.current = false;
    setDragging(false);
    setDragX(0);
    axis.current = null;
  }

  function onClick() {
    if (moved.current > 8) {
      moved.current = 0;
      return;
    }
    if (onOpen) {
      onOpen(index);
      return;
    }
    if (href) router.push(href);
  }

  const dots = photos.slice(0, 5);

  return (
    <div
      className={cx("group/media relative select-none overflow-hidden bg-[#e8e8e8]", radius, ratio)}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
    >
      <div
        className="media-viewport absolute inset-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragStart={(event) => event.preventDefault()}
        onClick={onClick}
        role={href || onOpen ? "link" : undefined}
        aria-label={href || onOpen ? alt : undefined}
      >
        <div
          className="flex h-full will-change-transform"
          style={{
            transform: `translate3d(calc(${-index * 100}% + ${dragX}px), 0, 0)`,
            transition: dragging ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {(photos.length ? photos : [""]).map((src, photoIndex) => (
            <div key={`${src}-${photoIndex}`} className="relative h-full min-w-full">
              {src ? (
                <Photo
                  src={src}
                  alt={photoIndex === index ? alt : ""}
                  priority={priority && photoIndex === 0}
                  sizes={sizes}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

      {photos.length > 1 && index > 0 && (
        <button
          type="button"
          aria-label="Photo précédente"
          className={cx(
            "media-arrow absolute left-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.18)]",
            hot && "is-on",
          )}
          onClick={(event) => {
            event.stopPropagation();
            commit(index - 1);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {photos.length > 1 && index < count - 1 && (
        <button
          type="button"
          aria-label="Photo suivante"
          className={cx(
            "media-arrow absolute right-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.18)]",
            hot && "is-on",
          )}
          onClick={(event) => {
            event.stopPropagation();
            commit(index + 1);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {dots.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex items-center justify-center gap-[5px]">
          {dots.map((src, dot) => (
            <span
              key={`${src}-${dot}`}
              className={cx(
                "rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)] transition-all duration-300",
                dot === index ? "h-[7px] w-[7px]" : "h-1.5 w-1.5 opacity-70",
              )}
            />
          ))}
        </div>
      )}

      {counter && photos.length > 0 && (
        <span className="absolute bottom-3 right-3 z-10 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {index + 1} / {photos.length}
        </span>
      )}
    </div>
  );
}
