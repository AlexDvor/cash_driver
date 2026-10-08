import { useEffect } from 'react';
import { DataChange } from './changeNotifier';
import { usePersistence } from './PersistenceProvider';

export function useDataChanges(onChange: (change: DataChange) => void): void {
  const { services } = usePersistence();
  useEffect(() => services.changes.subscribe(onChange), [services, onChange]);
}
