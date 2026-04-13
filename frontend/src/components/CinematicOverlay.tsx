import { createSignal, Show, For } from "solid-js";

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
  const [transitioning, setTransitioning] = createSignal(false);

  const slide = () => props.slides[currentSlide()];
  const isLast = () => currentSlide() >= props.slides.length - 1;

  const resolveText = (text: string) => {
    return text.replace(/\{villageName\}/g, props.villageName ?? "the settlement");
  };

  const advance = () => {
    if (transitioning()) return;
    if (isLast()) {
      setTransitioning(true);
      setTimeout(() => props.onComplete(), 600);
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((i) => i + 1);
      setTransitioning(false);
    }, 400);
  };

  return (
    <div
      onClick={advance}
      style={{
        position: "fixed",
        inset: 0,
        "z-index": 10000,
        cursor: "pointer",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          "background-image": `url(${slide().image})`,
          "background-size": "cover",
          "background-position": "center",
          opacity: transitioning() ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Dark gradient overlay for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: (slide().position ?? "bottom") === "top"
            ? "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)"
            : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 35%, transparent 55%)",
        }}
      />

      {/* Text content */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          ...(slide().position === "top"
            ? { top: "8%" }
            : slide().position === "center"
            ? { top: "50%", transform: "translateY(-50%)" }
            : { bottom: "8%" }),
          padding: "0 10%",
          opacity: transitioning() ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        <p
          style={{
            color: "#e8e0d4",
            "font-size": "clamp(0.95rem, 2vw, 1.2rem)",
            "line-height": "1.8",
            "font-style": "italic",
            "text-align": "center",
            "max-width": "700px",
            margin: "0 auto",
            "text-shadow": "0 2px 8px rgba(0,0,0,0.8)",
            "white-space": "pre-line",
          }}
          innerHTML={resolveText(slide().text).replace(/\*\*(.*?)\*\*/g, '<strong style="font-style:normal;color:#f5c542">$1</strong>')}
        />
      </div>

      {/* Slide indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
        }}
      >
        <For each={props.slides}>
          {(_, i) => (
            <div
              style={{
                width: "8px",
                height: "8px",
                "border-radius": "50%",
                background: i() === currentSlide() ? "#f5c542" : "rgba(255,255,255,0.3)",
                transition: "background 0.3s",
              }}
            />
          )}
        </For>
      </div>

      {/* Skip button */}
      <button
        onClick={(e) => { e.stopPropagation(); props.onComplete(); }}
        style={{
          position: "absolute",
          top: "20px",
          right: "24px",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.5)",
          padding: "6px 16px",
          "border-radius": "4px",
          cursor: "pointer",
          "font-size": "0.8rem",
          "z-index": 10,
          transition: "color 0.2s, border-color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.9)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
      >
        Skip
      </button>

      {/* Click hint */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "24px",
          color: "rgba(255,255,255,0.3)",
          "font-size": "0.7rem",
        }}
      >
        Click to continue
      </div>
    </div>
  );
}
