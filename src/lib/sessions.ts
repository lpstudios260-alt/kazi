import { collection, doc, query, where, orderBy, getDocs, getDoc, setDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { ChatSession, ChatMessage } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number = 15000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout after " + ms + "ms")), ms))
  ]);
};

export const getSessions = async (): Promise<ChatSession[]> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  const q = query(
    collection(db, 'chatSessions'),
    where('userId', '==', auth.currentUser.uid)
  );
  
  try {
    const snapshot = await withTimeout(getDocs(q));
    const sessions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        messages: data.messages || []
      } as ChatSession;
    });
    
    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (err) {
    console.warn("getSessions timeout or error:", err);
    return [];
  }
};

export const getSession = async (sessionId: string): Promise<ChatSession | null> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  const docRef = doc(db, 'chatSessions', sessionId);
  try {
    const docSnap = await withTimeout(getDoc(docRef));
    
    if (docSnap.exists() && docSnap.data().userId === auth.currentUser.uid) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        title: data.title,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        messages: data.messages || []
      } as ChatSession;
    }
    return null;
  } catch (err) {
    console.warn("getSession timeout or error:", err);
    return null;
  }
};

export const createSession = async (title: string, messages: ChatMessage[]): Promise<string> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  const cleanMessages = messages.map(msg => {
    const cleanMsg: any = { ...msg };
    if (cleanMsg.attachments === undefined) {
      delete cleanMsg.attachments;
    }
    return cleanMsg;
  });
  
  const docRef = doc(collection(db, 'chatSessions'));
  await withTimeout(setDoc(docRef, {
    userId: auth.currentUser.uid,
    title,
    messages: cleanMessages,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })).catch(err => {
    console.warn("createSession firestore error/timeout:", err);
    // Continue despite error so chat doesn't break completely
  });
  
  return docRef.id;
};

export const updateSessionMessages = async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  const cleanMessages = messages.map(msg => {
    const cleanMsg: any = { ...msg };
    if (cleanMsg.attachments === undefined) {
      delete cleanMsg.attachments;
    }
    return cleanMsg;
  });
  
  const docRef = doc(db, 'chatSessions', sessionId);
  await withTimeout(updateDoc(docRef, {
    messages: cleanMessages,
    updatedAt: serverTimestamp()
  })).catch(err => {
    console.warn("updateSessionMessages firestore error/timeout:", err);
    // Continue despite error so chat doesn't break completely
  });
};
