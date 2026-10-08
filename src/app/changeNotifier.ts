export type DataChange = 'transactions' | 'preferences';

export function createChangeNotifier() {
  const listeners = new Set<(change: DataChange) => void>();
  return {
    subscribe(listener: (change: DataChange) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify(change: DataChange): void {
      for (const listener of [...listeners]) {
        try {
          listener(change);
        } catch (error) {
          // A subscriber failure must not turn a committed write into a retry.
          console.error('Data change subscriber failed', error);
        }
      }
    },
  };
}
