
import { supabase } from "@/lib/supabase";

export const getTokensForWasteSize = (wasteSize: string): number => {
  switch (wasteSize) {
    case 'small':
      return 5;
    case 'medium':
      return 15;
    case 'large':
      return 30;
    default:
      return 0;
  }
};

export const updateUserTokensForReport = async (userId: string, wasteSize: string, reportTitle: string) => {
  try {
    const tokenAmount = getTokensForWasteSize(wasteSize);
    
    if (tokenAmount === 0) {
      console.log("No tokens to award for waste size:", wasteSize);
      return false;
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: tokenAmount,
        description: `Waste report: ${reportTitle}`,
        transaction_type: 'earned',
        source_type: 'waste_report'
      });

    if (transactionError) {
      console.error("Error creating token transaction:", transactionError);
      return false;
    }

    // Check if user has existing token record
    const { data: existingTokens, error: fetchError } = await supabase
      .from('user_tokens')
      .select('balance, level')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching user tokens:", fetchError);
      return false;
    }

    if (!existingTokens) {
      // Create new token record with proper user_id
      const newLevel = tokenAmount >= 50 ? 2 : 1;
      const { error: insertError } = await supabase
        .from('user_tokens')
        .insert({
          user_id: userId,
          balance: tokenAmount,
          level: newLevel
        });

      if (insertError) {
        console.error("Error creating user tokens:", insertError);
        return false;
      }
    } else {
      // Update existing token record
      const newBalance = existingTokens.balance + tokenAmount;
      const newLevel = 
        newBalance >= 500 ? 5 :
        newBalance >= 300 ? 4 :
        newBalance >= 150 ? 3 :
        newBalance >= 50 ? 2 : 1;

      const { error: updateError } = await supabase
        .from('user_tokens')
        .update({
          balance: newBalance,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error("Error updating user tokens:", updateError);
        return false;
      }
    }

    console.log(`Successfully awarded ${tokenAmount} tokens to user ${userId}`);
    return true;

  } catch (error) {
    console.error("Exception in updateUserTokensForReport:", error);
    return false;
  }
};
