import { createSignal, createResource, For, Show, onCleanup } from "solid-js";
import { fetchFriends, sendFriendRequest, respondFriendRequest, removeFriend } from "~/api/friends";
import { wsClient } from "~/api/ws";

export default function FriendsPage() {
  const [friendsData, { refetch }] = createResource(() => fetchFriends());

  // Slow fallback poll — WS pushes are primary. Catches missed events if socket drops.
  const pollTimer = setInterval(() => refetch(), 120_000);
  onCleanup(() => clearInterval(pollTimer));

  // Realtime: refetch on any friend event (new request, accept, remove)
  const offFriend = wsClient.on("friend:update", () => refetch());
  onCleanup(() => offFriend());

  const [addUsername, setAddUsername] = createSignal("");
  const [addStatus, setAddStatus] = createSignal<string | null>(null);

  const handleSendRequest = async () => {
    const username = addUsername().trim();
    if (!username) return;
    setAddStatus(null);
    try {
      const result = await sendFriendRequest(username);
      if (result.status === "accepted") setAddStatus(`✓ You're now friends with ${username}!`);
      else setAddStatus(`✓ Request sent to ${username}`);
      setAddUsername("");
      refetch();
    } catch (e: any) {
      setAddStatus(`✗ ${e.message || "Failed to send request"}`);
    }
    // Clear status after 4s
    setTimeout(() => setAddStatus(null), 4000);
  };

  const handleRespond = async (id: string, accept: boolean) => {
    try {
      await respondFriendRequest(id, accept);
      refetch();
    } catch (e: any) {
      console.error("Respond failed:", e.message);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this friend?")) return;
    try {
      await removeFriend(id);
      refetch();
    } catch (e: any) {
      console.error("Remove failed:", e.message);
    }
  };

  const handleCancelOutgoing = async (id: string) => {
    try {
      await removeFriend(id);
      refetch();
    } catch (e: any) {
      console.error("Cancel failed:", e.message);
    }
  };

  return (
    <div>
      <h1 class="page-title">👥 Friends</h1>

      {/* Add friend */}
      <div style={{
        padding: "12px 14px",
        "margin-bottom": "20px",
        background: "var(--bg-secondary)",
        "border-radius": "6px",
      }}>
        <div style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
          Add a friend
        </div>
        <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
          <input
            type="text"
            placeholder="Username"
            value={addUsername()}
            onInput={(e) => setAddUsername(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendRequest(); }}
            style={{
              flex: "1",
              padding: "6px 10px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              "border-radius": "4px",
              color: "var(--text-primary)",
              "font-size": "0.85rem",
            }}
          />
          <button
            class="upgrade-btn"
            onClick={handleSendRequest}
            disabled={!addUsername().trim()}
            style={{ padding: "6px 14px", "font-size": "0.85rem" }}
          >
            Send Request
          </button>
        </div>
        <Show when={addStatus()}>
          <div style={{
            "margin-top": "8px",
            "font-size": "0.8rem",
            color: addStatus()!.startsWith("✓") ? "var(--accent-green)" : "var(--accent-red)",
          }}>
            {addStatus()}
          </div>
        </Show>
      </div>

      {/* Incoming requests */}
      <Show when={(friendsData()?.incoming ?? []).length > 0}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--accent-gold)" }}>
          Incoming Requests ({friendsData()!.incoming.length})
        </h3>
        <div style={{ "margin-bottom": "20px" }}>
          <For each={friendsData()!.incoming}>
            {(req) => (
              <div style={{
                display: "flex",
                "align-items": "center",
                gap: "12px",
                padding: "10px 14px",
                background: "rgba(245, 197, 66, 0.08)",
                border: "1px solid rgba(245, 197, 66, 0.3)",
                "border-radius": "6px",
                "margin-bottom": "6px",
              }}>
                <span style={{ color: "var(--text-primary)", "font-weight": "bold" }}>
                  {req.otherUsername}
                </span>
                <span style={{ color: "var(--text-muted)", "font-size": "0.75rem", "margin-left": "auto" }}>
                  wants to be friends
                </span>
                <button
                  class="upgrade-btn"
                  onClick={() => handleRespond(req.id, true)}
                  style={{ padding: "4px 12px", "font-size": "0.8rem" }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(req.id, false)}
                  style={{
                    padding: "4px 12px",
                    background: "transparent",
                    border: "1px solid var(--border-color)",
                    "border-radius": "4px",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    "font-size": "0.8rem",
                  }}
                >
                  Decline
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Friends list */}
      <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
        Friends ({(friendsData()?.friends ?? []).length})
      </h3>
      <Show when={friendsData.loading && !friendsData()}>
        <div style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>Loading…</div>
      </Show>
      <Show when={friendsData() && friendsData()!.friends.length === 0}>
        <div style={{ color: "var(--text-muted)", "font-size": "0.85rem", "margin-bottom": "20px" }}>
          No friends yet. Invite someone to play together!
        </div>
      </Show>
      <div style={{ "margin-bottom": "20px" }}>
        <For each={friendsData()?.friends ?? []}>
          {(friend) => (
            <div style={{
              display: "flex",
              "align-items": "center",
              gap: "12px",
              padding: "10px 14px",
              background: "var(--bg-secondary)",
              "border-radius": "6px",
              "margin-bottom": "6px",
            }}>
              <span style={{ color: "var(--text-primary)", "font-weight": "bold" }}>
                {friend.friendUsername}
              </span>
              <button
                onClick={() => handleRemove(friend.id)}
                style={{
                  padding: "4px 12px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  "border-radius": "4px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  "font-size": "0.8rem",
                  "margin-left": "auto",
                }}
              >
                Remove
              </button>
            </div>
          )}
        </For>
      </div>

      {/* Outgoing requests */}
      <Show when={(friendsData()?.outgoing ?? []).length > 0}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-muted)" }}>
          Sent Requests ({friendsData()!.outgoing.length})
        </h3>
        <For each={friendsData()!.outgoing}>
          {(req) => (
            <div style={{
              display: "flex",
              "align-items": "center",
              gap: "12px",
              padding: "8px 14px",
              background: "var(--bg-secondary)",
              "border-radius": "6px",
              "margin-bottom": "6px",
              opacity: 0.7,
            }}>
              <span style={{ color: "var(--text-secondary)" }}>
                {req.otherUsername}
              </span>
              <span style={{ color: "var(--text-muted)", "font-size": "0.75rem", "margin-left": "auto", "font-style": "italic" }}>
                waiting for response
              </span>
              <button
                onClick={() => handleCancelOutgoing(req.id)}
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  "border-radius": "4px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  "font-size": "0.75rem",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
