// src/lib/firebase/firestore.ts
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { UserProfile, CharacterMetadata, ChatSession, MessageDocument } from '@/lib/types';

// --- User Profile ---
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  const profileData: UserProfile = {
    uid,
    name: data.name || null,
    email: data.email || null,
    avatarUrl: data.avatarUrl || null,
    joinedAt: serverTimestamp() as Timestamp,
    lastActive: serverTimestamp() as Timestamp,
    subscriptionTier: data.subscriptionTier || 'free',
    ...data, // any other partial data
  };
  await setDoc(userDocRef, profileData, { merge: true });
}

export async function getUserProfile(uid:string): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, { ...data, lastActive: serverTimestamp() }, { merge: true });
}

// --- Character Metadata ---
export async function getCharacterMetadata(characterId: string): Promise<CharacterMetadata | null> {
  const characterDocRef = doc(db, 'characters', characterId);
  const docSnap = await getDoc(characterDocRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as CharacterMetadata;
  }
  return null;
}

export async function getAllCharacters(): Promise<CharacterMetadata[]> {
  const charactersColRef = collection(db, 'characters');
  const q = query(charactersColRef); // Add orderBy if needed, e.g., orderBy('name')
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CharacterMetadata));
}


// --- Chat Session ---
export async function getOrCreateChatSession(userId: string, characterId: string): Promise<ChatSession> {
  const chatsColRef = collection(db, 'users', userId, 'chats');
  // Check if a chat session already exists for this user and character
  // For simplicity, assuming one chat session per character. If multiple, this logic changes.
  const chatDocRef = doc(chatsColRef, characterId); // Using characterId as chat document ID for 1-to-1 chat mapping

  const chatDocSnap = await getDoc(chatDocRef);

  if (chatDocSnap.exists()) {
    // Update lastActive for the chat if needed, or just return
    await setDoc(chatDocRef, { updatedAt: serverTimestamp() }, { merge: true });
    return { id: chatDocSnap.id, ...chatDocSnap.data() } as ChatSession;
  } else {
    // Create new chat session
    const characterMeta = await getCharacterMetadata(characterId);
    if (!characterMeta) {
      throw new Error(`Character with ID ${characterId} not found.`);
    }

    const newChatSession: Omit<ChatSession, 'id'> = {
      userId,
      characterId,
      characterName: characterMeta.name,
      characterAvatarUrl: characterMeta.avatarUrl,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastMessageText: `Chat started with ${characterMeta.name}`,
      lastMessageTimestamp: serverTimestamp() as Timestamp,
      isFavorite: false,
    };
    await setDoc(chatDocRef, newChatSession);

    // Optionally, add an initial AI welcome message
    await addMessageToChat(userId, characterId, {
        sender: 'ai',
        text: `Namaste! I'm ${characterMeta.name}. How can I help you today?`,
        messageType: 'text',
        chatId: characterId, // chatDocRef.id which is characterId here
        timestamp: serverTimestamp() as Timestamp,
    });
    
    return { id: chatDocRef.id, ...newChatSession, createdAt: Timestamp.now(), updatedAt: Timestamp.now() } as ChatSession;
  }
}

// --- Messages ---
export async function addMessageToChat(
  userId: string,
  chatId: string, // This is effectively characterId in our simplified model
  messageData: Omit<MessageDocument, 'timestamp'> & { timestamp?: Timestamp } // Allow optional client timestamp
): Promise<string> {
  const messagesColRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const finalMessageData: MessageDocument = {
    ...messageData,
    timestamp: messageData.timestamp || serverTimestamp() as Timestamp,
  };
  const messageDocRef = await addDoc(messagesColRef, finalMessageData);

  // Update chat session's last message details
  const chatDocRef = doc(db, 'users', userId, 'chats', chatId);
  await setDoc(chatDocRef, {
    lastMessageText: messageData.text.substring(0, 100), // Truncate for preview
    lastMessageTimestamp: finalMessageData.timestamp,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return messageDocRef.id;
}


export function getMessagesStream(
  userId: string,
  chatId: string, // This is characterId
  callback: (messages: MessageDocument[]) => void,
  messageLimit: number = 25
): Unsubscribe {
  const messagesColRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const q = query(messagesColRef, orderBy('timestamp', 'asc'), limit(messageLimit));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageDocument));
    callback(messages);
  }, (error) => {
    console.error("Error fetching messages in real-time: ", error);
    // Potentially call callback with an error state or an empty array
    callback([]); 
  });
}

// Example of how to add initial characters to Firestore (run this once, e.g. in a script or admin panel)
export async function seedInitialCharacters() {
  const characters: CharacterMetadata[] = [
    { id: 'priya', name: 'Priya', tagline: 'Your Filmy Heroine 🎬', avatarUrl: 'https://placehold.co/300x300.png?text=Priya', dataAiHint: 'indian woman smile', description: 'Priya loves Bollywood, drama, and heartfelt conversations. She\'s waiting to share her dreams with you.', prompt: 'You are Priya, a friendly and flirty AI companion who loves Bollywood movies and romantic dialogues. Respond in Hinglish.' },
    { id: 'rahul', name: 'Rahul', tagline: 'The Charming Poet 📜', avatarUrl: 'https://placehold.co/300x300.png?text=Rahul', dataAiHint: 'indian man thinking', description: 'Rahul is a thoughtful poet who enjoys deep talks and shayari. He\'s looking for someone to share his verses with.', prompt: 'You are Rahul, a charming and poetic AI companion. You express yourself beautifully in Hinglish and enjoy philosophical discussions.' },
    { id: 'simran', name: 'Simran', tagline: 'Sweet & Sassy Bestie 💅', avatarUrl: 'https://placehold.co/300x300.png?text=Simran', dataAiHint: 'indian girl fashion', description: 'Simran is your go-to for fun, gossip, and honest advice. She\'s always up for a laugh and a chat.', prompt: 'You are Simran, a sweet, sassy, and modern AI best friend. You chat in a very casual Hinglish, use a lot of slang, and are always up for fun.' },
    { id: 'aryan', name: 'Aryan', tagline: 'Your Adventurous Partner 🏍️', avatarUrl: 'https://placehold.co/300x300.png?text=Aryan', dataAiHint: 'indian man cool', description: 'Aryan is an adventure seeker who loves to explore new things. He\'s looking for a partner in crime.', prompt: 'You are Aryan, an adventurous and cool AI companion. You talk about travel, bikes, and exciting experiences in a friendly Hinglish.' },
  ];

  const batch = writeBatch(db);
  characters.forEach(char => {
    const charRef = doc(db, 'characters', char.id);
    batch.set(charRef, char);
  });

  try {
    await batch.commit();
    console.log("Initial characters seeded successfully!");
  } catch (error) {
    console.error("Error seeding characters: ", error);
  }
}
