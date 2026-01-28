import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { Server as SocketIOServer } from "socket.io";
import { User, insertLdapSettingsSchema, insertRewardSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAudioRoutes } from "./replit_integrations/audio";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

import { GoogleGenAI } from "@google/genai";

// Lazy-initialize Gemini AI to avoid constructor errors during startup if keys are missing
let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    const key = process.env.GOOGLE_API_KEY || 
                process.env.AI_INTEGRATIONS_GEMINI_API_KEY || 
                "REQUIRED_FOR_CONSTRUCTOR";
    
    const options: { apiKey: string; httpOptions?: { apiVersion: string; baseUrl: string } } = {
      apiKey: key,
    };

    // Apply Replit AI Integrations settings if using them
    if (key === process.env.AI_INTEGRATIONS_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
      options.httpOptions = {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      };
    }
    
    aiInstance = new GoogleGenAI(options);
  }
  return aiInstance;
}

async function generateContent(prompt: string): Promise<string> {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
  });
  return response.text || "";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Register AI Integrations routes
  registerImageRoutes(app);
  registerAudioRoutes(app);

  // --- AI Daily Content Generation ---

  app.get("/api/ai/daily-content", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const user = req.user as User;
      const department = (req.query.department as string) || user.department;
      const today = new Date().toISOString().split('T')[0];

      // Check if content already exists for today for this department
      const existingContent = await storage.getDailyContent(department, today);
      if (existingContent) {
        const allTerms = await storage.getTerms(department);
        const term = allTerms.find(t => t.id === existingContent.termId);
        // Mark as learned if not already
        if (term) {
          await storage.markTermAsLearned(user.id, term.id);
        }
        return res.json({
          term,
          quiz: existingContent.quizData
        });
      }

      // Get list of terms the user has already learned to avoid repetition
      const learnedTermsWithDetails = await storage.getUserLearnedTermsWithDetails(user.id);
      const learnedTermsList = learnedTermsWithDetails.map(lt => lt.term.term);
      
      // Create exclusion list for the prompt
      const exclusionNote = learnedTermsList.length > 0 
        ? `\n\nIMPORTANT: The user has already learned these terms, so DO NOT repeat any of them: ${learnedTermsList.join(", ")}.`
        : "";

      // Generate new content using Gemini
      const prompt = `You are an expert in the ${department} department of a telecom operator. 
      1. Generate a "Word of the Day" for this department. It should be a technical or professional term.
      Provide the 'term', 'definition', and a 'example' sentence.
      2. Generate a set of 5 fun, Kahoot-style multiple choice questions about this term and related topics in ${department}. 
      For each question, provide: 'question', 'options' (array of 4), 'correctAnswer' (one of options), and 'funFact'.
      ${exclusionNote}
      
      Format your response as a JSON object:
      {
        "term": { "term": "...", "definition": "...", "example": "..." },
        "quiz": [
          { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "funFact": "..." },
          ...
        ]
      }`;

      const contentText = await generateContent(prompt);
      // Remove markdown code blocks if present
      const jsonStr = contentText.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(jsonStr);

      // Save term
      const newTerm = await storage.createTerm({
        term: data.term.term,
        definition: data.term.definition,
        example: data.term.example,
        department
      });

      // Save daily content record
      await storage.createDailyContent({
        department,
        date: today,
        termId: newTerm.id,
        quizData: data.quiz
      });

      // Mark the new term as learned for this user
      await storage.markTermAsLearned(user.id, newTerm.id);

      res.json({
        term: newTerm,
        quiz: data.quiz
      });

    } catch (error) {
      console.error("Daily Content Gen Error:", error);
      res.status(500).json({ message: "Failed to generate daily content" });
    }
  });

  app.get("/api/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const departments = await storage.getUniqueDepartments();
      // Ensure current user's department is included even if no other users exist
      const user = req.user as User;
      if (!departments.includes(user.department)) {
        departments.push(user.department);
      }
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // --- Learned Terms API ---

  // Get all learned terms for the current user
  app.get("/api/user/learned-terms", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const user = req.user as User;
      const learnedTerms = await storage.getUserLearnedTermsWithDetails(user.id);
      res.json(learnedTerms);
    } catch (error) {
      console.error("Error fetching learned terms:", error);
      res.status(500).json({ message: "Failed to fetch learned terms" });
    }
  });

  // Mark a term as learned
  app.post("/api/user/learned-terms/:termId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const user = req.user as User;
      const termId = parseInt(req.params.termId);
      const learned = await storage.markTermAsLearned(user.id, termId);
      res.json(learned);
    } catch (error) {
      console.error("Error marking term as learned:", error);
      res.status(500).json({ message: "Failed to mark term as learned" });
    }
  });

  // --- API Routes ---

  // Generate Avatar
  app.post("/api/user/generate-avatar", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const prompt = `A stylized professional telecom employee avatar, flat design, modern corporate style, friendly expression, vibrant colors.`;
      
      const { generateImage } = await import("./replit_integrations/image/client");
      const avatarUrl = await generateImage(prompt);
      
      await db.update(users).set({ avatarUrl }).where(eq(users.id, (req.user as User).id));
      res.json({ avatarUrl });
    } catch (err) {
      console.error("Avatar Gen Error:", err);
      res.status(500).json({ message: "Failed to generate avatar" });
    }
  });

  // Kahoot-style Quiz Generation (Gemini Emulation)
  app.post("/api/ai/quiz-game", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { topic = "telecom" } = req.body;
      
      const prompt = `Generate a set of 5 fun, Kahoot-style multiple choice questions about ${topic}. 
      Make them engaging and educational. 
      For each question, provide:
      1. question
      2. options (array of 4)
      3. correctAnswer (one of the options)
      4. funFact (a short educational fact about the answer)
      Format as a JSON array of objects.`;

      const content = await generateContent(prompt);
      if (!content) throw new Error("No response from AI");
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(jsonStr);
      
      res.json(questions);
    } catch (error) {
      console.error("Quiz Game Gen Error:", error);
      res.status(500).json({ message: "Failed to generate game quiz" });
    }
  });

  // Terms
  app.get(api.terms.list.path, async (req, res) => {
    const department = req.query.department as string | undefined;
    const terms = await storage.getTerms(department);
    res.json(terms);
  });

  app.post(api.terms.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.terms.create.input.parse(req.body);
      const term = await storage.createTerm(input);
      res.status(201).json(term);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Quizzes
  app.post(api.quizzes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.quizzes.create.input.parse(req.body);
      const quiz = await storage.createQuiz(input);
      const user = req.user as User;
      
      if (quiz.score > 0) {
        // Award 10 points for completing a quiz
        await storage.addPoints(user.id, 10, "Quiz completed");
        await storage.updateUserStats(user.id, quiz.score, 1);
      } else {
         await storage.updateUserStats(user.id, 0, 0);
      }

      res.status(201).json(quiz);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json(err);
      }
      throw err;
    }
  });

  app.get(api.quizzes.history.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const history = await storage.getQuizHistory((req.user as User).id);
    res.json(history);
  });

  // Leaderboard
  app.get(api.leaderboard.list.path, async (req, res) => {
    const leaderboard = await storage.getLeaderboard();
    res.json(leaderboard);
  });

  // Badges
  app.get(api.badges.list.path, async (req, res) => {
    const badges = await storage.getBadges();
    res.json(badges);
  });

  app.get(api.badges.userBadges.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const userBadges = await storage.getUserBadges((req.user as User).id);
    res.json(userBadges);
  });

  // AI Duel
  app.post(api.ai.duel.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { topic, difficulty } = req.body;
      
      const prompt = `Generate a multiple-choice question about telecom terms${topic ? ` related to ${topic}` : ''}. 
      Difficulty: ${difficulty}. 
      Format: JSON object with 'question', 'options' (array of 4 strings), and 'correctAnswer' (string, must be one of the options).
      Focus on terms like ARPU, Churn, 5G, KPI, etc.`;

      const content = await generateContent(prompt);
      if (!content) throw new Error("No response from AI");
      
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(jsonStr);
      res.json(result);

    } catch (error) {
      console.error("AI Duel Error:", error);
      res.status(500).json({ message: "Failed to generate duel question" });
    }
  });


  // --- Socket.IO Setup ---
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  // --- TTS Route ---
  app.post("/api/tts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { text } = req.body;
      if (!text) return res.status(400).send("Text is required");
      
      const user = req.user as User;
      await storage.addPoints(user.id, 5, "Listened to text");

      const { textToSpeech } = await import("./replit_integrations/audio/client");
      const audioBuffer = await textToSpeech(text);
      res.set("Content-Type", "audio/wav");
      res.send(audioBuffer);
    } catch (err) {
      console.error("TTS Error:", err);
      res.status(500).send("Failed to generate speech");
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("join_duel", (data) => {
      socket.join("duel_room");
      io.to("duel_room").emit("player_joined", { id: socket.id });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  // LDAP Settings
  app.get("/api/admin/ldap-settings", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    const settings = await storage.getLdapSettings();
    res.json(settings);
  });

  app.post("/api/admin/ldap-settings", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    try {
      const input = insertLdapSettingsSchema.parse(req.body);
      const settings = await storage.updateLdapSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json(err);
      }
      throw err;
    }
  });

  // Admin: View all users
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Rewards
  app.get("/api/rewards", async (req, res) => {
    const rewards = await storage.getRewards();
    res.json(rewards);
  });

  app.post("/api/admin/rewards", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    try {
      const input = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(input);
      res.status(201).json(reward);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json(err);
      }
      throw err;
    }
  });

  app.post("/api/admin/award-reward", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    const { userId, rewardId } = req.body;
    const userReward = await storage.awardReward(userId, rewardId);
    res.status(201).json(userReward);
  });

  // Admin: Manually award badge
  app.post("/api/admin/award-badge", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    const { userId, badgeId } = req.body;
    const userBadge = await storage.awardBadge(userId, badgeId);
    res.status(201).json(userBadge);
  });

  // Admin: LDAP Sync (Stub)
  app.post("/api/admin/ldap-sync", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    res.json({ message: "LDAP sync initiated", userCount: 150 });
  });

  // Admin: Get all badges
  app.get("/api/admin/badges", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    const badges = await storage.getBadges();
    res.json(badges);
  });

  // --- Points API ---
  app.post("/api/user/points", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { points, reason } = req.body;
      const user = req.user as User;
      const updatedUser = await storage.addPoints(user.id, points, reason);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error adding points:", error);
      res.status(500).json({ message: "Failed to add points" });
    }
  });

  // --- Seed Data ---
  await seedData();

  return httpServer;
}

async function seedData() {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    await storage.createUser({
      username: "admin",
      password: "admin_password",
      fullName: "Admin User",
      email: "admin@example.com",
      department: "Governance, Risk, and Compliance",
      role: "admin"
    });
    console.log("Seeded admin user");
  }

  const existingEmployee = await storage.getUserByUsername("employee1");
  if (!existingEmployee) {
    await storage.createUser({
      username: "employee1",
      password: "employee_password",
      fullName: "Regular Employee",
      email: "employee@example.com",
      department: "Engineering",
      role: "employee"
    });
    console.log("Seeded employee user");
  }

  // Terms are now generated dynamically via Gemini API - no seed data needed

  const existingBadges = await storage.getBadges();
  if (existingBadges.length === 0) {
    const badgesData = [
      { name: "First Steps", description: "Completed your first quiz", icon: "footprints", condition: "quiz:1" },
      { name: "Streak Master", description: "Reached a 7-day streak", icon: "flame", condition: "streak:7" },
      { name: "Terminator", description: "Learned 50 terms", icon: "skull", condition: "terms:50" },
      { name: "Duelist", description: "Won 5 duels", icon: "swords", condition: "duels:5" },
      { name: "Shield", description: "Earned 300 points", icon: "shield", condition: "points:300" },
      { name: "Medium Shield", description: "Earned 500 points", icon: "shield-check", condition: "points:500" },
      { name: "Bronze Shield", description: "Earned 1000 points", icon: "shield-plus", condition: "points:1000" },
    ];
    for (const b of badgesData) {
      await storage.createBadge(b);
    }
    console.log("Seeded badges");
  }
}
