/**
 * Tests for Core Event Schema
 */

import { describe, it, expect } from 'vitest';
import {
  validateEvent,
  safeValidateEvent,
  createTimestamp,
  createSessionId,
  SessionStartEventSchema,
  SessionEndEventSchema,
  IterationStartEventSchema,
  IterationEndEventSchema,
  TokensInEventSchema,
  TokensOutEventSchema,
  CompilationResultEventSchema,
  TestResultEventSchema,
  StoryCompleteEventSchema,
  MeterEventSchema,
  type MeterEvent,
} from './events.js';
import { isOk, isErr } from '../shared/result.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const validSessionId = '550e8400-e29b-41d4-a716-446655440000';
const validTimestamp = '2026-01-30T12:00:00.000Z';

function createBaseEvent(
  eventType: string,
  payload: unknown
): Record<string, unknown> {
  return {
    timestamp: validTimestamp,
    sessionId: validSessionId,
    eventType,
    payload,
  };
}

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('createTimestamp', () => {
  it('returns a valid ISO 8601 timestamp', () => {
    const timestamp = createTimestamp();
    expect(() => new Date(timestamp)).not.toThrow();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('createSessionId', () => {
  it('returns a valid UUID v4', () => {
    const id = createSessionId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('returns unique values on each call', () => {
    const id1 = createSessionId();
    const id2 = createSessionId();
    expect(id1).not.toBe(id2);
  });
});

// ============================================================================
// Session Start Event Tests
// ============================================================================

describe('SessionStartEventSchema', () => {
  it('validates a valid session_start event with tags', () => {
    const event = createBaseEvent('session_start', {
      tags: { mode: 'development', methodology: 'tdd' },
    });
    const result = SessionStartEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates a valid session_start event without tags', () => {
    const event = createBaseEvent('session_start', {});
    const result = SessionStartEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects invalid tags type', () => {
    const event = createBaseEvent('session_start', {
      tags: 'not-an-object',
    });
    const result = SessionStartEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Session End Event Tests
// ============================================================================

describe('SessionEndEventSchema', () => {
  it('validates a valid session_end event', () => {
    const event = createBaseEvent('session_end', {
      success: true,
      reason: 'All stories complete',
    });
    const result = SessionEndEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates a session_end event without optional reason', () => {
    const event = createBaseEvent('session_end', {
      success: false,
    });
    const result = SessionEndEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects missing success field', () => {
    const event = createBaseEvent('session_end', {});
    const result = SessionEndEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Iteration Start Event Tests
// ============================================================================

describe('IterationStartEventSchema', () => {
  it('validates a valid iteration_start event', () => {
    const event = createBaseEvent('iteration_start', {
      iterationNumber: 1,
      storyId: 'US-001',
    });
    const result = IterationStartEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects zero iteration number', () => {
    const event = createBaseEvent('iteration_start', {
      iterationNumber: 0,
      storyId: 'US-001',
    });
    const result = IterationStartEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });

  it('rejects missing storyId', () => {
    const event = createBaseEvent('iteration_start', {
      iterationNumber: 1,
    });
    const result = IterationStartEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Iteration End Event Tests
// ============================================================================

describe('IterationEndEventSchema', () => {
  it('validates a valid iteration_end event', () => {
    const event = createBaseEvent('iteration_end', {
      iterationNumber: 1,
      storyId: 'US-001',
      success: true,
    });
    const result = IterationEndEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects missing success field', () => {
    const event = createBaseEvent('iteration_end', {
      iterationNumber: 1,
      storyId: 'US-001',
    });
    const result = IterationEndEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tokens In Event Tests
// ============================================================================

describe('TokensInEventSchema', () => {
  it('validates a valid tokens_in event', () => {
    const event = createBaseEvent('tokens_in', {
      count: 1000,
      model: 'claude-opus-4-5-20251101',
    });
    const result = TokensInEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates tokens_in without optional model', () => {
    const event = createBaseEvent('tokens_in', {
      count: 500,
    });
    const result = TokensInEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects negative token count', () => {
    const event = createBaseEvent('tokens_in', {
      count: -1,
    });
    const result = TokensInEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tokens Out Event Tests
// ============================================================================

describe('TokensOutEventSchema', () => {
  it('validates a valid tokens_out event', () => {
    const event = createBaseEvent('tokens_out', {
      count: 500,
      model: 'claude-opus-4-5-20251101',
    });
    const result = TokensOutEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('accepts zero tokens', () => {
    const event = createBaseEvent('tokens_out', {
      count: 0,
    });
    const result = TokensOutEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Compilation Result Event Tests
// ============================================================================

describe('CompilationResultEventSchema', () => {
  it('validates a successful compilation event', () => {
    const event = createBaseEvent('compilation_result', {
      success: true,
    });
    const result = CompilationResultEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates a failed compilation with errors', () => {
    const event = createBaseEvent('compilation_result', {
      success: false,
      errorCount: 2,
      errors: [
        { file: 'src/index.ts', line: 10, column: 5, message: 'Type error' },
        { file: 'src/utils.ts', line: 20, message: 'Syntax error' },
      ],
    });
    const result = CompilationResultEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects errors with invalid line number', () => {
    const event = createBaseEvent('compilation_result', {
      success: false,
      errors: [{ file: 'src/index.ts', line: 0, message: 'Error' }],
    });
    const result = CompilationResultEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Test Result Event Tests
// ============================================================================

describe('TestResultEventSchema', () => {
  it('validates a valid test_result event', () => {
    const event = createBaseEvent('test_result', {
      success: true,
      totalTests: 10,
      passed: 10,
      failed: 0,
      skipped: 0,
      coveragePercent: 85.5,
    });
    const result = TestResultEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates a test_result without optional fields', () => {
    const event = createBaseEvent('test_result', {
      success: false,
      totalTests: 5,
      passed: 3,
      failed: 2,
    });
    const result = TestResultEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects coverage over 100%', () => {
    const event = createBaseEvent('test_result', {
      success: true,
      totalTests: 1,
      passed: 1,
      failed: 0,
      coveragePercent: 101,
    });
    const result = TestResultEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Story Complete Event Tests
// ============================================================================

describe('StoryCompleteEventSchema', () => {
  it('validates a valid story_complete event', () => {
    const event = createBaseEvent('story_complete', {
      storyId: 'US-001',
      passes: true,
      locCount: 150,
    });
    const result = StoryCompleteEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates story_complete without optional locCount', () => {
    const event = createBaseEvent('story_complete', {
      storyId: 'US-002',
      passes: false,
    });
    const result = StoryCompleteEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Union Schema (MeterEventSchema) Tests
// ============================================================================

describe('MeterEventSchema', () => {
  it('accepts all valid event types', () => {
    const events: MeterEvent[] = [
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'session_start',
        payload: {},
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'session_end',
        payload: { success: true },
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'iteration_start',
        payload: { iterationNumber: 1, storyId: 'US-001' },
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'iteration_end',
        payload: { iterationNumber: 1, storyId: 'US-001', success: true },
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'tokens_in',
        payload: { count: 100 },
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'tokens_out',
        payload: { count: 50 },
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'compilation_result',
        payload: { success: true },
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'test_result',
        payload: { success: true, totalTests: 5, passed: 5, failed: 0 },
      },
      {
        timestamp: validTimestamp,
        sessionId: validSessionId,
        eventType: 'story_complete',
        payload: { storyId: 'US-001', passes: true },
      },
    ];

    for (const event of events) {
      const result = MeterEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    }
  });

  it('rejects unknown event types', () => {
    const event = createBaseEvent('unknown_type', {});
    const result = MeterEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });

  it('rejects invalid sessionId format', () => {
    const event = {
      timestamp: validTimestamp,
      sessionId: 'not-a-uuid',
      eventType: 'session_start',
      payload: {},
    };
    const result = MeterEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });

  it('rejects invalid timestamp format', () => {
    const event = {
      timestamp: '2026-01-30',
      sessionId: validSessionId,
      eventType: 'session_start',
      payload: {},
    };
    const result = MeterEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Validation Function Tests
// ============================================================================

describe('validateEvent', () => {
  it('returns validated event for valid input', () => {
    const event = createBaseEvent('session_start', {
      tags: { test: 'value' },
    });
    const result = validateEvent(event);
    expect(result.eventType).toBe('session_start');
    expect(result.sessionId).toBe(validSessionId);
  });

  it('throws ZodError for invalid input', () => {
    const invalidEvent = { invalid: 'data' };
    expect(() => validateEvent(invalidEvent)).toThrow();
  });
});

describe('safeValidateEvent', () => {
  it('returns Ok result for valid input', () => {
    const event = createBaseEvent('tokens_in', { count: 100 });
    const result = safeValidateEvent(event);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.eventType).toBe('tokens_in');
    }
  });

  it('returns Err result for invalid input', () => {
    const invalidEvent = { missing: 'fields' };
    const result = safeValidateEvent(invalidEvent);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Event validation failed');
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('includes detailed error issues', () => {
    const event = {
      timestamp: 'invalid',
      sessionId: 'not-uuid',
      eventType: 'session_start',
      payload: {},
    };
    const result = safeValidateEvent(event);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      // Should have issues for both timestamp and sessionId
      expect(result.error.issues.length).toBeGreaterThanOrEqual(1);
    }
  });
});
