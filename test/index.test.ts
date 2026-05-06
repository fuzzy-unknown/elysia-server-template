import type { AppType } from '../src'
import { treaty } from '@elysia/eden'
import { describe, expect, it } from 'bun:test'
import app from '../src/index'

const api = treaty<AppType>(app)

describe('elysia', () => {
  it('returns a response', async () => {
    const { data } = await api.get()

    expect(data).toBe('Hello World !')
  })
})
