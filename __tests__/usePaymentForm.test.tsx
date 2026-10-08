import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { usePaymentForm } from '../src/features/transactions/usePaymentForm';
import { Platform } from '../src/features/transactions/types';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

test('default changes apply to a pristine or next form, preserving the platform of an existing draft', async () => {
  jest.useFakeTimers();
  const db = openTestDatabase();
  const services = await testPersistence(db);
  let current: ReturnType<typeof usePaymentForm> | undefined;
  function form() {
    if (!current) {
      throw new Error('Missing form');
    }
    return current;
  }
  function Probe({ platform }: { platform: Platform }) {
    current = usePaymentForm({
      initialPlatform: platform,
      onSubmit: input =>
        services.transactions.save(
          services.transactions.newPendingOperation(),
          input,
        ),
    });
    return <Text>{current.platform}</Text>;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe platform="cabify" />);
    });
    expect(form().platform).toBe('cabify');
    await act(async () => renderer?.update(<Probe platform="bolt" />));
    expect(form().platform).toBe('bolt');
    await act(async () => {
      form().changeField('fare', '18');
      form().changeField('received', '20');
    });
    const staleBlur = form().blur;
    await act(async () => renderer?.update(<Probe platform="uber" />));
    expect(form().platform).toBe('bolt');
    await act(async () => {
      await form().submit();
    });
    expect((await services.transactions.list())[0].platform).toBe('bolt');
    expect(form().platform).toBe('uber');
    expect(form().fare).toBe('');
    await act(async () => staleBlur('fare'));
    expect(form().fare).toBe('');
    await act(async () => renderer?.update(<Probe platform="cabify" />));
    expect(form().platform).toBe('cabify');
  } finally {
    await act(async () => renderer?.unmount());
    db.close();
    jest.useRealTimers();
  }
});
