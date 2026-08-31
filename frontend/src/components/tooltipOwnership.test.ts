import { describe, it, expect } from "vitest";
import tooltipSource from "./Tooltip.tsx?raw";

// Guards a rule that is invisible in the types and easy to reintroduce.
//
// Solid compiles an inline JSX prop into a GETTER. Reading `props.text` or
// `props.content` therefore evaluates the caller's expression at the moment you
// touch it — and if that expression creates a computation (a `<For>` in the
// content, a memoised ternary over store data), creating it from inside an
// EVENT HANDLER means it has no owner and is never disposed. Solid says so:
//   "computations created outside a `createRoot` or `render` will never be
//    disposed"
// Every such orphan stays subscribed to whatever it read, so it re-runs on
// every later store update for the rest of the session. With 71 Tooltip call
// sites, ~49 of them passing reactive text/content, hovering around the UI was
// accumulating them steadily.
//
// The fix is to never read those props outside the render tree. `show()` used
// to call hasContent() purely as an early-out, which the <Show> below already
// covers from inside the owner.
//
// There is no component-test setup in this package (vitest is `environment:
// "node"` and only collects `*.test.ts`), so this reads the source instead of
// rendering. Crude, but it encodes the actual rule and fails on the exact
// regression.

/** Strip comments, so a prop or helper NAMED in a comment isn't a false hit. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

/** Body of a top-level `const <name> = (...) => { ... }` in the source. */
function handlerBody(src: string, name: string): string {
  const start = src.indexOf(`const ${name} = (`);
  expect(start, `handler ${name} not found — was it renamed?`).toBeGreaterThan(-1);
  const open = src.indexOf("{", src.indexOf("=>", start));
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(open + 1, i); }
  }
  throw new Error(`unbalanced braces in ${name}`);
}

describe("Tooltip never reads content props from an event handler", () => {
  it("show() touches no props at all", () => {
    const body = stripComments(handlerBody(tooltipSource, "show"));
    const reads = [...body.matchAll(/props\.\w+/g)].map((m) => m[0]);
    expect(reads, "reading a prop here creates unowned computations").toEqual([]);
    // And it must not sneak the read in via the helper either.
    expect(body).not.toContain("hasContent");
  });

  it("the render tree still gates on hasContent, so no empty tooltip can show", () => {
    // Removing the guard from show() is only safe BECAUSE this gate exists.
    // If someone deletes it, empty tooltips would render — hence the pairing.
    expect(tooltipSource).toMatch(/<Show\s+when=\{visible\(\)\s*&&\s*hasContent\(\)\}/);
  });

  it("hasContent is the only place those props are read outside the JSX", () => {
    const decl = tooltipSource.slice(
      tooltipSource.indexOf("const hasContent"),
      tooltipSource.indexOf("\n", tooltipSource.indexOf("const hasContent")),
    );
    expect(decl).toContain("props.text");
    expect(decl).toContain("props.content");
  });
});
