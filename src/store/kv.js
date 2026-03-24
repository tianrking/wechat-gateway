export async function kvGetJson(kv, key) {
  const raw = await kv.get(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function kvPutJson(kv, key, value, options) {
  await kv.put(key, JSON.stringify(value), options);
}

export async function kvDelete(kv, key) {
  await kv.delete(key);
}

export async function kvListJson(kv, prefix) {
  const out = [];
  let cursor = undefined;
  do {
    const page = await kv.list({ prefix, cursor });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const item of page.keys) {
      const raw = await kv.get(item.name);
      if (raw) out.push(JSON.parse(raw));
    }
  } while (cursor);
  return out;
}
