import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle large file uploads for API routes
  if (request.nextUrl.pathname.startsWith('/api/photos/')) {
    // Set headers for large file uploads
    const response = NextResponse.next()
    
    // Increase timeout for file uploads
    response.headers.set('Connection', 'keep-alive')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/photos/:path*',
  ],
}