import {pgTable, serial, text, time, timestamp} from "drizzle-orm/pg-core";


export const scores = pgTable("scores", {
    id: serial("id").primaryKey(),
    user_id: text("user_id").notNull(),
    mode: text("mode").notNull(),
    mbid: text("mbid").notNull(),
    time: text("time").notNull(),
    score: text("score").notNull(),
})