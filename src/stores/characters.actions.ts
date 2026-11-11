import { produce } from "immer";
import { client } from "/api/client";
import { ApiError } from "/api/errors";
import { setAt, type Path, type PathValue } from "/api/paths";
import { createDefault } from "/stores/characters.default";
import {
  useCharacterStore,
  type CharDownload,
  type Deleted,
  type Editable,
  type CharData,
  type CharacterRecord,
  type LocalOnly,
  type Modified,
  type Synced,
} from "/stores/characters.store";
import deepEqual from "fast-deep-equal";

const INITIAL_VERSION = 0;

const get = () => useCharacterStore.getState();
const set = useCharacterStore.setState;
const put = (rec: CharacterRecord) =>
  set((s) => {
    // do not overwrite busy, it may have changed somewhere between function calls
    s.characters[rec.localId] = { ...rec, busy: s.characters[rec.localId]?.busy ?? false };
  });
const del = (localId: string) =>
  set((s) => {
    delete s.characters[localId];
  });

const asSynced = (localId: string, dl: CharDownload): Synced => ({
  localId,
  busy: false,
  sync: "synced",
  remote: dl,
  data: dl.data,
});

function editable(localId: string): Editable {
  const rec = get().characters[localId];
  if (!rec) throw new Error(`Unknown character ${localId}`);
  if (rec.sync === "deleted") throw new Error(`Character ${localId} is deleted`);
  return rec;
}

/** update the data of a character record and resolve the sync status */
function resolveSync(rec: Editable, data: CharData): Editable {
  if (rec.sync === "local") return { ...rec, data };
  return deepEqual(data, rec.remote.data)
    ? { ...rec, sync: "synced", data: rec.remote.data } // next comparison is fast
    : { ...rec, sync: rec.sync, data };
}

function edit(localId: string, recipe: (draft: CharData) => void) {
  const rec = editable(localId);
  put(resolveSync(rec, produce(rec.data, recipe)));
}

// --- local actions -------------------------------------------------------------------------------
export function createCharacter(data: CharData = createDefault()): string {
  const localId = crypto.randomUUID();
  put({ sync: "local", busy: false, localId, data });
  return localId;
}

export function setField<P extends Path<CharData> & string>(
  localId: string,
  path: P,
  value: PathValue<CharData, P>,
) {
  edit(localId, (s) => setAt(s, path, value));
}

export function deleteCharacter(localId: string) {
  const rec = get().characters[localId];
  if (!rec) return;
  if (rec.sync === "local") del(localId);
  else if (rec.sync !== "deleted") put({ ...rec, sync: "deleted" });
}

export function discardChanges(localId: string) {
  const rec = get().characters[localId];
  if (!rec || rec.sync === "local" || rec.sync === "synced") return;
  put(asSynced(localId, rec.remote));
}

export function resolveConflict(localId: string, keep: "mine" | "theirs") {
  const rec = get().characters[localId];
  if (rec?.sync !== "conflict") return;
  if (keep === "theirs") {
    discardChanges(localId);
  } else {
    // just change the state, the remote version is already updated
    put({ ...rec, sync: "modified" });
  }
}

// --- handle remote states ------------------------------------------------------------------------

function mergeRemoteVersion(localId: string, server: CharDownload) {
  const cur = get().characters[localId];
  if (!cur || cur.sync === "local" || cur.sync === "deleted") return;
  if (server.version <= cur.remote.version) return; // an update arrived late and is now stale
  if (cur.sync === "synced" || deepEqual(cur.data, server.data)) {
    put(asSynced(localId, server));
  } else {
    put({ sync: "conflict", localId, busy: cur.busy, data: cur.data, remote: server });
  }
}

function deleteFlaggedOrDetach(localId: string) {
  const cur = get().characters[localId];
  if (!cur || cur.sync === "local") return;
  if (cur.sync === "deleted") del(localId);
  else put({ sync: "local", localId, busy: false, data: cur.data });
}

function mergeEditsWhileInFlight(localId: string, sent: CharData, dl: CharDownload) {
  const cur = get().characters[localId];
  if (!cur || cur.sync === "deleted") return;
  if (cur.data === sent) return put(asSynced(localId, dl));
  const base: Modified = { sync: "modified", localId, busy: cur.busy, data: cur.data, remote: dl };
  put(resolveSync(base, cur.data));
}

const setBusy = (localId: string, busy: boolean) =>
  set((s) => {
    const rec = s.characters[localId];
    if (rec) rec.busy = busy;
  });

async function withBusy(localId: string, fn: () => Promise<void>) {
  if (get().characters[localId]?.busy !== false) return; // unknown or already busy
  setBusy(localId, true);
  try {
    await fn();
  } finally {
    setBusy(localId, false);
  }
}

// --- sync actions --------------------------------------------------------------------------------

async function pushNew(rec: LocalOnly) {
  const sent = rec.data;
  const { data } = await client.POST("/characters/owned", {
    body: { version: INITIAL_VERSION, data: sent },
  }); // too_many_characters (403) propagates to the caller
  if (data) mergeEditsWhileInFlight(rec.localId, sent, data);
}

async function pushUpdate(rec: Modified) {
  const sent = rec.data;
  try {
    const { data } = await client.PUT("/characters/owned/{char_id}", {
      params: { path: { char_id: rec.remote.char_id } },
      body: { version: rec.remote.version, data: sent },
    });
    if (data) mergeEditsWhileInFlight(rec.localId, sent, data);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.body.code === "character_outdated")
        return mergeRemoteVersion(rec.localId, e.body.detail);
      if (e.status === 404) return deleteFlaggedOrDetach(rec.localId);
    }
    throw e;
  }
}

async function pushDelete(rec: Deleted) {
  try {
    await client.DELETE("/characters/owned/{char_id}", {
      params: { path: { char_id: rec.remote.char_id } },
    });
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }
  if (get().characters[rec.localId]?.sync === "deleted") del(rec.localId); // not restored meanwhile
}

export async function pushCharacter(localId: string): Promise<void> {
  await withBusy(localId, async () => {
    const rec = get().characters[localId];
    if (!rec) return;
    switch (rec.sync) {
      case "local":
        return pushNew(rec);
      case "modified":
        return pushUpdate(rec);
      case "deleted":
        return pushDelete(rec);
      case "synced":
        return; // nothing to push
      case "conflict":
        return; // must resolve first
    }
  });
}

// sequential, deletions first so they free slots for creations
export async function pushAll() {
  const rank = { deleted: 0, modified: 1, local: 2 } as const;
  const todo = Object.values(get().characters)
    .filter((c) => c.sync === "deleted" || c.sync === "modified" || c.sync === "local")
    .sort((a, b) => rank[a.sync as keyof typeof rank] - rank[b.sync as keyof typeof rank]);
  const results: { localId: string; error?: unknown }[] = [];
  for (const c of todo) {
    try {
      await pushCharacter(c.localId);
      results.push({ localId: c.localId });
    } catch (error) {
      results.push({ localId: c.localId, error });
    }
  }
  return results;
}

export async function pullCharacter(localId: string): Promise<void> {
  await withBusy(localId, async () => {
    const rec = get().characters[localId];
    if (!rec || rec.sync === "local" || rec.sync === "deleted") return;
    try {
      const { data } = await client.GET("/characters/owned/{char_id}", {
        params: { path: { char_id: rec.remote.char_id } },
      });
      if (data) mergeRemoteVersion(localId, data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return deleteFlaggedOrDetach(localId);
      throw e;
    }
  });
}

export async function pullAll(): Promise<void> {
  // only records known before the request may be detached (avoids racing with pushes)
  const known = new Map(
    Object.values(get().characters).flatMap((c) =>
      c.sync === "local" ? [] : [[c.remote.char_id, c.localId] as const],
    ),
  );
  set((s) => {
    s.listStatus = "loading";
  });
  try {
    const { data } = await client.GET("/characters/owned");
    if (!data) throw new Error("Empty character list");
    const seen = new Set<string>();
    for (const dl of data.characters) {
      seen.add(dl.char_id);
      const localId = Object.values(get().characters).find(
        (c) => c.sync !== "local" && c.remote.char_id === dl.char_id,
      )?.localId;
      if (localId) mergeRemoteVersion(localId, dl);
      else put(asSynced(crypto.randomUUID(), dl));
    }
    for (const [charId, localId] of known) {
      if (!seen.has(charId)) deleteFlaggedOrDetach(localId);
    }
    set((s) => {
      s.listStatus = "loaded";
    });
  } catch (e) {
    set((s) => {
      s.listStatus = "error";
    });
    throw e;
  }
}
