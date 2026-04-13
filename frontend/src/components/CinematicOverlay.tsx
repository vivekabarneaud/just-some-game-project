import { createSignal, onMount, onCleanup, For } from "solid-js";
import { PageFlip } from "page-flip";

export interface CinematicSlide {
  image: string;
  text: string;
  position?: "top" | "bottom" | "center";
}

interface CinematicOverlayProps {
  slides: CinematicSlide[];
  onComplete: () => void;
  villageName?: string;
}

const IS_DEV = import.meta.env.DEV;
const PARCHMENT = IS_DEV
  ? "/images/stories/parchment_texture.png"
  : "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/parchment_texture.png";

export default function CinematicOverlay(props: CinematicOverlayProps) {
  const [currentPage, setCurrentPage] = createSignal(0);
  const [exiting, setExiting] = createSignal(false);
  const [ready, setReady] = createSignal(false);
  let flipContainerRef: HTMLDivElement | undefined;
  let pageFlip: PageFlip | undefined;

  const isLast = () => currentPage() >= props.slides.length - 1;

  const resolveText = (text: string) => {
    return text.replace(/\{villageName\}/g, props.villageName ?? "the settlement");
  };

  const formatText = (text: string) => {
    return resolveText(text).replace(/\*\*(.*?)\*\*/g, '<strong style="font-style:normal;color:#6b4c1e">$1</strong>');
  };

  const advance = () => {
    if (exiting() || !ready()) return;
    if (isLast()) {
      setExiting(true);
      setTimeout(() => props.onComplete(), 800);
      return;
    }
    pageFlip?.flipNext();
  };

  onMount(() => {
    if (!flipContainerRef) return;

    const maxW = Math.min(window.innerWidth * 0.88, 880);
    const maxH = Math.min(window.innerHeight * 0.85, 660);
    // Book-page aspect ratio (~3:4)
    const pageW = Math.min(maxW, maxH * 0.75);
    const pageH = Math.min(maxH, pageW / 0.75);

    pageFlip = new PageFlip(flipContainerRef, {
      width: Math.floor(pageW),
      height: Math.floor(pageH),
      showCover: false,
      maxShadowOpacity: 0.4,
      mobileScrollSupport: false,
      flippingTime: 1400,
      useMouseEvents: false,
      swipeDistance: 50,
      startPage: 0,
      drawShadow: true,
      autoSize: false,
    } as any);

    const pages = flipContainerRef.querySelectorAll(".cinematic-page");
    pageFlip.loadFromHTML(pages as unknown as HTMLElement[]);

    pageFlip.on("flip", (e: any) => {
      setCurrentPage(e.data as number);
    });

    setReady(true);
  });

  onCleanup(() => {
    pageFlip?.destroy();
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        "z-index": 10000,
        background: "#0a0806",
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        gap: "clamp(12px, 2vh, 20px)",
        opacity: exiting() ? 0 : 1,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* PageFlip container — full journal pages */}
      <div ref={flipContainerRef}>
        <For each={props.slides}>
          {(slide, i) => (
            <div
              class="cinematic-page"
              style={{
                "background-image": `url(${PARCHMENT})`,
                "background-size": "cover",
                "background-position": "center",
                display: "flex",
                "flex-direction": "column",
                "align-items": "center",
                "justify-content": "center",
                padding: "5% 6%",
                gap: "3%",
                "box-sizing": "border-box",
                position: "relative",
              }}
            >
              {/* Framed painting */}
              <div
                style={{
                  width: "88%",
                  "aspect-ratio": "16 / 9",
                  "max-height": "58%",
                  "border-radius": "2px",
                  overflow: "hidden",
                  border: "3px solid rgba(80, 55, 25, 0.45)",
                  "box-shadow": "inset 0 0 12px rgba(0,0,0,0.35), 2px 2px 10px rgba(0,0,0,0.25)",
                  "background-image": `url(${slide.image})`,
                  "background-size": "cover",
                  "background-position": "center",
                  "flex-shrink": 0,
                }}
              />

              {/* Journal text on the parchment */}
              <div
                style={{
                  width: "85%",
                  "text-align": "center",
                  padding: "2% 3%",
                }}
              >
                <p
                  style={{
                    color: "#2a1e0e",
                    "font-size": "clamp(0.75rem, 1.3vw, 0.95rem)",
                    "line-height": "1.7",
                    "font-style": "italic",
                    margin: 0,
                    "white-space": "pre-line",
                    "font-family": "Georgia, 'Times New Roman', serif",
                  }}
                  innerHTML={formatText(slide.text)}
                />
              </div>

              {/* Page number */}
              <div
                style={{
                  position: "absolute",
                  bottom: "3%",
                  right: "5%",
                  color: "rgba(80, 55, 25, 0.35)",
                  "font-size": "0.7rem",
                  "font-style": "italic",
                  "font-family": "Georgia, serif",
                }}
              >
                {i() + 1}
              </div>

              {/* Spine shadow */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: "20px",
                  background: "linear-gradient(to right, rgba(0,0,0,0.1), transparent)",
                  "pointer-events": "none",
                }}
              />
            </div>
          )}
        </For>
      </div>

      {/* Controls below the journal */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          gap: "24px",
        }}
      >
        {/* Slide indicators */}
        <div style={{ display: "flex", gap: "8px" }}>
          <For each={props.slides}>
            {(_, i) => (
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  "border-radius": "50%",
                  background: i() === currentPage() ? "rgba(200, 170, 110, 0.8)" : "rgba(255,255,255,0.15)",
                  transition: "background 0.3s",
                }}
              />
            )}
          </For>
        </div>

        {/* Turn page button */}
        <button
          onClick={advance}
          style={{
            background: "rgba(80, 55, 25, 0.3)",
            border: "1px solid rgba(80, 55, 25, 0.5)",
            color: "rgba(200, 170, 110, 0.9)",
            padding: "10px 24px",
            "border-radius": "4px",
            cursor: "pointer",
            "font-size": "0.9rem",
            "font-family": "Georgia, serif",
            "font-style": "italic",
            transition: "all 0.2s",
            "letter-spacing": "0.5px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(80, 55, 25, 0.5)";
            e.currentTarget.style.color = "rgba(240, 210, 140, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(80, 55, 25, 0.3)";
            e.currentTarget.style.color = "rgba(200, 170, 110, 0.9)";
          }}
        >
          {isLast() ? "Begin your story →" : "Turn page →"}
        </button>
      </div>

      {/* Skip button */}
      <button
        onClick={(e) => { e.stopPropagation(); props.onComplete(); }}
        style={{
          position: "absolute",
          top: "16px",
          right: "20px",
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.25)",
          padding: "6px 12px",
          cursor: "pointer",
          "font-size": "0.75rem",
          "z-index": 10,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}
      >
        Skip
      </button>
    </div>
  );
}
