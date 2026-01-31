/**
 * Event Collector for RalphMeter
 *
 * Receives, validates, and stores events in memory.
 * Calculates basic session metrics.
 */

import { type Result, ok, err } from '../shared/result.js';
import {
  type MeterEvent,
  type SessionStartEvent,
  type SessionEndEvent,
  safeValidateEvent,
} from './events.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Status of a metering session
 */
export type SessionStatus = 'active' | 'completed' | 'failed';

/**
 * Metadata about a session
 */
export interface SessionMetadata {
  /** Unique session identifier */
  id: string;
  /** Session status */
  status: SessionStatus;
  /** When the session started */
  startedAt: string;
  /** When the session ended (if completed) */
  endedAt?: string;
  /** Whether the session completed successfully */
  success?: boolean;
  /** Optional tags from session_start event */
  tags?: Record<string, string>;
}

/**
 * A session with all its events
 */
export interface Session {
  /** Session metadata */
  metadata: SessionMetadata;
  /** All events in this session */
  events: MeterEvent[];
}

/**
 * Basic metrics calculated from session events
 */
export interface SessionMetrics {
  /** Total iterations in the session */
  totalIterations: number;
  /** Total input tokens consumed */
  totalTokensIn: number;
  /** Total output tokens generated */
  totalTokensOut: number;
  /** Number of compilation attempts */
  compilationAttempts: number;
  /** Number of successful compilations */
  compilationSuccesses: number;
  /** Number of test run attempts */
  testAttempts: number;
  /** Number of successful test runs */
  testSuccesses: number;
  /** Stories completed in this session */
  storiesCompleted: number;
  /** Stories that passed all gates */
  storiesPassed: number;
}

/**
 * Error types for collector operations
 */
export interface CollectorError {
  code:
    | 'SESSION_NOT_FOUND'
    | 'SESSION_ALREADY_EXISTS'
    | 'SESSION_NOT_ACTIVE'
    | 'VALIDATION_ERROR'
    | 'INVALID_EVENT_ORDER';
  message: string;
  details?: unknown;
}

// ============================================================================
// EventCollector Class
// ============================================================================

/**
 * Collects and stores metering events in memory.
 * Provides methods to query sessions and calculate metrics.
 */
export class EventCollector {
  /** In-memory storage of sessions by ID */
  private sessions = new Map<string, Session>();

  /**
   * Emits an event to the collector.
   * Events are validated and stored in the appropriate session.
   *
   * - session_start creates a new session
   * - session_end closes the session
   * - Other events are appended to existing active sessions
   *
   * @param data - The event data (will be validated)
   * @returns Result with the validated event or error
   */
  emit(data: unknown): Result<MeterEvent, CollectorError> {
    // Validate the event
    const validationResult = safeValidateEvent(data);
    if (!validationResult.ok) {
      return err({
        code: 'VALIDATION_ERROR',
        message: validationResult.error.message,
        details: validationResult.error.issues,
      });
    }

    const event = validationResult.value;

    // Handle based on event type
    switch (event.eventType) {
      case 'session_start':
        return this.handleSessionStart(event);
      case 'session_end':
        return this.handleSessionEnd(event);
      default:
        return this.handleEvent(event);
    }
  }

  /**
   * Gets a session by ID
   *
   * @param id - The session ID
   * @returns Result with the session or error if not found
   */
  getSession(id: string): Result<Session, CollectorError> {
    const session = this.sessions.get(id);
    if (!session) {
      return err({
        code: 'SESSION_NOT_FOUND',
        message: `Session not found: ${id}`,
      });
    }
    return ok(session);
  }

  /**
   * Gets all sessions
   *
   * @returns Array of all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Calculates metrics for a session
   *
   * @param sessionId - The session ID
   * @returns Result with metrics or error if session not found
   */
  getMetrics(sessionId: string): Result<SessionMetrics, CollectorError> {
    const sessionResult = this.getSession(sessionId);
    if (!sessionResult.ok) {
      return sessionResult;
    }

    const session = sessionResult.value;
    return ok(this.calculateMetrics(session));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Handles session_start event - creates a new session
   */
  private handleSessionStart(
    event: SessionStartEvent
  ): Result<MeterEvent, CollectorError> {
    const { sessionId, timestamp, payload } = event;

    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      return err({
        code: 'SESSION_ALREADY_EXISTS',
        message: `Session already exists: ${sessionId}`,
      });
    }

    // Create new session
    const session: Session = {
      metadata: {
        id: sessionId,
        status: 'active',
        startedAt: timestamp,
        ...(payload.tags !== undefined && { tags: payload.tags }),
      },
      events: [event],
    };

    this.sessions.set(sessionId, session);
    return ok(event);
  }

  /**
   * Handles session_end event - closes the session
   */
  private handleSessionEnd(
    event: SessionEndEvent
  ): Result<MeterEvent, CollectorError> {
    const { sessionId, timestamp, payload } = event;

    // Get the session
    const session = this.sessions.get(sessionId);
    if (!session) {
      return err({
        code: 'SESSION_NOT_FOUND',
        message: `Session not found: ${sessionId}`,
      });
    }

    // Check if session is active
    if (session.metadata.status !== 'active') {
      return err({
        code: 'SESSION_NOT_ACTIVE',
        message: `Session is not active: ${sessionId}`,
      });
    }

    // Update session metadata
    session.metadata.status = payload.success ? 'completed' : 'failed';
    session.metadata.endedAt = timestamp;
    session.metadata.success = payload.success;

    // Add event
    session.events.push(event);
    return ok(event);
  }

  /**
   * Handles all other events - appends to existing session
   */
  private handleEvent(event: MeterEvent): Result<MeterEvent, CollectorError> {
    const { sessionId } = event;

    // Get the session
    const session = this.sessions.get(sessionId);
    if (!session) {
      return err({
        code: 'SESSION_NOT_FOUND',
        message: `Session not found: ${sessionId}`,
      });
    }

    // Check if session is active
    if (session.metadata.status !== 'active') {
      return err({
        code: 'SESSION_NOT_ACTIVE',
        message: `Session is not active: ${sessionId}`,
      });
    }

    // Add event
    session.events.push(event);
    return ok(event);
  }

  /**
   * Calculates metrics from session events
   */
  private calculateMetrics(session: Session): SessionMetrics {
    const metrics: SessionMetrics = {
      totalIterations: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      compilationAttempts: 0,
      compilationSuccesses: 0,
      testAttempts: 0,
      testSuccesses: 0,
      storiesCompleted: 0,
      storiesPassed: 0,
    };

    for (const event of session.events) {
      switch (event.eventType) {
        case 'iteration_end':
          metrics.totalIterations++;
          break;
        case 'tokens_in':
          metrics.totalTokensIn += event.payload.count;
          break;
        case 'tokens_out':
          metrics.totalTokensOut += event.payload.count;
          break;
        case 'compilation_result':
          metrics.compilationAttempts++;
          if (event.payload.success) {
            metrics.compilationSuccesses++;
          }
          break;
        case 'test_result':
          metrics.testAttempts++;
          if (event.payload.success) {
            metrics.testSuccesses++;
          }
          break;
        case 'story_complete':
          metrics.storiesCompleted++;
          if (event.payload.passes) {
            metrics.storiesPassed++;
          }
          break;
      }
    }

    return metrics;
  }
}
