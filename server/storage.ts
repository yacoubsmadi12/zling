import { db } from "./db";
import { users, terms, quizzes, badges, userBadges, type User, type InsertUser, type Term, type InsertTerm, type Quiz, type InsertQuiz, type Badge, type InsertBadge, type UserBadge } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string; fullName?: string; email?: string }): Promise<User>;
  updateUserStats(userId: number, points: number, streakIncrement: number): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Terms
  getTerms(department?: string): Promise<Term[]>;
  createTerm(term: InsertTerm): Promise<Term>;

  // Quizzes
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizHistory(userId: number): Promise<Quiz[]>;

  // Leaderboard
  getLeaderboard(): Promise<User[]>;

  // Badges
  getBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getUserBadges(userId: number): Promise<UserBadge[]>;
  awardBadge(userId: number, badgeId: number): Promise<UserBadge>;
  
  // LDAP Settings
  getLdapSettings(): Promise<LdapSettings | undefined>;
  updateLdapSettings(settings: InsertLdapSettings): Promise<LdapSettings>;

  // Rewards
  getRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  awardReward(userId: number, rewardId: number): Promise<UserReward>;
  getUserRewards(userId: number): Promise<UserReward[]>;

  // Session
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { role?: string; fullName?: string; email?: string }): Promise<User> {
    const { username, department, role, fullName, email } = insertUser;
    const [user] = await db.insert(users).values({
      username,
      department,
      role: role || "employee",
      fullName: fullName || null,
      email: email || null,
    }).returning();
    return user;
  }

  async updateUserStats(userId: number, points: number, streakIncrement: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        points: sql`points + ${points}`,
        streak: streakIncrement === 0 ? 0 : sql`streak + ${streakIncrement}`
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Term methods
  async getTerms(department?: string): Promise<Term[]> {
    if (department) {
      return db.select().from(terms).where(eq(terms.department, department));
    }
    return db.select().from(terms);
  }

  async createTerm(term: InsertTerm): Promise<Term> {
    const [newTerm] = await db.insert(terms).values(term).returning();
    return newTerm;
  }

  // Quiz methods
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getQuizHistory(userId: number): Promise<Quiz[]> {
    return db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.date));
  }

  // Leaderboard
  async getLeaderboard(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.points)).limit(50);
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async awardBadge(userId: number, badgeId: number): Promise<UserBadge> {
    const [badge] = await db.insert(userBadges).values({ userId, badgeId }).returning();
    return badge;
  }

  // LDAP Settings
  async getLdapSettings(): Promise<LdapSettings | undefined> {
    const [settings] = await db.select().from(ldapSettings).limit(1);
    return settings;
  }

  async updateLdapSettings(settings: InsertLdapSettings): Promise<LdapSettings> {
    const existing = await this.getLdapSettings();
    if (existing) {
      const [updated] = await db.update(ldapSettings).set(settings).where(eq(ldapSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(ldapSettings).values(settings).returning();
    return created;
  }

  // Rewards
  async getRewards(): Promise<Reward[]> {
    return db.select().from(rewards);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async awardReward(userId: number, rewardId: number): Promise<UserReward> {
    const [userReward] = await db.insert(userRewards).values({ userId, rewardId }).returning();
    return userReward;
  }

  async getUserRewards(userId: number): Promise<UserReward[]> {
    return db.select().from(userRewards).where(eq(userRewards.userId, userId));
  }
}

export const storage = new DatabaseStorage();
