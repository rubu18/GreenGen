
import { useState, useEffect } from "react";
import { Trophy, User, Filter, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  reportsSubmitted: number;
  tokens: number;
  rank: number;
}

type SortField = "reportsSubmitted" | "tokens";

const Leaderboard = () => {
  const [sortField, setSortField] = useState<SortField>("tokens");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [timeFilter, setTimeFilter] = useState("all-time");
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    getUser();
  }, []);
  
  // Fetch users data
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['leaderboard', timeFilter],
    queryFn: async () => {
      try {
        // Get user tokens data
        const { data: userTokens, error: tokensError } = await supabase
          .from('user_tokens')
          .select('user_id, balance');

        if (tokensError) throw tokensError;

        // Get user profiles data
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url');

        if (profilesError) throw profilesError;

        // Get waste reports data with time filter
        let wasteQuery = supabase
          .from('waste_reports')
          .select('user_id, status');
        
        if (timeFilter !== 'all-time') {
          const now = new Date();
          let startDate;
          
          if (timeFilter === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          } else if (timeFilter === 'weekly') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
          }
          
          wasteQuery = wasteQuery.gte('created_at', startDate.toISOString());
        }
        
        wasteQuery = wasteQuery.eq('status', 'approved');
        
        const { data: wasteReports, error: wasteError } = await wasteQuery;
        
        if (wasteError) throw wasteError;
        
        // Create user map with profile data
        const userMap = new Map();
        
        // Initialize with token data and profile data
        if (userTokens) {
          userTokens.forEach((user) => {
            const profile = userProfiles?.find(p => p.id === user.user_id);
            
            // Better name handling - only show proper names or "You" for current user
            let displayName = "Anonymous User";
            if (profile?.full_name?.trim()) {
              displayName = profile.full_name.trim();
            } else if (user.user_id === currentUserId) {
              displayName = "You";
            }
            
            // Only include users who have either:
            // 1. A proper full name set
            // 2. Are the current user
            // 3. Have some activity (will be added later if they have reports)
            if (profile?.full_name?.trim() || user.user_id === currentUserId) {
              userMap.set(user.user_id, {
                id: user.user_id,
                name: displayName,
                avatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${user.user_id}`,
                tokens: user.balance || 0,
                reportsSubmitted: 0,
              });
            }
          });
        }
        
        // Add waste report data
        if (wasteReports) {
          wasteReports.forEach((report) => {
            const profile = userProfiles?.find(p => p.id === report.user_id);
            
            // Only add users with proper names or current user
            if (profile?.full_name?.trim() || report.user_id === currentUserId) {
              if (!userMap.has(report.user_id)) {
                let displayName = "Anonymous User";
                if (profile?.full_name?.trim()) {
                  displayName = profile.full_name.trim();
                } else if (report.user_id === currentUserId) {
                  displayName = "You";
                }
                
                userMap.set(report.user_id, {
                  id: report.user_id,
                  name: displayName,
                  avatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${report.user_id}`,
                  tokens: 0,
                  reportsSubmitted: 0,
                });
              }
              
              const userData = userMap.get(report.user_id);
              userData.reportsSubmitted += 1;
            }
          });
        }
        
        return Array.from(userMap.values());
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        toast({
          title: "Failed to load leaderboard data",
          description: "Please try again later",
          variant: "destructive",
        });
        return [];
      }
    },
  });
  
  useEffect(() => {
    if (userData) {
      const sortedData = [...userData].sort((a, b) => {
        if (sortDirection === "asc") {
          return a[sortField] - b[sortField];
        } else {
          return b[sortField] - a[sortField];
        }
      });
      
      const rankedData = sortedData.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
      
      setLeaderboardUsers(rankedData);
    }
  }, [userData, sortField, sortDirection, currentUserId]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-center py-8">Loading leaderboard data...</p>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-center py-8 text-red-500">
            Failed to load leaderboard data. Please try again.
          </p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-600 mb-8">
          See who's making the biggest impact in waste management.
        </p>
        
        {/* Top Users Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Contributors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboardUsers.slice(0, 3).map((user, index) => (
              <Card key={user.id} className={index === 0 ? "border-2 border-yellow-400" : ""}>
                <CardHeader className="text-center">
                  <div className="relative mx-auto mb-2">
                    {index === 0 && (
                      <div className="absolute -top-3 -right-3">
                        <Trophy className="h-6 w-6 text-yellow-400" />
                      </div>
                    )}
                    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto">
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <CardTitle className="flex flex-col items-center">
                    <span>{user.name}</span>
                    <Badge className="mt-1 bg-eco hover:bg-eco-dark">Rank #{user.rank}</Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="text-center space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Reports Submitted</p>
                      <p className="font-bold">{user.reportsSubmitted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tokens Earned</p>
                      <p className="font-bold">{user.tokens}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Full Leaderboard */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-semibold mb-2 sm:mb-0">Full Leaderboard</h2>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Filter</span>
              </Button>
              
              <Tabs value={timeFilter} onValueChange={setTimeFilter} className="h-8">
                <TabsList className="h-8 p-0.5">
                  <TabsTrigger value="all-time" className="h-7 px-2 text-xs">All Time</TabsTrigger>
                  <TabsTrigger value="monthly" className="h-7 px-2 text-xs">Monthly</TabsTrigger>
                  <TabsTrigger value="weekly" className="h-7 px-2 text-xs">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort("reportsSubmitted")}>
                      <div className="flex items-center justify-end">
                        <span>Reports</span>
                        {sortField === "reportsSubmitted" && (
                          sortDirection === "asc" ? 
                            <ArrowUp className="ml-1 h-3 w-3" /> : 
                            <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort("tokens")}>
                      <div className="flex items-center justify-end">
                        <span>Tokens</span>
                        {sortField === "tokens" && (
                          sortDirection === "asc" ? 
                            <ArrowUp className="ml-1 h-3 w-3" /> : 
                            <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className={user.id === currentUserId ? "bg-eco-light" : ""}
                    >
                      <TableCell className="font-medium">{user.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.name}
                            </span>
                            {user.id === currentUserId && (
                              <span className="text-xs text-eco-dark">That's you!</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.reportsSubmitted}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.tokens}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
