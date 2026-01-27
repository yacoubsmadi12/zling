import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, LdapSettings, Badge, Reward } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLdapSettingsSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, Users, Settings, Award } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: ldapSettings } = useQuery<LdapSettings>({
    queryKey: ["/api/admin/ldap-settings"],
  });

  const { data: badges } = useQuery<Badge[]>({
    queryKey: ["/api/admin/badges"],
  });

  const ldapForm = useForm({
    resolver: zodResolver(insertLdapSettingsSchema),
    defaultValues: ldapSettings || {
      url: "ldap://localhost:389",
      bindDn: "",
      bindPassword: "",
      baseDn: "",
      adminGroup: "Learning_Admins",
    },
  });

  const updateLdapMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/ldap-settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "LDAP settings updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ldap-settings"] });
    },
  });

  const ldapSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/ldap-sync");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Sync Successful", description: `Fetched ${data.userCount} users.` });
    },
  });

  const awardBadgeMutation = useMutation({
    mutationFn: async ({ userId, badgeId }: { userId: number; badgeId: number }) => {
      await apiRequest("POST", "/api/admin/award-badge", { userId, badgeId });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Badge awarded" });
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="w-4 h-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="ldap" className="gap-2">
            <Settings className="w-4 h-4" />
            LDAP Integration
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Award className="w-4 h-4" />
            Rewards & Badges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{u.fullName}</TableCell>
                        <TableCell>{u.department}</TableCell>
                        <TableCell>{u.points}</TableCell>
                        <TableCell>{u.streak}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => {
                            const badgeId = badges?.[0]?.id;
                            if (badgeId) awardBadgeMutation.mutate({ userId: u.id, badgeId });
                          }}>
                            Award Badge
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ldap">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>LDAP Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...ldapForm}>
                  <form onSubmit={ldapForm.handleSubmit((data) => updateLdapMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={ldapForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LDAP URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ldap://active-directory.local:389" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ldapForm.control}
                      name="bindDn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bind DN</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="cn=admin,dc=company,dc=com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ldapForm.control}
                      name="bindPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bind Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ldapForm.control}
                      name="baseDn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base DN</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ou=users,dc=company,dc=com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ldapForm.control}
                      name="adminGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Group Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Learning_Admins" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={updateLdapMutation.isPending}>
                      {updateLdapMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Settings
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Synchronize your local database with Active Directory users and group memberships.
                </p>
                <Button 
                  onClick={() => ldapSyncMutation.mutate()} 
                  className="w-full" 
                  variant="secondary"
                  disabled={ldapSyncMutation.isPending}
                >
                  {ldapSyncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Trigger Full Sync
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Manage Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Rewards management interface coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
