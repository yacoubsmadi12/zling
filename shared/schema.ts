import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export * from "./models/chat"; // Export chat schema for integration

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Employee ID from LDAP
  password: text("password"),
  fullName: text("full_name"),
  email: text("email"),
  department: text("department").notNull(),
  points: integer("points").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  lastLoginDate: timestamp("last_login_date").defaultNow(),
  role: text("role").default("employee").notNull(), // employee or admin
  avatarUrl: text("avatar_url"),
  wordsLearned: integer("words_learned").default(0).notNull(),
  avgQuizScore: integer("avg_quiz_score").default(0).notNull(),
});

export const ldapSettings = pgTable("ldap_settings", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  bindDn: text("bind_dn").notNull(),
  bindPassword: text("bind_password").notNull(),
  baseDn: text("base_dn").notNull(),
  adminGroup: text("admin_group").default("Learning_Admins").notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
});

export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rewardId: integer("reward_id").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow(),
});

export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  example: text("example").notNull(),
  department: text("department").notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), 
  type: text("type").notNull(), 
  score: integer("score").notNull(),
  date: timestamp("date").defaultNow(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), 
  condition: text("condition").notNull(), 
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const dailyContent = pgTable("daily_content", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  termId: integer("term_id").notNull(),
  quizData: jsonb("quiz_data").notNull(), // Array of 5 questions
});

// Track which terms each user has learned to prevent repetition
export const userLearnedTerms = pgTable("user_learned_terms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  termId: integer("term_id").notNull(),
  learnedAt: timestamp("learned_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  quizzes: many(quizzes),
  badges: many(userBadges),
  rewards: many(userRewards),
}));

export const rewardRelations = relations(rewards, ({ many }) => ({
  users: many(userRewards),
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [userRewards.rewardId],
    references: [rewards.id],
  }),
}));

export const badgeRelations = relations(badges, ({ many }) => ({
  users: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, points: true, streak: true, lastLoginDate: true, role: true });
export const insertLdapSettingsSchema = createInsertSchema(ldapSettings).omit({ id: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true });
export const insertTermSchema = createInsertSchema(terms).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, date: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Term = typeof terms.$inferSelect;
export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type LdapSettings = typeof ldapSettings.$inferSelect;
export type InsertLdapSettings = z.infer<typeof insertLdapSettingsSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type UserReward = typeof userRewards.$inferSelect;
export type UserLearnedTerm = typeof userLearnedTerms.$inferSelect;
