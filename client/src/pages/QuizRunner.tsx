import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useAiDuel, useSubmitQuiz } from "@/hooks/use-quizzes";
import { Navigation } from "@/components/Navigation";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function QuizRunner() {
  const { mode } = useParams(); // 'ai-duel', 'daily', 'word-rush', 'listen-tap', 'survival', 'boss-fight'
  const { mutateAsync: fetchQuestion, isPending: isLoadingQuestion } = useAiDuel();
  const { mutate: submitResult } = useSubmitQuiz();
  const { toast } = useToast();
  const [search] = useState(window.location.search);
  const department = new URLSearchParams(search).get("department");

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionCache, setQuestionCache] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode === 'word-rush' ? 60 : 15);
  const [isPaused, setIsPaused] = useState(false);

  // Timer logic for Word Rush
  useEffect(() => {
    if (gameOver || isPaused || mode !== 'word-rush') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, isPaused, mode, score]);

  // General Timer logic for other modes
  useEffect(() => {
    if (gameOver || isPaused || mode === 'word-rush') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up for a single question
          handleAnswer(""); // Treat as wrong answer
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, isPaused, mode, currentQuestion]);

  // Load initial questions
  useEffect(() => {
    const initQuiz = async () => {
      try {
        if (mode === 'daily') {
          const res = await fetch(`/api/ai/daily-content?department=${encodeURIComponent(department || "")}`);
          if (!res.ok) throw new Error("Failed to fetch daily content");
          const data = await res.json();
          setQuestionCache(data.quiz);
          setCurrentQuestion(data.quiz[0]);
        } else if (['word-rush', 'listen-tap', 'survival', 'boss-fight', 'match-meaning'].includes(mode || "")) {
          const endpoint = mode === 'listen-tap' ? 'audio-tap' : mode;
          const res = await fetch(`/api/games/${endpoint}`);
          if (!res.ok) throw new Error("Failed to fetch game content");
          const data = await res.json();
          
          let formattedQuestions = data;
          if (['word-rush', 'survival', 'boss-fight', 'listen-tap'].includes(mode || "")) {
            formattedQuestions = data.map((term: any) => {
              const distractors = data
                .filter((t: any) => t.id !== term.id)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map((t: any) => t.definition);
              
              const options = [term.definition, ...distractors].sort(() => 0.5 - Math.random());
              
              return {
                id: term.id,
                question: mode === 'listen-tap' ? "What did you hear?" : `What is the meaning of "${term.term}"?`,
                term: term.term,
                options,
                correctAnswer: term.definition,
                funFact: term.example
              };
            });
          } else if (mode === 'match-meaning') {
            formattedQuestions = data.map((q: any) => ({
              id: q.id,
              question: `Match the meaning for: ${q.word}`,
              options: q.options,
              correctAnswer: q.correctMeaning,
              funFact: "Great job! Keep going."
            }));
          }
          
          setQuestionCache(formattedQuestions);
          setCurrentQuestion(formattedQuestions[0]);
        } else {
          // Prefetch first batch
          const res = await fetch("/api/ai/quiz-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              topic: department || "telecom",
              difficulty: mode === 'boss-fight' ? 'hard' : 'medium'
            })
          });
          if (!res.ok) throw new Error("Failed to prefetch questions");
          const data = await res.json();
          setQuestionCache(data);
          setCurrentQuestion(data[0]);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to load questions", variant: "destructive" });
      }
    };
    initQuiz();
  }, [mode, department]);

  const loadNewQuestion = async () => {
    const nextIdx = questionCount + 1;
    const isInfinite = ['word-rush', 'survival'].includes(mode || "");
    const maxQuestions = mode === 'boss-fight' ? 10 : (isInfinite ? 50 : 5);
    
    if (nextIdx >= maxQuestions || nextIdx >= questionCache.length) {
      finishGame(score);
      return;
    }

    setCurrentQuestion(questionCache[nextIdx]);
    setQuestionCount(nextIdx);
    setSelectedOption(null);
    setIsCorrect(null);
    if (mode !== 'word-rush') {
      setTimeLeft(15);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedOption || !currentQuestion) return;
    
    setSelectedOption(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      const timeBonus = mode === 'word-rush' ? 0 : Math.floor(timeLeft * 2);
      setScore(s => s + (mode === 'word-rush' ? 1 : 10 + timeBonus));
      confetti({ 
        particleCount: 100, 
        spread: 70, 
        origin: { y: 0.6 },
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
      });
    } else if (mode === 'survival') {
      setTimeout(() => finishGame(score), 1000);
      return;
    }

    setTimeout(() => {
      loadNewQuestion();
    }, mode === 'word-rush' ? 300 : 2500);
  };

  const finishGame = (finalScore: number) => {
    setGameOver(true);
    submitResult({
      type: mode || 'unknown',
      score: finalScore,
      userId: 0, // Backend handles user ID from session
    });
    
    // Award 5 points for additional quiz (non-daily) or 10 points for regular quiz completion
    // The points are awarded in the backend route, but we can add an extra trigger here if needed
    // In our case, the backend already adds 10 points on /api/quizzes creation if score > 0
    // We add 5 extra points specifically for "additional" quizzes if it's not the daily one
    if (mode !== 'daily' && finalScore > 0) {
      apiRequest("POST", "/api/user/points", { points: 5, reason: "Additional quiz completed" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/user"] }));
    }

    if (finalScore >= 40) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }
  };

  if (gameOver) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card w-full max-w-md p-8 rounded-3xl shadow-2xl text-center border-2 border-primary/10"
        >
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-8">You scored</p>
          <div className="text-6xl font-bold text-primary mb-8">{score}</div>
          
          <div className="space-y-4">
            <Link href="/quiz">
              <Button className="w-full py-6 text-lg rounded-xl">Play Again</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full py-6 text-lg rounded-xl">Back to Dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-2xl w-full space-y-8">
          
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Question {questionCount + 1}/5</span>
              <h1 className="text-xl font-bold capitalize">{mode?.replace('-', ' ')}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-xl ${timeLeft < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-primary text-primary'}`}>
                {timeLeft}
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold">
                {score} pts
              </div>
            </div>
          </div>

          <Progress value={(questionCount / 5) * 100} className="h-2" />

          {/* Question Card */}
          <AnimatePresence mode="wait">
            {isLoadingQuestion || !currentQuestion ? (
              <div className="h-64 flex items-center justify-center">
                <Loader />
              </div>
            ) : (
              <motion.div
                key={questionCount}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <div className="bg-card p-10 rounded-3xl shadow-xl border-b-8 border-primary/20">
                  <h2 className="text-3xl font-bold leading-relaxed text-center font-display">
                    {currentQuestion.question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentQuestion.options.map((option: string, idx: number) => {
                    const isSelected = selectedOption === option;
                    const isCorrectAnswer = option === currentQuestion.correctAnswer;
                    const colors = ["bg-blue-500", "bg-red-500", "bg-yellow-500", "bg-green-500"];
                    const icons = [
                      <div key="1" className="w-6 h-6 border-2 border-white rotate-45" />,
                      <div key="2" className="w-6 h-6 border-2 border-white rounded-full" />,
                      <div key="3" className="w-6 h-6 border-2 border-white" />,
                      <div key="4" className="w-6 h-6 border-2 border-white rounded-sm skew-x-12" />
                    ];

                    let buttonStyle = `${colors[idx]} text-white hover:brightness-110 shadow-lg translate-y-0`;
                    if (selectedOption) {
                      if (isSelected) {
                        buttonStyle = isCorrect 
                          ? "bg-green-600 ring-4 ring-green-400 scale-105 z-10"
                          : "bg-red-600 opacity-100 scale-95 grayscale-0";
                      } else if (isCorrectAnswer) {
                        buttonStyle = "bg-green-600 scale-105 z-10";
                      } else {
                        buttonStyle = "opacity-20 scale-90 grayscale";
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!selectedOption ? { scale: 1.02, translateY: -4 } : {}}
                        whileTap={!selectedOption ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(option)}
                        disabled={!!selectedOption}
                        className={`
                          p-8 rounded-2xl text-left font-bold text-xl transition-all duration-300
                          flex items-center gap-4 relative overflow-hidden
                          ${buttonStyle}
                        `}
                      >
                        <div className="flex-shrink-0 opacity-50">
                          {icons[idx]}
                        </div>
                        <span className="flex-1">{option}</span>
                        {selectedOption && isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            {isCorrect 
                              ? <CheckCircle2 className="w-8 h-8 text-white" />
                              : <XCircle className="w-8 h-8 text-white" />
                            }
                          </motion.div>
                        )}
                        {selectedOption && isCorrectAnswer && !isSelected && (
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                
                {selectedOption && currentQuestion.funFact && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/10 text-center"
                  >
                    <p className="text-sm font-bold text-primary uppercase mb-2">Did you know?</p>
                    <p className="text-lg italic text-muted-foreground">"{currentQuestion.funFact}"</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
