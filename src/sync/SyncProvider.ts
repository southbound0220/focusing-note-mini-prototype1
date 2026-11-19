export interface SyncProvider {
  push(sessionIds: string[]): Promise<void>;
  pull(): Promise<string[]>;
}

// TODO(Phase2): Supabase連携と端末間同期を実装する。
export const syncProvider: SyncProvider = {
  async push() {},
  async pull() { return []; },
};
