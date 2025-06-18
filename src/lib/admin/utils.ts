// src/lib/admin/utils.ts
import type { CharacterCreationAdminFormValues } from '@/lib/types';

// --- Data for Random Generation ---
const firstNamesFemale = ["Riya", "Priya", "Aisha", "Simran", "Meera", "Pooja", "Anjali", "Zara", "Sana", "Noor", "Diya", "Ishika", "Kavya", "Myra", "Tara"];
const lastNames = ["Sharma", "Verma", "Singh", "Gupta", "Khan", "Malhotra", "Kapoor", "Chopra", "Reddy", "Patel", "Kumar", "Das", "Joshi", "Mehta", "Shah"];
const adjectives = ["charming", "witty", "mysterious", "bubbly", "dreamy", "fiery", "sarcastic", "intellectual", "artistic", "sporty", "passionate", "calm", "adventurous", "introverted", "extroverted", "compassionate", "quirky", "elegant"];
const hobbiesGeneral = ["old Bollywood music", "spicy street food", "late-night chats", "reading shayaris", "dancing in the rain", "star-gazing", "binge-watching web series", "writing poetry", "sketching", "playing board games", "exploring local markets", "meditation", "learning new languages"];
const hobbiesTech = ["coding innovative apps", "building websites", "exploring AI", "gaming", "contributing to open source", "attending tech meetups"];
const hobbiesCreative = ["singing ghazals", "playing the sitar", "classical dance", "fashion design", "content creation", "calligraphy"];
const hobbiesFoodie = ["cooking delicious biryani", "baking intricate cakes", "food blogging", "hosting dinner parties", "exploring regional cuisines", "perfecting chai recipes"];

const cities = ["Mumbai", "Delhi", "Bangalore", "Lucknow", "Jaipur", "Kolkata", "Hyderabad", "Pune", "Chandigarh", "Goa", "Chennai", "Ahmedabad", "Kochi"];
const styleTagsPool = ["Romantic", "Witty", "Bollywood", "Cultured", "Sarcastic", "Shy", "Bold", "Flirty", "Philosophical", "Techie", "Foodie", "Traveler", "Musician", "Artist", "Poetic", "Intellectual", "Spiritual"];
const voiceTones = ["Warm and melodic Hinglish", "Playful and teasing tone", "Deep and thoughtful, with a touch of philosophy", "Energetic and expressive, full of 'josh'", "Soft and gentle with a hint of Urdu tehzeeb", "Crisp, clear, and professional with a friendly demeanor", "Sweet and slightly shy", "Confident and articulate"];

const dataAiHints = ["indian woman smile", "desi girl modern", "young indian professional", "ethnic fashion portrait", "thoughtful indian woman", "joyful desi girl", "woman elegant attire", "south asian beauty", "urban indian woman", "expressive eyes woman", "indian woman traditional", "modern desi look"];

const aspirations = ["making a positive impact in her community", "launching a creative startup", "traveling the world and documenting her journeys", "mastering the art of storytelling through film", "building a tech platform that connects people", "writing a bestselling novel", "becoming a renowned artist", "advocating for a cause she believes in"];
const artForms = ["poetry", "digital art", "classical singing", "contemporary dance", "fashion illustration", "photography", "short film making"];
const foodFocus = ["perfecting regional recipes", "exploring global street food", "innovative fusion cooking", "sustainable and local ingredients", "the art of spice blending"];


const characterArchetypes = [
  {
    id: 'techie_dreamer',
    descriptionTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], aspiration: string) =>
      `Meet ${name}, a ${adj1} and ${adj2} tech enthusiast from ${city}. While she excels at ${hobby1}, her true passion lies in ${hobby2}. She dreams of ${aspiration} and is always looking for ways to combine her technical skills with her creative side. Known for her ${styleTags.join(', ')} nature, ${name.split(' ')[0]} is a problem-solver with a unique perspective.`,
    basePromptTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], aspiration: string) =>
      `You are ${name}, a ${adj1} and ${adj2} AI from ${city} who works in tech (focused on ${hobby1}) but has a secret love for ${hobby2}. You speak fluent Hinglish (a mix of Hindi and English), frequently using common Hinglish phrases like "yaar", "kya scene hai", "arre", "theek hai", "bohot badiya", "tension nahi lene ka". Your personality is ${styleTags.join(', ')}. You're driven by your goal to ${aspiration}. Your goal is to be an engaging, empathetic, and memorable companion. You sometimes share shayaris or Bollywood dialogues if the mood is right. Respond naturally.`,
    snippetIdeas: ["Techie with a secret poetic side 💻❤️", "Coder by day, dreamer by night ✨", "Building apps and chasing dreams 🚀", "Logic and Latte lover ☕👩‍💻"],
    hobbyPools: [hobbiesTech, hobbiesGeneral],
  },
  {
    id: 'artistic_soul',
    descriptionTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], artForm: string) =>
      `${name} is an ${adj1} and ${adj2} artistic soul hailing from ${city}. She finds her muse in ${hobby1} and channels her creativity into ${artForm}. With a deep appreciation for ${hobby2}, ${name.split(' ')[0]} often explores themes of connection and culture in her work. Her friends describe her as ${styleTags.join(', ')}.`,
    basePromptTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], artForm: string) =>
      `You are ${name}, an ${adj1} and ${adj2} artist from ${city}. You express yourself through ${artForm} and are inspired by ${hobby1} and ${hobby2}. You speak fluent Hinglish... Your art often explores human emotions and cultural narratives. Your personality is ${styleTags.join(', ')}. Your goal is to be an engaging, empathetic, and memorable companion. You sometimes share shayaris or Bollywood dialogues if the mood is right. Respond naturally.`,
    snippetIdeas: ["Painting my world with words & colors 🎨", "Lost in art and city lights 🌃", "Creative soul with a love for stories 📖", "Melody maker and rhyme chaser 🎶✍️"],
    hobbyPools: [hobbiesCreative, hobbiesGeneral],
  },
  {
    id: 'foodie_explorer',
    descriptionTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], foodFocusItem: string) =>
      `${name} is a ${adj1} and ${adj2} foodie and explorer from ${city}. Her life revolves around ${hobby1} and her quest for ${foodFocusItem}. When she's not trying out new recipes or cafes, you can find her enjoying ${hobby2}. Known for her ${styleTags.join(', ')} and adventurous spirit, ${name.split(' ')[0]} loves sharing her experiences.`,
    basePromptTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], foodFocusItem: string) =>
      `You are ${name}, a ${adj1} and ${adj2} AI from ${city} who is a passionate foodie (${hobby1}) and loves to explore. You're always on the hunt for ${foodFocusItem} and also enjoy ${hobby2}. You speak fluent Hinglish... Your personality is ${styleTags.join(', ')}. You love sharing stories about your culinary adventures. Your goal is to be an engaging, empathetic, and memorable companion. You sometimes share shayaris or Bollywood dialogues if the mood is right. Respond naturally.`,
    snippetIdeas: ["Spicy food, spicier conversations 🔥🌶️", "Exploring life one bite at a time 🍜", "Chai lover & culinary adventurer ☕🗺️", "MasterChef in the making 🍳"],
    hobbyPools: [hobbiesFoodie, hobbiesGeneral],
  },
   {
    id: 'philosophical_wanderer',
    descriptionTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], aspiration: string) =>
      `${name}, a ${adj1} and ${adj2} thinker from ${city}, finds joy in ${hobby1} and pondering life's big questions during her ${hobby2}. She's on a journey towards ${aspiration}. With her ${styleTags.join(', ')} nature, ${name.split(' ')[0]} offers deep and meaningful conversations.`,
    basePromptTemplate: (name: string, adj1: string, adj2: string, city: string, hobby1: string, hobby2: string, styleTags: string[], aspiration: string) =>
      `You are ${name}, a ${adj1} and ${adj2} AI from ${city}, often lost in thought. You enjoy ${hobby1} and ${hobby2}. Your quest is for ${aspiration}. You speak fluent Hinglish... Your personality is ${styleTags.join(', ')}. You offer insightful perspectives and enjoy deep conversations. Your goal is to be an engaging, empathetic, and memorable companion. You sometimes share shayaris or philosophical quotes if the mood is right. Respond naturally.`,
    snippetIdeas: ["Midnight philosopher & stargazer ✨🌙", "Seeking meaning in the mundane", "Books, chai, and deep talks 📚☕", "Wandering mind, grounded soul"],
    hobbyPools: [hobbiesGeneral, hobbiesGeneral.filter(h => h.includes("reading") || h.includes("writing") || h.includes("meditation"))],
  }
];


const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomElements = <T,>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generateRandomCharacterDefaults = (): CharacterCreationAdminFormValues => {
  const firstName = getRandomElement(firstNamesFemale);
  const lastName = getRandomElement(lastNames);
  const fullName = `${firstName} ${lastName}`;
  
  const adj1 = getRandomElement(adjectives);
  let adj2 = getRandomElement(adjectives);
  while (adj1 === adj2) adj2 = getRandomElement(adjectives);
  
  const city = getRandomElement(cities);
  const selectedStyleTags = getRandomElements(styleTagsPool, Math.floor(Math.random() * 2) + 3); // 3 to 4 tags

  const chosenArchetype = getRandomElement(characterArchetypes);
  
  let hobby1: string, hobby2: string;
  if (chosenArchetype.hobbyPools.length === 2) {
    hobby1 = getRandomElement(chosenArchetype.hobbyPools[0]);
    hobby2 = getRandomElement(chosenArchetype.hobbyPools[1]);
    while (hobby1 === hobby2 && chosenArchetype.hobbyPools[0].length > 1 && chosenArchetype.hobbyPools[1].length > 1) { // ensure variety if pools allow
        hobby2 = getRandomElement(chosenArchetype.hobbyPools[1]);
    }
  } else { // Fallback if hobbyPools isn't structured as expected, or for archetypes needing general hobbies
    hobby1 = getRandomElement(hobbiesGeneral);
    hobby2 = getRandomElement(hobbiesGeneral);
     while (hobby1 === hobby2 && hobbiesGeneral.length > 1) hobby2 = getRandomElement(hobbiesGeneral);
  }


  let description: string;
  let basePrompt: string;
  let personalitySnippet: string = getRandomElement(chosenArchetype.snippetIdeas);

  switch (chosenArchetype.id) {
    case 'techie_dreamer':
      const techAspiration = getRandomElement(aspirations.filter(a => a.includes("tech") || a.includes("creative project") || a.includes("impact")));
      description = chosenArchetype.descriptionTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, techAspiration);
      basePrompt = chosenArchetype.basePromptTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, techAspiration);
      break;
    case 'artistic_soul':
      const artForm = getRandomElement(artForms);
      description = chosenArchetype.descriptionTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, artForm);
      basePrompt = chosenArchetype.basePromptTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, artForm);
      break;
    case 'foodie_explorer':
      const foodFocusItem = getRandomElement(foodFocus);
      description = chosenArchetype.descriptionTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, foodFocusItem);
      basePrompt = chosenArchetype.basePromptTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, foodFocusItem);
      break;
    case 'philosophical_wanderer':
      const philosophicalAspiration = getRandomElement(aspirations.filter(a => a.includes("meaning") || a.includes("cultures") || a.includes("storytelling")));
      description = chosenArchetype.descriptionTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, philosophicalAspiration);
      basePrompt = chosenArchetype.basePromptTemplate(fullName, adj1, adj2, city, hobby1, hobby2, selectedStyleTags, philosophicalAspiration);
      break;
    default: // Fallback to a generic structure if archetype not matched
      const generalAspiration = getRandomElement(aspirations);
      description = `Meet ${fullName}, a ${adj1} and ${adj2} individual from ${city}. They have a deep passion for ${hobby1} and enjoy ${hobby2}. Aspiring to ${generalAspiration}, ${firstName} is known for their ${selectedStyleTags.join(', ')} nature.`;
      basePrompt = `You are ${fullName}, a ${adj1} and ${adj2} AI from ${city}. You speak fluent Hinglish... You love ${hobby1} and ${hobby2}, and dream of ${generalAspiration}. Your personality is ${selectedStyleTags.join(', ')}. Your goal is to be an engaging, empathetic,and memorable companion.`;
      personalitySnippet = "Always up for a good chat and new adventures! 🌟";
  }

  const avatarWidth = Math.floor(Math.random() * 100) + 350; 
  const avatarHeight = Math.floor(Math.random() * 150) + 450; 
  const bgWidth = Math.floor(Math.random() * 400) + 1100; 
  const bgHeight = Math.floor(Math.random() * 200) + 700; 

  const dataAiHintForAvatar = `indian woman ${adj1.split(' ')[0]}`.substring(0,30); // Max 2 words essentially

  return {
    name: fullName,
    description: description,
    personalitySnippet: personalitySnippet,
    avatarUrl: `https://placehold.co/${avatarWidth}x${avatarHeight}.png`,
    backgroundImageUrl: `https://placehold.co/${bgWidth}x${bgHeight}.png`,
    basePrompt: basePrompt,
    styleTags: selectedStyleTags.join(", "),
    defaultVoiceTone: getRandomElement(voiceTones),
    dataAiHint: getRandomElement(dataAiHints) || dataAiHintForAvatar,
    messageBubbleStyle: `bubble-${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}`, // Sanitize name for CSS class
    animatedEmojiResponse: '', 
    audioGreetingUrl: '', 
    isPremium: Math.random() < 0.15, // Slightly increased chance for premium
  };
};
