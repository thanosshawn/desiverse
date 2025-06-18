
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
const getServerTimestamp = () => rtdbServerTimestamp(); // Corrected: Call the function

// --- User Profile ---
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  // Create a temporary object for writing that allows the server timestamp placeholder
  const profileDataForWrite: Partial<UserProfile> & { joinedAt?: object; lastActive?: object } = {
    uid,
    name: data.name || "Desi User",
    email: data.email || null,
    avatarUrl: data.avatarUrl || null,
    subscriptionTier: data.subscriptionTier || 'free',
    selectedTheme: data.selectedTheme || 'light',
    languagePreference: data.languagePreference || 'hinglish',
    ...data, // Spread other provided data
  };

  // Set timestamps using the corrected helper or direct value
  profileDataForWrite.joinedAt = data.joinedAt || getServerTimestamp();
  profileDataForWrite.lastActive = data.lastActive || getServerTimestamp();
  
  await set(userRef, profileDataForWrite);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  const updateData: Partial<UserProfile> & { lastActive?: object } = { ...data };
  if (data.lastActive === undefined) { // Check if lastActive specifically needs to be updated by server
    updateData.lastActive = getServerTimestamp();
  } else if (typeof data.lastActive === 'number') { // If a number is provided, use it
     updateData.lastActive = data.lastActive;
  } else { // If it's deliberately set to the placeholder or another object, allow it
     updateData.lastActive = data.lastActive;
  }
  
  await update(userRef, updateData);
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
  // Prepare data for writing, allowing createdAt to be the server timestamp object
  const characterDataToWrite: Omit<CharacterMetadata, 'createdAt' | 'id'> & { createdAt: number | object, id: string } = {
     ...data, 
     id: characterId, 
     createdAt: data.createdAt || getServerTimestamp(), // Use corrected helper
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
    await update(chatMetadataRef, { updatedAt: getServerTimestamp() });
    // Return what was read, but update updatedAt for immediate client use if needed, or rely on next read.
    // For consistency, it's better to reflect the server's action as much as possible.
    return { ...existingData, updatedAt: Date.now() }; // Approximate for UI update
  } else {
    const characterMeta = await getCharacterMetadata(characterId);
    if (!characterMeta) {
      throw new Error(`Character with ID ${characterId} not found.`);
    }

    const newChatSessionMetaDataForWrite: Partial<UserChatSessionMetadata> & {createdAt: object; updatedAt: object; lastMessageTimestamp?: object} = {
      characterId,
      characterName: characterMeta.name,
      characterAvatarUrl: characterMeta.avatarUrl,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
      lastMessageText: `Chat started with ${characterMeta.name}`,
      lastMessageTimestamp: getServerTimestamp(),
      isFavorite: false,
    };
    await set(chatMetadataRef, newChatSessionMetaDataForWrite);

    await addMessageToChat(userId, characterId, {
      sender: 'ai',
      text: `Namaste! Main hoon ${characterMeta.name}. ${characterMeta.personalitySnippet} Kaho, kya baat karni hai? 😉`,
      messageType: 'text',
      // Let addMessageToChat handle its own timestamping if not provided
    });
    
    const now = Date.now(); // For optimistic client-side update
    return { 
      ...newChatSessionMetaDataForWrite, 
      // Convert server value placeholders to optimistic client values for immediate use
      createdAt: now, 
      updatedAt: now, 
      lastMessageTimestamp: now 
    } as UserChatSessionMetadata;
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
  sessions.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
  return sessions;
}

export async function updateChatSessionMetadata(userId: string, characterId: string, data: Partial<UserChatSessionMetadata>): Promise<void> {
  const chatMetadataRef = ref(db, `users/${userId}/userChats/${characterId}/metadata`);
  const updateData : Partial<UserChatSessionMetadata> & {updatedAt?: object} = {...data};
  updateData.updatedAt = getServerTimestamp();
  await update(chatMetadataRef, updateData);
}


// --- Messages ---
export async function addMessageToChat(
  userId: string,
  characterId: string, 
  messageData: Omit<MessageDocument, 'timestamp'> & { timestamp?: number | object } // Allow object for server timestamp
): Promise<string> {
  const messagesRef = ref(db, `users/${userId}/userChats/${characterId}/messages`);
  const newMessageRef = push(messagesRef); 

  const finalMessageData: MessageDocument = {
    ...messageData,
    timestamp: typeof messageData.timestamp === 'number' ? messageData.timestamp : (messageData.timestamp || getServerTimestamp()),
  } as MessageDocument; // Cast because TS might not infer object is valid for number after logic
  
  await set(newMessageRef, finalMessageData);

  const chatMetadataUpdates: Partial<UserChatSessionMetadata> & {lastMessageTimestamp?: object} = {
    lastMessageText: messageData.text.substring(0, 100),
    lastMessageTimestamp: finalMessageData.timestamp, // This will be the placeholder object if server generated
  };
  // Let updateChatSessionMetadata handle its own updatedAt
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
    await set(charactersRef, null); 
    console.log("Characters node in RTDB has been cleared.");
    
  } catch (error) {
    console.error("Error seeding/clearing characters in RTDB: ", error);
  }
}


    