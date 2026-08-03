import { authFetch } from "@/services/authFetch";
import { readJson, writeJson } from "@/utils/offline/storage";

export interface OutboxEntry {
  id: string;
  /** Absolute request URL. */
  url: string;
  method: "POST" | "DELETE" | "PATCH" | "PUT";
  body?: unknown;
  /** Groups entries so a screen can show "3 marks pending". */
  kind: "marks" | "attendance";
  /** Human label for the pending-changes banner. */
  label: string;
  createdAt: string;
}

const KEY = "outbox";

type Listener = () => void;

/**
 * Durable queue of writes made while offline.
 *
 * Marks and attendance are entered in places with unreliable connectivity, so
 * a failed request must not lose the teacher's work. Entries survive restarts
 * and are replayed in order once a request succeeds again.
 *
 * Only idempotent endpoints belong here: replaying `POST /marks` for the same
 * student overwrites rather than duplicates, which is what makes retry safe.
 */
class Outbox {
  private entries: OutboxEntry[] = [];
  private listeners = new Set<Listener>();
  private loaded = false;
  private flushing = false;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.entries;

  private emit() {
    this.entries = [...this.entries];
    this.listeners.forEach((listener) => listener());
  }

  private async persist() {
    await writeJson(KEY, this.entries);
  }

  async hydrate() {
    if (this.loaded) return;
    this.entries = (await readJson<OutboxEntry[]>(KEY)) ?? [];
    this.loaded = true;
    this.emit();
  }

  count(kind?: OutboxEntry["kind"]) {
    return kind
      ? this.entries.filter((entry) => entry.kind === kind).length
      : this.entries.length;
  }

  async enqueue(entry: Omit<OutboxEntry, "id" | "createdAt">) {
    await this.hydrate();
    this.entries = [
      ...this.entries,
      { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() },
    ];
    await this.persist();
    this.emit();
  }

  /**
   * Replays queued writes oldest-first.
   *
   * Stops at the first transport failure (still offline) so ordering holds, but
   * drops entries the server rejects outright — a 4xx will never succeed on
   * retry and would block the queue forever.
   */
  async flush(): Promise<{ sent: number; failed: number }> {
    await this.hydrate();
    if (this.flushing || this.entries.length === 0) return { sent: 0, failed: 0 };

    this.flushing = true;
    let sent = 0;
    let failed = 0;

    try {
      while (this.entries.length > 0) {
        const entry = this.entries[0];
        let response: Response;

        try {
          response = await authFetch(entry.url, {
            method: entry.method,
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: entry.body === undefined ? undefined : JSON.stringify(entry.body),
          });
        } catch {
          // Transport failure: still offline, keep everything for later.
          break;
        }

        if (response.ok) {
          sent += 1;
        } else if (response.status >= 400 && response.status < 500) {
          // Permanently rejected — discard so the queue can drain.
          failed += 1;
        } else {
          // 5xx may recover; leave it at the head and stop.
          break;
        }

        this.entries = this.entries.slice(1);
        await this.persist();
        this.emit();
      }
    } finally {
      this.flushing = false;
    }

    return { sent, failed };
  }

  async clear() {
    this.entries = [];
    await this.persist();
    this.emit();
  }
}

export const outbox = new Outbox();
