"use server";

import { auth } from "@clerk/nextjs/server";
import { scores } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq, desc, and } from "drizzle-orm";
import { sortResultsNumerically } from "./utils";

export async function createScore({
  mode,
  mbid,
  rgmbid,
  time,
  score,
}: {
  mode: string;
  mbid: string;
  rgmbid: string;
  time: string;
  score: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  await db.insert(scores).values({
    user_id: userId,
    mode,
    mbid,
    rgmbid,
    time,
    score,
  });
}

export async function getScoresByAlbum(mbid: string) {
  const results = await db
    .select()
    .from(scores)
    .where(eq(scores.mbid, mbid))
    .orderBy(desc(scores.score));

  return sortResultsNumerically(results);
}

export async function getScoresByUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  const results = await db
    .select()
    .from(scores)
    .where(eq(scores.user_id, userId))
    .orderBy(desc(scores.score));
    
  return sortResultsNumerically(results);
}

export async function getUserScoresByAlbum(mbid: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  const results = await db
    .select()
    .from(scores)
    .where(and(
      eq(scores.mbid, mbid),
      eq(scores.user_id, userId)
    ))
    .orderBy(desc(scores.score));

  return sortResultsNumerically(results);
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

export async function getUserScoresByReleaseGroup(rgmbid: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  const results = await db
    .select()
    .from(scores)
    .where(and(
      eq(scores.rgmbid, rgmbid),
      eq(scores.user_id, userId)
    ))
    .orderBy(desc(scores.score));

  return sortResultsNumerically(results);
}

export async function getScoresByReleaseGroup(rgmbid: string) {
  const results = await db
    .select()
    .from(scores)
    .where(eq(scores.rgmbid, rgmbid))
    .orderBy(desc(scores.score));

  return sortResultsNumerically(results);
}
