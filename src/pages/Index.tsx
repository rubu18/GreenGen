import { useEffect, useState } from "react";
import { Leaf, Coins, Users, Trophy, Copyright, ArrowRight, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import FeatureCard from "@/components/FeatureCard";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const navigate = useNavigate();

  // Fetch stats data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Count total reports submitted
        const { count: reportsCount, error: reportsError } = await supabase
          .from('waste_reports')
          .select('*', { count: 'exact', head: true });
        
        if (reportsError) throw reportsError;
        
        // Get total tokens earned across all users
        const { data: tokensData, error: tokensError } = await supabase
          .from('user_tokens')
          .select('balance');
        
        if (tokensError) throw tokensError;
        
        let totalTokensEarned = 0;
        if (tokensData) {
          totalTokensEarned = tokensData.reduce((sum, item) => sum + item.balance, 0);
        }
        
        // Count total active users
        const { count: usersCount, error: usersError } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        return {
          reportsSubmitted: reportsCount || 0,
          tokensEarned: totalTokensEarned,
          activeUsers: usersCount || 0
        };
      } catch (error) {
        console.error("Error fetching stats:", error);
        return {
          reportsSubmitted: 0,
          tokensEarned: 0,
          activeUsers: 0
        };
      }
    }
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Improved with better responsive design */}
        <div className="relative rounded-2xl bg-gradient-to-br from-eco-light to-white dark:from-eco-dark/20 dark:to-gray-800 p-6 sm:p-8 lg:p-12 mb-16 shadow-sm overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-full bg-eco-light transform translate-x-1/4 -translate-y-1/4"></div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            <div className="lg:w-3/5 z-10 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
                <span className="text-gray-800 dark:text-white">GreenGen</span>{" "}
                <span className="text-eco">Waste Management</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed max-w-2xl">
                Together we can create a cleaner environment. Join our community in making waste management more efficient and rewarding!
              </p>
              <Button 
                size="lg" 
                className="bg-eco hover:bg-eco-dark group transition-all duration-200 shadow-md hover:shadow-lg text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                onClick={() => navigate("/report")}
              >
                Report Waste 
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="lg:w-2/5 flex justify-center items-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full bg-eco-light/50 dark:bg-eco-dark/30 flex items-center justify-center relative">
                <Leaf className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-eco animate-pulse" />
                <div className="absolute -inset-4 border-2 border-dashed border-eco/30 rounded-full animate-spin-slow"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section - Improved responsive grid */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 dark:text-white">Our Features</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">Join thousands of users making a difference in waste management</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Link to="/report" className="no-underline text-inherit transform transition-all duration-200 hover:scale-105">
              <FeatureCard 
                icon={Leaf}
                title="Eco-Friendly"
                description="Contribute to a cleaner environment by reporting and collecting waste."
              />
            </Link>
            <Link to="/rewards" className="no-underline text-inherit transform transition-all duration-200 hover:scale-105">
              <FeatureCard 
                icon={Coins}
                title="Earn Rewards"
                description="Get tokens for your contributions to waste management efforts."
              />
            </Link>
            <Link to="/leaderboard" className="no-underline text-inherit transform transition-all duration-200 hover:scale-105">
              <FeatureCard 
                icon={Users}
                title="Community-Driven"
                description="Be part of a growing community committed to sustainable practices."
              />
            </Link>
          </div>
        </div>
        
        {/* Impact Section - Updated without waste KG concept */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 dark:text-white">Our Impact</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">See the difference we're making together</p>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              <StatCard 
                icon={MapPin} 
                value={isLoading ? "Loading..." : `${stats?.reportsSubmitted || 0}`} 
                label="Reports Submitted" 
              />
              <StatCard 
                icon={Coins} 
                value={isLoading ? "Loading..." : `${stats?.tokensEarned || 0}`} 
                label="Tokens Earned" 
              />
              <StatCard 
                icon={Users} 
                value={isLoading ? "Loading..." : `${stats?.activeUsers || 0}`} 
                label="Active Users" 
              />
            </div>
          </div>
        </div>
        
        {/* How It Works Section - Improved responsive design */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 dark:text-white">How It Works</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">Three simple steps to make a difference</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-eco-light dark:bg-eco-dark/50 z-0"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-eco-light dark:bg-eco-dark flex items-center justify-center mx-auto mb-6 shadow-md">
                <span className="text-eco-dark dark:text-eco font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-lg sm:text-xl mb-3 dark:text-white">Report Waste</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Find and report plastic waste in your area by uploading photos.
              </p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-eco-light dark:bg-eco-dark flex items-center justify-center mx-auto mb-6 shadow-md">
                <span className="text-eco-dark dark:text-eco font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-lg sm:text-xl mb-3 dark:text-white">Collect Waste</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Collect the reported waste or join collection events in your area.
              </p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-eco-light dark:bg-eco-dark flex items-center justify-center mx-auto mb-6 shadow-md">
                <span className="text-eco-dark dark:text-eco font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-lg sm:text-xl mb-3 dark:text-white">Earn Rewards</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Get rewarded with tokens based on your contributions to the community.
              </p>
            </div>
          </div>
        </div>
        
        {/* Join Community Section - Improved responsive design */}
        <div className="bg-gradient-to-br from-eco to-eco-dark rounded-xl p-6 sm:p-8 lg:p-12 text-center text-white shadow-lg mb-16">
          <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Join Our Leaderboard</h2>
          <p className="text-white/90 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base lg:text-lg">
            Compete with others and see who makes the biggest impact in waste management.
          </p>
          <Button 
            className="bg-white text-eco-dark hover:bg-eco-light border-2 border-white font-medium text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4"
            size="lg"
            onClick={() => navigate("/leaderboard")}
          >
            View Leaderboard
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        {/* Copyright Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
          <p className="flex items-center justify-center flex-wrap">
            <Copyright className="h-4 w-4 mr-1" /> 
            {new Date().getFullYear()} GreenGen Waste Management. All Rights Reserved. | Developed by Rubu Basumatary
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
