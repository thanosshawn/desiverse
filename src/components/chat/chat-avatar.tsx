// src/components/chat/chat-avatar.tsx
'use client';

import Image from 'next/image';
import React from 'react';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types'; // Import default

interface ChatAvatarProps {
  videoSrc?: string; // Data URI for video
  staticAvatarSrc?: string;
  characterName?: string;
}

export function ChatAvatar({ 
  videoSrc, 
  staticAvatarSrc = DEFAULT_AVATAR_DATA_URI, // Use imported default
  characterName = "Bae" 
}: ChatAvatarProps) {
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoSrc && videoRef.current) {
      setIsVideoPlaying(true);
      videoRef.current.src = videoSrc; // Explicitly set src
      videoRef.current.load(); 
      videoRef.current.play().catch(error => {
        console.error("Video play failed:", error);
        setIsVideoPlaying(false); // Fallback if play fails
      });
    } else {
      setIsVideoPlaying(false);
    }
  }, [videoSrc]);

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
  };
  
  return (
    <div className="w-full md:w-1/3 lg:w-1/4 p-4 flex flex-col items-center justify-center"> {/* Added justify-center */}
      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shadow-lg border-4 border-primary bg-muted"> {/* Added bg-muted for placeholder */}
        {isVideoPlaying && videoSrc ? (
          <video
            ref={videoRef}
            key={videoSrc} 
            className="w-full h-full object-cover"
            autoPlay
            muted={false} 
            onEnded={handleVideoEnd}
            playsInline // Important for iOS
            onError={(e) => {
                console.error("Video error:", e);
                setIsVideoPlaying(false); // Fallback on error
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={staticAvatarSrc || DEFAULT_AVATAR_DATA_URI} // Ensure fallback
            alt={`${characterName}'s Avatar`}
            width={256} // Explicit width for md:w-64
            height={256} // Explicit height for md:h-64
            className="w-full h-full object-cover"
            data-ai-hint={characterName ? `${characterName} portrait` : "woman portrait"}
            priority
          />
        )}
      </div>
      <h2 className="mt-4 text-2xl font-headline text-primary">{characterName}</h2>
      <p className="text-sm text-muted-foreground">Your Virtual Bae</p>
    </div>
  );
}
