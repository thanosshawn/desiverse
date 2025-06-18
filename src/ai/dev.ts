import { config } from 'dotenv';
config();

import '@/ai/flows/generate-video-replies.ts';
import '@/ai/flows/generate-personalized-voice-message.ts';
import '@/ai/flows/personalize-daily-message.ts';