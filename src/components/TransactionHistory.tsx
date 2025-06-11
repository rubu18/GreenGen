
import { useState, useEffect } from "react";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface TokenTransaction {
  id: string;
  amount: number;
  description: string;
  transaction_type: 'earned' | 'spent';
  created_at: string;
}

interface TransactionHistoryProps {
  onBack: () => void;
}

const TransactionHistory = ({ onBack }: TransactionHistoryProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('token_transactions')
          .select('id, amount, description, transaction_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Remove duplicates based on description and amount combinations
        const uniqueTransactions = [];
        const seen = new Set();
        
        for (const transaction of data) {
          const key = `${transaction.description}-${transaction.amount}-${transaction.transaction_type}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTransactions.push(transaction);
          }
        }
        
        setTransactions(uniqueTransactions as TokenTransaction[]);
      } catch (error: any) {
        console.error("Error fetching all transactions:", error);
        setError("Failed to load transaction history.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4 text-gray-700 dark:text-gray-300 hover:text-eco dark:hover:text-eco">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rewards
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
        </div>

        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-6 w-6 text-eco animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 dark:text-red-400">{error}</p>
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
                      <span className="font-medium">
                        {transaction.transaction_type === 'earned' ? '+' : '-'}{transaction.amount}
                      </span>
                      <Coins className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TransactionHistory;
