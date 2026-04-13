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
    return resolveText(text).replace(/\*\*(.*?)\*\*/g, '<strong style="font-style:normal;color:#8b6914">$1</strong>');
  };

  const advance = () => {
    if (animating() || exiting()) return;
    if (isLast()) {
      setExiting(true);
      setTimeout(() => props.onComplete(), 800);
      return;
    }
    setAnimating(true);
    // Flip the current page
    setFlippedPages((prev) => {
      const next = new Set(prev);
      next.add(currentSlide());
      return next;
    });
    // After the turn animation, update the current slide
    setTimeout(() => {
      setCurrentSlide((i) => i + 1);
      setAnimating(false);
    }, 900);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        "z-index": 10000,
        background: "rgba(15, 12, 8, 0.95)",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        opacity: exiting() ? 0 : 1,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* The Journal */}
      <div
        style={{
          position: "relative",
          width: "min(90vw, 900px)",
          height: "min(80vh, 650px)",
          perspective: "1500px",
        }}
      >
        {/* Pages — stacked, each can flip */}
        <For each={props.slides}>
          {(slide, i) => {
            const isFlipped = () => flippedPages().has(i());
            const zIndex = () => props.slides.length - i(); // first page on top

            return (
              <div
                onClick={advance}
                style={{
                  position: "absolute",
                  inset: 0,
                  "transform-origin": "left center",
                  transform: isFlipped() ? "rotateY(-180deg)" : "rotateY(0deg)",
                  transition: "transform 0.9s ease",
                  "z-index": isFlipped() ? 0 : zIndex(),
                  "backface-visibility": "hidden",
                  cursor: "pointer",
                  "border-radius": "4px",
                  overflow: "hidden",
                }}
              >
                {/* Parchment page */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    "background-image": `url(${PARCHMENT})`,
                    "background-size": "cover",
                    "box-shadow": "4px 4px 20px rgba(0,0,0,0.5), inset 0 0 60px rgba(139,109,20,0.1)",
                    display: "flex",
                    "flex-direction": "column",
                    "align-items": "center",
                    padding: "clamp(20px, 4vh, 40px) clamp(24px, 5vw, 50px)",
                    gap: "clamp(12px, 2vh, 24px)",
                  }}
                >
                  {/* Framed image */}
                  <div
                    style={{
                      flex: "1",
                      width: "100%",
                      "max-height": "65%",
                      "border-radius": "3px",
                      overflow: "hidden",
                      border: "3px solid rgba(100, 75, 40, 0.4)",
                      "box-shadow": "inset 0 0 10px rgba(0,0,0,0.3), 2px 2px 8px rgba(0,0,0,0.2)",
                      "background-image": `url(${slide.image})`,
                      "background-size": "cover",
                      "background-position": "center",
                    }}
                  />

                  {/* Text below the image */}
                  <div
                    style={{
                      width: "100%",
                      "max-width": "680px",
                      "text-align": "center",
                    }}
                  >
                    <p
                      style={{
                        color: "#3d2e1c",
                        "font-size": "clamp(0.85rem, 1.5vw, 1.05rem)",
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
                      bottom: "12px",
                      right: "20px",
                      color: "rgba(100, 75, 40, 0.4)",
                      "font-size": "0.75rem",
                      "font-style": "italic",
                      "font-family": "Georgia, serif",
                    }}
                  >
                    {i() + 1}
                  </div>
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
          bottom: "clamp(20px, 5vh, 50px)",
          right: "clamp(24px, 5vw, 80px)",
          background: "rgba(139, 109, 20, 0.15)",
          border: "1px solid rgba(139, 109, 20, 0.4)",
          color: "rgba(220, 190, 130, 0.8)",
          padding: "8px 20px",
          "border-radius": "4px",
          cursor: "pointer",
          "font-size": "0.85rem",
          "font-family": "Georgia, serif",
          "font-style": "italic",
          "z-index": 10,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(139, 109, 20, 0.3)";
          e.currentTarget.style.color = "rgba(245, 220, 160, 1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(139, 109, 20, 0.15)";
          e.currentTarget.style.color = "rgba(220, 190, 130, 0.8)";
        }}
      >
        {isLast() ? "Begin your story →" : "Turn page →"}
      </button>

      {/* Skip button */}
      <button
        onClick={(e) => { e.stopPropagation(); props.onComplete(); }}
        style={{
          position: "absolute",
          top: "20px",
          right: "24px",
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.3)",
          padding: "6px 12px",
          cursor: "pointer",
          "font-size": "0.75rem",
          "z-index": 10,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
      >
        Skip
      </button>

      {/* Slide indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(20px, 5vh, 50px)",
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
                background: i() === currentSlide() ? "rgba(139, 109, 20, 0.8)" : "rgba(255,255,255,0.2)",
                transition: "background 0.3s",
              }}
            />
          )}
        </For>
      </div>
    </div>
  );
}
