import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUser } from '@/lib/user-db'
import { z } from 'zod'

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { name, email, password } = result.data

    // Check for existing user
    const existing = getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const user = await createUser(name, email, password)

    return NextResponse.json({
      id:    user.id,
      name:  user.name,
      email: user.email,
    }, { status: 201 })

  } catch (err: any) {
    console.error('[signup] error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
