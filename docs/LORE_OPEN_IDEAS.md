# Valenheart — Open Lore Ideas

**Status:** Holding pen for proposed lore items that need further discussion before being promoted to canon. Items here are **not authoritative** and should not be relied on for chronicle, cinematic, or mission writing without locking with the user first.

When an item is locked, move it into `LORE_TIMELINE.md` (or the relevant standalone doc) and delete it from this file. When an item is rejected, leave a one-line note here so future sessions don't reintroduce it.

---

## Khor'vani Alchemy

**Proposal (parked April 2026):** A pre-Aether magical tradition of physical-process alchemy. Predates the Academy of the Aether. Does not channel Aether — works on chemical and material principles. Therefore outside the Church's Doctrine of Silence, which is why Khor'vani alchemists are proposed to move freely in the Dominion despite the cultural Khor'vani stigma after Varek.

**Why parked:** User does not remember this being established and wants to discuss before committing.

**Questions to resolve:**

- Is this canon-compatible with the existing world?
- If not Aether-based, what does it actually run on? Pure material chemistry? A pre-divine substrate?
- Does it interact with the Aether cycle at all, or is it fully orthogonal?
- Does it offer any distinctive narrative or gameplay levers (e.g., a Khor'vani alchemist character can do something a wizard cannot)?

---

## Khazdurim Rune-craft

**Proposal (parked April 2026):** Inscription magic carved into stone or steel. Pre-Sundering origin. Functions on Aether but as *latent storage* rather than active manipulation — once a rune is carved, it holds its function until physically destroyed. Persists through the cycle's failure because the runes were inscribed during the working era and still hold their imprint.

**Why parked:** User does not remember this being established and wants to discuss before committing.

**Questions to resolve:**

- Does this exist as a separate tradition, or is it a subset of Arcane magic with a Khazdurim cultural twist?
- Can new runes still be carved today (with reduced effectiveness because of the broken cycle), or only the old ones still function?
- Does this connect at all to the Eighth's seals (made by gods, not dwarves) or are those entirely different magic?
- Narrative levers: is this a way for Khazdurim adventurers to do something distinctive in combat or crafting?

---

## Shrine RAG chatbot — divine guidance feature

**Proposal (parked May 2026):** A chatbot at the Shrine where the Lord can ask questions and receive a "divine response." Player offers a small token (chamomile sprig, astral shard) and asks. The chatbot has access to:
- Game state (resources, buildings, current quests, adventurers)
- Lore knowledge base (`LORE_TIMELINE.md`, founding characters, factions)
- The Lord's chronicle entries

Three implementation paths:
- Hardcoded FAQ (cheapest, ships fast)
- LLM with system prompt + game state injection (Anthropic/OpenAI; needs server proxy + budget)
- Local browser LLM via WebLLM (no API cost, heavy download)

**Why parked:** Fun late-game feature, nice ritual framing (Lord prays at altar, divine voice answers). Defer until quest system is settled and core UX is polished.

**Questions to resolve:**
- Implementation path
- Cost gating: per-question offerings? Daily limit? Free?
- Tone: which deity speaks? The Radiant One? The Six? Something more ambiguous?
- Knowledge boundaries: should the chatbot know late-game lore (Eighth, Halldora) and refuse to answer, or only know what the Lord knows?

## (Additional open ideas will be added here as they arise)
