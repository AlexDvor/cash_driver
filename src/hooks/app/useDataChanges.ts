import { useEffect } from 'react';
import { DataChange } from '../../app/changeNotifier';
import { usePersistence } from '../../app/PersistenceProvider';

export function useDataChanges(onChange: (change: DataChange) => void): void {
  const { services } = usePersistence();
  useEffect(() => services.changes.subscribe(onChange), [services, onChange]);
}
