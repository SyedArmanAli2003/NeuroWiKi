import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/auth/signin', '/auth/signup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow static files, NextAuth API, and public paths
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
