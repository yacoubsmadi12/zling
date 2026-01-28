import { useAuth } from "@/hooks/use-auth";
import { useUserBadges } from "@/hooks/use-gamification";
import { Navigation } from "@/components/Navigation";
import { Loader } from "@/components/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Calendar, Mail, Building, Award, Sparkles, Medal, Share2, Shield, ShieldCheck, ShieldPlus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user } = useAuth();
  const { data: userBadgesData, isLoading } = useUserBadges();
  const { data: allBadges } = useQuery({ queryKey: ["/api/badges"] });
  const { toast } = useToast();

  const handleShare = (badgeName: string) => {
    const text = `I just earned the ${badgeName} badge on Zlingo! I'm level ${Math.floor((user?.points || 0) / 1000) + 1} in my telecom learning journey.`;
    const url = window.location.origin;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedinUrl, '_blank');
  };

  const getBadgeIcon = (name: string) => {
    if (name.includes("Bronze Shield")) return <ShieldPlus className="w-8 h-8 text-amber-600" />;
    if (name.includes("Medium Shield")) return <ShieldCheck className="w-8 h-8 text-slate-400" />;
    if (name.includes("Shield")) return <Shield className="w-8 h-8 text-blue-500" />;
    return <Award className="w-8 h-8 text-primary" />;
  };

  const generateAvatarMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/generate-avatar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Success", description: "New avatar generated!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to generate avatar", 
        variant: "destructive" 
      });
    },
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Card */}
          <div className="relative bg-card rounded-3xl border shadow-lg overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary to-secondary opacity-90" />
            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6 flex justify-between items-end">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-card shadow-xl overflow-visible">
                    <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                    <AvatarFallback className="text-4xl">{user.username[0]}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full shadow-lg h-10 w-10 border-2 border-background"
                    onClick={() => generateAvatarMutation.mutate()}
                    disabled={generateAvatarMutation.isPending}
                  >
                    {generateAvatarMutation.isPending ? (
                      <Loader className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2 mb-2">
                  <UIBadge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20">
                    Level {Math.floor(user.points / 1000) + 1}
                  </UIBadge>
                  <UIBadge variant="outline" className="px-3 py-1 text-sm border-primary text-primary font-bold">
                    {user.points} Z-Points
                  </UIBadge>
                </div>
              </div>
              
              <h1 className="text-3xl font-display font-bold mb-2">{user.fullName || user.username}</h1>
              
              <div className="flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {user.department}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.username}@company.com
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(user.lastLoginDate || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-orange-500" />
                Badges & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader />
              ) : !userBadgesData || userBadgesData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No badges earned yet. Keep playing!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {userBadgesData.map((ub: any) => {
                    const badge = allBadges?.find((b: any) => b.id === ub.badgeId);
                    if (!badge) return null;
                    return (
                      <div key={ub.id} className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-all text-center group">
                        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          {getBadgeIcon(badge.name)}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                        <div className="flex flex-col gap-2 w-full mt-auto">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-2 hover-elevate"
                            onClick={() => handleShare(badge.name)}
                            data-testid={`button-share-${badge.id}`}
                          >
                            <Share2 className="w-4 h-4" />
                            Share on LinkedIn
                          </Button>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Earned {new Date(ub.earnedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
