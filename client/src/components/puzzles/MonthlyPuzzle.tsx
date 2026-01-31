import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Send, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader } from "@/components/Loader";

import { MonthlyPuzzle as MonthlyPuzzleType } from "@shared/schema";

export function MonthlyPuzzle() {
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const { data, isLoading } = useQuery<{ puzzle: MonthlyPuzzleType; solved: boolean }>({
    queryKey: ["/api/ai/monthly-puzzle"],
  });

  const solveMutation = useMutation({
    mutationFn: async (answer: string) => {
      const res = await apiRequest("POST", "/api/ai/monthly-puzzle/solve", {
        puzzleId: data?.puzzle.id,
        answer,
      });
      return res.json() as Promise<{ correct: boolean; message: string }>;
    },
    onSuccess: (data) => {
      if (data.correct) {
        toast({ title: "Correct!", description: "You've earned 100 points!", variant: "default" });
        queryClient.invalidateQueries({ queryKey: ["/api/ai/monthly-puzzle"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else {
        toast({ title: "Incorrect", description: data.message, variant: "destructive" });
      }
    },
  });

  if (isLoading) return <Loader />;
  if (!data?.puzzle) return null;

  const { puzzle, solved } = data;

  return (
    <Card className="overflow-hidden border-2 border-primary/20 rounded-[2rem] bg-card/50 backdrop-blur-sm">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img 
          src={puzzle.imageUrl || undefined} 
          alt="Monthly Puzzle" 
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">
              Monthly Quest
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">
              100 Points
            </span>
          </div>
          <h2 className="text-3xl font-display font-bold text-white drop-shadow-md">
            {puzzle.title}
          </h2>
        </div>
      </div>

      <CardContent className="p-8 space-y-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/30 pl-4">
            "{puzzle.description}"
          </p>
        </div>

        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Brain className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">The Challenge</h3>
          </div>
          <p className="text-xl font-medium leading-snug">
            {(puzzle.puzzleData as any).question}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {solved ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 p-6 bg-green-500/10 border-2 border-green-500/20 rounded-2xl text-green-600 font-bold"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>QUEST COMPLETED - 100 PTS EARNED</span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Input
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="h-14 rounded-xl text-lg border-2 focus-visible:ring-primary/20"
                onKeyDown={(e) => e.key === "Enter" && solveMutation.mutate(answer)}
              />
              <Button 
                onClick={() => solveMutation.mutate(answer)}
                disabled={solveMutation.isPending || !answer.trim()}
                className="h-14 px-8 rounded-xl text-lg font-bold group"
              >
                {solveMutation.isPending ? "SUBMITTING..." : (
                  <>
                    SOLVE <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pt-4">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini Intelligence
          <Sparkles className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
