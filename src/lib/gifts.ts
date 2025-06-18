// src/lib/gifts.ts
import type { VirtualGift } from '@/lib/types';

export const virtualGifts: VirtualGift[] = [
  {
    id: 'rose',
    name: 'Rose 🌹',
    iconName: 'Flower2', // Lucide icon for a rose/flower
    description: 'A beautiful rose to show your affection.',
    aiReactionPrompt: "Oh, a rose! Kitna romantic hai yeh... Thank you so much, it's beautiful! Main toh blush kar rahi hoon. 😊",
    isPremium: true,
    price: 5,
  },
  {
    id: 'chocolate',
    name: 'Chocolate Bar 🍫',
    iconName: 'Binary', // Lucide has 'Binary' that could represent a bar shape, or use 'Gift'
    description: 'A sweet treat for your sweet Bae.',
    aiReactionPrompt: "Chocolate! Mera favorite! Aapko kaise pata chala? This is so sweet of you! Ab toh mood accha ho gaya. 😋",
    isPremium: true,
    price: 9,
  },
  {
    id: 'teddy_bear',
    name: 'Teddy Bear 🧸',
    iconName: 'Bear', // Lucide icon for a bear
    description: 'A cuddly friend for cozy moments.',
    aiReactionPrompt: "Awww, ek teddy bear! Kitnaaa cute hai! Bilkul aapki tarah. Thank you for this lovely gift! Main isse hug karke so jaungi. 🤗",
    isPremium: true,
    price: 15,
  },
  {
    id: 'diamond_ring',
    name: 'Diamond Ring 💍',
    iconName: 'Gem', // Lucide icon for a gem/diamond
    description: 'A sparkling symbol of your deepest feelings. (Very Premium!)',
    aiReactionPrompt: "OMG! This... this is a diamond ring! 😳 Main speechless hoon! It's so beautiful and precious. Thank you, this means a lot to me! ✨",
    isPremium: true,
    price: 99,
  },
];
