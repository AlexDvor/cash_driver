import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useCreatePayment } from '../src/hooks/transactions/useCreatePayment';
import * as haptics from '../src/features/settings/confirmationHaptics';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';

test('failed retries reuse an ID only while the exact tip amount is unchanged', async () => {
  const db = openTestDatabase();
  const services = await testPersistence(db);
  const feedback = jest
    .spyOn(haptics, 'confirmationHaptics')
    .mockImplementation(() => {});
  const save = jest
    .spyOn(services.transactions, 'save')
    .mockRejectedValueOnce(new Error('Write failed'))
    .mockRejectedValueOnce(new Error('Retry failed'));
  let current: ReturnType<typeof useCreatePayment> | undefined;
  function submit() {
    if (!current) {
      throw new Error('Missing payment handler');
    }
    return current;
  }
  function Probe() {
    current = useCreatePayment(services, true);
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  const partial = {
    ...validInput,
    fareAmountCents: 2000,
    cashReceivedCents: 5000,
    tipCents: 500,
  };
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    await expect(submit()(partial)).rejects.toThrow('Write failed');
    await expect(submit()({ ...partial })).rejects.toThrow('Retry failed');
    expect(save.mock.calls[1][0].id).toBe(save.mock.calls[0][0].id);
    expect(feedback).not.toHaveBeenCalled();
    const committed = await submit()({ ...partial, tipCents: 600 });
    expect(save.mock.calls[2][0].id).not.toBe(save.mock.calls[0][0].id);
    expect(committed).toMatchObject({ tipCents: 600, changeGivenCents: 2400 });
    expect(await services.transactions.list()).toEqual([committed]);
    expect(feedback).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => renderer?.unmount());
    jest.restoreAllMocks();
    db.close();
  }
});

test.each([false, true])(
  'uses the latest haptics choice after a delayed commit (initially %s)',
  async initiallyEnabled => {
    const db = openTestDatabase();
    const services = await testPersistence(db);
    const feedback = jest
      .spyOn(haptics, 'confirmationHaptics')
      .mockImplementation(() => {});
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const save = services.transactions.save;
    jest
      .spyOn(services.transactions, 'save')
      .mockImplementation(async (pending, input) => {
        await gate;
        return save(pending, input);
      });
    let submit: ReturnType<typeof useCreatePayment> | undefined;
    function Probe({ enabled }: { enabled: boolean }) {
      submit = useCreatePayment(services, enabled);
      return null;
    }
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <Probe enabled={initiallyEnabled} />,
        );
      });
      if (!submit) {
        throw new Error('Missing payment handler');
      }
      const writing = submit(validInput);
      expect(feedback).not.toHaveBeenCalled();
      expect(await services.transactions.list()).toEqual([]);
      await act(async () => {
        renderer?.update(<Probe enabled={!initiallyEnabled} />);
      });
      release();
      const committed = await writing;
      expect(await services.transactions.list()).toEqual([committed]);
      expect(feedback).toHaveBeenCalledTimes(1);
      expect(feedback).toHaveBeenCalledWith(!initiallyEnabled);
    } finally {
      release();
      await act(async () => renderer?.unmount());
      jest.restoreAllMocks();
      db.close();
    }
  },
);
