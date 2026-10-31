import { CommunityChallenge, Complaint, CommunityProgressMetric } from '../types';

/**
 * Computes the transparent mathematical Community Progress Score
 * for a community challenge based on verified improvements, completed activities,
 * and reviewed hotspots.
 */
export function calculateCommunityScore(
  challenge: CommunityChallenge,
  allComplaints: Complaint[]
): CommunityProgressMetric {
  const associatedComplaints = allComplaints.filter((c) =>
    challenge.associatedComplaintIds.includes(c.id)
  );

  const totalReported = associatedComplaints.length;
  const reviewedOrActive = associatedComplaints.filter(
    (c) => c.status !== 'submitted'
  ).length;

  const verifiedResolved = associatedComplaints.filter(
    (c) => c.status === 'verified' || (c.status === 'resolved' && c.resolutionProof?.isGeofenceValid)
  ).length;

  const completedActivities = challenge.volunteerActivities.filter(
    (a) => a.status === 'completed' && a.isOfficiallyApproved
  ).length;

  const totalActivities = challenge.volunteerActivities.length;
  const participantCount = challenge.participatingUserIds.length;

  // Check data sufficiency threshold: requires at least 1 resident or 1 reported hotspot or 1 activity
  const isDataSufficient = totalReported > 0 || totalActivities > 0 || participantCount > 0;

  if (!isDataSufficient) {
    return {
      score: 0,
      baselineScore: challenge.progressScore?.baselineScore || 20,
      targetScore: challenge.progressScore?.targetScore || 85,
      hotspotsReportedCount: 0,
      hotspotsReviewedCount: 0,
      cleanupActivitiesCompletedCount: 0,
      totalActivitiesCount: 0,
      verifiedImprovementsCount: 0,
      participatingResidentsCount: 0,
      factors: [
        {
          name: 'Hotspots Reviewed & Triage',
          weight: 35,
          achieved: 0,
          description: 'No civic hotspots logged for this challenge yet.',
        },
        {
          name: 'Verified Physical Fixes',
          weight: 30,
          achieved: 0,
          description: 'Awaiting photographic verification and consensus audits.',
        },
        {
          name: 'Completed Approved Activities',
          weight: 25,
          achieved: 0,
          description: 'No municipal or community cleanup drives completed yet.',
        },
        {
          name: 'Resident Participation',
          weight: 10,
          achieved: 0,
          description: 'Awaiting neighborhood residents to join the challenge.',
        },
      ],
      lastCalculatedAt: new Date().toISOString(),
      isDataSufficient: false,
    };
  }

  // 1. Hotspots Reviewed & Triage (Weight 35%)
  const targetHotspots = Math.max(1, challenge.targets.targetHotspotsToAddress);
  const reviewedRatio = totalReported > 0 ? reviewedOrActive / totalReported : 0;
  const targetCoverageRatio = Math.min(1.0, reviewedOrActive / targetHotspots);
  const factor1Achieved = Math.round((reviewedRatio * 0.5 + targetCoverageRatio * 0.5) * 100);

  // 2. Verified Physical Fixes with Geofence / Consensus (Weight 30%)
  const verificationRatio = totalReported > 0 ? verifiedResolved / totalReported : 0;
  const targetVerificationRatio = Math.min(1.0, verifiedResolved / targetHotspots);
  const factor2Achieved = Math.round((verificationRatio * 0.6 + targetVerificationRatio * 0.4) * 100);

  // 3. Completed Approved Volunteer Activities (Weight 25%)
  const targetActivities = Math.max(1, challenge.targets.targetVolunteerCleanups);
  const activityRatio = Math.min(1.0, completedActivities / targetActivities);
  const factor3Achieved = Math.round(activityRatio * 100);

  // 4. Resident Participation (Weight 10%)
  const targetResidents = Math.max(1, challenge.targets.targetResidentParticipation);
  const residentRatio = Math.min(1.0, participantCount / targetResidents);
  const factor4Achieved = Math.round(residentRatio * 100);

  // Composite Weighted Calculation
  const compositeScore = Math.round(
    (factor1Achieved * 0.35) +
    (factor2Achieved * 0.30) +
    (factor3Achieved * 0.25) +
    (factor4Achieved * 0.10)
  );

  const baselineScore = challenge.progressScore?.baselineScore || 25;
  const targetScore = challenge.progressScore?.targetScore || 85;

  return {
    score: Math.min(100, Math.max(0, compositeScore)),
    baselineScore,
    targetScore,
    hotspotsReportedCount: totalReported,
    hotspotsReviewedCount: reviewedOrActive,
    cleanupActivitiesCompletedCount: completedActivities,
    totalActivitiesCount: totalActivities,
    verifiedImprovementsCount: verifiedResolved,
    participatingResidentsCount: participantCount,
    factors: [
      {
        name: 'Hotspots Reviewed & Triage',
        weight: 35,
        achieved: factor1Achieved,
        description: `${reviewedOrActive} of ${totalReported} logged hotspots reviewed by ward officials.`,
      },
      {
        name: 'Verified Physical Fixes',
        weight: 30,
        achieved: factor2Achieved,
        description: `${verifiedResolved} issues verified resolved with GPS geofence & photographic proof.`,
      },
      {
        name: 'Completed Approved Activities',
        weight: 25,
        achieved: factor3Achieved,
        description: `${completedActivities} of ${targetActivities} target volunteer drives completed.`,
      },
      {
        name: 'Resident Participation',
        weight: 10,
        achieved: factor4Achieved,
        description: `${participantCount} of ${targetResidents} target residents active.`,
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
    isDataSufficient: true,
  };
}
