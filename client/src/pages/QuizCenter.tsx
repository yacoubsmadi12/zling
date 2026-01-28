import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, Swords, Sparkles, Timer, Zap, Volume2, ShieldAlert, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

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

const miniGames = [
  {
    id: "word-rush",
    title: "Word Rush",
    desc: "Score as many correct words as possible in 60s.",
    icon: Zap,
    color: "from-yellow-400 to-orange-500",
    points: "2x Points",
    badge: "Flash Speed",
    href: "/quiz/word-rush"
  },
  {
    id: "listen-tap",
    title: "Listen & Tap",
    desc: "Hear a word and quickly choose its meaning.",
    icon: Volume2,
    color: "from-cyan-400 to-blue-500",
    points: "50 Points",
    badge: "Sharp Ear",
    href: "/quiz/listen-tap"
  },
  {
    id: "survival",
    title: "Survival",
    desc: "Wrong = Elimination. How long can you last?",
    icon: ShieldAlert,
    color: "from-red-500 to-rose-700",
    points: "100 Points",
    badge: "Survivor",
    href: "/quiz/survival"
  },
  {
    id: "boss-fight",
    title: "Boss Fight",
    desc: "10 challenging questions vs the AI Boss.",
    icon: Skull,
    color: "from-slate-700 to-slate-900",
    points: "250 Points",
    badge: "Boss Slayer",
    href: "/quiz/boss-fight"
  },
];

export default function QuizCenter() {
  const currentDay = new Date().getDate();
  const daysLeft = 30 - currentDay;

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center">
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
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Monthly Challenges Section */}
          <div className="space-y-6 pt-8 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold">Monthly Challenges</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="text-primary font-bold">🔥 New games this month</span>
                  </p>
                </div>
              </div>
              <div className="bg-muted px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                ENDS IN {daysLeft} DAYS
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {miniGames.map((game, idx) => (
                <Link key={game.id} href={game.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className={cn(
                      "group relative h-full p-6 rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer bg-gradient-to-br text-white",
                      game.color
                    )}
                  >
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                          <game.icon className="w-6 h-6" />
                        </div>
                        <div className="text-[10px] font-bold bg-black/20 backdrop-blur-md px-2 py-1 rounded-full uppercase tracking-wider">
                          {game.badge}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1">{game.title}</h3>
                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">{game.desc}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs font-bold text-white/90">{game.points}</span>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-colors">
                          <Zap className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
