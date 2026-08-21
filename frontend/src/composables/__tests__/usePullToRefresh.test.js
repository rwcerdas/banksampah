import { describe, expect, it, vi } from 'vitest';
import { usePullToRefresh } from '../usePullToRefresh';

describe('usePullToRefresh', () => {
  it('runs the supplied refresh and always restores idle state', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const state = usePullToRefresh(refresh);
    state.isDragging.value = true;

    await state.refreshData();

    expect(refresh).toHaveBeenCalledOnce();
    expect(state.isRefreshing.value).toBe(false);
    expect(state.isDragging.value).toBe(false);
    expect(state.pullDistance.value).toBe(0);
  });

  it('restores idle state when refresh rejects', async () => {
    const state = usePullToRefresh(() => Promise.reject(new Error('network')));
    state.isDragging.value = true;

    await expect(state.refreshData()).rejects.toThrow('network');
    expect(state.isRefreshing.value).toBe(false);
    expect(state.isDragging.value).toBe(false);
  });
});
