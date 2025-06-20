
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
  onDisconnect,
  runTransaction,
} from 'firebase/database';
import { db } from './config'; // RTDB instance
import type { UserProfile, CharacterMetadata, UserChatSessionMetadata, MessageDocument, AdminCredentials, UserChatStreakData, StreakUpdateResult, InteractiveStory, UserStoryProgress, StoryTurnRecord } from '@/lib/types';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';

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
  await incrementTotalRegisteredUsers(); // Increment total users when a new profile is created
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
  const updatePayload: { [key: string]: any } = { ...data };
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
  const characterDataToWrite: Omit<CharacterMetadata, 'id'> & { createdAt: number | object, id: string } = {
     ...data,
     id: characterId,
     createdAt: data.createdAt || rtdbServerTimestamp(),
     personalitySnippet: data.personalitySnippet || data.description.substring(0,70) + "...",
     isPremium: data.isPremium || false,
     styleTags: data.styleTags || [],
  };
  await set(characterRef, characterDataToWrite);
}

export async function updateCharacter(characterId: string, data: Partial<Omit<CharacterMetadata, 'id' | 'createdAt'>>): Promise<void> {
  const characterRef = ref(db, `characters/${characterId}`);
  // Ensure 'id' and 'createdAt' are not part of the update payload directly,
  // as these should generally be immutable or handled specifically if they need to change.
  // For this implementation, we assume they don't change during an edit.
  const { id, createdAt, ...updateData } = data as any; // Cast to any to satisfy Omit not liking id and createdAt
  await update(characterRef, updateData);
}


// --- Chat Session Metadata ---
export async function getOrCreateChatSession(userId: string, characterId: string): Promise<UserChatSessionMetadata> {
  const chatMetadataRef = ref(db, `users/${userId}/userChats/${characterId}/metadata`);
  const snapshot = await get(chatMetadataRef);

  if (snapshot.exists()) {
    const existingData = snapshot.val() as UserChatSessionMetadata;
    await update(chatMetadataRef, { updatedAt: rtdbServerTimestamp() });
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
      createdAt: rtdbServerTimestamp(),
      updatedAt: rtdbServerTimestamp(),
      lastMessageText: `Chat started with ${characterMeta.name}`,
      lastMessageTimestamp: rtdbServerTimestamp(),
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
  updateData.updatedAt = rtdbServerTimestamp();
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
    sender: messageData.sender,
    text: messageData.text,
    messageType: messageData.messageType,
    timestamp: typeof messageData.timestamp === 'number' ? messageData.timestamp : (messageData.timestamp || rtdbServerTimestamp()),
    audioUrl: messageData.audioUrl || null,
    videoUrl: messageData.videoUrl || null,
    sentGiftId: messageData.sentGiftId || null, // Ensure sentGiftId is saved
  } as MessageDocument;

  await set(newMessageRef, finalMessageData);

  const chatMetadataUpdates: Partial<UserChatSessionMetadata> & {lastMessageTimestamp?: object} = {
    lastMessageText: messageData.text.substring(0, 100), // Keep last message text concise
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

// --- Chat Streaks ---
export async function updateUserChatStreak(userId: string, characterId: string): Promise<StreakUpdateResult> {
  const streakRef = ref(db, `users/${userId}/userChats/${characterId}/streakData`);
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

  const snapshot = await get(streakRef);
  let currentStreakValue = 0;
  let status: StreakUpdateResult['status'];

  if (snapshot.exists()) {
    const streakData = snapshot.val() as UserChatStreakData;
    const lastChatDateString = streakData.lastChatDate;

    const yesterdayDate = new Date(currentDate);
    yesterdayDate.setDate(currentDate.getDate() - 1);
    const yesterdayDateString = yesterdayDate.toISOString().split('T')[0];

    if (lastChatDateString === currentDateString) {
      // Chatting again on the same day
      currentStreakValue = streakData.currentStreak;
      status = 'maintained_same_day';
    } else if (lastChatDateString === yesterdayDateString) {
      // Streak continued from yesterday
      currentStreakValue = streakData.currentStreak + 1;
      status = 'continued';
    } else {
      // Streak broken
      currentStreakValue = 1;
      status = 'reset';
    }
  } else {
    // No previous streak data, start a new streak
    currentStreakValue = 1;
    status = 'first_ever';
  }

  const newStreakData: UserChatStreakData = {
    currentStreak: currentStreakValue,
    lastChatDate: currentDateString,
  };

  await set(streakRef, newStreakData);
  return { streak: currentStreakValue, status };
}

export function getStreakDataStream(
  userId: string,
  characterId: string,
  callback: (streakData: UserChatStreakData | null) => void
): Unsubscribe {
  const streakRef = ref(db, `users/${userId}/userChats/${characterId}/streakData`);
  const listener = onValue(streakRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() as UserChatStreakData : null);
  }, (error) => {
    console.error("Error fetching streak data in real-time from RTDB: ", error);
    callback(null);
  });
  return () => off(streakRef, 'value', listener);
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

// --- Presence and Site Stats ---
export async function setOnlineStatus(uid: string, displayName: string | null): Promise<void> {
  const userStatusRef = ref(db, `status/${uid}`);
  const status = {
    online: true,
    name: displayName || 'Anonymous User',
    lastChanged: rtdbServerTimestamp(),
  };
  await set(userStatusRef, status);
}

export async function setOfflineStatus(uid: string): Promise<void> {
  const userStatusRef = ref(db, `status/${uid}`);
   const status = {
    online: false,
    name: null, // Or keep the name if preferred when offline
    lastChanged: rtdbServerTimestamp(),
  };
  await set(userStatusRef, status);
}

export function goOfflineOnDisconnect(uid: string): void {
  const userStatusRef = ref(db, `status/${uid}`);
  const status = {
    online: false,
    name: null,
    lastChanged: rtdbServerTimestamp(),
  };
  onDisconnect(userStatusRef).set(status).catch((err) => {
    console.error('Could not establish onDisconnect event', err);
  });
}

export function listenToOnlineUsersCount(callback: (count: number) => void): Unsubscribe {
  const statusRef = ref(db, 'status');
  const listener = onValue(statusRef, (snapshot) => {
    let count = 0;
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.val()?.online === true) {
          count++;
        }
      });
    }
    callback(count);
  }, (error) => {
    console.error("Error listening to online users count:", error);
    callback(0);
  });
  return () => off(statusRef, 'value', listener);
}

export async function incrementTotalRegisteredUsers(): Promise<void> {
  const counterRef = ref(db, 'siteStats/totalUsersRegistered');
  try {
    await runTransaction(counterRef, (currentData) => {
      return (currentData || 0) + 1;
    });
  } catch (error) {
    console.error('Failed to increment total registered users:', error);
  }
}

export function listenToTotalRegisteredUsers(callback: (count: number) => void): Unsubscribe {
  const counterRef = ref(db, 'siteStats/totalUsersRegistered');
  const listener = onValue(counterRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() as number : 0);
  }, (error) => {
    console.error("Error listening to total registered users:", error);
    callback(0);
  });
  return () => off(counterRef, 'value', listener);
}


// --- Interactive Stories ---
export async function addInteractiveStory(storyId: string, data: Omit<InteractiveStory, 'id' | 'createdAt'> & { createdAt?: number | object }): Promise<void> {
  const storyRef = ref(db, `interactiveStories/${storyId}`);
  const storyDataForWrite = {
    ...data,
    id: storyId, // ensure id is part of the written object
    createdAt: data.createdAt || rtdbServerTimestamp(),
    updatedAt: rtdbServerTimestamp(),
  };
  await set(storyRef, storyDataForWrite);
}

export async function getAllInteractiveStories(): Promise<InteractiveStory[]> {
  const storiesRef = ref(db, 'interactiveStories');
  // Removed orderByChild to avoid indexing error, will sort client-side
  const snapshot = await get(query(storiesRef)); 
  const stories: InteractiveStory[] = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const val = childSnapshot.val();
      const key = childSnapshot.key;
      if (key && val && typeof val === 'object' && 
          val.title && typeof val.title === 'string' &&
          val.characterId && typeof val.characterId === 'string' &&
          val.initialSceneSummary && typeof val.initialSceneSummary === 'string'
      ) {
        stories.push({
          id: key,
          title: val.title,
          description: val.description || '',
          characterId: val.characterId,
          characterNameSnapshot: val.characterNameSnapshot || 'Unknown Character',
          characterAvatarSnapshot: val.characterAvatarSnapshot || DEFAULT_AVATAR_DATA_URI,
          coverImageUrl: val.coverImageUrl || null,
          tags: Array.isArray(val.tags) ? val.tags.filter((tag: any) => typeof tag === 'string') : [],
          initialSceneSummary: val.initialSceneSummary,
          createdAt: typeof val.createdAt === 'number' ? val.createdAt : 0,
          updatedAt: typeof val.updatedAt === 'number' ? val.updatedAt : undefined,
        } as InteractiveStory);
      } else {
        console.warn(`Skipping malformed story data for key: ${key}. Received:`, val);
      }
    });
  }
  // Client-side sorting as a workaround for potential indexing issues.
  stories.sort((a, b) => (b.createdAt as number) - (a.createdAt as number));
  return stories;
}


export async function getInteractiveStory(storyId: string): Promise<InteractiveStory | null> {
  const storyRef = ref(db, `interactiveStories/${storyId}`);
  const snapshot = await get(storyRef);
  if (snapshot.exists()) {
      const val = snapshot.val();
      const key = snapshot.key;
       if (key && val && typeof val === 'object' && 
          val.title && typeof val.title === 'string' &&
          val.characterId && typeof val.characterId === 'string' &&
          val.initialSceneSummary && typeof val.initialSceneSummary === 'string'
      ) {
        return {
          id: key,
          title: val.title,
          description: val.description || '',
          characterId: val.characterId,
          characterNameSnapshot: val.characterNameSnapshot || 'Unknown Character',
          characterAvatarSnapshot: val.characterAvatarSnapshot || DEFAULT_AVATAR_DATA_URI,
          coverImageUrl: val.coverImageUrl || null,
          tags: Array.isArray(val.tags) ? val.tags.filter((tag: any) => typeof tag === 'string') : [],
          initialSceneSummary: val.initialSceneSummary,
          createdAt: typeof val.createdAt === 'number' ? val.createdAt : 0,
          updatedAt: typeof val.updatedAt === 'number' ? val.updatedAt : undefined,
        } as InteractiveStory;
      } else {
        console.warn(`Malformed story data fetched for ID: ${storyId}. Received:`, val);
        return null;
      }
  }
  return null;
}

// --- User Story Progress ---
export async function getUserStoryProgress(userId: string, storyId: string): Promise<UserStoryProgress | null> {
  const progressRef = ref(db, `users/${userId}/userStoryProgress/${storyId}`);
  const snapshot = await get(progressRef);
  if (snapshot.exists()) {
    const data = snapshot.val() as UserStoryProgress;
    // Ensure history is an array, even if it's missing or null in the DB
    return { ...data, history: data.history || [] };
  }
  return null;
}

export async function updateUserStoryProgress(
  userId: string,
  storyId: string,
  data: {
    currentTurnContext: UserStoryProgress['currentTurnContext'];
    storyTitleSnapshot: string;
    characterIdSnapshot: string;
    userChoiceThatLedToThis: string;
    newAiNarration: string;
  }
): Promise<void> {
  const progressRef = ref(db, `users/${userId}/userStoryProgress/${storyId}`);

  const newHistoryEntry: StoryTurnRecord = {
    userChoice: data.userChoiceThatLedToThis,
    aiNarration: data.newAiNarration,
    timestamp: rtdbServerTimestamp(),
  };

  const snapshot = await get(progressRef);
  let existingHistory: StoryTurnRecord[] = [];
  if (snapshot.exists()) {
    existingHistory = snapshot.val()?.history || [];
  }
  
  const updatedHistory = [...existingHistory, newHistoryEntry];

  // Special handling for the very first turn to ensure `history` starts correctly
  if (data.userChoiceThatLedToThis === "Let's begin the story!" && existingHistory.length === 0) {
    // The 'userChoice' for the first history entry is a placeholder representing the start.
    // The 'aiNarration' is the actual first narration from the AI.
    updatedHistory[0].userChoice = "Story Started"; 
  }
  
  const updatePayload: UserStoryProgress = {
    userId,
    storyId,
    currentTurnContext: data.currentTurnContext, // This contains the AI's latest narration and new choices
    storyTitleSnapshot: data.storyTitleSnapshot,
    characterIdSnapshot: data.characterIdSnapshot,
    lastPlayed: rtdbServerTimestamp(),
    history: updatedHistory,
  };

  await set(progressRef, updatePayload);
}
