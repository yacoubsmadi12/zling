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
  const { loginMutation, registerMutation, user } = useAuth();
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
            <p className="text-muted-foreground">Gamified vocabulary for telecom pros.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-none shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to continue your streak.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-none shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Join your department and start competing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RegisterForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
        <Label htmlFor="username">Username</Label>
        <Input 
          id="username"
          placeholder="e.g. telecom_pro" 
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

function RegisterForm() {
  const { registerMutation } = useAuth();
  const [formData, setFormData] = useState({ 
    username: "", 
    password: "", 
    department: "" 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ ...formData, points: 0, streak: 0, lastLoginDate: new Date(), isAdmin: false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-username">Username</Label>
        <Input 
          id="reg-username"
          placeholder="Choose a unique username" 
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select 
          value={formData.department} 
          onValueChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input 
          id="reg-password" 
          type="password" 
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold py-6 group"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <Loader2 className="animate-spin mr-2" /> 
        ) : (
          <span className="flex items-center">
            Create Account <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </Button>
    </form>
  );
}
