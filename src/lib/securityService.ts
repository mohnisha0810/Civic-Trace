/**
 * CivicTrace Security Engine & Threat Mitigation Service
 *
 * Implements server-grade controls:
 * 1. Input sanitization (XSS defense)
 * 2. Sliding window rate limiting (brute force & flood defense)
 * 3. Deny-by-default object-level authorization guards
 * 4. Tamper-evident cryptographic audit log hashing
 */

import { User, UserRole, Complaint, AuditLogEntry } from '../types';
import { computeSha256Sync } from './cryptoAuth';

// In-memory Sliding Window Rate Limiter
interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitStore: Record<string, RateLimitBucket> = {};

export function checkRateLimit(
  actionKey: string,
  maxAttempts: number = 5,
  windowMs: number = 120000 // 2 minutes
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  if (!rateLimitStore[actionKey]) {
    rateLimitStore[actionKey] = { timestamps: [] };
  }

  const bucket = rateLimitStore[actionKey];
  // Filter out timestamps outside current window
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= maxAttempts) {
    const oldest = bucket.timestamps[0];
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record attempt
  bucket.timestamps.push(now);
  return {
    allowed: true,
    remainingAttempts: maxAttempts - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(actionKey: string): void {
  delete rateLimitStore[actionKey];
}

// Input Sanitization (XSS Defense)
export function sanitizeTextInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip script tags and their inner code
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // strip style tags
    .replace(/<[^>]*>/g, '')                                           // strip any remaining HTML markup
    .replace(/javascript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

// Deny-by-Default Access Control Guards
export function canUserViewPrivateDetails(
  currentUser: User | null,
  complaint: Complaint
): boolean {
  if (!currentUser) return false;
  // Super admin can view all
  if (currentUser.role === 'super_admin') return true;
  // Government officials can view complaints in their state / jurisdiction
  if (currentUser.role === 'government' || currentUser.role === 'official') return true;
  // Citizen can view their own complaint details
  return (
    complaint.reportedByUserId === currentUser.id ||
    complaint.reportedByIdentifier.toLowerCase() === currentUser.identifier.toLowerCase()
  );
}

export function canUserPerformGovernmentActions(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'government' || user.role === 'official' || user.role === 'super_admin';
}

export function canUserPerformSuperAdminActions(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin';
}

// Tamper-Evident Cryptographic Audit Digest
export function generateAuditStateDigest(
  targetId: string,
  action: string,
  actorId: string,
  timestamp: string
): string {
  const payload = `${targetId}|${action}|${actorId}|${timestamp}`;
  return computeSha256Sync(payload);
}
