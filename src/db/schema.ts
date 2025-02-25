import {pgTable, serial, text, time, timestamp} from "drizzle-orm/pg-core";


export const scores = pgTable("scores", {
    id: serial("id").primaryKey(),
    mode: text("mode").notNull(),
    name: text("name").notNull(),
    mbid: text("mbid").notNull(),
    time: time("time").notNull(),
    score: text("score").notNull(),
})