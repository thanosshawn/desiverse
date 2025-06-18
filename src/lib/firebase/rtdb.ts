
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

// --- User Profile ---

// Type for data structure when writing a new user profile to RTDB.
// Timestamps are 'object' because they are Firebase ServerValue.TIMESTAMP placeholders.
type NewUserProfileWritePayload = Omit<Partial<UserProfile>, 'uid' | 'joinedAt' | 'lastActive'> & {
  joinedAt: object; // Firebase Server Timestamp Placeholder
  lastActive: object; // Firebase Server Timestamp Placeholder
};

export async function createUserProfile(uid: string, data: NewUserProfileWritePayload): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  const profileDataForWrite = {
    uid, // Use the passed uid
    name: data.name ?? "Desi User",
    email: data.email ?? null,
    avatarUrl: data.avatarUrl ?? null,
    subscriptionTier: data.subscriptionTier ?? 'free',
    selectedTheme: data.selectedTheme ?? 'light', // Default if not in data
    languagePreference: data.languagePreference ?? 'hinglish', // Default if not in data
    joinedAt: data.joinedAt, // This IS the placeholder object from data
    lastActive: data.lastActive, // This IS the placeholder object from data
  };
  await set(userRef, profileDataForWrite);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
}

// Type for data structure when updating a user profile.
// lastActive can be a number (client-set timestamp) or an object (server timestamp placeholder).
type UserProfileUpdateData = Omit<Partial<UserProfile>, 'lastActive'> & {
  lastActive?: number | object;
};

export async function updateUserProfile(uid: string, data: UserProfileUpdateData): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  // Create a new object for the update operation to avoid mutating the input `data`
  const updatePayload: { [key: string]: any } = { ...data };

  // If lastActive is explicitly part of the data to update, ensure it's correctly formatted.
  // If `data.lastActive` is already a server timestamp object or a number, it will be used as is.
  // If `data.lastActive` was undefined, it won't be in `updatePayload` unless explicitly added like below.
  // The AuthContext calls now ensure `lastActive` is `rtdbServerTimestamp()` if it's meant to be a server update.
  
  // No specific transformation for lastActive is needed here if AuthContext correctly provides it.
  // Firebase `update` handles partial updates correctly.

  await update(userRef, updatePayload);
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
  const characterDataToWrite: Omit<CharacterMetadata, 'createdAt' | 'id'> & { createdAt: number | object, id: string } = {
     ...data, 
     id: characterId, 
     createdAt: data.createdAt || rtdbServerTimestamp(), // Call rtdbServerTimestamp()
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
    await update(chatMetadataRef, { updatedAt: rtdbServerTimestamp() }); // Call rtdbServerTimestamp()
    return { ...existingData, updatedAt: Date.now() }; 
  } else {
    const characterMeta = await getCharacterMetadata(characterId);
    if (!characterMeta) {
      throw new Error(`Character with ID ${characterId} not found.`);
    }

    const newChatSessionMetaDataForWrite: Partial<UserChatSessionMetadata> & {createdAt: object; updatedAt: object; lastMessageTimestamp?: object} = {
      characterId,
      characterName: characterMeta.name,
      characterAvatarUrl: characterMeta.avatarUrl,
      createdAt: rtdbServerTimestamp(), // Call rtdbServerTimestamp()
      updatedAt: rtdbServerTimestamp(), // Call rtdbServerTimestamp()
      lastMessageText: `Chat started with ${characterMeta.name}`,
      lastMessageTimestamp: rtdbServerTimestamp(), // Call rtdbServerTimestamp()
      isFavorite: false,
    };
    await set(chatMetadataRef, newChatSessionMetaDataForWrite);

    await addMessageToChat(userId, characterId, {
      sender: 'ai',
      text: `Namaste! Main hoon ${characterMeta.name}. ${characterMeta.personalitySnippet} Kaho, kya baat karni hai? 😉`,
      messageType: 'text',
    });
    
    const now = Date.now(); 
    return { 
      ...newChatSessionMetaDataForWrite, 
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
  updateData.updatedAt = rtdbServerTimestamp(); // Call rtdbServerTimestamp()
  await update(chatMetadataRef, updateData);
}


// --- Messages ---
export async function addMessageToChat(
  userId: string,
  characterId: string, 
  messageData: Omit<MessageDocument, 'timestamp'> & { timestamp?: number | object } 
): Promise<string> {
  const messagesRef = ref(db, `users/${userId}/userChats/${characterId}/messages`);
  const newMessageRef = push(messagesRef); 

  const finalMessageData: MessageDocument = {
    ...messageData,
    timestamp: typeof messageData.timestamp === 'number' ? messageData.timestamp : (messageData.timestamp || rtdbServerTimestamp()), // Call rtdbServerTimestamp()
  } as MessageDocument; 
  
  await set(newMessageRef, finalMessageData);

  const chatMetadataUpdates: Partial<UserChatSessionMetadata> & {lastMessageTimestamp?: object} = {
    lastMessageText: messageData.text.substring(0, 100),
    lastMessageTimestamp: finalMessageData.timestamp, 
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
    
