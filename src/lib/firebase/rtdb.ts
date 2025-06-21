
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
  remove, // Added for delete operation
  equalTo, // Added for querying
} from 'firebase/database';
import { db } from './config'; // RTDB instance
import type { UserProfile, CharacterMetadata, UserChatSessionMetadata, MessageDocument, AdminCredentials, UserChatStreakData, StreakUpdateResult, InteractiveStory, UserStoryProgress, StoryTurnRecord, GroupChatMetadata, GroupChatMessage, GroupChatMessageUI } from '@/lib/types';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';

// --- User Profile ---

type NewUserProfileWritePayload = Omit<Partial<UserProfile>, 'uid' | 'joinedAt' | 'lastActive'> & {
  joinedAt: object;
  lastActive: object;
};

export async function createUserProfile(uid: string, data: NewUserProfileWritePayload): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  const profileDataForWrite = {
    uid,
    name: data.name ?? "Desi User",
    email: data.email ?? null,
    avatarUrl: data.avatarUrl ?? null,
    subscriptionTier: data.subscriptionTier ?? 'free',
    selectedTheme: data.selectedTheme ?? 'dark',
    languagePreference: data.languagePreference ?? 'hinglish',
    joinedAt: data.joinedAt,
    lastActive: data.lastActive,
  };
  await set(userRef, profileDataForWrite);
  await incrementTotalRegisteredUsers();
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
}

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
  const { id, createdAt, ...updateData } = data as any;
  await update(characterRef, updateData);
}

export async function deleteCharacter(characterId: string): Promise<void> {
  // 1. Delete the main character object
  const characterRef = ref(db, `characters/${characterId}`);
  await remove(characterRef);

  // 2. Delete all interactive stories associated with this character
  const storiesRef = ref(db, 'interactiveStories');
  const storiesQuery = query(storiesRef, orderByChild('characterId'), equalTo(characterId));
  const storiesSnapshot = await get(storiesQuery);
  if (storiesSnapshot.exists()) {
    storiesSnapshot.forEach(storySnap => {
      // This will also delete user progress for the story
      deleteInteractiveStory(storySnap.key!).catch(err => console.warn(`Could not delete story ${storySnap.key} for character ${characterId}:`, err));
    });
  }

  // 3. Delete all user chat sessions associated with this character
  const usersRef = ref(db, 'users');
  const usersSnapshot = await get(usersRef);
  if (usersSnapshot.exists()) {
    usersSnapshot.forEach(userSnap => {
      const userChatRef = ref(db, `users/${userSnap.key}/userChats/${characterId}`);
      remove(userChatRef).catch(err => console.warn(`Could not remove chat for user ${userSnap.key} and character ${characterId}:`, err));
    });
  }
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
    sentGiftId: messageData.sentGiftId || null,
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
      currentStreakValue = streakData.currentStreak;
      status = 'maintained_same_day';
    } else if (lastChatDateString === yesterdayDateString) {
      currentStreakValue = streakData.currentStreak + 1;
      status = 'continued';
    } else {
      currentStreakValue = 1;
      status = 'reset';
    }
  } else {
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
    name: null,
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
export async function addInteractiveStory(storyId: string, data: Omit<InteractiveStory, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: number | object; updatedAt?: number | object }): Promise<void> {
  const storyRef = ref(db, `interactiveStories/${storyId}`);
  const storyDataForWrite = {
    ...data,
    id: storyId,
    createdAt: data.createdAt || rtdbServerTimestamp(),
    updatedAt: data.updatedAt || rtdbServerTimestamp(),
  };
  await set(storyRef, storyDataForWrite);
}

export async function getAllInteractiveStories(): Promise<InteractiveStory[]> {
  const storiesRef = ref(db, 'interactiveStories');
  const snapshot = await get(query(storiesRef, orderByChild('createdAt')));
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
          createdAt:  val.createdAt,
          updatedAt: val.updatedAt ,
        } as InteractiveStory);
      } else {
        console.warn(`Skipping malformed story data for key: ${key}. Received:`, val);
      }
    });
  }
  // Sort stories by createdAt in descending order (newest first) on the client side
  return stories.reverse(); // Since RTDB returns in ascending by default when ordered
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
          createdAt: val.createdAt ,
          updatedAt: val.updatedAt ,
        } as InteractiveStory;
      } else {
        console.warn(`Malformed story data fetched for ID: ${storyId}. Received:`, val);
        return null;
      }
  }
  return null;
}

export async function deleteInteractiveStory(storyId: string): Promise<void> {
  const storyRef = ref(db, `interactiveStories/${storyId}`);
  await remove(storyRef);
  // Also remove any user progress associated with this story
  const usersRef = ref(db, 'users');
  const usersSnapshot = await get(usersRef);
  if (usersSnapshot.exists()) {
    usersSnapshot.forEach(userSnap => {
      const userStoryProgressRef = ref(db, `users/${userSnap.key}/userStoryProgress/${storyId}`);
      remove(userStoryProgressRef).catch(err => console.warn(`Could not remove story progress for user ${userSnap.key} and story ${storyId}:`, err));
    });
  }
}


// --- User Story Progress ---
export async function getUserStoryProgress(userId: string, storyId: string): Promise<UserStoryProgress | null> {
  const progressRef = ref(db, `users/${userId}/userStoryProgress/${storyId}`);
  const snapshot = await get(progressRef);
  if (snapshot.exists()) {
    const data = snapshot.val() as UserStoryProgress;
    return {
      ...data,
      history: data.history || [],
      currentTurnContext: {
        ...data.currentTurnContext,
        choiceA: data.currentTurnContext.choiceA || null,
        choiceB: data.currentTurnContext.choiceB || null,
      }
    };
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
    offeredChoiceA?: string | null;
    offeredChoiceB?: string | null;
  }
): Promise<void> {
  const progressRef = ref(db, `users/${userId}/userStoryProgress/${storyId}`);

  const newHistoryEntry: StoryTurnRecord = {
    userChoice: data.userChoiceThatLedToThis,
    aiNarration: data.newAiNarration,
    timestamp: rtdbServerTimestamp(),
    offeredChoiceA: data.offeredChoiceA || null,
    offeredChoiceB: data.offeredChoiceB || null,
  };

  const snapshot = await get(progressRef);
  let existingHistory: StoryTurnRecord[] = [];
  if (snapshot.exists()) {
    existingHistory = snapshot.val()?.history || [];
  }

  const updatedHistory = [...existingHistory, newHistoryEntry];

  if (data.userChoiceThatLedToThis === "Let's begin the story!" && existingHistory.length === 0) {
    updatedHistory[0].userChoice = "Story Started";
  }

  const updatePayload: UserStoryProgress = {
    userId,
    storyId,
    currentTurnContext: data.currentTurnContext,
    storyTitleSnapshot: data.storyTitleSnapshot,
    characterIdSnapshot: data.characterIdSnapshot,
    lastPlayed: rtdbServerTimestamp(),
    history: updatedHistory,
  };

  await set(progressRef, updatePayload);
}

// --- Group Chats ---
export async function addGroupChat(groupId: string, data: Omit<GroupChatMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const groupRef = ref(db, `groupChats/${groupId}`);
  const groupDataForWrite = {
    ...data,
    id: groupId,
    createdAt: rtdbServerTimestamp(),
    updatedAt: rtdbServerTimestamp(),
    participantCount: data.participantCount || 0,
  };
  await set(groupRef, groupDataForWrite);
}

export async function getAllGroupChats(): Promise<GroupChatMetadata[]> {
  const groupsRef = ref(db, 'groupChats');
  const snapshot = await get(query(groupsRef, orderByChild('createdAt')));
  const groups: GroupChatMetadata[] = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const val = childSnapshot.val();
      const key = childSnapshot.key!;
      
      // Backward compatibility for old single-host structure
      if (val.characterId && !val.hostCharacterIds) {
        val.hostCharacterIds = [val.characterId];
        val.hostCharacterSnapshots = [{
          id: val.characterId,
          name: val.characterNameSnapshot,
          avatarUrl: val.characterAvatarSnapshot,
        }];
      }

      if (val.title && val.hostCharacterIds && val.hostCharacterSnapshots) {
        groups.push({
          id: key,
          ...val,
        } as GroupChatMetadata);
      } else {
         console.warn(`Skipping malformed group chat data for key: ${key}. Received:`, val);
      }
    });
  }
  return groups.reverse(); // Newest first
}

export async function deleteGroupChat(groupId: string): Promise<void> {
  const groupRef = ref(db, `groupChats/${groupId}`);
  await remove(groupRef);
  // In the future, we would also delete all messages within the group chat here.
}

export async function getGroupChatMetadata(groupId: string): Promise<GroupChatMetadata | null> {
  const groupRef = ref(db, `groupChats/${groupId}`);
  const snapshot = await get(groupRef);
  if (snapshot.exists()) {
      return snapshot.val() as GroupChatMetadata;
  }
  return null;
}

export async function addGroupChatMessage(groupId: string, messageData: Omit<GroupChatMessage, 'timestamp'>): Promise<string> {
  const messagesRef = ref(db, `groupChats/${groupId}/messages`);
  const newMessageRef = push(messagesRef);

  const finalMessageData: GroupChatMessage = {
    ...messageData,
    timestamp: rtdbServerTimestamp(),
  };

  await set(newMessageRef, finalMessageData);

  // Update last message on group metadata
  const groupRef = ref(db, `groupChats/${groupId}`);
  await update(groupRef, {
      lastMessageText: messageData.text.substring(0, 100),
      lastMessageTimestamp: rtdbServerTimestamp(),
  });

  return newMessageRef.key!;
}

export function getGroupMessagesStream(
  groupId: string,
  callback: (messages: GroupChatMessageUI[]) => void,
  limit: number = 50
): Unsubscribe {
  const messagesQuery = query(
    ref(db, `groupChats/${groupId}/messages`),
    orderByChild('timestamp'),
    limitToLast(limit)
  );

  const listener = onValue(messagesQuery, (snapshot) => {
    const messagesData: GroupChatMessageUI[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const val = childSnapshot.val() as Omit<GroupChatMessage, 'timestamp'> & {timestamp: number};
        messagesData.push({ 
            id: childSnapshot.key!, 
            ...val,
            timestamp: new Date(val.timestamp) 
        });
      });
    }
    callback(messagesData);
  }, (error) => {
    console.error("Error fetching group messages in real-time:", error);
    callback([]);
  });

  return () => off(messagesQuery, 'value', listener);
}
