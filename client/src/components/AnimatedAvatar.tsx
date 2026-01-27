import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";

interface AvatarProps {
  department: string;
  textToSpeak?: string;
  onSpeakEnd?: () => void;
}

const departmentPrompts: Record<string, string> = {
  "Finance": "A professional male finance officer in a sharp suit, wearing glasses, holding a tablet with charts, friendly smile, clean office background.",
  "Human Resources": "A friendly female HR manager, professional business casual attire, warm expression, modern office setting.",
  "Engineering": "A focused male network engineer wearing a tech polo and a headset, standing in front of server racks.",
  "Marketing": "A creative female marketing specialist, trendy office wear, energetic pose, bright colorful studio background.",
  "Sales": "A confident male sales executive, professional suit, optimistic expression, modern glass office background.",
  "Governance, Risk, and Compliance": "A serious but approachable female compliance officer, professional attire, holding a folder.",
  "Consumer Business": "A friendly retail manager, professional uniform, standing in a modern store environment.",
  "Legal and Regulatory": "A dignified male lawyer, formal suit, standing in a library-like office.",
  "Technology & Digital Innovation": "A tech-savvy female innovator, wearing a futuristic headset, digital holographic background.",
  "Corporate Communications & Sustainability": "A professional female spokesperson, business attire, standing in a green eco-friendly office.",
  "Data Analytics and AI": "A male data scientist, casual tech wear, standing in front of multiple monitors with data visualizations."
};

export function AnimatedAvatar({ department, textToSpeak, onSpeakEnd }: AvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Generate avatar if not already done
  useEffect(() => {
    let isMounted = true;
    async function getAvatar() {
      setIsGenerating(true);
      try {
        const prompt = departmentPrompts[department] || "A professional office employee, friendly expression, high quality 3D render style.";
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `3D stylized character: ${prompt}` })
        });
        
        if (!res.ok) throw new Error("Failed to generate image");
        
        const data = await res.json();
        if (isMounted && data.b64_json) {
          setAvatarUrl(`data:image/png;base64,${data.b64_json}`);
        }
      } catch (err) {
        console.error("Avatar Gen Error:", err);
        // Fallback to a generic icon or color if image generation fails
        if (isMounted) {
          setAvatarUrl(null);
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    }
    getAvatar();
    return () => { isMounted = false; };
  }, [department]);

  const handleSpeak = async () => {
    if (!textToSpeak || isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak })
      });
      
      if (!response.ok) throw new Error("TTS request failed");
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        onSpeakEnd?.();
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error("Speak Error:", err);
      setIsSpeaking(false);
      
      // Fallback to speech synthesis if API fails
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onSpeakEnd?.();
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center shadow-xl">
        {isGenerating ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        ) : avatarUrl ? (
          <motion.img 
            src={avatarUrl} 
            alt="Department Avatar"
            className="w-full h-full object-cover"
            animate={isSpeaking ? {
              scale: [1, 1.05, 1],
              rotate: [0, 1, -1, 0]
            } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="text-4xl mb-2 opacity-20">👤</div>
            <div className="text-[10px] text-muted-foreground leading-tight">Avatar not available</div>
          </div>
        )}
        
        {isSpeaking && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="w-full h-full border-4 border-primary rounded-full animate-ping opacity-20" />
          </div>
        )}
      </div>
      
      {textToSpeak && (
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="gap-2 rounded-full px-6 hover-elevate shadow-md"
        >
          {isSpeaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
          {isSpeaking ? "Speaking..." : "Listen to Avatar"}
        </Button>
      )}
    </div>
  );
}
