import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, Swords, Users, Sparkles } from "lucide-react";

const modes = [
  {
    id: "ai-duel",
    title: "Term Duel (AI)",
    desc: "Battle against an AI opponent to test your knowledge.",
    icon: Brain,
    color: "from-purple-500 to-indigo-600",
    href: "/quiz/ai-duel"
  },
  {
    id: "daily",
    title: "Daily Mix",
    desc: "Your daily dose of random questions to keep streaks alive.",
    icon: Sparkles,
    color: "from-orange-400 to-red-500",
    href: "/quiz/daily"
  },
  {
    id: "pvp",
    title: "Live Battle",
    desc: "Challenge a colleague in real-time (Coming Soon).",
    icon: Swords,
    color: "from-blue-400 to-blue-600",
    href: "#",
    disabled: true
  },
];

export default function QuizCenter() {
  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold mb-4">Battle Arena</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose your challenge mode. Earn points, badges, and glory on the leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modes.map((mode, idx) => (
              <Link key={mode.id} href={mode.disabled ? "#" : mode.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`
                    relative h-full min-h-[200px] rounded-3xl p-6 text-white overflow-hidden shadow-lg
                    bg-gradient-to-br ${mode.color}
                    ${mode.disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer hover:scale-105 transition-transform"}
                  `}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md mb-4">
                      <mode.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{mode.title}</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{mode.desc}</p>
                    </div>
                  </div>
                  
                  {/* Decorative background circle */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
