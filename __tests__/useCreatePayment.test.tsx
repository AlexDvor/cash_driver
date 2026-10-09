import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useCreatePayment } from '../src/hooks/transactions/useCreatePayment';
import * as haptics from '../src/features/settings/confirmationHaptics';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';

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
