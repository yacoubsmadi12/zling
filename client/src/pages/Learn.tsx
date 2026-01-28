import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Megaphone, 
  Briefcase, 
  Code2, 
  Scale, 
  Users, 
  Wallet, 
  ShieldCheck, 
  ShoppingBag, 
  Cpu, 
  MessageSquareShare 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const departments = [
  { id: "Finance", icon: Wallet, color: "bg-emerald-500 text-white", desc: "Banking, accounts, and financial management." },
  { id: "Human Resources", icon: Users, color: "bg-green-500 text-white", desc: "Talent, culture, and organizational dev." },
  { id: "Engineering", icon: Code2, color: "bg-red-500 text-white", desc: "Technical specs, protocols, and networks." },
  { id: "Marketing", icon: Megaphone, color: "bg-pink-500 text-white", desc: "Campaigns, reach, and branding terms." },
  { id: "Sales", icon: Briefcase, color: "bg-blue-500 text-white", desc: "Negotiation, pipelines, and closing deals." },
  { id: "Governance, Risk, and Compliance", icon: ShieldCheck, color: "bg-slate-600 text-white", desc: "Regulations, risk management, and compliance." },
  { id: "Consumer Business", icon: ShoppingBag, color: "bg-orange-500 text-white", desc: "Retail, consumer behavior, and business models." },
  { id: "Legal and Regulatory", icon: Scale, color: "bg-amber-600 text-white", desc: "Compliance, contracts, and regulations." },
  { id: "Technology & Digital Innovation", icon: Cpu, color: "bg-cyan-500 text-white", desc: "Cutting-edge tech and digital transformation." },
  { id: "Corporate Communications & Sustainability", icon: MessageSquareShare, color: "bg-teal-500 text-white", desc: "External relations and ESG initiatives." },
  { id: "Data Analytics and AI", icon: Code2, color: "bg-indigo-600 text-white", desc: "Big data, machine learning, and AI insights." },
];

export default function Learn() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toDateString() : null;
      const today = new Date().toDateString();
      
      if (lastLogin !== today) {
        apiRequest("POST", "/api/user/points", { points: 5, reason: "Daily login" })
          .then(() => queryClient.invalidateQueries({ queryKey: ["/api/user"] }));
      }
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Study Center</h1>
            <p className="text-muted-foreground">Select a department to start learning terms.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((dept, index) => {
              const isUserDept = user.department === dept.id;
              return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "relative overflow-hidden group bg-card/40 backdrop-blur-sm rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 p-6",
                      isUserDept ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background bg-card/60" : ""
                    )}
                  >
                    {isUserDept && (
                      <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                        YOUR DEPT
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <Link href={`/flashcards/${dept.id}`} className="cursor-pointer">
                        <div className={cn("p-4 rounded-xl shadow-lg shadow-black/5", dept.color, "hover:scale-110 transition-transform duration-300")}>
                          <dept.icon className="w-8 h-8" />
                        </div>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/flashcards/${dept.id}`} className="cursor-pointer">
                            <h3 className="text-xl font-bold hover:text-primary transition-colors">{dept.id}</h3>
                          </Link>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{dept.desc}</p>
                        <Link href={`/quiz/daily?department=${encodeURIComponent(dept.id)}`}>
                          <Button size="sm" variant="outline" className="relative z-20 hover-elevate no-default-hover-elevate">
                            Take Quiz
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
