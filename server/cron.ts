import cron from "node-cron";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";

async function generateDailyContentForDepartment(department: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if content already exists
  const existing = await storage.getDailyContent(department, today);
  if (existing) return;

  const key = process.env.GOOGLE_API_KEY || 
              process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  
  if (!key) {
    console.error("Missing Gemini API Key for cron job");
    return;
  }

  const options: any = { apiKey: key };
  if (key === process.env.AI_INTEGRATIONS_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
    options.httpOptions = {
      apiVersion: "",
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    };
  }

  const genAI = new GoogleGenAI(options);
  // Using generativeModel instead of getGenerativeModel as per typical library structure or fixing based on LSP
  // Actually, checking standard @google/generative-ai, it is genAI.getGenerativeModel({ model: "..." })
  // The error "Property 'getGenerativeModel' does not exist on type 'GoogleGenAI'" suggests a different version or mock.
  // Given Replit's integration, let's stick to what routes.ts uses: ai.models.generateContent
  
  const prompt = `You are an expert in the ${department} department of a telecom operator. 
  1. Generate a "Word of the Day" for this department. It should be a technical or professional term.
  Provide the 'term', 'definition', and a 'example' sentence.
  2. Generate a set of 5 fun, Kahoot-style multiple choice questions about this term and related topics in ${department}. 
  For each question, provide: 'question', 'options' (array of 4), 'correctAnswer' (one of options), and 'funFact'.
  
  Format your response as a JSON object:
  {
    "term": { "term": "...", "definition": "...", "example": "..." },
    "quiz": [
      { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "funFact": "..." },
      ...
    ]
  }`;

  try {
    // Mimic the working implementation in routes.ts
    const response = await (genAI as any).models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const text = response.text || "";
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(jsonStr);

    const newTerm = await storage.createTerm({
      term: data.term.term,
      definition: data.term.definition,
      example: data.term.example,
      department
    });

    await storage.createDailyContent({
      department,
      date: today,
      termId: newTerm.id,
      quizData: data.quiz
    });
    
    console.log(`Generated daily content for ${department}`);
  } catch (error) {
    console.error(`Failed to generate content for ${department}:`, error);
  }
}

export function setupCronJobs() {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily content generation cron job...");
    const departments = await storage.getUniqueDepartments();
    for (const dept of departments) {
      await generateDailyContentForDepartment(dept);
    }
  });

  // Also run on startup to ensure today's content exists
  (async () => {
    const departments = await storage.getUniqueDepartments();
    for (const dept of departments) {
      await generateDailyContentForDepartment(dept);
    }
  })();
}
