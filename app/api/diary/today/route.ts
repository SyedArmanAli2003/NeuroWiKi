import { getTodayEntries, insertEntry, updateEntry, getMeta, upsertMeta, computeStreak } from '@/lib/diary-db'
import { hydra, ensureTenant } from '@/lib/hydra'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const entries = getTodayEntries(date)
  const meta = getMeta(date)
  const streak = computeStreak(date)

  return Response.json({ entries, meta, streak })
}

async function syncToHydra(entry: { id: number; date: string; time: string; kind: string; title: string | null; text: string }): Promise<boolean> {
  try {
    await ensureTenant('default')
    const displayTitle = entry.title?.trim() || `Diary ${entry.date} – ${entry.kind}`
    const heading = entry.title?.trim() || `Diary Entry — ${entry.date} ${entry.time}`
    await hydra.upload.knowledge({
      tenant_id: 'default',
      upsert: true,
      app_knowledge: JSON.stringify([{
        tenant_id: 'default',
        sub_tenant_id: 'default',
        id: `diary-${entry.id}`,
        title: displayTitle,
        type: 'document',
        content: {
          markdown: `# ${heading}\n\n**Kind:** ${entry.kind}\n\n${entry.text}`,
        },
        document_metadata: {
          category: 'diary',
          date: entry.date,
          kind: entry.kind,
          title: entry.title ?? null,
          slug: `diary-${entry.id}`,
        },
      }]),
    })
    return true
  } catch (e) {
    console.error('[diary] HydraDB sync failed:', e)
    return false
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const { action, date, ...fields } = body

  if (action === 'entry') {
    const entry = insertEntry({
      date,
      time: fields.time,
      kind: fields.kind ?? 'thought',
      title: fields.title?.trim() || null,
      text: fields.text,
      filed_under: fields.filed_under ?? null,
    })

    const synced = await syncToHydra(entry)

    return Response.json({ entry, synced })
  }

  if (action === 'meta') {
    const meta = upsertMeta(date, {
      intention: fields.intention,
      intention_time: fields.intention_time,
      mood: fields.mood,
      review: fields.review,
      streak: fields.streak,
    })
    return Response.json({ meta })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

export async function PATCH(req: Request) {
  const { id, text, title } = await req.json()
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })
  if (text === undefined && title === undefined) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  }
  const entry = updateEntry(id, {
    ...(text !== undefined ? { text: text.trim() } : {}),
    ...(title !== undefined ? { title: title?.trim() || null } : {}),
  })
  return Response.json({ entry })
}
