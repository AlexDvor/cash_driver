import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { usePaymentForm } from '../src/hooks/transactions/usePaymentForm';
import { Platform } from '../src/features/transactions/types';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

test('the legacy form boundary retains exact partial tips across edit commit', async () => {
  const db = openTestDatabase();
  const services = await testPersistence(db);
  const input = {
    platform: 'uber' as const,
    fareAmountCents: 2000,
    cashReceivedCents: 5000,
    tipCents: 500,
  };
  const saved = await services.transactions.save(
    services.transactions.newPendingOperation(),
    input,
  );
  let current: ReturnType<typeof usePaymentForm> | undefined;
  function form() {
    if (!current) {
      throw new Error('Missing form');
    }
    return current;
  }
  function Probe() {
    current = usePaymentForm({
      initialPlatform: 'uber',
      initialValues: input,
      clearAfterSave: false,
      onSubmit: draft => services.transactions.edit(saved.id, draft),
    });
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    expect(form().payment).toMatchObject({
      tipCents: 500,
      changeGivenCents: 2500,
    });
    expect(form().changeAsTip).toBe(false);
    await act(async () => {
      expect(await form().submit()).toBe(true);
    });
    expect(form().payment).toMatchObject({
      tipCents: 500,
      changeGivenCents: 2500,
    });
    expect(await services.transactions.get(saved.id)).toMatchObject({
      tipCents: 500,
      createdAt: saved.createdAt,
    });
    await act(async () => {
      expect(await form().submit()).toBe(false);
    });
    await act(async () => form().toggleTip(true));
    expect(form().payment).toMatchObject({
      tipCents: 3000,
      changeGivenCents: 0,
    });
    await act(async () => form().toggleTip(false));
    expect(form().payment).toMatchObject({
      tipCents: 0,
      changeGivenCents: 3000,
    });
  } finally {
    await act(async () => renderer?.unmount());
    db.close();
  }
});

test('delayed blur preserves quick, Exacto and newly typed amounts', async () => {
  let current: ReturnType<typeof usePaymentForm> | undefined;
  function form() {
    if (!current) {
      throw new Error('Missing form');
    }
    return current;
  }
  function Probe() {
    current = usePaymentForm({
      initialPlatform: 'uber',
      onSubmit: async () => {
        throw new Error('This draft must not be submitted');
      },
    });
    return <Text>{current.received}</Text>;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    await act(async () => {
      form().changeField('fare', '18');
      form().changeField('received', '20');
    });
    const oldBlur = form().blur;
    await act(async () => form().quick(5000));
    await act(async () => oldBlur('received'));
    expect(form().received).toBe('50,00');
    expect(form().payment).toMatchObject({ changeGivenCents: 3200 });
    await act(async () => form().quick());
    await act(async () => oldBlur('received'));
    expect(form().received).toBe('18,00');
    await act(async () => form().changeField('fare', '25,'));
    await act(async () => oldBlur('fare'));
    expect(form().fare).toBe('25,00');
  } finally {
    await act(async () => renderer?.unmount());
  }
});

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
