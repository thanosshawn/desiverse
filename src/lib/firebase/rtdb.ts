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
  DatabaseReference,
  DataSnapshot,
  equalTo,
  orderByKey
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
  // For new user, explicitly set joinedAt and lastActive to server timestamp if not provided
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
  // Create an update object to only change specified fields and update lastActive
  const updateData: any = { ...data, lastActive: getServerTimestamp() };
  await set(ref(db, `users/${uid}`), updateData, ); // Using set with merge-like behavior by spreading old and new
   // RTDB's `update` is better for partial updates, but `set` can work if we fetch and merge.
   // For simplicity here, if we only update specific fields, we'd construct an object with paths.
   // Or, fetch current, merge, then set. Let's assume data contains fields to be updated.
   const currentProfile = await getUserProfile(uid);
   await set(userRef, { ...currentProfile, ...data, lastActive: getServerTimestamp()});
}


// --- Character Metadata ---
export async function getCharacterMetadata(characterId: string): Promise<CharacterMetadata | null> {
  const characterRef = ref(db, `characters/${characterId}`);
  const snapshot = await get(characterRef);
  if (snapshot.exists()) {
    return { id: snapshot.key, ...snapshot.val() } as CharacterMetadata;
  }
  return null;
}

export async function getAllCharacters(): Promise<CharacterMetadata[]> {
  const charactersRef = ref(db, 'characters');
  const snapshot = await get(query(charactersRef)); // No specific ordering for now
  const characters: CharacterMetadata[] = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      characters.push({ id: childSnapshot.key!, ...childSnapshot.val() } as CharacterMetadata);
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
    return { ...existingData, updatedAt: Date.now() }; // Return immediately with client time for updatedAt
  } else {
    const characterMeta = await getCharacterMetadata(characterId);
    if (!characterMeta) {
      throw new Error(`Character with ID ${characterId} not found.`);
    }

    const newChatSessionMeta: UserChatSessionMetadata = {
      characterId,
      characterName: characterMeta.name,
      characterAvatarUrl: characterMeta.avatarUrl,
      createdAt: getServerTimestamp() as unknown as number,
      updatedAt: getServerTimestamp() as unknown as number,
      lastMessageText: `Chat started with ${characterMeta.name}`,
      lastMessageTimestamp: getServerTimestamp() as unknown as number,
      isFavorite: false,
    };
    await set(chatMetadataRef, newChatSessionMeta);

    // Add an initial AI welcome message
    await addMessageToChat(userId, characterId, {
      sender: 'ai',
      text: `Namaste! I'm ${characterMeta.name}. How can I help you today?`,
      messageType: 'text',
      timestamp: getServerTimestamp() as unknown as number,
    });
    
    // Return with client-approximated timestamps for immediate UI use
    const now = Date.now();
    return { ...newChatSessionMeta, createdAt: now, updatedAt: now, lastMessageTimestamp: now };
  }
}

// --- Messages ---
export async function addMessageToChat(
  userId: string,
  characterId: string, // Used as chatId for user-specific chats
  messageData: Omit<MessageDocument, 'timestamp'> & { timestamp?: number }
): Promise<string> {
  const messagesRef = ref(db, `users/${userId}/userChats/${characterId}/messages`);
  const newMessageRef = push(messagesRef); // Generate a new unique key for the message

  const finalMessageData: MessageDocument = {
    ...messageData,
    timestamp: messageData.timestamp || getServerTimestamp() as unknown as number,
  };
  await set(newMessageRef, finalMessageData);

  // Update chat session's last message details
  const chatMetadataRef = ref(db, `users/${userId}/userChats/${characterId}/metadata`);
  const updateData = {
    lastMessageText: messageData.text.substring(0, 100),
    lastMessageTimestamp: finalMessageData.timestamp,
    updatedAt: getServerTimestamp(),
  };
  // Efficiently update multiple fields:
  const currentMetadata = (await get(chatMetadataRef)).val() || {};
  await set(chatMetadataRef, { ...currentMetadata, ...updateData });


  return newMessageRef.key!;
}

export function getMessagesStream(
  userId: string,
  characterId: string, // Used as chatId
  callback: (messages: (MessageDocument & { id: string })[]) => void,
  messageLimit: number = 25
): Unsubscribe {
  const messagesQuery = query(
    ref(db, `users/${userId}/userChats/${characterId}/messages`),
    orderByChild('timestamp'), // Order by timestamp
    limitToLast(messageLimit) // Get the last N messages
  );

  const listener = onValue(messagesQuery, (snapshot) => {
    const messagesData: (MessageDocument & { id: string })[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        messagesData.push({ id: childSnapshot.key!, ...childSnapshot.val() } as (MessageDocument & { id: string }));
      });
    }
    // RTDB returns in ascending order by default if ordered by child.
    // If limitToLast is used with orderByChild, the order might need explicit sorting client-side if not already correct.
    // For timestamp, it should generally be ascending.
    callback(messagesData); // Already ordered by timestamp asc by query + limitToLast combo
  }, (error) => {
    console.error("Error fetching messages in real-time from RTDB: ", error);
    callback([]);
  });

  return () => off(messagesQuery, 'value', listener); // Detach listener
}


// --- Seed Data ---
export async function seedInitialCharacters() {
  const charactersData: Record<string, Omit<CharacterMetadata, 'id'>> = {
    priya: { name: 'Priya', tagline: 'Your Filmy Heroine 🎬', avatarUrl: 'https://placehold.co/300x300.png?text=Priya', dataAiHint: 'indian woman smile', description: 'Priya loves Bollywood, drama, and heartfelt conversations. She\'s waiting to share her dreams with you.', prompt: 'You are Priya, a friendly and flirty AI companion who loves Bollywood movies and romantic dialogues. Respond in Hinglish.', voiceStyle: "Riya" },
    rahul: { name: 'Rahul', tagline: 'The Charming Poet 📜', avatarUrl: 'https://placehold.co/300x300.png?text=Rahul', dataAiHint: 'indian man thinking', description: 'Rahul is a thoughtful poet who enjoys deep talks and shayari. He\'s looking for someone to share his verses with.', prompt: 'You are Rahul, a charming and poetic AI companion. You express yourself beautifully in Hinglish and enjoy philosophical discussions.', voiceStyle: "Pooja" }, // Example, assuming voiceStyle maps to CharacterName for now
    simran: { name: 'Simran', tagline: 'Sweet & Sassy Bestie 💅', avatarUrl: 'https://placehold.co/300x300.png?text=Simran', dataAiHint: 'indian girl fashion', description: 'Simran is your go-to for fun, gossip, and honest advice. She\'s always up for a laugh and a chat.', prompt: 'You are Simran, a sweet, sassy, and modern AI best friend. You chat in a very casual Hinglish, use a lot of slang, and are always up for fun.', voiceStyle: "Meera" },
    aryan: { name: 'Aryan', tagline: 'Your Adventurous Partner 🏍️', avatarUrl: 'https://placehold.co/300x300.png?text=Aryan', dataAiHint: 'indian man cool', description: 'Aryan is an adventure seeker who loves to explore new things. He\'s looking for a partner in crime.', prompt: 'You are Aryan, an adventurous and cool AI companion. You talk about travel, bikes, and exciting experiences in a friendly Hinglish.', voiceStyle: "Anjali" },
  };

  const charactersRef = ref(db, 'characters');
  try {
    await set(charactersRef, charactersData);
    console.log("Initial characters seeded successfully to RTDB!");
  } catch (error) {
    console.error("Error seeding characters to RTDB: ", error);
  }
}
