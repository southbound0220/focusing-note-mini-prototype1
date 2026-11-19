import { db, type Session } from './schema';

export async function createSession(): Promise<Session> {
  const now = Date.now();
  const session: Session = {
    id: crypto.randomUUID(), createdAt: now, updatedAt: now,
    chosenWords: [], bgType: 'plain', currentStepId: 's01', bookmarked: false,
  };
  await db.sessions.put(session);
  return session;
}

export async function saveSession(session: Session) {
  await db.sessions.put({ ...session, updatedAt: Date.now() });
}

export async function getSessions() {
  return db.sessions.orderBy('updatedAt').reverse().toArray();
}
