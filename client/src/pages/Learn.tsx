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

const departments = [
  { id: "Finance", icon: Wallet, color: "bg-emerald-100 text-emerald-600", desc: "Banking, accounts, and financial management." },
  { id: "Human Resources", icon: Users, color: "bg-green-100 text-green-600", desc: "Talent, culture, and organizational dev." },
  { id: "Engineering", icon: Code2, color: "bg-purple-100 text-purple-600", desc: "Technical specs, protocols, and networks." },
  { id: "Marketing", icon: Megaphone, color: "bg-pink-100 text-pink-600", desc: "Campaigns, reach, and branding terms." },
  { id: "Sales", icon: Briefcase, color: "bg-blue-100 text-blue-600", desc: "Negotiation, pipelines, and closing deals." },
  { id: "Governance, Risk, and Compliance", icon: ShieldCheck, color: "bg-slate-100 text-slate-600", desc: "Regulations, risk management, and compliance." },
  { id: "Consumer Business", icon: ShoppingBag, color: "bg-orange-100 text-orange-600", desc: "Retail, consumer behavior, and business models." },
  { id: "Legal and Regulatory", icon: Scale, color: "bg-amber-100 text-amber-600", desc: "Compliance, contracts, and regulations." },
  { id: "Technology & Digital Innovation", icon: Cpu, color: "bg-cyan-100 text-cyan-600", desc: "Cutting-edge tech and digital transformation." },
  { id: "Corporate Communications & Sustainability", icon: MessageSquareShare, color: "bg-teal-100 text-teal-600", desc: "External relations and ESG initiatives." },
  { id: "Data Analytics and AI", icon: Code2, color: "bg-indigo-100 text-indigo-600", desc: "Big data, machine learning, and AI insights." },
];

export default function Learn() {
  const { user } = useAuth();
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
                      "relative overflow-hidden group cursor-pointer bg-card rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 p-6",
                      isUserDept ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background" : ""
                    )}
                  >
                    {isUserDept && (
                      <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                        YOUR DEPT
                      </div>
                    )}
                    <Link href={`/flashcards/${dept.id}`} className="absolute inset-0 z-10" />
                    <div className="flex items-start gap-4">
                      <div className={cn("p-4 rounded-xl", dept.color, "group-hover:scale-110 transition-transform duration-300")}>
                        <dept.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{dept.id}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{dept.desc}</p>
                        <Link href={`/quiz/daily?department=${encodeURIComponent(dept.id)}`}>
                          <Button size="sm" variant="outline" className="relative z-20 hover-elevate">
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
