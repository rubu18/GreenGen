
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
}

const StatCard = ({ icon: Icon, value, label }: StatCardProps) => {
  return (
    <div className="flex flex-col items-center p-3 sm:p-4">
      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-eco mb-2" />
      <h4 className="text-xl sm:text-2xl lg:text-3xl font-bold dark:text-white">{value}</h4>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center">{label}</p>
    </div>
  );
};

export default StatCard;
