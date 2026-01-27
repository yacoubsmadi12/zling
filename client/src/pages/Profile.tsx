import { useAuth } from "@/hooks/use-auth";
import { useUserBadges } from "@/hooks/use-gamification";
import { Navigation } from "@/components/Navigation";
import { Loader } from "@/components/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Building, Award } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: badges, isLoading } = useUserBadges();

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
                <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                  <AvatarFallback className="text-4xl">{user.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex gap-2 mb-2">
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20">
                    Level {Math.floor(user.points / 1000) + 1}
                  </Badge>
                </div>
              </div>
              
              <h1 className="text-3xl font-display font-bold mb-2">{user.username}</h1>
              
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
                <Award className="w-6 h-6 text-orange-500" />
                Badges & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader />
              ) : badges?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No badges earned yet. Keep playing!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {badges?.map((ub: any) => (
                    <div key={ub.id} className="flex flex-col items-center p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/60 transition-colors text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                        <span className="text-2xl">🏅</span>
                      </div>
                      <span className="font-bold text-sm truncate w-full">{ub.badgeId}</span>
                      <span className="text-xs text-muted-foreground">{new Date(ub.earnedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
