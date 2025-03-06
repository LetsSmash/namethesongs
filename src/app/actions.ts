"use server";

import { auth } from "@clerk/nextjs/server";
import { scores } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq, desc, and } from "drizzle-orm";

export async function createScore({
  mode,
  mbid,
  time,
  score,
}: {
  mode: string;
  mbid: string;
  time: string;
  score: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  await db.insert(scores).values({
    user_id: userId,
    mode,
    mbid,
    time,
    score,
  });
}

export async function getScoresByAlbum(mbid: string) {
  return await db
    .select()
    .from(scores)
    .where(eq(scores.mbid, mbid))
    .orderBy(desc(scores.score));
}

export async function getScoresByUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  return await db
    .select()
    .from(scores)
    .where(eq(scores.user_id, userId))
    .orderBy(desc(scores.score));
}

export async function getUserScoresByAlbum(mbid: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  return await db
    .select()
    .from(scores)
    .where(and(
      eq(scores.mbid, mbid),
      eq(scores.user_id, userId)
    ))
    .orderBy(desc(scores.score));
}

export async function getAlbumsPlayedByUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  return await db
    .select({ mbid: scores.mbid })
    .from(scores)
    .where(eq(scores.user_id, userId))
    .groupBy(scores.mbid);
}
