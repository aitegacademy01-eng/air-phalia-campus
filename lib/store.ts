import postgres from "postgres";
import { get, list, put } from "@vercel/blob";

export type Enquiry = { id: string; name: string; phone: string; level: string; message: string; status: string; created_at: number };
export type NewEnquiry = Omit<Enquiry, "id" | "status" | "created_at">;

/**
 * Persistent storage for enquiries, webhook de-duplication and rate limits.
 * Postgres (DATABASE_URL / POSTGRES_URL, e.g. Neon from the Vercel Marketplace) is preferred.
 * A private Vercel Blob store (BLOB_READ_WRITE_TOKEN) is supported as a fallback.
 * Every write throws on failure so callers never report an unsaved enquiry as saved.
 */
type Store = {
  kind: "postgres" | "blob";
  saveEnquiry(e: NewEnquiry): Promise<Enquiry>;
  listEnquiries(limit: number): Promise<Enquiry[]>;
  updateStatus(id: string, status: string): Promise<boolean>;
  hasEvent(id: string): Promise<boolean>;
  recordEvent(id: string): Promise<void>;
  hit(key: string, ttlMs: number): Promise<number>;
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS enquiries (id text PRIMARY KEY, name text NOT NULL, phone text NOT NULL, level text NOT NULL, message text NOT NULL, status text NOT NULL DEFAULT 'new', created_at bigint NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS webhook_events (id text PRIMARY KEY, created_at bigint NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS request_limits (id text PRIMARY KEY, count integer NOT NULL, expires_at bigint NOT NULL)`,
];

function postgresStore(url: string): Store {
  // prepare:false keeps the client compatible with pooled (PgBouncer) connection strings.
  const sql = postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  let ready: Promise<void> | null = null;
  const init = () => {
    ready ??= (async () => { for (const s of SCHEMA) await sql.unsafe(s); })().catch((e) => { ready = null; throw e; });
    return ready;
  };
  const cols = sql`id, name, phone, level, message, status, created_at::float8 AS created_at`;
  return {
    kind: "postgres",
    async saveEnquiry(e) {
      await init();
      const row = { id: crypto.randomUUID(), ...e, status: "new", created_at: Date.now() };
      const r = await sql`INSERT INTO enquiries (id, name, phone, level, message, status, created_at) VALUES (${row.id}, ${row.name}, ${row.phone}, ${row.level}, ${row.message}, 'new', ${row.created_at}) RETURNING id`;
      if (r.count !== 1) throw new Error("Enquiry not saved");
      return row;
    },
    async listEnquiries(limit) {
      await init();
      return (await sql<Enquiry[]>`SELECT ${cols} FROM enquiries ORDER BY created_at DESC LIMIT ${limit}`).map((r) => ({ ...r }));
    },
    async updateStatus(id, status) {
      await init();
      return (await sql`UPDATE enquiries SET status = ${status} WHERE id = ${id}`).count === 1;
    },
    async hasEvent(id) {
      await init();
      return (await sql`SELECT 1 FROM webhook_events WHERE id = ${id}`).count > 0;
    },
    async recordEvent(id) {
      await init();
      await sql`INSERT INTO webhook_events (id, created_at) VALUES (${id}, ${Date.now()}) ON CONFLICT (id) DO NOTHING`;
    },
    async hit(key, ttlMs) {
      await init();
      const now = Date.now();
      const [row] = await sql<{ count: number }[]>`INSERT INTO request_limits (id, count, expires_at) VALUES (${key}, 1, ${now + ttlMs}) ON CONFLICT (id) DO UPDATE SET count = request_limits.count + 1 RETURNING count`;
      await sql`DELETE FROM request_limits WHERE expires_at < ${now}`;
      return row?.count ?? 0;
    },
  };
}

function blobStore(): Store {
  const opts = { access: "private" as const, contentType: "application/json", addRandomSuffix: false };
  const path = (id: string) => `enquiries/${id}.json`;
  async function read<T>(pathname: string): Promise<T | null> {
    const r = await get(pathname, { access: "private", useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text()) as T;
  }
  // Rate limits are per server instance in this mode (best effort, not persisted).
  const hits = new Map<string, { count: number; expires: number }>();
  return {
    kind: "blob",
    async saveEnquiry(e) {
      const row: Enquiry = { id: crypto.randomUUID(), ...e, status: "new", created_at: Date.now() };
      const saved = await put(path(row.id), JSON.stringify(row), { ...opts, allowOverwrite: false });
      if (!saved?.pathname) throw new Error("Enquiry not saved");
      return row;
    },
    async listEnquiries(limit) {
      const blobs = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: "enquiries/", cursor, limit: 1000 });
        blobs.push(...page.blobs);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
      const rows = await Promise.all(blobs.slice(0, limit).map((b) => read<Enquiry>(b.pathname)));
      return rows.filter((r): r is Enquiry => !!r).sort((a, b) => b.created_at - a.created_at);
    },
    async updateStatus(id, status) {
      if (!/^[0-9a-f-]{36}$/.test(id)) return false;
      const row = await read<Enquiry>(path(id));
      if (!row) return false;
      await put(path(id), JSON.stringify({ ...row, status }), { ...opts, allowOverwrite: true });
      return true;
    },
    async hasEvent(id) {
      return (await read(`webhook-events/${encodeURIComponent(id)}.json`)) !== null;
    },
    async recordEvent(id) {
      await put(`webhook-events/${encodeURIComponent(id)}.json`, JSON.stringify({ id, created_at: Date.now() }), { ...opts, allowOverwrite: true });
    },
    async hit(key, ttlMs) {
      const now = Date.now();
      for (const [k, v] of hits) if (v.expires < now) hits.delete(k);
      const v = hits.get(key) ?? { count: 0, expires: now + ttlMs };
      v.count++;
      hits.set(key, v);
      return v.count;
    },
  };
}

let cached: Store | null | undefined;
export function store(): Store {
  if (cached === undefined) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    cached = url ? postgresStore(url) : process.env.BLOB_READ_WRITE_TOKEN ? blobStore() : null;
  }
  if (!cached) throw new Error("No database configured. Set DATABASE_URL (Postgres) or connect a Vercel Blob store.");
  return cached;
}
