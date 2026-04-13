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

export default function CinematicOverlay(props: CinematicOverlayProps) {
  const [currentPage, setCurrentPage] = createSignal(0);
  const [exiting, setExiting] = createSignal(false);
  const [ready, setReady] = createSignal(false);
  const [textVisible, setTextVisible] = createSignal(true);
  const [pageSize, setPageSize] = createSignal({ w: 600, h: 800 });
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
    if (exiting() || !ready()) return;
    if (isLast()) {
      setExiting(true);
      setTimeout(() => props.onComplete(), 800);
      return;
    }
    setTextVisible(false);
    pageFlip?.flipNext();
  };

  onMount(() => {
    if (!flipContainerRef) return;

    const maxW = Math.min(window.innerWidth * 0.85, 680);
    const maxH = Math.min(window.innerHeight * 0.72, 680);
    // Square-ish page for the journal (the composited images are ~1:1)
    const size = Math.floor(Math.min(maxW, maxH));
    setPageSize({ w: size, h: size });

    flipContainerRef.style.width = `${size}px`;
    flipContainerRef.style.height = `${size}px`;

    const pages = flipContainerRef.querySelectorAll(".cinematic-page") as NodeListOf<HTMLElement>;
    pages.forEach((p) => {
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
    });

    pageFlip = new PageFlip(flipContainerRef, {
      width: size,
      height: size,
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

    pageFlip.loadFromHTML(Array.from(pages));

    pageFlip.on("flip", (e: any) => {
      setCurrentPage(e.data as number);
      setTimeout(() => setTextVisible(true), 200);
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
      {/* PageFlip container — composited journal images */}
      <div
        ref={flipContainerRef}
        style={{
          position: "relative",
          width: `${pageSize().w}px`,
          height: `${pageSize().h}px`,
        }}
      >
        <For each={props.slides}>
          {(slideData) => (
            <div
              class="cinematic-page"
              style={{
                width: `${pageSize().w}px`,
                height: `${pageSize().h}px`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={slideData.image}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  "object-fit": "cover",
                }}
              />
            </div>
          )}
        </For>
      </div>

      {/* Text below — crisp HTML, fades between slides */}
      <div
        style={{
          width: "min(85vw, 640px)",
          "text-align": "center",
          "min-height": "70px",
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
            "font-size": "clamp(0.85rem, 1.4vw, 1.05rem)",
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

      {/* Controls */}
      <div style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        gap: "24px",
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <For each={props.slides}>
            {(_, i) => (
              <div style={{
                width: "8px",
                height: "8px",
                "border-radius": "50%",
                background: i() === currentPage() ? "rgba(200, 170, 110, 0.8)" : "rgba(255,255,255,0.15)",
                transition: "background 0.3s",
              }} />
            )}
          </For>
        </div>
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

      {/* Skip */}
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
