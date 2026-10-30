import { calculateDistanceMeters } from './duplicateCheck';
import { VerificationGate, VerificationVoteOption } from '../types';

export const GEOFENCE_TOLERANCE_METERS = 25;
export const DISPUTE_STILL_BROKEN_THRESHOLD = 2;

/**
 * Validates whether the contractor's completion coordinates match the defect location within 25m.
 */
export function validateResolutionGeofence(
  originalLat: number,
  originalLng: number,
  completedLat: number,
  completedLng: number
): { distanceMeters: number; isValid: boolean; message: string } {
  const dist = calculateDistanceMeters(originalLat, originalLng, completedLat, completedLng);
  const distanceMeters = Math.round(dist * 10) / 10;
  const isValid = distanceMeters <= GEOFENCE_TOLERANCE_METERS;

  return {
    distanceMeters,
    isValid,
    message: isValid
      ? `PASSED: Resolution camera GPS is ${distanceMeters}m from original complaint (within ${GEOFENCE_TOLERANCE_METERS}m tolerance).`
      : `FAILED: Resolution camera GPS is ${distanceMeters}m away (exceeds ${GEOFENCE_TOLERANCE_METERS}m tolerance). Recheck site coordinates!`,
  };
}

/**
 * Updates citizen verification votes and checks dispute threshold.
 */
export function recordCitizenVote(
  currentGate: VerificationGate,
  userId: string,
  vote: VerificationVoteOption
): { updatedGate: VerificationGate; shouldReopen: boolean; message: string } {
  const previousVote = currentGate.votedUsers[userId];
  const votedUsers = { ...currentGate.votedUsers, [userId]: vote };

  let fixed = currentGate.fixedVotes;
  let stillBroken = currentGate.stillBrokenVotes;
  let partiallyFixed = currentGate.partiallyFixedVotes;

  if (previousVote) {
    if (previousVote === 'fixed') fixed = Math.max(0, fixed - 1);
    if (previousVote === 'still_broken') stillBroken = Math.max(0, stillBroken - 1);
    if (previousVote === 'partially_fixed') partiallyFixed = Math.max(0, partiallyFixed - 1);
  }

  if (vote === 'fixed') fixed++;
  if (vote === 'still_broken') stillBroken++;
  if (vote === 'partially_fixed') partiallyFixed++;

  const total = fixed + stillBroken + partiallyFixed;
  const consensusPercentage = total > 0 ? Math.round((fixed / total) * 100) : 0;
  const isDisputed = stillBroken >= DISPUTE_STILL_BROKEN_THRESHOLD;

  let message = `Vote registered: ${vote.replace(/_/g, ' ')}. Consensus: ${consensusPercentage}%.`;
  if (isDisputed) {
    message = `DISPUTE TRIGGERED: ${stillBroken} citizens verified issue as "Still Broken". Complaint automatically reopened at Priority 95 and escalated!`;
  }

  return {
    updatedGate: {
      ...currentGate,
      fixedVotes: fixed,
      stillBrokenVotes: stillBroken,
      partiallyFixedVotes: partiallyFixed,
      totalVotes: total,
      consensusPercentage,
      isDisputed,
      votedUsers,
    },
    shouldReopen: isDisputed,
    message,
  };
}
