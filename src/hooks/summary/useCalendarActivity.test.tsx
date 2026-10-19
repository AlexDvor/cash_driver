import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { useCalendarActivity } from './useCalendarActivity';
import { createChangeNotifier } from '../../app/changeNotifier';

const mockChanges = createChangeNotifier();
let mockServices = { changes: mockChanges };
jest.mock('../../providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistence: () => ({ services: mockServices }),
}));
let app: Renderer.ReactTestRenderer;
afterEach(async () => {
  await act(async () => app?.unmount());
});

test('reopening retains cached data during refresh and error; a closed commit clears it', async () => {
  let enabled = true;
  let resolve!: (data: number[]) => void;
  const read = jest
    .fn()
    .mockResolvedValueOnce([2])
    .mockReturnValueOnce(
      new Promise<number[]>(yes => {
        resolve = yes;
      }),
    );
  let current!: ReturnType<typeof useCalendarActivity<number>>;
  function Probe() {
    current = useCalendarActivity('2026/UTC', enabled, 3, read);
    return null;
  }
  await act(async () => {
    app = Renderer.create(<Probe />);
  });
  enabled = false;
  await act(async () => {
    app.update(<Probe />);
  });
  enabled = true;
  await act(async () => {
    app.update(<Probe />);
  });
  expect(current.status).toBe('loading');
  expect(current.data).toEqual([2]);
  await act(async () => {
    resolve([3]);
  });
  read.mockRejectedValueOnce(new Error('failed'));
  await act(async () => {
    await current.refresh();
  });
  expect(current.status).toBe('error');
  expect(current.data).toEqual([3]);
  enabled = false;
  await act(async () => {
    app.update(<Probe />);
  });
  await act(async () => {
    mockChanges.notify('transactions');
  });
  read.mockReturnValueOnce(new Promise(() => {}));
  enabled = true;
  await act(async () => {
    app.update(<Probe />);
  });
  expect(current.data).toBeNull();
});

test.each([3, 12])(
  'cache evicts the least recently used key at limit %i',
  async limit => {
    let key = '0/UTC';
    const read = jest.fn().mockImplementation(async () => [key]);
    let current!: ReturnType<typeof useCalendarActivity<string>>;
    function Probe() {
      current = useCalendarActivity(key, true, limit, read);
      return null;
    }
    await act(async () => {
      app = Renderer.create(<Probe />);
    });
    for (let index = 1; index < limit; index++) {
      key = `${index}/UTC`;
      await act(async () => {
        app.update(<Probe />);
      });
    }
    // Touch oldest, so the next insertion evicts key 1 instead.
    key = '0/UTC';
    await act(async () => {
      app.update(<Probe />);
    });
    key = `${limit}/UTC`;
    await act(async () => {
      app.update(<Probe />);
    });
    read.mockReturnValue(new Promise(() => {}));
    key = '0/UTC';
    await act(async () => {
      app.update(<Probe />);
    });
    expect(current.data).toEqual(['0/UTC']);
    key = '1/UTC';
    await act(async () => {
      app.update(<Probe />);
    });
    expect(current.data).toBeNull();
  },
);

test('old responses cannot repopulate cache after a commit or service replacement', async () => {
  let resolve!: (data: number[]) => void;
  const read = jest
    .fn()
    .mockReturnValueOnce(
      new Promise<number[]>(yes => {
        resolve = yes;
      }),
    )
    .mockResolvedValueOnce([5]);
  let current!: ReturnType<typeof useCalendarActivity<number>>;
  function Probe() {
    current = useCalendarActivity('2026/UTC', true, 3, read);
    return null;
  }
  await act(async () => {
    app = Renderer.create(<Probe />);
  });
  await act(async () => {
    mockChanges.notify('transactions');
    mockChanges.notify('transactions');
  });
  await act(async () => {
    resolve([1]);
  });
  expect(read).toHaveBeenCalledTimes(2);
  expect(current.data).toEqual([5]);
  mockServices = { changes: mockChanges };
  read.mockReturnValueOnce(new Promise(() => {}));
  await act(async () => {
    app.update(<Probe />);
  });
  expect(current.data).toBeNull();
});
