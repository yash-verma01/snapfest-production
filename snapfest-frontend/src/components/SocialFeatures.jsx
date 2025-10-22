import React, { useState } from 'react';
import { Heart, Share2, MessageCircle, Star, Download, Bookmark, Flag } from 'lucide-react';
import { Button, Card } from './ui';

// Social Share Component
export const SocialShare = ({ 
  url, 
  title, 
  description, 
  image,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: '💬',
      action: () => {
        const text = `${title}\n${description}\n${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    {
      name: 'Facebook',
      icon: '📘',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      }
    },
    {
      name: 'Twitter',
      icon: '🐦',
      action: () => {
        const text = `${title} - ${description}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      }
    },
    {
      name: 'Instagram',
      icon: '📷',
      action: () => {
        // Instagram doesn't support direct sharing, so we copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard! You can now paste it in your Instagram story or post.');
      }
    },
    {
      name: 'Copy Link',
      icon: '🔗',
      action: () => {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    }
  ];

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 p-4 w-48 z-50">
          <div className="space-y-2">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => {
                  option.action();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg text-left"
              >
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm font-medium">{option.name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Like/Favorite Component
export const LikeButton = ({ 
  isLiked, 
  onToggle, 
  count = 0,
  className = '' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={`flex items-center space-x-2 ${className} ${
        isLiked ? 'text-red-500 border-red-500' : 'text-gray-600'
      }`}
    >
      <Heart 
        className={`w-4 h-4 transition-all duration-200 ${
          isLiked ? 'fill-current' : ''
        } ${isAnimating ? 'scale-125' : ''}`} 
      />
      <span>{count}</span>
    </Button>
  );
};

// Rating Component
export const RatingDisplay = ({ 
  rating, 
  reviewCount, 
  showCount = true,
  size = 'sm',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-gray-600">({reviewCount})</span>
      )}
    </div>
  );
};

// Review Component
export const ReviewCard = ({ 
  review, 
  onLike,
  onReply,
  className = '' 
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.likes || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(review._id, !isLiked);
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-primary-600 font-medium">
            {review.user?.name?.charAt(0) || 'U'}
          </span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium text-gray-900">{review.user?.name || 'Anonymous'}</h4>
              <RatingDisplay rating={review.rating} size="sm" showCount={false} />
            </div>
            <span className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-gray-700 mb-3">{review.comment}</p>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 text-sm ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={() => onReply?.(review._id)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-primary-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Bookmark Component
export const BookmarkButton = ({ 
  isBookmarked, 
  onToggle,
  className = '' 
}) => {
  return (
    <Button
      onClick={onToggle}
      variant="outline"
      size="sm"
      className={`${className} ${
        isBookmarked ? 'text-yellow-500 border-yellow-500' : 'text-gray-600'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
    </Button>
  );
};

// Download Component
export const DownloadButton = ({ 
  url, 
  filename,
  className = '' 
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      Download
    </Button>
  );
};

export default {
  SocialShare,
  LikeButton,
  RatingDisplay,
  ReviewCard,
  BookmarkButton,
  DownloadButton
};


