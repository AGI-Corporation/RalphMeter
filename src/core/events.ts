/**
 * Core Event Schema for RalphMeter
 *
 * Defines Zod schemas for all agent activity events.
 * Events are the raw signal that drives all metering calculations.
 */

import { z } from 'zod';
import { type Result, ok, err } from '../shared/result.js';

// ============================================================================
// Base Schema Components
// ============================================================================

/**
 * UUID format validation
 */
const UUIDSchema = z.uuid();

/**
 * ISO 8601 timestamp string
 */
const TimestampSchema = z.iso.datetime();

/**
 * Base event fields present on all events
 */
const BaseEventSchema = z.object({
  timestamp: TimestampSchema,
  sessionId: UUIDSchema,
});

// ============================================================================
// Event Type Schemas
// ============================================================================

/**
 * Session start event - marks the beginning of an agent session
 */
export const SessionStartEventSchema = BaseEventSchema.extend({
  eventType: z.literal('session_start'),
  payload: z.object({
    /** Optional tags for arbitrary metadata (mode, methodology, A/B tests, etc.) */
    tags: z.record(z.string(), z.string()).optional(),
  }),
});

/**
 * Session end event - marks the end of an agent session
 */
export const SessionEndEventSchema = BaseEventSchema.extend({
  eventType: z.literal('session_end'),
  payload: z.object({
    /** Whether the session completed successfully */
    success: z.boolean(),
    /** Optional reason for session end */
    reason: z.string().optional(),
  }),
});

/**
 * Iteration start event - marks the beginning of an iteration
 */
export const IterationStartEventSchema = BaseEventSchema.extend({
  eventType: z.literal('iteration_start'),
  payload: z.object({
    /** Iteration number within the session */
    iterationNumber: z.number().int().positive(),
    /** The story ID this iteration is targeting */
    storyId: z.string(),
  }),
});

/**
 * Iteration end event - marks the end of an iteration
 */
export const IterationEndEventSchema = BaseEventSchema.extend({
  eventType: z.literal('iteration_end'),
  payload: z.object({
    /** Iteration number within the session */
    iterationNumber: z.number().int().positive(),
    /** The story ID this iteration targeted */
    storyId: z.string(),
    /** Whether the iteration was successful */
    success: z.boolean(),
  }),
});

/**
 * Tokens in event - records input tokens consumed
 */
export const TokensInEventSchema = BaseEventSchema.extend({
  eventType: z.literal('tokens_in'),
  payload: z.object({
    /** Number of input tokens */
    count: z.number().int().nonnegative(),
    /** Optional model identifier */
    model: z.string().optional(),
  }),
});

/**
 * Tokens out event - records output tokens generated
 */
export const TokensOutEventSchema = BaseEventSchema.extend({
  eventType: z.literal('tokens_out'),
  payload: z.object({
    /** Number of output tokens */
    count: z.number().int().nonnegative(),
    /** Optional model identifier */
    model: z.string().optional(),
  }),
});

/**
 * Compilation result event - records build/compile outcomes
 */
export const CompilationResultEventSchema = BaseEventSchema.extend({
  eventType: z.literal('compilation_result'),
  payload: z.object({
    /** Whether compilation succeeded */
    success: z.boolean(),
    /** Number of errors (if failed) */
    errorCount: z.number().int().nonnegative().optional(),
    /** Error messages (if failed) */
    errors: z
      .array(
        z.object({
          file: z.string(),
          line: z.number().int().positive(),
          column: z.number().int().nonnegative().optional(),
          message: z.string(),
        })
      )
      .optional(),
  }),
});

/**
 * Test result event - records test run outcomes
 */
export const TestResultEventSchema = BaseEventSchema.extend({
  eventType: z.literal('test_result'),
  payload: z.object({
    /** Whether all tests passed */
    success: z.boolean(),
    /** Total number of tests run */
    totalTests: z.number().int().nonnegative(),
    /** Number of tests passed */
    passed: z.number().int().nonnegative(),
    /** Number of tests failed */
    failed: z.number().int().nonnegative(),
    /** Number of tests skipped */
    skipped: z.number().int().nonnegative().optional(),
    /** Coverage percentage (if available) */
    coveragePercent: z.number().min(0).max(100).optional(),
  }),
});

/**
 * Story complete event - marks a story as completed
 */
export const StoryCompleteEventSchema = BaseEventSchema.extend({
  eventType: z.literal('story_complete'),
  payload: z.object({
    /** The story ID that was completed */
    storyId: z.string(),
    /** Whether the story passed all quality gates */
    passes: z.boolean(),
    /** Lines of code in the final implementation */
    locCount: z.number().int().nonnegative().optional(),
  }),
});

// ============================================================================
// Union Schema for All Events
// ============================================================================

/**
 * Union of all event schemas
 */
export const MeterEventSchema = z.discriminatedUnion('eventType', [
  SessionStartEventSchema,
  SessionEndEventSchema,
  IterationStartEventSchema,
  IterationEndEventSchema,
  TokensInEventSchema,
  TokensOutEventSchema,
  CompilationResultEventSchema,
  TestResultEventSchema,
  StoryCompleteEventSchema,
]);

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type SessionStartEvent = z.infer<typeof SessionStartEventSchema>;
export type SessionEndEvent = z.infer<typeof SessionEndEventSchema>;
export type IterationStartEvent = z.infer<typeof IterationStartEventSchema>;
export type IterationEndEvent = z.infer<typeof IterationEndEventSchema>;
export type TokensInEvent = z.infer<typeof TokensInEventSchema>;
export type TokensOutEvent = z.infer<typeof TokensOutEventSchema>;
export type CompilationResultEvent = z.infer<
  typeof CompilationResultEventSchema
>;
export type TestResultEvent = z.infer<typeof TestResultEventSchema>;
export type StoryCompleteEvent = z.infer<typeof StoryCompleteEventSchema>;

/**
 * Union type of all meter events
 */
export type MeterEvent = z.infer<typeof MeterEventSchema>;

/**
 * All possible event types
 */
export type EventType = MeterEvent['eventType'];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validation error with details about what went wrong
 */
export interface ValidationError {
  message: string;
  issues: z.core.$ZodIssue[];
}

/**
 * Validates an event and throws if invalid.
 *
 * @param data - The data to validate as an event
 * @returns The validated event
 * @throws {z.ZodError} If validation fails
 */
export function validateEvent(data: unknown): MeterEvent {
  return MeterEventSchema.parse(data);
}

/**
 * Safely validates an event, returning a Result instead of throwing.
 *
 * @param data - The data to validate as an event
 * @returns Result containing the validated event or a validation error
 */
export function safeValidateEvent(
  data: unknown
): Result<MeterEvent, ValidationError> {
  const result = MeterEventSchema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  return err({
    message: 'Event validation failed',
    issues: result.error.issues,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a timestamp string in ISO 8601 format
 */
export function createTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Creates a new UUID v4
 */
export function createSessionId(): string {
  return crypto.randomUUID();
}
