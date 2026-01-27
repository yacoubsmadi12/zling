import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { StatCard } from "@/components/StatCard";
import { Trophy, Flame, Zap, Target, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">
                Hello, <span className="text-primary">{user.username}</span>! 👋
              </h1>
              <p className="text-muted-foreground mt-1">Ready to master your telecom lingo today?</p>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-full border shadow-sm pr-4">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                {user.department[0]}
              </div>
              <span className="font-medium text-sm">{user.department} Dept.</span>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div variants={item}>
              <StatCard 
                label="Total Points" 
                value={user.points} 
                icon={Trophy} 
                color="primary"
                trend="+120 this week"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                label="Day Streak" 
                value={user.streak} 
                icon={Flame} 
                color="orange"
                trend="You're on fire!"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                label="Level" 
                value={Math.floor(user.points / 1000) + 1} 
                icon={Zap} 
                color="secondary"
                trend="Novice"
              />
            </motion.div>
          </motion.div>

          {/* Daily Challenge Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 text-white p-8 shadow-xl shadow-primary/20"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm">
                  <Target className="w-4 h-4" /> Daily Goal
                </div>
                <h2 className="text-3xl font-display font-bold">Complete Today's Quiz</h2>
                <p className="text-primary-foreground/80 max-w-md">
                  Earn double points by completing the daily mix of {user.department} terms.
                </p>
              </div>
              <Link href="/quiz">
                <button className="px-8 py-4 bg-white text-primary rounded-xl font-bold shadow-lg hover:bg-zinc-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  Start Quiz <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
            {/* Background decoration */}
            <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </motion.div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/learn">
              <div className="group cursor-pointer bg-card rounded-2xl p-6 border shadow-sm hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpenIcon />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Study Flashcards</h3>
                <p className="text-muted-foreground text-sm">Review terms specific to your department before taking quizzes.</p>
              </div>
            </Link>

            <Link href="/quiz">
              <div className="group cursor-pointer bg-card rounded-2xl p-6 border shadow-sm hover:border-secondary/50 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <SwordIcon />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-secondary transition-colors">AI Term Duel</h3>
                <p className="text-muted-foreground text-sm">Challenge the AI to a 1-on-1 vocabulary battle and earn badges.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// Simple icons for local use
function BookOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  );
}

function SwordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>
  );
}
