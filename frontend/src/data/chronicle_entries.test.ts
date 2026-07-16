import { describe, it, expect } from "vitest";
import { splitChronicleSlides, CHRONICLE_ENTRIES } from "./chronicle_entries";

describe("splitChronicleSlides", () => {
  it("returns a single slide when there is no page-break marker", () => {
    const slides = splitChronicleSlides("First paragraph.\n\nSecond paragraph.");
    expect(slides).toEqual([["First paragraph.", "Second paragraph."]]);
  });

  it("splits on a '---' paragraph into multiple slides", () => {
    const slides = splitChronicleSlides("A.\n\nB.\n\n---\n\nC.\n\n---\n\nD.\n\nE.");
    expect(slides).toEqual([["A.", "B."], ["C."], ["D.", "E."]]);
  });

  it("ignores empty slides from leading/trailing/double markers", () => {
    const slides = splitChronicleSlides("---\n\nA.\n\n---\n\n---\n\nB.\n\n---");
    expect(slides).toEqual([["A."], ["B."]]);
  });

  it("the authored marquee entries paginate (Hale's journal, Niamh)", () => {
    const hale = CHRONICLE_ENTRIES.find((e) => e.id === "ch1_garrison_ruins")!;
    const niamh = CHRONICLE_ENTRIES.find((e) => e.id === "ch1_warden")!;
    expect(splitChronicleSlides(hale.fullText).length).toBe(4);
    expect(splitChronicleSlides(niamh.fullText).length).toBe(4);
  });

  it("no entry has an empty slide or a stray '---' leaking into prose", () => {
    for (const e of CHRONICLE_ENTRIES) {
      const slides = splitChronicleSlides(e.fullText);
      expect(slides.length).toBeGreaterThan(0);
      for (const slide of slides) {
        expect(slide.length).toBeGreaterThan(0);
        for (const p of slide) expect(p.trim()).not.toBe("---");
      }
    }
  });
});
