
// src/components/chat/chat-avatar.tsx
'use client';

import Image from 'next/image';
import React from 'react';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';
import { Loader2, Sparkles } from 'lucide-react'; 
import { cn } from '@/lib/utils';

interface ChatAvatarProps {
  videoSrc?: string; 
  staticAvatarSrc?: string;
  characterName?: string;
  isLoadingAiResponse?: boolean; 
}

export function ChatAvatar({ 
  videoSrc, 
  staticAvatarSrc = DEFAULT_AVATAR_DATA_URI,
  characterName = "Bae",
  isLoadingAiResponse = false, 
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
    <div className="p-4 flex flex-col items-center justify-start mt-6 md:mt-2 w-full max-w-xs mx-auto">
      <div 
        className={cn(
          "relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-primary/70 bg-muted transition-all duration-300 ease-in-out hover:shadow-glow-primary",
          isLoadingAiResponse && "ring-4 ring-accent ring-offset-2 ring-offset-background animate-pulse-spinner"
        )}
      >
        {isVideoPlaying && videoSrc ? (
          <video
            ref={videoRef}
            key={videoSrc} 
            className="w-full h-full object-cover rounded-full" // Ensure video also respects rounded-full
            autoPlay
            muted // Usually better to start muted for autoplay
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
            width={192} 
            height={192}
            className="w-full h-full object-cover rounded-full" // Ensure image also respects rounded-full
            data-ai-hint={characterName ? `${characterName.toLowerCase()} portrait` : "woman portrait"}
            priority
          />
        )}
        {isLoadingAiResponse && !isVideoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <Loader2 className="w-10 h-10 text-white/80 animate-spin"/>
            </div>
        )}
      </div>
      <h2 className="mt-5 text-3xl font-headline text-primary text-center drop-shadow-sm">{characterName}</h2>
      <p className="text-sm text-muted-foreground text-center flex items-center">
         <Sparkles className="w-4 h-4 mr-1.5 text-green-400 animate-pulse" /> Online & Waiting...
      </p>
    </div>
  );
}
