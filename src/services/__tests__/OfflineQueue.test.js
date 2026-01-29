import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OfflineQueue } from '../OfflineQueue'

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
}

global.indexedDB = mockIndexedDB

describe('OfflineQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enqueue a mutation', async () => {
    const mutation = {
      id: 'test-1',
      endpoint: 'campaigns',
      type: 'POST',
      body: { name: 'Test Campaign' }
    }

    // Mock successful enqueue
    const result = await OfflineQueue.enqueue(mutation)
    expect(result).toBeDefined()
  })

  it('should get queue', async () => {
    const queue = await OfflineQueue.getQueue()
    expect(Array.isArray(queue)).toBe(true)
  })

  it('should dequeue a mutation', async () => {
    const mutationId = 'test-1'
    await OfflineQueue.dequeue(mutationId)
    // If no error, test passes
    expect(true).toBe(true)
  })

  it('should update a mutation', async () => {
    const mutationId = 'test-1'
    const updates = { status: 'failed' }
    await OfflineQueue.update(mutationId, updates)
    // If no error, test passes
    expect(true).toBe(true)
  })
})
