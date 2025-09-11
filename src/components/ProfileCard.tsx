import { User, Mail, MapPin, Calendar, Edit } from 'lucide-react';

interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    location?: string;
    joinedDate?: string;
    bio?: string;
    stats?: {
      mealsShared: number;
      wasteReduced: number;
      recipesGenerated: number;
    };
  };
  onEdit?: () => void;
  className?: string;
}

export default function ProfileCard({ user, onEdit, className = "" }: ProfileCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200 ${className}`}>
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-green-600 dark:text-green-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            {user.location && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{user.location}</span>
              </div>
            )}
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Edit className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {user.bio}
          </p>
        </div>
      )}

      {/* Stats */}
      {user.stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user.stats.mealsShared}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Meals Shared
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user.stats.wasteReduced}kg
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Waste Reduced
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user.stats.recipesGenerated}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Recipes Generated
            </div>
          </div>
        </div>
      )}

      {/* Join Date */}
      {user.joinedDate && (
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
          <Calendar className="w-4 h-4" />
          <span>Joined {user.joinedDate}</span>
        </div>
      )}
    </div>
  );
}
