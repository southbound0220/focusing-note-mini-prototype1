import Dexie, { type EntityTable } from 'dexie';

export type Session = {
  id: string;
  createdAt: number;
  updatedAt: number;
  theme?: string;
  chosenWords?: string[];
  bgType: string;
  currentStepId: string;
  bookmarked: boolean;
};
export type Tile = { id?: number; sessionId: string; tx: number; ty: number; blob: Blob };
export type ObjectItem = { id?: number; sessionId: string; type: 'text'|'sticky'|'bodymap'|'audio'; json: string };
export type Setting = { id: string; value: string };

export const db = new Dexie('FocusingNote') as Dexie & {
  sessions: EntityTable<Session, 'id'>;
  tiles: EntityTable<Tile, 'id'>;
  objects: EntityTable<ObjectItem, 'id'>;
  settings: EntityTable<Setting, 'id'>;
};

db.version(1).stores({
  sessions: 'id, createdAt, updatedAt, bookmarked',
  tiles: '++id, sessionId, [sessionId+tx+ty]',
  objects: '++id, sessionId, type',
  settings: 'id',
});
