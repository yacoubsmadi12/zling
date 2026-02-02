import { db } from "./server/db";
import { users } from "./shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const departments = [
  "Finance",
  "Human Resources",
  "Engineering",
  "Marketing",
  "Sales",
  "Governance, Risk, and Compliance",
  "Consumer Business",
  "Legal and Regulatory",
  "Technology & Digital Innovation",
  "Corporate Communications & Sustainability",
  "Data Analytics and AI"
];

async function seed() {
  console.log("Seeding test users...");
  const password = await hashPassword("password123");
  
  for (const dept of departments) {
    const username = dept.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_user";
    try {
      await db.insert(users).values({
        username,
        password,
        fullName: `${dept} Test User`,
        email: `${username}@example.com`,
        department: dept,
        role: "employee",
        points: Math.floor(Math.random() * 500),
      }).onConflictDoNothing();
      console.log(`Created user for ${dept}: ${username}`);
    } catch (err) {
      console.error(`Failed to create user for ${dept}:`, err);
    }
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed();
