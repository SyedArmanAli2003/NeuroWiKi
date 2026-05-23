import { getDb } from './firebase-admin'

const WIKI_COLLECTION = 'wiki_pages'
const SOURCES_COLLECTION = 'sources'
const LOGS_COLLECTION = 'logs'

export interface WikiPageDoc {
  userId: string
  slug: string
  title: string
  content: string
  type: string
  summary: string
  createdAt: string
  updatedAt: string
  wikilinks: string[]
}

export async function getAllWikiPages(userId: string): Promise<(WikiPageDoc & { id: string })[]> {
  const snapshot = await getDb().collection(WIKI_COLLECTION).where('userId', '==', userId).get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as WikiPageDoc) }))
}

export async function getWikiPageBySlug(userId: string, slug: string): Promise<(WikiPageDoc & { id: string }) | null> {
  const snapshot = await getDb().collection(WIKI_COLLECTION)
    .where('userId', '==', userId)
    .where('slug', '==', slug)
    .limit(1)
    .get()
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as WikiPageDoc) }
}

export async function createWikiPage(userId: string, data: Omit<WikiPageDoc, 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString()
  const docRef = await getDb().collection(WIKI_COLLECTION).add({
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateWikiPage(userId: string, id: string, data: Partial<Omit<WikiPageDoc, 'userId'>>): Promise<void> {
  const docRef = getDb().collection(WIKI_COLLECTION).doc(id)
  const docSnap = await docRef.get()
  if (docSnap.exists && docSnap.data()?.userId === userId) {
    await docRef.update({
      ...data,
      updatedAt: new Date().toISOString()
    })
  } else {
    throw new Error('Wiki page not found or unauthorized')
  }
}

export async function deleteWikiPage(userId: string, id: string): Promise<void> {
  const docRef = getDb().collection(WIKI_COLLECTION).doc(id)
  const docSnap = await docRef.get()
  if (docSnap.exists && docSnap.data()?.userId === userId) {
    await docRef.delete()
  } else {
    throw new Error('Wiki page not found or unauthorized')
  }
}

export async function deleteWikiPageBySlug(userId: string, slug: string): Promise<void> {
  const snapshot = await getDb().collection(WIKI_COLLECTION)
    .where('userId', '==', userId)
    .where('slug', '==', slug)
    .get()
  
  const batch = getDb().batch()
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

// ---------------------------------------------------------------------------
// Sources & Logs (FIX 3)
// ---------------------------------------------------------------------------
export async function createSource(userId: string, data: { url: string | null, title: string | null, raw_content: string, processed: number }) {
  const docRef = await getDb().collection(SOURCES_COLLECTION).add({
    ...data,
    userId,
    createdAt: new Date().toISOString(),
  })
  return docRef.id
}

export async function createLog(userId: string, data: { source_id: string | null, pages_created: number, pages_updated: number, message: string | null }) {
  const docRef = await getDb().collection(LOGS_COLLECTION).add({
    ...data,
    userId,
    createdAt: new Date().toISOString(),
  })
  return docRef.id
}
