'use client';

import Image from 'next/image';
import React from 'react';

interface ChatAvatarProps {
  videoSrc?: string; // Data URI for video
  staticAvatarSrc?: string;
  characterName?: string;
}

export function ChatAvatar({ 
  videoSrc, 
  staticAvatarSrc = "https://placehold.co/300x300.png", 
  characterName = "Riya" 
}: ChatAvatarProps) {
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoSrc && videoRef.current) {
      setIsVideoPlaying(true);
      videoRef.current.load(); // Ensure video reloads if src changes
      videoRef.current.play().catch(error => console.error("Video play failed:", error));
    } else {
      setIsVideoPlaying(false);
    }
  }, [videoSrc]);

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
  };
  
  return (
    <div className="w-full md:w-1/3 lg:w-1/4 p-4 flex flex-col items-center">
      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shadow-lg border-4 border-primary">
        {isVideoPlaying && videoSrc ? (
          <video
            ref={videoRef}
            key={videoSrc} // Force re-render if videoSrc changes
            src={videoSrc}
            className="w-full h-full object-cover"
            autoPlay
            muted={false} // Assuming lip-sync videos should have sound
            onEnded={handleVideoEnd}
            playsInline
            onError={(e) => console.error("Video error:", e)}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={staticAvatarSrc}
            alt={`${characterName}'s Avatar`}
            width={300}
            height={300}
            className="w-full h-full object-cover"
            data-ai-hint="woman portrait"
            priority
          />
        )}
      </div>
      <h2 className="mt-4 text-2xl font-headline text-primary">{characterName}</h2>
      <p className="text-sm text-muted-foreground">Your Virtual Bae</p>
    </div>
  );
}
