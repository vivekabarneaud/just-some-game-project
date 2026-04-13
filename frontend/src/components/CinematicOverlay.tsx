import { createSignal, For } from "solid-js";

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
  const [currentSlide, setCurrentSlide] = createSignal(0);
  const [flippedPages, setFlippedPages] = createSignal<Set<number>>(new Set());
  const [turningPage, setTurningPage] = createSignal<number | null>(null);
  const [exiting, setExiting] = createSignal(false);
  const [animating, setAnimating] = createSignal(false);

  const slide = () => props.slides[currentSlide()];
  const isLast = () => currentSlide() >= props.slides.length - 1;

  const resolveText = (text: string) => {
    return text.replace(/\{villageName\}/g, props.villageName ?? "the settlement");
  };

  const formatText = (text: string) => {
    return resolveText(text).replace(/\*\*(.*?)\*\*/g, '<strong style="font-style:normal;color:#6b4c1e">$1</strong>');
  };

  const advance = () => {
    if (animating() || exiting()) return;
    if (isLast()) {
      setExiting(true);
      setTimeout(() => props.onComplete(), 800);
      return;
    }
    const pageToFlip = currentSlide();
    setAnimating(true);
    setTurningPage(pageToFlip);
    setFlippedPages((prev) => {
      const next = new Set(prev);
      next.add(pageToFlip);
      return next;
    });
    setTimeout(() => {
      setTurningPage(null);
      setCurrentSlide((i) => i + 1);
      setAnimating(false);
    }, 1200);
  };

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
      {/* Journal page area */}
      <div
        style={{
          position: "relative",
          width: "min(88vw, 680px)",
          height: "min(80vh, 680px)",
          perspective: "2000px",
        }}
      >
        <For each={props.slides}>
          {(slideData, i) => {
            const isFlipped = () => flippedPages().has(i());
            const isTurning = () => turningPage() === i();
            const zIndex = () => {
              if (isTurning()) return props.slides.length + 10;
              if (isFlipped()) return 0;
              return props.slides.length - i() + 1;
            };

            return (
              <div
                onClick={advance}
                style={{
                  position: "absolute",
                  inset: 0,
                  "transform-origin": "left center",
                  transform: isFlipped() ? "rotateY(-180deg)" : "rotateY(0deg)",
                  transition: "transform 1.2s cubic-bezier(0.4, 0.0, 0.2, 1)",
                  "z-index": zIndex(),
                  "backface-visibility": "hidden",
                  cursor: "pointer",
                  "border-radius": "3px",
                  overflow: "hidden",
                  "box-shadow": "4px 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {/* Full composited journal page as background */}
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

                {/* Text overlay — positioned in the parchment area below the painting */}
                <div
                  style={{
                    position: "absolute",
                    left: "8%",
                    right: "8%",
                    bottom: "5%",
                    "text-align": "center",
                    padding: "12px",
                  }}
                >
                  <p
                    style={{
                      color: "#2a1e0e",
                      "font-size": "clamp(0.72rem, 1.15vw, 0.88rem)",
                      "line-height": "1.7",
                      "font-style": "italic",
                      margin: 0,
                      "white-space": "pre-line",
                      "font-family": "Georgia, 'Times New Roman', serif",
                    }}
                    innerHTML={formatText(slideData.text)}
                  />
                </div>

                {/* Page number */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "2%",
                    right: "5%",
                    color: "rgba(80, 55, 25, 0.35)",
                    "font-size": "0.7rem",
                    "font-style": "italic",
                    "font-family": "Georgia, serif",
                  }}
                >
                  {i() + 1}
                </div>
              </div>
            );
          }}
        </For>
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
                background: i() === currentSlide() ? "rgba(200, 170, 110, 0.8)" : "rgba(255,255,255,0.15)",
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
