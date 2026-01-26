import { clerkClient } from '@clerk/nextjs/server'
import {NextRequest, NextResponse} from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
 const userId  = (await params).user;

  if (!userId) {
    return new NextResponse('No user provided', { status: 500 })
  }

  const client = await clerkClient()

  try {
    const user = await client.users.getUser(userId)
    
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    // Return username or a fallback
    return new NextResponse(user.username || 'Anonymous User', { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error)
    return new NextResponse('Error fetching user data', { status: 500 })
  }
}