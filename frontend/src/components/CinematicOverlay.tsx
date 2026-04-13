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
  const [textVisible, setTextVisible] = createSignal(true);
  const [exiting, setExiting] = createSignal(false);
  let flipContainerRef: HTMLDivElement | undefined;
  let pageFlip: PageFlip | undefined;

  const slide = () => props.slides[currentPage()];
  const isLast = () => currentPage() >= props.slides.length - 1;

  const resolveText = (text: string) => {
    return text.replace(/\{villageName\}/g, props.villageName ?? "the settlement");
  };

  const formatText = (text: string) => {
    return resolveText(text).replace(/\*\*(.*?)\*\*/g, '<strong style="font-style:normal;color:#6b4c1e">$1</strong>');
  };

  const advance = () => {
    if (exiting()) return;
    if (isLast()) {
      setExiting(true);
      setTimeout(() => props.onComplete(), 800);
      return;
    }
    // Fade out text, flip page, fade in new text
    setTextVisible(false);
    pageFlip?.flipNext();
  };

  onMount(() => {
    if (!flipContainerRef) return;

    // Size the flip area — landscape ratio for the framed images
    const maxW = Math.min(window.innerWidth * 0.75, 720);
    const maxH = Math.min(window.innerHeight * 0.5, 420);
    const w = Math.floor(Math.min(maxW, maxH * (16 / 9)));
    const h = Math.floor(w / (16 / 9));

    pageFlip = new PageFlip(flipContainerRef, {
      width: w,
      height: h,
      showCover: false,
      maxShadowOpacity: 0.35,
      mobileScrollSupport: false,
      flippingTime: 1400,
      useMouseEvents: false,
      swipeDistance: 50,
      startPage: 0,
      drawShadow: true,
      autoSize: false,
    });

    const pages = flipContainerRef.querySelectorAll(".flip-page");
    pageFlip.loadFromHTML(pages as unknown as HTMLElement[]);

    pageFlip.on("flip", (e: any) => {
      setCurrentPage(e.data as number);
      // Fade text back in after flip
      setTimeout(() => setTextVisible(true), 100);
    });

    // Initial text visible
    setTextVisible(true);
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
        gap: "clamp(16px, 3vh, 28px)",
        padding: "clamp(16px, 3vh, 32px)",
        opacity: exiting() ? 0 : 1,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* Parchment frame around the page-flip area */}
      <div
        style={{
          position: "relative",
          padding: "clamp(12px, 2vw, 24px)",
          "background-image": `url(${PARCHMENT})`,
          "background-size": "cover",
          "background-position": "center",
          "border-radius": "4px",
          "box-shadow": "0 8px 32px rgba(0,0,0,0.6), inset 0 0 40px rgba(100,75,40,0.15)",
        }}
      >
        {/* PageFlip container — images only */}
        <div
          ref={flipContainerRef}
          style={{
            "border-radius": "2px",
            overflow: "hidden",
            border: "3px solid rgba(80, 55, 25, 0.4)",
            "box-shadow": "inset 0 0 12px rgba(0,0,0,0.3)",
          }}
        >
          <For each={props.slides}>
            {(slideData) => (
              <div
                class="flip-page"
                style={{
                  "background-image": `url(${slideData.image})`,
                  "background-size": "cover",
                  "background-position": "center",
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
          </For>
        </div>
      </div>

      {/* Text area — stays as crisp HTML, fades between slides */}
      <div
        style={{
          width: "min(85vw, 700px)",
          "text-align": "center",
          "min-height": "80px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          opacity: textVisible() ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <p
          style={{
            color: "#c8b48a",
            "font-size": "clamp(0.9rem, 1.5vw, 1.1rem)",
            "line-height": "1.8",
            "font-style": "italic",
            margin: 0,
            "white-space": "pre-line",
            "font-family": "Georgia, 'Times New Roman', serif",
            "text-shadow": "0 2px 6px rgba(0,0,0,0.7)",
          }}
          innerHTML={formatText(slide().text)}
        />
      </div>

      {/* Page indicator + controls row */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          gap: "24px",
          width: "100%",
          "max-width": "700px",
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
