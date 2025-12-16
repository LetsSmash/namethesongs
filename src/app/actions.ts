"use server";

import { auth } from "@clerk/nextjs/server";
import { artistConfigurations, artistScores, scores } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq, desc, and } from "drizzle-orm";
import { sortResultsNumerically } from "./utils";
import { ConfigSchema } from "@/types/config";

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

export async function createConfiguration({
  mbid,
  config
}: {
  mbid: string;
  config: string;
}) {

  await db.insert(artistConfigurations).values({
    mbid,
    config,
  });
}

export async function createArtistScore({
  time,
  score,
  mbid,
  configId
}: {
  time: string;
  score: string;
  mbid: string;
  configId: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  await db.insert(artistScores).values({
    user_id: userId,
    time,
    score,
    mbid,
    configId,
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

export async function getConfigurationId(config: string): Promise<ConfigSchema[]> {
  return await db
    .select()
    .from(artistConfigurations)
    .where(eq(artistConfigurations.config, config))
    .limit(1);
}

export async function getLastConfigurationId(): Promise<ConfigSchema[]> {
  return await db
    .select()
    .from(artistConfigurations)
    .orderBy(desc(artistConfigurations.id))
    .limit(1);
}

export async function getArtistScoresByMbid(mbid: string) {
  const results = await db
    .select({
      id: artistScores.id,
      user_id: artistScores.user_id,
      time: artistScores.time,
      score: artistScores.score,
      mbid: artistScores.mbid,
      configId: artistScores.configId,
      configMbid: artistConfigurations.mbid,
      configString: artistConfigurations.config,
    })
    .from(artistScores)
    .leftJoin(artistConfigurations, eq(artistScores.configId, artistConfigurations.id))
    .where(eq(artistScores.mbid, mbid))
    .orderBy(desc(artistScores.score));

  return sortResultsNumerically(results.map(r => ({
    id: r.id,
    user_id: r.user_id,
    time: r.time,
    score: r.score,
    mbid: r.mbid,
    mode: 'artist',
    rgmbid: '',
    config: r.configId && r.configString && r.configMbid ? {
      id: r.configId,
      mbid: r.configMbid,
      config: r.configString,
    } : undefined,
  })));
}

export async function getUserArtistScoresByMbid(mbid: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  const results = await db
    .select({
      id: artistScores.id,
      user_id: artistScores.user_id,
      time: artistScores.time,
      score: artistScores.score,
      mbid: artistScores.mbid,
      configId: artistScores.configId,
      configMbid: artistConfigurations.mbid,
      configString: artistConfigurations.config,
    })
    .from(artistScores)
    .leftJoin(artistConfigurations, eq(artistScores.configId, artistConfigurations.id))
    .where(and(
      eq(artistScores.mbid, mbid),
      eq(artistScores.user_id, userId)
    ))
    .orderBy(desc(artistScores.score));

  return sortResultsNumerically(results.map(r => ({
    id: r.id,
    user_id: r.user_id,
    time: r.time,
    score: r.score,
    mbid: r.mbid,
    mode: 'artist',
    rgmbid: '',
    config: r.configId && r.configString && r.configMbid ? {
      id: r.configId,
      mbid: r.configMbid,
      config: r.configString,
    } : undefined,
  })));
}
