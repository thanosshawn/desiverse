// src/components/chat/chat-avatar.tsx
'use client';

import Image from 'next/image';
import React from 'react';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';
import { Loader2 } from 'lucide-react'; // For pulsing effect

interface ChatAvatarProps {
  videoSrc?: string; 
  staticAvatarSrc?: string;
  characterName?: string;
  isLoadingAiResponse?: boolean; // New prop for typing indicator
}

export function ChatAvatar({ 
  videoSrc, 
  staticAvatarSrc = DEFAULT_AVATAR_DATA_URI,
  characterName = "Bae",
  isLoadingAiResponse = false, // Default to false
}: ChatAvatarProps) {
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoSrc && videoRef.current) {
      setIsVideoPlaying(true);
      videoRef.current.src = videoSrc; 
      videoRef.current.load(); 
      videoRef.current.play().catch(error => {
        console.error("Video play failed:", error);
        setIsVideoPlaying(false); 
      });
    } else {
      setIsVideoPlaying(false);
    }
  }, [videoSrc]);

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
  };
  
  return (
    // Removed fixed width/height from outer div to allow flexibility
    <div className="p-4 flex flex-col items-center justify-start mt-6 md:mt-0">
      <div className={`relative w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-xl border-4 border-primary bg-muted transition-all duration-300 ease-in-out ${isLoadingAiResponse ? 'animate-pulse-spinner ring-4 ring-accent ring-offset-2 ring-offset-background' : ''}`}>
        {isVideoPlaying && videoSrc ? (
          <video
            ref={videoRef}
            key={videoSrc} 
            className="w-full h-full object-cover"
            autoPlay
            muted={false} 
            onEnded={handleVideoEnd}
            playsInline 
            onError={(e) => {
                console.error("Video error:", e);
                setIsVideoPlaying(false); 
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={staticAvatarSrc || DEFAULT_AVATAR_DATA_URI}
            alt={`${characterName}'s Avatar`}
            width={192} // md:w-48 (12rem = 192px)
            height={192} // md:h-48
            className="w-full h-full object-cover"
            data-ai-hint={characterName ? `${characterName.toLowerCase()} portrait` : "woman portrait"}
            priority
          />
        )}
        {isLoadingAiResponse && !isVideoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="w-8 h-8 text-white/80 animate-spin"/>
            </div>
        )}
      </div>
      <h2 className="mt-4 text-2xl font-headline text-primary text-center">{characterName}</h2>
      <p className="text-sm text-muted-foreground text-center">Online</p> {/* Simplified status */}
    </div>
  );
}
