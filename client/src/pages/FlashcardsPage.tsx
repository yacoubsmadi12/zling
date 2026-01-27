import { useState } from "react";
import { useParams, Link } from "wouter";
import { useTerms } from "@/hooks/use-terms";
import { Navigation } from "@/components/Navigation";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FlashcardsPage() {
  const { department } = useParams();
  const { data: terms, isLoading, error } = useTerms(department);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (isLoading) return <Loader />;
  if (error || !terms) return <div className="p-8 text-center text-red-500">Failed to load terms.</div>;
  if (terms.length === 0) return (
    <div className="flex min-h-screen bg-background items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">No terms found</h2>
        <Link href="/learn"><Button>Back to Learn</Button></Link>
      </div>
    </div>
  );

  const currentTerm = terms[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % terms.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + terms.length) % terms.length);
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 flex flex-col h-screen md:h-auto overflow-hidden">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          
          <div className="flex items-center gap-4 mb-8">
            <Link href="/learn">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold">{department} Flashcards</h1>
              <p className="text-muted-foreground text-sm">{currentIndex + 1} of {terms.length} terms</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[400px] perspective-1000">
            <motion.div
              className="relative w-full max-w-lg aspect-[4/3] cursor-pointer group"
              onClick={handleFlip}
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-card border-2 border-border shadow-2xl rounded-3xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 transition-colors">
                <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">Term</div>
                <h2 className="text-4xl font-bold text-primary break-words max-w-full">{currentTerm.term}</h2>
                <p className="mt-8 text-sm text-muted-foreground">Tap to reveal definition</p>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-primary/5 border-2 border-primary shadow-2xl rounded-3xl flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                <div className="text-xs font-bold tracking-widest text-primary uppercase mb-4">Definition</div>
                <p className="text-xl font-medium text-foreground mb-6 leading-relaxed">
                  {currentTerm.definition}
                </p>
                <div className="bg-background/50 p-4 rounded-xl text-sm italic text-muted-foreground">
                  "{currentTerm.example}"
                </div>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <Button variant="outline" size="lg" onClick={handlePrev} className="rounded-full w-14 h-14 p-0">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <Button variant="ghost" size="lg" onClick={handleFlip} className="rounded-full w-14 h-14 p-0 bg-secondary/10 text-secondary hover:bg-secondary/20">
              <RotateCcw className="w-6 h-6" />
            </Button>

            <Button variant="outline" size="lg" onClick={handleNext} className="rounded-full w-14 h-14 p-0">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}
