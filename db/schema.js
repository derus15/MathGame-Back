import {
    pgTable,
    serial,
    varchar,
    integer,
    text,
    boolean,
    timestamp,
    json,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    avatarSeed: varchar('avatar_seed', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
    id: serial('id').primaryKey(),
    sign: json('sign').notNull(),
    mode: varchar('mode', { length: 20 }).notNull(),
    time: integer('time'),
    number: integer('number'),
    rounds: integer('rounds'),
    userId: integer('user_id').notNull().references(() => users.id),
    eps: varchar('eps', { length: 100 }),
    modifications: json('modifications').notNull(),
    unexpectedEnd: boolean('unexpected_end'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));
