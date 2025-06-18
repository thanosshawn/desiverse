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
  serverTimestamp as rtdbServerTimestamp, 
  off,
  type Unsubscribe,
  update,
} from 'firebase/database';
import { db } from './config'; // RTDB instance
import type { UserProfile, CharacterMetadata, UserChatSessionMetadata, MessageDocument, AdminCredentials } from '@/lib/types';

// Helper to get server timestamp value for RTDB
const getServerTimestamp = () => rtdbServerTimestamp;

// --- User Profile ---
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  const profileData: UserProfile = {
    uid,
    name: data.name || "Desi User", // Default name
    email: data.email || null,
    avatarUrl: data.avatarUrl || null,
    joinedAt: data.joinedAt || Date.now(), 
    lastActive: data.lastActive || Date.now(),
    subscriptionTier: data.subscriptionTier || 'free',
    selectedTheme: data.selectedTheme || 'light',
    languagePreference: data.languagePreference || 'hinglish',
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
  // We use `update` here to only change specified fields and avoid overwriting the whole profile
  // especially if `getServerTimestamp()` is involved.
  await update(userRef, {...data, lastActive: getServerTimestamp()});
}


// --- Character Metadata ---
export async function getCharacterMetadata(characterId: string): Promise<CharacterMetadata | null> {
  const characterRef = ref(db, `characters/${characterId}`);
  const snapshot = await get(characterRef);
  if (snapshot.exists()) {
    const val = snapshot.val();
    return { 
      id: snapshot.key!, 
      name: val.name,
      description: val.description,
      personalitySnippet: val.personalitySnippet || val.description.substring(0, 70) + "...",
      avatarUrl: val.avatarUrl,
      backgroundImageUrl: val.backgroundImageUrl,
      basePrompt: val.basePrompt,
      styleTags: val.styleTags || [],
      defaultVoiceTone: val.defaultVoiceTone,
      createdAt: val.createdAt,
      dataAiHint: val.dataAiHint,
      messageBubbleStyle: val.messageBubbleStyle,
      animatedEmojiResponse: val.animatedEmojiResponse,
      audioGreetingUrl: val.audioGreetingUrl,
      isPremium: val.isPremium || false,
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
        personalitySnippet: val.personalitySnippet || val.description.substring(0, 70) + "...",
        avatarUrl: val.avatarUrl,
        backgroundImageUrl: val.backgroundImageUrl,
        basePrompt: val.basePrompt,
        styleTags: val.styleTags || [],
        defaultVoiceTone: val.defaultVoiceTone,
        createdAt: val.createdAt,
        dataAiHint: val.dataAiHint,
        messageBubbleStyle: val.messageBubbleStyle,
        animatedEmojiResponse: val.animatedEmojiResponse,
        audioGreetingUrl: val.audioGreetingUrl,
        isPremium: val.isPremium || false,
      } as CharacterMetadata);
    });
  }
  return characters;
}

export async function addCharacter(characterId: string, data: Omit<CharacterMetadata, 'id' | 'createdAt'> & { createdAt?: number }): Promise<void> {
  const characterRef = ref(db, `characters/${characterId}`);
  const characterDataToWrite: CharacterMetadata = {
     ...data, 
     id: characterId, 
     createdAt: data.createdAt || (getServerTimestamp() as unknown as number),
     personalitySnippet: data.personalitySnippet || data.description.substring(0,70) + "...",
     isPremium: data.isPremium || false,
     styleTags: data.styleTags || [],
  };
  await set(characterRef, characterDataToWrite);
}


// --- Chat Session Metadata ---
export async function getOrCreateChatSession(userId: string, characterId: string): Promise<UserChatSessionMetadata> {
  const chatMetadataRef = ref(db, `users/${userId}/userChats/${characterId}/metadata`);
  const snapshot = await get(chatMetadataRef);

  if (snapshot.exists()) {
    const existingData = snapshot.val() as UserChatSessionMetadata;
    await update(chatMetadataRef, { updatedAt: getServerTimestamp() }); // Use update
    return { ...existingData, updatedAt: Date.now() }; 
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
      isFavorite: false, // Initialize new field
    };
    await set(chatMetadataRef, newChatSessionMeta);

    await addMessageToChat(userId, characterId, {
      sender: 'ai',
      text: `Namaste! Main hoon ${characterMeta.name}. ${characterMeta.personalitySnippet} Kaho, kya baat karni hai? 😉`,
      messageType: 'text',
      timestamp: getServerTimestamp() as unknown as number,
    });
    
    const now = Date.now();
    return { ...newChatSessionMeta, createdAt: now, updatedAt: now, lastMessageTimestamp: now };
  }
}

export async function getUserChatSessions(userId: string): Promise<(UserChatSessionMetadata & {characterId: string})[]> {
  const userChatsRef = ref(db, `users/${userId}/userChats`);
  const snapshot = await get(userChatsRef);
  const sessions: (UserChatSessionMetadata & {characterId: string})[] = [];
  if (snapshot.exists()) {
    snapshot.forEach(charSessionSnapshot => {
      const metadata = charSessionSnapshot.child('metadata').val();
      if (metadata) {
        sessions.push({
          ...metadata,
          characterId: charSessionSnapshot.key!,
        } as UserChatSessionMetadata & {characterId: string});
      }
    });
  }
  // Sort by updatedAt descending (most recent first), then by isFavorite
  sessions.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
  return sessions;
}

export async function updateChatSessionMetadata(userId: string, characterId: string, data: Partial<UserChatSessionMetadata>): Promise<void> {
  const chatMetadataRef = ref(db, `users/${userId}/userChats/${characterId}/metadata`);
  await update(chatMetadataRef, {...data, updatedAt: getServerTimestamp()});
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

  // Update chat session metadata
  const chatMetadataUpdates: Partial<UserChatSessionMetadata> = {
    lastMessageText: messageData.text.substring(0, 100),
    lastMessageTimestamp: finalMessageData.timestamp as number,
    // No need to spread currentMetadata here, update will merge
  };
   await updateChatSessionMetadata(userId, characterId, chatMetadataUpdates);

  return newMessageRef.key!;
}

export function getMessagesStream(
  userId: string,
  characterId: string, 
  callback: (messages: (MessageDocument & { id: string })[]) => void,
  messageLimit: number = 50 
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


// --- Admin Credentials (Prototype - INSECURE plain text) ---
export async function getAdminCredentials(): Promise<AdminCredentials | null> {
  const credRef = ref(db, 'admin_settings/credentials');
  const snapshot = await get(credRef);
  return snapshot.exists() ? (snapshot.val() as AdminCredentials) : null;
}

export async function seedAdminCredentialsIfNeeded(): Promise<void> {
  const credRef = ref(db, 'admin_settings/credentials');
  const snapshot = await get(credRef);
  if (!snapshot.exists()) {
    const defaultCreds: AdminCredentials = {
      username: 'admin',
      password: 'admin', 
    };
    try {
      await set(credRef, defaultCreds);
      console.log('Default admin credentials seeded to RTDB (INSECURE - PROTOTYPE ONLY).');
    } catch (error) {
      console.error('Error seeding admin credentials. Check RTDB rules for /admin_settings/credentials.', error);
    }
  }
}


// --- Seed Data ---
export async function seedInitialCharacters() {
  const charactersRef = ref(db, 'characters');
  try {
    await set(charactersRef, null); // Clears existing characters
    console.log("Characters node in RTDB has been cleared.");
    
    // Example of how you might add a character if needed for testing,
    // but for now, we keep it empty as per "remove all characters"
    /*
    const sampleCharId = "priya_sharma_001";
    const sampleCharData: Omit<CharacterMetadata, 'id' | 'createdAt'> = {
        name: "Priya Sharma",
        description: "A bubbly and modern girl from Mumbai, loves Bollywood and street food. She's confident and flirty.",
        personalitySnippet: "Mumbai ki Kudi ✨ Bollywood & Chats!",
        avatarUrl: "https://placehold.co/400x400.png", // Replace with actual Supabase URL
        backgroundImageUrl: "https://placehold.co/800x600.png", // Replace
        basePrompt: "You are Priya Sharma, a fun-loving and flirty girl from Mumbai. You use a lot of Hinglish, latest slang, and Bollywood references. You are here to have an exciting and engaging chat.",
        styleTags: ["Flirty", "Bollywood", "Funny", "Bold"],
        defaultVoiceTone: "Upbeat Hinglish (Mumbai accent)",
        dataAiHint: "indian woman",
        messageBubbleStyle: "pink-gradient",
        isPremium: false,
    };
    await addCharacter(sampleCharId, sampleCharData);
    console.log("Added sample character Priya Sharma.");
    */

  } catch (error) {
    console.error("Error seeding/clearing characters in RTDB: ", error);
  }
}
