import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where, limit } from 'firebase/firestore'
import bcrypt from 'bcryptjs'

const firebaseConfig = {
  apiKey: "yourapikey",
  authDomain: "secret",
  projectId: "secret",
  storageBucket: "secret",
  messagingSenderId: "secret",
  appId: "secret",
  measurementId: "secret"
}

// Initialize Firebase only if not already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db = getFirestore(app)
const USERS_COLLECTION = 'users'

export interface User {
  id: string
  name: string
  email: string
  password?: string
  created_at: string
}

/**
 * Retrieve a user by email from Firestore.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (!email) return undefined
  
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', email.toLowerCase().trim()),
      limit(1)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return undefined

    const doc = snapshot.docs[0]
    const data = doc.data()
    
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      password: data.password,
      created_at: data.created_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error('Firestore getUserByEmail error:', error)
    return undefined
  }
}

/**
 * Create a new user doc in Firestore with a hashed password.
 */
export async function createUser(name: string, email: string, plainPassword: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(plainPassword, 12)
  const normalizedEmail = email.toLowerCase().trim()

  const newUser = {
    name,
    email: normalizedEmail,
    password: hashedPassword,
    created_at: new Date().toISOString(),
  }

  // Add user to the Firestore collection
  const docRef = await addDoc(collection(db, USERS_COLLECTION), newUser)

  return {
    id: docRef.id,
    name,
    email: normalizedEmail,
    created_at: newUser.created_at,
  }
}

/**
 * Compare plain text password against hash stored in DB.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
