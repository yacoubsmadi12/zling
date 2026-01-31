import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Term } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ArrowLeft, RefreshCw, CheckCircle2, Lightbulb, Zap } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface CrosswordCell {
  char: string;
  isBlocked: boolean;
  acrossNum?: number;
  downNum?: number;
  userChar: string;
  x: number;
  y: number;
}

interface WordPlacement {
  word: string;
  definition: string;
  x: number;
  y: number;
  direction: "across" | "down";
  num: number;
}

export default function CrosswordGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [grid, setGrid] = useState<CrosswordCell[][]>([]);
  const [placements, setPlacements] = useState<WordPlacement[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ x: number, y: number } | null>(null);
  const [isWon, setIsWon] = useState(false);

  const { data: terms, isLoading } = useQuery<Term[]>({
    queryKey: ["/api/terms", user?.department],
    enabled: !!user?.department
  });

  const addPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      await apiRequest("POST", "/api/user/points", { points, reason: "Crossword Challenge Completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  });

  useEffect(() => {
    if (terms && terms.length >= 5) {
      generatePuzzle(terms);
    }
  }, [terms]);

  const generatePuzzle = (availableTerms: Term[]) => {
    // Simple crossword generation logic
    const size = 12;
    const newGrid: CrosswordCell[][] = Array(size).fill(null).map((_, y) => 
      Array(size).fill(null).map((_, x) => ({
        char: "",
        isBlocked: true,
        userChar: "",
        x,
        y
      }))
    );

    const shuffled = [...availableTerms].sort(() => Math.random() - 0.5).slice(0, 8);
    const newPlacements: WordPlacement[] = [];
    let wordNum = 1;

    // Filter terms to ensure they have content
    const validTerms = shuffled.filter(t => t.term && t.term.trim().length > 0);
    if (validTerms.length === 0) {
      console.error("No valid terms found for crossword");
      return;
    }

    // Place first word in middle across
    const first = validTerms[0];
    const firstWord = first.term.toUpperCase().replace(/[^A-Z]/g, "");
    if (!firstWord) return;

    const startX = Math.max(0, Math.floor((size - firstWord.length) / 2));
    const startY = Math.floor(size / 2);

    for (let i = 0; i < firstWord.length; i++) {
      newGrid[startY][startX + i] = {
        char: firstWord[i],
        isBlocked: false,
        userChar: "",
        acrossNum: i === 0 ? wordNum : undefined,
        x: startX + i,
        y: startY
      };
    }
    newPlacements.push({
      word: firstWord,
      definition: first.definition,
      x: startX,
      y: startY,
      direction: "across",
      num: wordNum++
    });

    // Try to place other words
    for (let i = 1; i < validTerms.length; i++) {
      const term = validTerms[i];
      const word = term.term.toUpperCase().replace(/[^A-Z]/g, "");
      if (!word) continue;
      
      let placed = false;
      // Try every intersection point
      for (let j = 0; j < word.length && !placed; j++) {
        for (let py = 0; py < size && !placed; py++) {
          for (let px = 0; px < size && !placed; px++) {
            if (!newGrid[py][px].isBlocked && newGrid[py][px].char === word[j]) {
              // Try placing vertically (down)
              const dStartX = px;
              const dStartY = py - j;
              
              if (dStartY >= 0 && dStartY + word.length < size) {
                let canPlace = true;
                for (let k = 0; k < word.length; k++) {
                  const targetY = dStartY + k;
                  if (targetY === py) continue;
                  
                  // Must be blocked or match existing char
                  if (!newGrid[targetY][px].isBlocked && newGrid[targetY][px].char !== word[k]) {
                    canPlace = false;
                    break;
                  }
                  
                  // Neighbors check (must not touch other words sideways)
                  if (newGrid[targetY][px].isBlocked) {
                    if ((px > 0 && !newGrid[targetY][px-1].isBlocked) || 
                        (px < size - 1 && !newGrid[targetY][px+1].isBlocked) ||
                        (k === 0 && dStartY > 0 && !newGrid[dStartY-1][px].isBlocked) ||
                        (k === word.length - 1 && dStartY + word.length < size && !newGrid[dStartY + word.length][px].isBlocked)) {
                      canPlace = false;
                      break;
                    }
                  }
                }

                if (canPlace) {
                  for (let k = 0; k < word.length; k++) {
                    const targetY = dStartY + k;
                    newGrid[targetY][px] = {
                      ...newGrid[targetY][px],
                      char: word[k],
                      isBlocked: false,
                      downNum: k === 0 ? wordNum : newGrid[targetY][px].downNum
                    };
                  }
                  newPlacements.push({
                    word,
                    definition: term.definition,
                    x: px,
                    y: dStartY,
                    direction: "down",
                    num: wordNum++
                  });
                  placed = true;
                }
              }
            }
          }
        }
      }
    }

    setGrid(newGrid);
    setPlacements(newPlacements);
    setIsWon(false);
  };

  const handleCellInput = (x: number, y: number, val: string) => {
    if (isWon) return;
    const newGrid = [...grid.map(row => [...row])];
    const char = val.toUpperCase().slice(-1);
    
    // Only allow letters
    if (char && !/[A-Z]/.test(char) && char !== "") return;
    
    newGrid[y][x].userChar = char;
    setGrid(newGrid);

    // Check win condition
    const allCorrect = newGrid.every(row => 
      row.every(cell => cell.isBlocked || cell.char === cell.userChar)
    );

    if (allCorrect && !isWon) {
      setIsWon(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      addPointsMutation.mutate(50);
      toast({
        title: "Puzzle Solved!",
        description: "Excellent work! You've earned 50 Z-Points.",
      });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading Challenge...</div>;

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Link href="/quiz">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Arena
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => terms && generatePuzzle(terms)}>
                <RefreshCw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-4 md:p-8 rounded-3xl border shadow-xl bg-card overflow-hidden">
              <div 
                className="grid gap-1 md:gap-2 mx-auto" 
                style={{ 
                  gridTemplateColumns: `repeat(${grid[0]?.length || 12}, minmax(0, 1fr))`,
                  maxWidth: "600px"
                }}
              >
                {grid.map((row, y) => row.map((cell, x) => (
                  <div 
                    key={`${x}-${y}`} 
                    className={cn(
                      "aspect-square relative rounded-sm md:rounded-md border flex items-center justify-center text-sm md:text-xl font-bold transition-all",
                      cell.isBlocked ? "bg-zinc-200/50 dark:bg-zinc-800/50 border-transparent" : "bg-white dark:bg-zinc-900 border-muted-foreground/20 shadow-sm",
                      selectedCell?.x === x && selectedCell?.y === y && "ring-2 ring-primary border-primary z-10"
                    )}
                  >
                    {!cell.isBlocked && (
                      <>
                        <span className="absolute top-0.5 left-0.5 text-[6px] md:text-[8px] text-muted-foreground leading-none font-medium">
                          {cell.acrossNum || cell.downNum}
                        </span>
                        <input
                          type="text"
                          className="w-full h-full text-center bg-transparent outline-none uppercase p-0"
                          value={cell.userChar}
                          onChange={(e) => handleCellInput(x, y, e.target.value)}
                          onFocus={() => setSelectedCell({ x, y })}
                        />
                      </>
                    )}
                  </div>
                )))}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-3xl border shadow-lg overflow-hidden">
                <CardHeader className="bg-primary/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="w-5 h-5 text-primary" /> Hints
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {placements.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/50 border border-muted-foreground/10 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                          {p.num}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-primary/70">{p.direction}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{p.definition}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <AnimatePresence>
                {isWon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-3xl bg-green-500 text-white text-center space-y-4 shadow-xl shadow-green-500/20"
                  >
                    <CheckCircle2 className="w-12 h-12 mx-auto" />
                    <h3 className="text-2xl font-bold">Mission Accomplished!</h3>
                    <p className="text-white/90">You've mastered the professional vocabulary for your department.</p>
                    <div className="flex items-center justify-center gap-2 font-bold text-lg">
                      <Zap className="w-5 h-5 fill-current" /> +50 Z-Points
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
