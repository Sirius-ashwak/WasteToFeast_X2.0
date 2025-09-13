interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedDate?: string;
}

interface BadgeListProps {
  badges: Badge[];
  className?: string;
}

export default function BadgeList({ badges, className = "" }: BadgeListProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            badge.earned
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
              : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600 opacity-60'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`text-2xl ${badge.earned ? '' : 'grayscale'}`}>
              {badge.icon}
            </div>
            <div>
              <h3 className={`font-semibold ${
                badge.earned 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {badge.name}
              </h3>
              {badge.earned && badge.earnedDate && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Earned {badge.earnedDate}
                </p>
              )}
            </div>
          </div>
          <p className={`text-sm ${
            badge.earned 
              ? 'text-gray-600 dark:text-gray-300' 
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            {badge.description}
          </p>
        </div>
      ))}
    </div>
  );
}
