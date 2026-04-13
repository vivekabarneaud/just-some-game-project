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

const IS_DEV = import.meta.env.DEV;
const PARCHMENT = IS_DEV
  ? "/images/stories/parchment_texture.png"
  : "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/parchment_texture.png";

export default function CinematicOverlay(props: CinematicOverlayProps) {
  const [currentSlide, setCurrentSlide] = createSignal(0);
  const [flippedPages, setFlippedPages] = createSignal<Set<number>>(new Set());
  const [exiting, setExiting] = createSignal(false);
  const [animating, setAnimating] = createSignal(false);

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
    setAnimating(true);
    setFlippedPages((prev) => {
      const next = new Set(prev);
      next.add(currentSlide());
      return next;
    });
    setTimeout(() => {
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
        "align-items": "center",
        "justify-content": "center",
        opacity: exiting() ? 0 : 1,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* Centered journal */}
      <div
        style={{
          position: "relative",
          width: "min(92vw, 920px)",
          height: "min(85vh, 680px)",
          perspective: "2000px",
        }}
      >
        {/* Pages — stacked, each can flip */}
        <For each={props.slides}>
          {(slide, i) => {
            const isFlipped = () => flippedPages().has(i());
            // Unflipped pages: higher index = lower z (first page on top)
            // Flipped pages: go behind everything
            const zIndex = () => isFlipped() ? 0 : (props.slides.length - i() + 1);

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
                }}
              >
                {/* Full-screen parchment page */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    "background-image": `url(${PARCHMENT})`,
                    "background-size": "cover",
                    "background-position": "center",
                    display: "flex",
                    "flex-direction": "column",
                    "align-items": "center",
                    "justify-content": "center",
                    padding: "clamp(30px, 6vh, 60px) clamp(40px, 8vw, 120px)",
                    gap: "clamp(16px, 3vh, 32px)",
                  }}
                >
                  {/* Framed painting */}
                  <div
                    style={{
                      width: "100%",
                      "max-width": "800px",
                      "aspect-ratio": "16 / 9",
                      "max-height": "55vh",
                      "border-radius": "2px",
                      overflow: "hidden",
                      border: "4px solid rgba(80, 55, 25, 0.5)",
                      "box-shadow": "inset 0 0 15px rgba(0,0,0,0.4), 3px 3px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(80, 55, 25, 0.3)",
                      "background-image": `url(${slide.image})`,
                      "background-size": "cover",
                      "background-position": "center",
                      "flex-shrink": 0,
                    }}
                  />

                  {/* Text below — journal entry */}
                  <div
                    style={{
                      width: "100%",
                      "max-width": "700px",
                      "text-align": "center",
                      background: "rgba(60, 45, 25, 0.08)",
                      padding: "clamp(12px, 2vh, 20px) clamp(16px, 3vw, 32px)",
                      "border-radius": "4px",
                    }}
                  >
                    <p
                      style={{
                        color: "#2a1e0e",
                        "font-size": "clamp(0.9rem, 1.6vw, 1.1rem)",
                        "line-height": "1.8",
                        "font-style": "italic",
                        margin: 0,
                        "white-space": "pre-line",
                        "font-family": "Georgia, 'Times New Roman', serif",
                        "text-shadow": "0 1px 2px rgba(255,240,200,0.3)",
                      }}
                      innerHTML={formatText(slide.text)}
                    />
                  </div>

                  {/* Page number */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "clamp(16px, 3vh, 30px)",
                      right: "clamp(24px, 4vw, 50px)",
                      color: "rgba(80, 55, 25, 0.4)",
                      "font-size": "0.8rem",
                      "font-style": "italic",
                      "font-family": "Georgia, serif",
                    }}
                  >
                    {i() + 1}
                  </div>

                  {/* Fold shadow on the left edge (spine of the book) */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: "30px",
                      background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)",
                      "pointer-events": "none",
                    }}
                  />
                </div>
              </div>
            );
          }}
        </For>
      </div>

      {/* Turn page button */}
      <button
        onClick={advance}
        style={{
          position: "absolute",
          bottom: "clamp(24px, 5vh, 50px)",
          right: "clamp(30px, 5vw, 80px)",
          background: "rgba(80, 55, 25, 0.25)",
          border: "1px solid rgba(80, 55, 25, 0.5)",
          color: "rgba(200, 170, 110, 0.9)",
          padding: "10px 24px",
          "border-radius": "4px",
          cursor: "pointer",
          "font-size": "0.9rem",
          "font-family": "Georgia, serif",
          "font-style": "italic",
          "z-index": 10,
          transition: "all 0.2s",
          "letter-spacing": "0.5px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(80, 55, 25, 0.45)";
          e.currentTarget.style.color = "rgba(240, 210, 140, 1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(80, 55, 25, 0.25)";
          e.currentTarget.style.color = "rgba(200, 170, 110, 0.9)";
        }}
      >
        {isLast() ? "Begin your story →" : "Turn page →"}
      </button>

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

      {/* Slide indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(24px, 5vh, 50px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          "z-index": 5,
        }}
      >
        <For each={props.slides}>
          {(_, i) => (
            <div
              style={{
                width: "8px",
                height: "8px",
                "border-radius": "50%",
                background: i() === currentSlide() ? "rgba(200, 170, 110, 0.8)" : "rgba(255,255,255,0.15)",
                transition: "background 0.3s",
              }}
            />
          )}
        </For>
      </div>
    </div>
  );
}
