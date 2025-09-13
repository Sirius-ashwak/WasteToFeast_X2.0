import { User, Mail, Edit } from 'lucide-react';

interface ProfileCardProps {
  avatarUrl?: string;
  name: string;
  title: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  enableTilt?: boolean;
  onContactClick?: () => void;
  className?: string;
}

export default function ProfileCard({ 
  avatarUrl, 
  name, 
  title, 
  handle, 
  status, 
  contactText = "Contact", 
  showUserInfo = true, 
  enableTilt = false, 
  onContactClick, 
  className = "" 
}: ProfileCardProps) {

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200 ${enableTilt ? 'transform hover:scale-105 transition-transform' : ''} ${className}`}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-8 h-8" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {name}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {title}
          </p>
          {handle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              @{handle}
            </p>
          )}
        </div>
        {onContactClick && (
          <button
            onClick={onContactClick}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={contactText}
          >
            <Edit className="w-5 h-5" />
          </button>
        )}
      </div>

      {status && (
        <div className="mb-4">
          <p className="text-green-600 dark:text-green-400 font-medium text-sm">
            {status}
          </p>
        </div>
      )}

      {showUserInfo && (
        <div className="space-y-3">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4 mr-2" />
            <span className="text-sm">{title}</span>
          </div>
          
          {handle && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">@{handle}</span>
            </div>
          )}
        </div>
      )}

      {onContactClick && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onContactClick}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            {contactText}
          </button>
        </div>
      )}
    </div>
  );
}
