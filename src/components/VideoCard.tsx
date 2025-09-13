import { Play, Eye } from 'lucide-react';
import { YouTubeVideo } from '../services/youtube';
import { youtubeService } from '../services/youtube';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick?: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const url = youtubeService.getWatchUrl(video.id);
      window.open(url, '_blank');
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800 dark:border dark:border-gray-700"
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {video.duration || '5:00'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {video.title}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span className="truncate">{video.channelTitle}</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{video.viewCount || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
