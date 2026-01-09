import {integer, pgTable, serial, text, timestamp} from "drizzle-orm/pg-core";


export const scores = pgTable("scores", {
    id: serial("id").primaryKey(),
    user_id: text("user_id").notNull(),
    mode: text("mode").notNull(),
    mbid: text("mbid").notNull(),
    rgmbid: text("rgmbid"),
    time: text("time").notNull(),
    score: text("score").notNull(),
    created: timestamp("created").notNull().defaultNow(),
    deleted: timestamp("deleted"),
})

export const artistScores = pgTable("artistScores", {
    id: serial("id").primaryKey(),
    user_id: text("user_id").notNull(),
    time: text("time").notNull(),
    score: text("score").notNull(),
    mbid: text("mbid").notNull(),
    configId: integer("configId").notNull().references(() => artistConfigurations.id),
    created: timestamp("created").notNull().defaultNow(),
    deleted: timestamp("deleted"),
})

export const artistConfigurations = pgTable("artistConfigurations", {
    id: serial("id").primaryKey(),
    mbid: text("mbid").notNull(),
    config: text("config").notNull(),
})