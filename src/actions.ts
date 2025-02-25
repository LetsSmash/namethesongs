'use server'

import { auth } from '@clerk/nextjs/server'
import { UserMessages } from './db/schema'
import { db } from '@/db/drizzle'
import { eq } from 'drizzle-orm'

export async function createUserMessage(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('User not found')

    const message = formData.get('message') as string
    await db.insert(UserMessages).values({
        user_id: userId,
        message,
    })
}

export async function deleteUserMessage() {
    const { userId } = await auth()
    if (!userId) throw new Error('User not found')

    await db.delete(UserMessages).where(eq(UserMessages.user_id, userId))
}