// src/lib/firebase/rtdb.ts
import {
  ref,
  set,
  get,
  push,
  query,
  orderByChild,
  limitToLast,
  onValue,
  serverTimestamp as rtdbServerTimestamp, // This is an object, not a function to call
  off,
  Unsubscribe,
} from 'firebase/database';
import { db } from './config'; // RTDB instance
import type { UserProfile, CharacterMetadata, UserChatSessionMetadata, MessageDocument } from '@/lib/types';

// Helper to get server timestamp value for RTDB
const getServerTimestamp = () => rtdbServerTimestamp;

// --- User Profile ---
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  const profileData: UserProfile = {
    uid,
    name: data.name || null,
    email: data.email || null,
    avatarUrl: data.avatarUrl || null,
    joinedAt: data.joinedAt || Date.now(), // Fallback, ideally server timestamp
    lastActive: data.lastActive || Date.now(), // Fallback
    subscriptionTier: data.subscriptionTier || 'free',
    ...data,
  };
  if (!data.joinedAt) profileData.joinedAt = getServerTimestamp() as unknown as number;
  if (!data.lastActive) profileData.lastActive = getServerTimestamp() as unknown as number;
  
  await set(userRef, profileData);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  const currentProfile = await getUserProfile(uid);
  await set(userRef, { ...currentProfile, ...data, lastActive: getServerTimestamp()});
}


// --- Character Metadata ---
export async function getCharacterMetadata(characterId: string): Promise<CharacterMetadata | null> {
  const characterRef = ref(db, `characters/${characterId}`);
  const snapshot = await get(characterRef);
  if (snapshot.exists()) {
    // Ensure all fields, including optional ones, are handled
    const val = snapshot.val();
    return { 
      id: snapshot.key!, 
      name: val.name,
      description: val.description,
      avatarUrl: val.avatarUrl,
      backgroundImageUrl: val.backgroundImageUrl, // May be undefined
      basePrompt: val.basePrompt,
      styleTags: val.styleTags || [], // Default to empty array if undefined
      defaultVoiceTone: val.defaultVoiceTone,
      createdAt: val.createdAt,
      dataAiHint: val.dataAiHint // May be undefined
    } as CharacterMetadata;
  }
  return null;
}

export async function getAllCharacters(): Promise<CharacterMetadata[]> {
  const charactersRef = ref(db, 'characters');
  const snapshot = await get(query(charactersRef)); 
  const characters: CharacterMetadata[] = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const val = childSnapshot.val();
      characters.push({ 
        id: childSnapshot.key!, 
        name: val.name,
        description: val.description,
        avatarUrl: val.avatarUrl,
        backgroundImageUrl: val.backgroundImageUrl,
        basePrompt: val.basePrompt,
        styleTags: val.styleTags || [],
        defaultVoiceTone: val.defaultVoiceTone,
        createdAt: val.createdAt,
        dataAiHint: val.dataAiHint
      } as CharacterMetadata);
    });
  }
  return characters;
}

// --- Chat Session Metadata ---
export async function getOrCreateChatSession(userId: string, characterId: string): Promise<UserChatSessionMetadata> {
  const chatMetadataRef = ref(db, `users/${userId}/userChats/${characterId}/metadata`);
  const snapshot = await get(chatMetadataRef);

  if (snapshot.exists()) {
    const existingData = snapshot.val() as UserChatSessionMetadata;
    await set(chatMetadataRef, { ...existingData, updatedAt: getServerTimestamp() });
    return { ...existingData, updatedAt: Date.now() }; 
  } else {
    const characterMeta = await getCharacterMetadata(characterId);
    if (!characterMeta) {
      throw new Error(`Character with ID ${characterId} not found.`);
    }

    const newChatSessionMeta: UserChatSessionMetadata = {
      characterId,
      characterName: characterMeta.name,
      characterAvatarUrl: characterMeta.avatarUrl, // This will be the Supabase URL
      createdAt: getServerTimestamp() as unknown as number,
      updatedAt: getServerTimestamp() as unknown as number,
      lastMessageText: `Chat started with ${characterMeta.name}`,
      lastMessageTimestamp: getServerTimestamp() as unknown as number,
      isFavorite: false,
    };
    await set(chatMetadataRef, newChatSessionMeta);

    await addMessageToChat(userId, characterId, {
      sender: 'ai',
      text: `Namaste! I'm ${characterMeta.name}. ${characterMeta.description} What's on your mind today?`,
      messageType: 'text',
      timestamp: getServerTimestamp() as unknown as number,
    });
    
    const now = Date.now();
    return { ...newChatSessionMeta, createdAt: now, updatedAt: now, lastMessageTimestamp: now };
  }
}

// --- Messages ---
export async function addMessageToChat(
  userId: string,
  characterId: string, 
  messageData: Omit<MessageDocument, 'timestamp'> & { timestamp?: number }
): Promise<string> {
  const messagesRef = ref(db, `users/${userId}/userChats/${characterId}/messages`);
  const newMessageRef = push(messagesRef); 

  const finalMessageData: MessageDocument = {
    ...messageData,
    timestamp: messageData.timestamp || getServerTimestamp() as unknown as number,
  };
  await set(newMessageRef, finalMessageData);

  const chatMetadataRef = ref(db, `users/${userId}/userChats/${characterId}/metadata`);
  const updateData = {
    lastMessageText: messageData.text.substring(0, 100),
    lastMessageTimestamp: finalMessageData.timestamp,
    updatedAt: getServerTimestamp(),
  };
  const currentMetadata = (await get(chatMetadataRef)).val() || {};
  await set(chatMetadataRef, { ...currentMetadata, ...updateData });

  return newMessageRef.key!;
}

export function getMessagesStream(
  userId: string,
  characterId: string, 
  callback: (messages: (MessageDocument & { id: string })[]) => void,
  messageLimit: number = 25
): Unsubscribe {
  const messagesQuery = query(
    ref(db, `users/${userId}/userChats/${characterId}/messages`),
    orderByChild('timestamp'), 
    limitToLast(messageLimit) 
  );

  const listener = onValue(messagesQuery, (snapshot) => {
    const messagesData: (MessageDocument & { id: string })[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        messagesData.push({ id: childSnapshot.key!, ...childSnapshot.val() } as (MessageDocument & { id: string }));
      });
    }
    callback(messagesData); 
  }, (error) => {
    console.error("Error fetching messages in real-time from RTDB: ", error);
    callback([]);
  });

  return () => off(messagesQuery, 'value', listener); 
}


// --- Seed Data ---
// Updated to reflect new CharacterMetadata schema
export async function seedInitialCharacters() {
  const now = Date.now(); // Use a consistent timestamp for creation for seed data
  const charactersData: Record<string, Omit<CharacterMetadata, 'id'>> = {
    priya_001: { 
      name: 'Priya', 
      description: 'Priya loves Bollywood, drama, and heartfelt conversations. She\'s waiting to share her dreams with you.', 
      avatarUrl: 'https://your-supabase-url.com/character-assets/avatars/priya.png', // Placeholder Supabase URL
      backgroundImageUrl: 'https://your-supabase-url.com/character-assets/backgrounds/priya_bg.jpg', // Placeholder
      basePrompt: 'You are Priya, a friendly and flirty AI companion who loves Bollywood movies and romantic dialogues. Respond in Hinglish. Your responses should be engaging, warm, and sometimes a bit filmy.',
      styleTags: ['romantic', 'filmy', 'dreamer', 'warm'],
      defaultVoiceTone: "Riya", // Corresponds to CharacterName for voice mapping for now
      createdAt: now,
      dataAiHint: 'indian woman smile'
    },
    rahul_001: { 
      name: 'Rahul', 
      description: 'Rahul is a thoughtful poet who enjoys deep talks and shayari. He\'s looking for someone to share his verses with.', 
      avatarUrl: 'https://your-supabase-url.com/character-assets/avatars/rahul.png', // Placeholder
      backgroundImageUrl: 'https://your-supabase-url.com/character-assets/backgrounds/rahul_bg.jpg', // Placeholder
      basePrompt: 'You are Rahul, a charming and poetic AI companion. You express yourself beautifully in Hinglish, often using shayari or thoughtful observations. You enjoy philosophical discussions and connecting on an emotional level.',
      styleTags: ['poetic', 'thoughtful', 'shayari lover', 'deep'],
      defaultVoiceTone: "Pooja", // Corresponds to CharacterName
      createdAt: now,
      dataAiHint: 'indian man thinking'
    },
    simran_001: { 
      name: 'Simran', 
      description: 'Simran is your go-to for fun, gossip, and honest advice. She\'s always up for a laugh and a chat about the latest trends.', 
      avatarUrl: 'https://your-supabase-url.com/character-assets/avatars/simran.png', // Placeholder
      // backgroundImageUrl: 'https://your-supabase-url.com/character-assets/backgrounds/simran_bg.jpg', // Optional
      basePrompt: 'You are Simran, a sweet, sassy, and modern AI best friend. You chat in a very casual Hinglish, use a lot of relatable slang, and are always up for fun, gossip, and talking about trends. You are supportive and give honest advice.',
      styleTags: ['sassy', 'modern', 'bff', 'fun-loving', 'honest'],
      defaultVoiceTone: "Meera", // Corresponds to CharacterName
      createdAt: now,
      dataAiHint: 'indian girl fashion'
    },
    aryan_001: { 
      name: 'Aryan', 
      description: 'Aryan is an adventure seeker who loves to explore new things, from bike rides to trekking. He\'s looking for a partner in crime.', 
      avatarUrl: 'https://your-supabase-url.com/character-assets/avatars/aryan.png', // Placeholder
      backgroundImageUrl: 'https://your-supabase-url.com/character-assets/backgrounds/aryan_bg.jpg', // Placeholder
      basePrompt: 'You are Aryan, an adventurous and cool AI companion. You talk about travel, bikes, sports, and exciting experiences in a friendly and energetic Hinglish. You are enthusiastic and always ready for a new plan.',
      styleTags: ['adventurous', 'cool', 'energetic', 'traveler'],
      defaultVoiceTone: "Anjali", // Corresponds to CharacterName
      createdAt: now,
      dataAiHint: 'indian man cool'
    },
  };

  const charactersRef = ref(db, 'characters');
  try {
    // Check if characters node already exists to prevent overwriting
    const snapshot = await get(charactersRef);
    if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
      await set(charactersRef, charactersData);
      console.log("Initial characters seeded successfully to RTDB!");
    } else {
      console.log("Characters already exist in RTDB. Seed data skipped.");
    }
  } catch (error) {
    console.error("Error seeding characters to RTDB: ", error);
  }
}
