import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "@assets/hero_bg.jpg"; // Placeholder asset reference

export default function AuthPage() {
  const { loginMutation, user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Panel - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-primary mb-2">Zlingo</h1>
            <p className="text-muted-foreground">Authenticate using your Employee ID and Password.</p>
          </div>

          <Card className="border-none shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle>Company Login</CardTitle>
              <CardDescription>Enter your Employee ID to access the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Hero Visual */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-0" />
        <div className="relative z-10 text-white space-y-6 max-w-lg">
          <div className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="font-display text-5xl font-bold leading-tight">
            Master Telecom Lingo like a Pro
          </h2>
          <p className="text-lg text-zinc-300">
            Compete with colleagues, climb the leaderboard, and master industry terms with our gamified learning platform.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary mb-1">5+</div>
              <div className="text-sm text-zinc-400">Departments</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-secondary mb-1">1000+</div>
              <div className="text-sm text-zinc-400">Terms to learn</div>
            </div>
          </div>
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 transform -translate-x-1/3 translate-y-1/3 w-80 h-80 bg-secondary/30 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Employee ID</Label>
        <Input 
          id="username"
          placeholder="e.g. 12345" 
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password" 
          type="password" 
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Sign In"}
      </Button>
    </form>
  );
}
