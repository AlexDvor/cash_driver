import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { usePaymentForm } from '../src/hooks/transactions/usePaymentForm';
import { CashTransaction, Platform } from '../src/features/transactions/types';
import { TransactionInput } from '../src/features/transactions/transactionService';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

test('the shared form retains exact partial tips across edit commit', async () => {
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
    expect(form().tip).toBe('5,00');
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
    await act(async () => form().allChangeAsTip());
    expect(form().payment).toMatchObject({
      tipCents: 3000,
      changeGivenCents: 0,
    });
    await act(async () => form().clearTip());
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

test('create guard rejects a disabled platform, retains the draft, and allows explicit replacement', async () => {
  const submit = jest.fn(
    async (input: {
      platform: Platform;
      fareAmountCents: number;
      cashReceivedCents: number;
      tipCents: number;
    }): Promise<CashTransaction> => ({
      ...input,
      id: 'saved',
      changeGivenCents: 0,
      netCashCents: input.fareAmountCents + input.tipCents,
      createdAt: '2026-10-08T10:00:00Z',
      updatedAt: null,
    }),
  );
  let current: ReturnType<typeof usePaymentForm> | undefined;
  function form() {
    if (!current) throw new Error('Missing form');
    return current;
  }
  function Probe({
    defaultPlatform,
    allowed,
  }: {
    defaultPlatform: Platform;
    allowed: Platform[];
  }) {
    current = usePaymentForm({
      initialPlatform: defaultPlatform,
      allowedPlatforms: allowed,
      onSubmit: submit,
    });
    return <Text>{current.platform}</Text>;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <Probe defaultPlatform="uber" allowed={['uber', 'cabify']} />,
      );
    });
    await act(async () => {
      form().changeField('fare', '18');
      form().changeField('received', '20');
      form().expandTip();
    });
    await act(async () => form().allChangeAsTip());
    await act(async () =>
      renderer?.update(<Probe defaultPlatform="cabify" allowed={['cabify']} />),
    );
    expect(form()).toMatchObject({
      platform: 'uber',
      platformAllowed: false,
      fare: '18',
      received: '20',
      tip: '2,00',
      tipExpanded: true,
      canConfirm: false,
    });
    await act(async () => expect(await form().submit()).toBe(false));
    await act(async () => form().choosePlatform('uber'));
    expect(submit).not.toHaveBeenCalled();
    expect(form().platform).toBe('uber');
    await act(async () =>
      renderer?.update(
        <Probe defaultPlatform="cabify" allowed={['uber', 'cabify']} />,
      ),
    );
    expect(form().platformAllowed).toBe(true);
    expect(form().canConfirm).toBe(true);
    await act(async () =>
      renderer?.update(<Probe defaultPlatform="cabify" allowed={['cabify']} />),
    );
    await act(async () => form().choosePlatform('cabify'));
    expect(form().canConfirm).toBe(true);
    await act(async () => expect(await form().submit()).toBe(true));
    expect(submit).toHaveBeenCalledWith({
      platform: 'cabify',
      fareAmountCents: 1800,
      cashReceivedCents: 2000,
      tipCents: 200,
    });
  } finally {
    await act(async () => renderer?.unmount());
  }
});

test('an accepted in-flight save keeps its platform and resets to the latest committed default', async () => {
  let release: ((value: CashTransaction) => void) | undefined;
  const pending = new Promise<CashTransaction>(resolve => {
    release = resolve;
  });
  const submit = jest.fn((_input: TransactionInput) => pending);
  let current: ReturnType<typeof usePaymentForm> | undefined;
  function form() {
    if (!current) throw new Error('Missing form');
    return current;
  }
  function Probe({
    defaultPlatform,
    allowed,
  }: {
    defaultPlatform: Platform;
    allowed: Platform[];
  }) {
    current = usePaymentForm({
      initialPlatform: defaultPlatform,
      allowedPlatforms: allowed,
      onSubmit: submit,
    });
    return <Text>{current.platform}</Text>;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <Probe defaultPlatform="uber" allowed={['uber', 'cabify']} />,
      );
    });
    await act(async () => {
      form().changeField('fare', '18');
      form().changeField('received', '20');
    });
    let first: Promise<boolean> | undefined;
    await act(async () => {
      first = form().submit();
      expect(await form().submit()).toBe(false);
    });
    expect(submit).toHaveBeenCalledTimes(1);
    await act(async () =>
      renderer?.update(<Probe defaultPlatform="cabify" allowed={['cabify']} />),
    );
    expect(form().platform).toBe('uber');
    expect(form().canConfirm).toBe(false);
    await act(async () => {
      release?.({
        id: 'saved',
        platform: 'uber',
        fareAmountCents: 1800,
        cashReceivedCents: 2000,
        tipCents: 0,
        changeGivenCents: 200,
        netCashCents: 1800,
        createdAt: '2026-10-08T10:00:00Z',
        updatedAt: '2026-10-08T10:00:00Z',
      });
      expect(await first).toBe(true);
    });
    expect(submit.mock.calls[0][0].platform).toBe('uber');
    expect(form().platform).toBe('cabify');
    expect(form().fare).toBe('');
    expect(form().platformAllowed).toBe(true);
  } finally {
    await act(async () => renderer?.unmount());
  }
});
