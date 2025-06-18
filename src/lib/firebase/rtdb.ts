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
  type Unsubscribe,
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

export async function addCharacter(characterId: string, data: Omit<CharacterMetadata, 'id'>): Promise<void> {
  // In RTDB, the characterId becomes the key of the node.
  // The data stored at `characters/${characterId}` will be the `data` object itself.
  // We no longer need to store the `id` field within the object if characterId is the key.
  // However, to maintain consistency with CharacterMetadata type which expects an id, 
  // we'll keep it for now, though it's redundant for direct RTDB structure under characters/${characterId}.
  // If CharacterMetadata is used for other purposes where id is crucial from the object itself, it's fine.
  // Otherwise, for pure RTDB storage under `characters/${characterId}`, the `id` field inside `data` isn't strictly needed.
  const characterRef = ref(db, `characters/${characterId}`);
  const characterDataToWrite: CharacterMetadata = { ...data, id: characterId, createdAt: data.createdAt || Date.now() };
  await set(characterRef, characterDataToWrite);
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
      characterAvatarUrl: characterMeta.avatarUrl,
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
  messageLimit: number = 50 // Increased default limit slightly
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
    // Ensure messages are sorted by timestamp if not guaranteed by RTDB default order for keys (though orderByChild should handle it)
    // messagesData.sort((a, b) => a.timestamp - b.timestamp);
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
    // WARNING: Storing plain text credentials. Highly insecure. For prototype only.
    const defaultCreds: AdminCredentials = {
      username: 'admin',
      password: 'admin', // Super insecure
    };
    try {
      await set(credRef, defaultCreds);
      console.log('Default admin credentials seeded to RTDB (INSECURE - PROTOTYPE ONLY).');
    } catch (error) {
      console.error('Error seeding admin credentials. Check RTDB rules for /admin_settings/credentials. It might need to be writable temporarily by an admin user or globally for first seed.', error);
      // Rethrow or handle as appropriate if seeding is critical for app function
      // For this prototype, we'll log and continue.
    }
  }
}


// --- Seed Data ---
export async function seedInitialCharacters() {
  const charactersRef = ref(db, 'characters');
  try {
    // This will remove all existing characters under the 'characters' node
    // by setting its value to null.
    await set(charactersRef, null);
    console.log("Characters node in RTDB has been cleared. No characters will be present until added via admin or other means.");
  } catch (error) {
    console.error("Error clearing characters in RTDB: ", error);
  }
}
