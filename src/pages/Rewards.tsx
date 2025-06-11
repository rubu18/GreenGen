import { useState, useEffect } from "react";
import { Coins, Gift, CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import TransactionHistory from "@/components/TransactionHistory";

interface RewardItem {
  id: string;
  title: string;
  description: string;
  token_cost: number;
  image_url: string;
  available?: boolean;
}

interface TokenTransaction {
  id: string;
  amount: number;
  description: string;
  transaction_type: 'earned' | 'spent';
  created_at: string;
}

interface UserTokens {
  balance: number;
  level: number;
}

const Rewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [loading, setLoading] = useState({
    tokens: true,
    rewards: true,
    transactions: true,
    redemption: false
  });
  const [error, setError] = useState<string | null>(null);
  
  // Calculate tokens needed for next level
  const getNextLevelTarget = () => {
    if (!userTokens) return 0;
    
    if (userTokens.level === 1) return 50;
    if (userTokens.level === 2) return 150;
    if (userTokens.level === 3) return 300;
    if (userTokens.level === 4) return 500;
    return 0; // Max level
  };
  
  const calculateProgress = () => {
    if (!userTokens) return 0;
    const nextLevel = getNextLevelTarget();
    if (nextLevel === 0) return 100; // Max level
    
    // Calculate previous level threshold
    let prevThreshold = 0;
    if (userTokens.level === 2) prevThreshold = 50;
    if (userTokens.level === 3) prevThreshold = 150;
    if (userTokens.level === 4) prevThreshold = 300;
    
    // Progress is calculated as progress within the current level range
    const range = nextLevel - prevThreshold;
    const progress = userTokens.balance - prevThreshold;
    return Math.min(Math.floor((progress / range) * 100), 100);
  };
  
  const getTokensForNextLevel = () => {
    if (!userTokens) return 0;
    const nextLevel = getNextLevelTarget();
    if (nextLevel === 0) return 0; // Max level reached
    return nextLevel - userTokens.balance;
  };
  
  // Fetch user token balance
  useEffect(() => {
    if (!user) return;
    
    const fetchUserTokens = async () => {
      try {
        const { data, error } = await supabase
          .from('user_tokens')
          .select('balance, level')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          // If record doesn't exist, create a new one
          if (error.code === 'PGRST116') {
            const { data: newData, error: insertError } = await supabase
              .from('user_tokens')
              .insert({ user_id: user.id, balance: 0, level: 1 })
              .select()
              .single();
            
            if (insertError) throw insertError;
            setUserTokens(newData as UserTokens);
          } else {
            throw error;
          }
        } else {
          setUserTokens(data as UserTokens);
        }
      } catch (error: any) {
        console.error("Error fetching user tokens:", error);
        setError("Failed to load your token balance.");
      } finally {
        setLoading(prev => ({ ...prev, tokens: false }));
      }
    };
    
    fetchUserTokens();
  }, [user]);
  
  // Fetch available rewards
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .order('token_cost', { ascending: true });
        
        if (error) throw error;
        setRewards(data as RewardItem[]);
      } catch (error: any) {
        console.error("Error fetching rewards:", error);
        setError("Failed to load available rewards.");
      } finally {
        setLoading(prev => ({ ...prev, rewards: false }));
      }
    };
    
    fetchRewards();
  }, []);
  
  // Fetch recent transactions (only top 3, no duplicates)
  useEffect(() => {
    if (!user) return;
    
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('token_transactions')
          .select('id, amount, description, transaction_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20); // Get more to filter duplicates then limit
        
        if (error) throw error;
        
        // Remove duplicates based on description and amount combinations (not just id)
        const uniqueTransactions = [];
        const seen = new Set();
        
        for (const transaction of data) {
          const key = `${transaction.description}-${transaction.amount}-${transaction.transaction_type}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTransactions.push(transaction);
          }
        }
        
        // Limit to 3 most recent unique transactions
        setTransactions(uniqueTransactions.slice(0, 3) as TokenTransaction[]);
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        setError("Failed to load your recent transactions.");
      } finally {
        setLoading(prev => ({ ...prev, transactions: false }));
      }
    };
    
    fetchTransactions();
  }, [user]);
  
  // Function to get proper image for rewards
  const getRewardImage = (reward: RewardItem) => {
    // Map specific reward titles to appropriate images
    if (reward.title.toLowerCase().includes('amazon') || reward.title.toLowerCase().includes('gift card')) {
      return 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center';
    }
    if (reward.title.toLowerCase().includes('bag') || reward.title.toLowerCase().includes('shopping')) {
      return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&crop=center';
    }
    if (reward.title.toLowerCase().includes('bottle') || reward.title.toLowerCase().includes('water')) {
      return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop&crop=center';
    }
    if (reward.title.toLowerCase().includes('plant') || reward.title.toLowerCase().includes('tree')) {
      return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center';
    }
    // Default eco-friendly image
    return 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=300&fit=crop&crop=center';
  };
  
  const handleRedeemReward = async (reward: RewardItem) => {
    if (!user || !userTokens) return;
    
    // Check if user has enough tokens
    if (userTokens.balance < reward.token_cost) {
      toast("Not enough tokens", {
        description: `You need ${reward.token_cost - userTokens.balance} more tokens to redeem this reward.`,
        icon: <Coins className="h-4 w-4 text-yellow-500" />,
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, redemption: true }));
    
    try {
      // Start a transaction to ensure all operations complete
      // 1. Insert into redeemed_rewards
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('redeemed_rewards')
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          status: 'pending'
        })
        .select()
        .single();
      
      if (redemptionError) throw redemptionError;
      
      // 2. Create a token transaction record with unique timestamp
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          amount: reward.token_cost,
          description: `Redeemed: ${reward.title}`,
          transaction_type: 'spent',
          source_type: 'reward_redemption',
          source_id: redemptionData.id
        });
      
      if (transactionError) throw transactionError;
      
      // 3. Update user token balance
      const { error: updateError } = await supabase
        .from('user_tokens')
        .update({ 
          balance: userTokens.balance - reward.token_cost,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // 4. Update local state
      setUserTokens({
        ...userTokens,
        balance: userTokens.balance - reward.token_cost
      });
      
      // 5. Add new transaction to the list (prevent duplicates)
      const newTransaction = {
        id: redemptionData.id,
        amount: reward.token_cost,
        description: `Redeemed: ${reward.title}`,
        transaction_type: 'spent' as 'spent',
        created_at: new Date().toISOString()
      };
      
      setTransactions(prev => {
        // Filter out any existing similar transactions and add the new one
        const filtered = prev.filter(t => 
          !(t.description === newTransaction.description && 
            t.amount === newTransaction.amount && 
            t.transaction_type === newTransaction.transaction_type)
        );
        return [newTransaction, ...filtered].slice(0, 3);
      });
      
      toast("Reward redeemed successfully!", {
        description: `You've redeemed ${reward.title}. It will be delivered to your address.`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error: any) {
      console.error("Error redeeming reward:", error);
      toast("Failed to redeem reward", {
        description: "Please try again later.",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setLoading(prev => ({ ...prev, redemption: false }));
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const handleViewAllTransactions = () => {
    setShowTransactionHistory(true);
  };
  
  const handleBackToRewards = () => {
    setShowTransactionHistory(false);
  };
  
  // Show transaction history component
  if (showTransactionHistory) {
    return <TransactionHistory onBack={handleBackToRewards} />;
  }
  
  // Loading and error states
  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Please log in to view rewards</h2>
          <p className="text-gray-600">You need to be logged in to access the rewards page.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Rewards</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Redeem your earned tokens for eco-friendly rewards and discounts.
        </p>
        
        {/* Tokens Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8 border dark:border-gray-700">
          {loading.tokens ? (
            <div className="flex justify-center items-center min-h-[100px]">
              <Loader2 className="h-6 w-6 text-eco animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Tokens</p>
                <div className="flex items-center">
                  <Coins className="h-6 w-6 text-yellow-500 mr-2" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {userTokens?.balance || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col md:items-end">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Level Progress:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {userTokens?.level || 1}/5
                  </span>
                </div>
                <div className="w-full md:w-60">
                  <Progress value={calculateProgress()} className="h-2 bg-gray-200 dark:bg-gray-700" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getTokensForNextLevel() > 0 
                    ? `Earn ${getTokensForNextLevel()} more tokens to reach Level ${(userTokens?.level || 1) + 1}`
                    : "You've reached the maximum level!"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-eco hover:text-eco-dark hover:bg-eco-light dark:hover:bg-eco-dark/20"
              onClick={handleViewAllTransactions}
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
            {loading.transactions ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-6 w-6 text-eco animate-spin" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div className={`flex items-center ${transaction.transaction_type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="font-medium">{transaction.transaction_type === 'earned' ? '+' : '-'}{transaction.amount}</span>
                      <Coins className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Available Rewards */}
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Available Rewards</h2>
        {loading.rewards ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 text-eco animate-spin" />
          </div>
        ) : rewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className="overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="w-full h-48 rounded-md overflow-hidden mb-4 bg-gray-100 dark:bg-gray-700">
                    <img 
                      src={getRewardImage(reward)} 
                      alt={reward.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getRewardImage(reward);
                      }}
                    />
                  </div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    {reward.title === '$10 Gift Card' ? 'Amazon Gift Card' : reward.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-300">{reward.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center">
                    <Coins className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{reward.token_cost} tokens</span>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className={`w-full ${userTokens && userTokens.balance >= reward.token_cost ? 'bg-eco hover:bg-eco-dark text-white' : 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed text-gray-500 dark:bg-gray-600 dark:text-gray-400'}`}
                    onClick={() => handleRedeemReward(reward)}
                    disabled={!userTokens || userTokens.balance < reward.token_cost || loading.redemption}
                  >
                    {loading.redemption ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        {userTokens && userTokens.balance >= reward.token_cost 
                          ? 'Redeem Reward' 
                          : `Need ${reward.token_cost - (userTokens?.balance || 0)} more`
                        }
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No rewards available</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back soon for new rewards!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Rewards;
