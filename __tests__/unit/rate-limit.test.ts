import { RateLimitManager } from '../../lib/rate-limit'

describe('RateLimitManager', () => {
  let manager: RateLimitManager

  beforeEach(() => {
    // Create a mock Redis client
    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK')
    }

    manager = new RateLimitManager({
      tokensPerInterval: 2,
      interval: 'second'
    }, mockRedis)
  })

  it('allows requests within limit', async () => {
    const identifier = 'test-user'
    const result1 = await manager.isRateLimited(identifier)
    const result2 = await manager.isRateLimited(identifier)

    expect(result1).toBe(false)
    expect(result2).toBe(false)
  })

  it('blocks requests over limit', async () => {
    const identifier = 'test-user'
    await manager.isRateLimited(identifier) // First request
    await manager.isRateLimited(identifier) // Second request
    const result = await manager.isRateLimited(identifier) // Third request

    expect(result).toBe(true)
  })

  it('saves state to Redis', async () => {
    const identifier = 'test-user'
    await manager.isRateLimited(identifier)
    await manager.saveState(identifier)

    // State should be saved to Redis
    expect(await manager.isRateLimited(identifier)).toBe(false)
  })
}) 