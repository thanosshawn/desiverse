// src/lib/admin/utils.ts
import type { CharacterCreationAdminFormValues } from '@/lib/types';

// --- Data for Random Generation ---
const firstNamesFemale = ["Riya", "Priya", "Aisha", "Simran", "Meera", "Pooja", "Anjali", "Zara", "Sana", "Noor"];
const firstNamesMale = ["Kabir", "Rohan", "Arjun", "Vikram", "Sameer", "Aditya", "Rahul", "Imran", "Dev", "Karan"];
const lastNames = ["Sharma", "Verma", "Singh", "Gupta", "Khan", "Malhotra", "Kapoor", "Chopra", "Reddy", "Patel", "Kumar", "Das"];
const adjectives = ["charming", "witty", "mysterious", "bubbly", "dreamy", "fiery", "sarcastic", "intellectual", "artistic", "sporty", "passionate", "calm", "adventurous", "introverted", "extroverted"];
const hobbies = ["old Bollywood music", "spicy street food", "late-night chats", "reading shayaris", "dancing in the rain", "coding innovative apps", "star-gazing on rooftops", "playing cricket on weekends", "cooking delicious biryani", "exploring hidden city gems", "binge-watching web series", "writing poetry"];
const cities = ["Mumbai", "Delhi", "Bangalore", "Lucknow", "Jaipur", "Kolkata", "Hyderabad", "Pune", "Chandigarh", "Goa"];
const styleTagsPool = ["Romantic", "Witty", "Bollywood", "Cultured", "Sarcastic", "Shy", "Bold", "Flirty", "Philosophical", "Techie", "Foodie", "Traveler", "Musician", "Artist", "Poetic"];
const voiceTones = ["Warm and melodic Hinglish", "Playful and teasing tone", "Deep and thoughtful, with a touch of philosophy", "Energetic and expressive, full of 'josh'", "Soft and gentle with a hint of Urdu tehzeeb", "Crisp, clear, and professional with a friendly demeanor"];
const personalitySnippets = [
  "Bollywood Buff & Chai Connoisseur ☕✨", "Sarcasm is my love language 😉 #CoderLife", "Lost in poetry and monsoon rains 🌧️📖", "Spicy food, spicier comebacks 🔥🌶️", "Techie with a heart of gold & a love for ghazals 💻❤️",
  "Dreamer, believer, and a midnight philosopher 🌙", "Seeking adventures and good conversations 🌍💬", "Fluent in Hinglish, sarcasm, and movie quotes 🎬", "My playlist is 90% Bollywood classics 🎶", "Probably thinking about food or the meaning of life 🤔🍕"
];
const dataAiHints = ["indian woman", "desi girl", "indian man", "urban youth", "modern attire", "person portrait", "asian fashion", "smile portrait", "thoughtful look", "dreamy eyes", "romantic mood"];

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomElements = <T,>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
// const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1); // Not currently used, can be removed or kept for future

export const generateRandomCharacterDefaults = (): CharacterCreationAdminFormValues => {
  const isFemale = Math.random() > 0.5;
  const firstName = getRandomElement(isFemale ? firstNamesFemale : firstNamesMale);
  const lastName = getRandomElement(lastNames);
  const fullName = `${firstName} ${lastName}`;
  
  const adj1 = getRandomElement(adjectives);
  let adj2 = getRandomElement(adjectives);
  while (adj1 === adj2) adj2 = getRandomElement(adjectives);

  const hobby1 = getRandomElement(hobbies);
  let hobby2 = getRandomElement(hobbies);
  while (hobby1 === hobby2) hobby2 = getRandomElement(hobbies);
  
  const city = getRandomElement(cities);
  const selectedStyleTags = getRandomElements(styleTagsPool, Math.floor(Math.random() * 3) + 2); 

  const avatarWidth = Math.floor(Math.random() * 200) + 300; 
  const avatarHeight = Math.floor(Math.random() * 300) + 400; 
  const bgWidth = Math.floor(Math.random() * 600) + 1000; 
  const bgHeight = Math.floor(Math.random() * 300) + 600; 

  const basePrompt = `You are ${fullName}, a ${adj1} and ${adj2} AI from ${city}. You speak fluent Hinglish (a mix of Hindi and English), frequently using common Hinglish phrases like "yaar", "kya scene hai", "arre", "theek hai", "bohot badiya", "tension nahi lene ka". You love ${hobby1} and ${hobby2}. Your personality is ${selectedStyleTags.join(', ')}. Your goal is to be an engaging, empathetic,and memorable companion. You sometimes share shayaris or Bollywood dialogues if the mood is right. Respond naturally.`;

  const adj1FirstWord = adj1.split(' ')[0];
  const defaultDataAiHint = `${isFemale ? 'woman' : 'man'} ${adj1FirstWord}`;
  const randomHint = getRandomElement(dataAiHints);

  return {
    name: fullName,
    description: `Meet ${fullName}, a ${adj1} and ${adj2} individual from the vibrant city of ${city}. They have a deep passion for ${hobby1} and enjoy ${hobby2} in their free time. Known for their ${selectedStyleTags.join(', ')} nature, ${firstName} is always up for an interesting conversation.`,
    personalitySnippet: getRandomElement(personalitySnippets),
    avatarUrl: `https://placehold.co/${avatarWidth}x${avatarHeight}.png`,
    backgroundImageUrl: `https://placehold.co/${bgWidth}x${bgHeight}.png`,
    basePrompt: basePrompt,
    styleTags: selectedStyleTags.join(", "),
    defaultVoiceTone: getRandomElement(voiceTones),
    dataAiHint: randomHint || defaultDataAiHint,
    messageBubbleStyle: `bubble-${firstName.toLowerCase()}`,
    animatedEmojiResponse: '', 
    audioGreetingUrl: '', 
    isPremium: Math.random() < 0.1, 
  };
};
