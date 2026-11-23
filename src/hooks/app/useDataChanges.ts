import { useEffect } from 'react';
import { DataChange } from '../../app/changeNotifier';
import { usePersistenceServices } from '../../providers/PersistenceProvider/PersistenceProvider';

export function useDataChanges(onChange: (change: DataChange) => void): void {
  const { services } = usePersistenceServices();
  useEffect(() => services.changes.subscribe(onChange), [services, onChange]);
}
