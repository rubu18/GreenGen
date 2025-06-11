
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm dark:shadow-md flex flex-col items-center text-center border dark:border-gray-700 transition-colors duration-200">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-eco-light dark:bg-eco-dark/30 flex items-center justify-center mb-3 sm:mb-4">
        <Icon className="text-eco h-6 w-6 sm:h-8 sm:w-8" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;
