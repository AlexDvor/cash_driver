import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { useOccupiedMonths } from './useOccupiedMonths';
import { createChangeNotifier } from '../../app/changeNotifier';

const mockChanges = createChangeNotifier();
const mockRead = jest.fn();
const mockServices = {
  changes: mockChanges,
  transactions: { occupiedMonths: mockRead },
};
jest.mock('../../providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistence: () => ({ services: mockServices }),
}));

test('month activity loads on demand, rejects stale years, coalesces commits and retries errors', async () => {
  let year = 2026;
  let enabled = false;
  let resolveOld!: (months: number[]) => void;
  mockRead
    .mockReturnValueOnce(
      new Promise<number[]>(resolve => {
        resolveOld = resolve;
      }),
    )
    .mockResolvedValueOnce([2]);
  let current!: ReturnType<typeof useOccupiedMonths>;
  function Probe() {
    current = useOccupiedMonths(year, 'UTC', enabled);
    return null;
  }
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(<Probe />);
  });
  expect(mockRead).not.toHaveBeenCalled();
  enabled = true;
  await act(async () => {
    app.update(<Probe />);
  });
  year = 2027;
  await act(async () => {
    app.update(<Probe />);
  });
  await act(async () => {
    resolveOld([10]);
  });
  expect(current.state).toEqual({ status: 'ready', months: [2] });
  expect(mockRead).toHaveBeenLastCalledWith(2027, 'UTC');
  mockRead.mockRejectedValueOnce(new Error('unavailable'));
  await act(async () => {
    mockChanges.notify('transactions');
    mockChanges.notify('transactions');
  });
  expect(mockRead).toHaveBeenCalledTimes(3);
  expect(current.state.status).toBe('error');
  mockRead.mockResolvedValueOnce([3, 7]);
  await act(async () => {
    await current.retry();
  });
  expect(current.state).toEqual({ status: 'ready', months: [3, 7] });
  enabled = false;
  await act(async () => {
    app.update(<Probe />);
  });
  await act(async () => {
    mockChanges.notify('transactions');
  });
  expect(mockRead).toHaveBeenCalledTimes(4);
  expect(current.state.status).toBe('idle');
  await act(async () => {
    app.unmount();
  });
});
