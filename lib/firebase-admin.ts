import admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newline characters back to actual newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error)
  }
}

export const getDb = () => {
  if (!admin.apps.length) throw new Error('Firebase Admin not initialized (missing env vars)')
  return admin.firestore()
}

export { admin }
