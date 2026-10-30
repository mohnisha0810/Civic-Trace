import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEDPS, DEFAULT_EDPS_CONFIG } from '../src/lib/edps.js';
import { calculateDistanceMeters, checkDuplicateComplaint, computeDuplicateMetrics } from '../src/lib/duplicateShield.js';
import { INITIAL_COMPLAINTS, SENSITIVE_ZONES } from '../src/lib/demoData.js';
import { analyzeCivicMemory } from '../src/lib/civicMemory.js';
import { assessRadarUrgency, filterAndRankRadarQueue } from '../src/lib/civicRadar.js';
import { generateSyncSha256, truncateHash } from '../src/lib/checksum.js';
import { getPlaybookForCategory } from '../src/lib/playbooks.js';
import { generateCivicImpactAssessment } from '../src/lib/civicImpact.js';
import { CivicComplaint } from '../src/types/civic.js';

test('CivicTrace EDPS Priority Scoring Formula', async (t) => {
  await t.test('calculates correct score for CP-8492 Critical Pothole (Target: 88)', () => {
    const factors = {
      visualHazard: 92,   // 92 * 0.30 = 27.6
      zoneProximity: 96,  // 96 * 0.25 = 24.0
      clusterVelocity: 85, // 85 * 0.20 = 17.0
      civicEquity: 74,    // 74 * 0.15 = 11.1
      wardSLA: 83,        // 83 * 0.10 = 8.3 => Sum = 88.0
    };

    const result = calculateEDPS(factors);
    assert.equal(result.score, 88);
    assert.equal(result.band, 'critical');
    assert.ok(result.explanation.includes('CRITICAL'));
    assert.ok(result.breakdown.visualHazard.weightedScore === 27.6);
  });

  await t.test('bounds scores properly between 0 and 100', () => {
    const maxFactors = { visualHazard: 150, zoneProximity: 120, clusterVelocity: 110, civicEquity: 100, wardSLA: 100 };
    const maxResult = calculateEDPS(maxFactors);
    assert.equal(maxResult.score, 100);
    assert.equal(maxResult.band, 'critical');

    const minFactors = { visualHazard: -10, zoneProximity: 0, clusterVelocity: 0, civicEquity: 0, wardSLA: 0 };
    const minResult = calculateEDPS(minFactors);
    assert.equal(minResult.score, 0);
    assert.equal(minResult.band, 'low');
  });

  await t.test('classifies priority bands appropriately', () => {
    const critical = calculateEDPS({ visualHazard: 85, zoneProximity: 85, clusterVelocity: 85, civicEquity: 85, wardSLA: 85 });
    assert.equal(critical.band, 'critical');

    const high = calculateEDPS({ visualHazard: 65, zoneProximity: 65, clusterVelocity: 65, civicEquity: 65, wardSLA: 65 });
    assert.equal(high.band, 'high');

    const medium = calculateEDPS({ visualHazard: 45, zoneProximity: 45, clusterVelocity: 45, civicEquity: 45, wardSLA: 45 });
    assert.equal(medium.band, 'medium');

    const low = calculateEDPS({ visualHazard: 20, zoneProximity: 20, clusterVelocity: 20, civicEquity: 20, wardSLA: 20 });
    assert.equal(low.band, 'low');
  });
});

test('CivicTrace Duplicate Shield Spatial Radar', async (t) => {
  await t.test('accurately calculates Haversine distance in meters', () => {
    // Metro Hospital Gate (28.6139, 77.2090) to neighboring point (28.6141, 77.2091)
    const dist = calculateDistanceMeters(28.6139, 77.2090, 28.6141, 77.2091);
    assert.ok(dist >= 20 && dist <= 30, `Expected distance ~24m, got ${dist}m`);
  });

  await t.test('detects duplicate complaint within 50m radius and same category', () => {
    const candidateLat = 28.6140;
    const candidateLng = 77.2091;
    const result = checkDuplicateComplaint(
      'road_damage',
      candidateLat,
      candidateLng,
      'Another report of deep pothole crater outside hospital',
      INITIAL_COMPLAINTS
    );

    assert.equal(result.isLikelyDuplicate, true);
    assert.equal(result.matchedComplaint?.id, 'CP-8492');
    assert.ok(result.distanceMeters! <= 50);
  });

  await t.test('does not flag duplicate when location is > 500m away', () => {
    const distantLat = 28.6500;
    const distantLng = 77.2500;
    const result = checkDuplicateComplaint(
      'road_damage',
      distantLat,
      distantLng,
      'Different pothole far away',
      INITIAL_COMPLAINTS
    );

    assert.equal(result.isLikelyDuplicate, false);
  });

  await t.test('computes platform duplicate reduction metrics', () => {
    const metrics = computeDuplicateMetrics(INITIAL_COMPLAINTS);
    assert.ok(metrics.totalSubmissions > INITIAL_COMPLAINTS.length);
    assert.ok(metrics.duplicatesAvoided > 0);
    assert.ok(metrics.reductionPercentage > 0);
  });
});

test('CivicTrace Civic Memory Engine', async (t) => {
  await t.test('detects recurring chronic defects within 100m radius of same category', () => {
    // Test CP-7319 School Drainage which has recurring history
    const schoolDrainage = INITIAL_COMPLAINTS.find((c) => c.id === 'CP-7319');
    assert.ok(schoolDrainage);
    assert.ok(schoolDrainage.civicMemory);
    assert.equal(schoolDrainage.civicMemory.isRecurring, true);
    assert.ok(schoolDrainage.civicMemory.recurrenceScore >= 70);
    assert.ok(schoolDrainage.civicMemory.recurringAlert?.includes('Recurring Problem Detected'));
    assert.ok(schoolDrainage.civicMemory.history.length > 0);
  });

  await t.test('generates transparent recurrence score and non-null alert', () => {
    const testComplaint = INITIAL_COMPLAINTS[0];
    const memory = analyzeCivicMemory(
      'TEST-NEW-01',
      testComplaint.category,
      testComplaint.location.lat,
      testComplaint.location.lng,
      INITIAL_COMPLAINTS
    );

    assert.ok(memory.recurrenceScore >= 0 && memory.recurrenceScore <= 100);
    assert.ok(typeof memory.isRecurring === 'boolean');
  });
});

test('CivicTrace Priority Radar Operational Urgency Calculation', async (t) => {
  await t.test('calculates urgency index combining EDPS, aging, SLA, and recurrence', () => {
    const criticalPothole = INITIAL_COMPLAINTS.find((c) => c.id === 'CP-8492');
    assert.ok(criticalPothole);

    const assessment = assessRadarUrgency(criticalPothole);
    assert.ok(assessment.urgencyIndex >= 40 && assessment.urgencyIndex <= 100);
    assert.ok(assessment.whyIsThisHere.length > 10);
    assert.ok(assessment.contributingFactors.edpsBase > 0);
  });

  await t.test('ranks queue descending by urgency index', () => {
    const queue = filterAndRankRadarQueue(INITIAL_COMPLAINTS, {});
    assert.ok(queue.length > 0);
    for (let i = 0; i < queue.length - 1; i++) {
      assert.ok(queue[i].urgency.urgencyIndex >= queue[i + 1].urgency.urgencyIndex);
    }
  });
});

test('CivicTrace SHA-256 Cryptographic Checksum Utility', async (t) => {
  await t.test('generates deterministic hexadecimal digest of identical string payload', () => {
    const payload = 'CP-8492:EVIDENCE:PHOTO_URL_99812:28.6139:77.2090';
    const hash1 = generateSyncSha256(payload);
    const hash2 = generateSyncSha256(payload);
    assert.equal(hash1, hash2);
    assert.ok(hash1.length >= 32);
  });

  await t.test('produces different hashes for different payloads (avoids collision)', () => {
    const hashA = generateSyncSha256('FILE_A_DATA');
    const hashB = generateSyncSha256('FILE_B_DATA');
    assert.notEqual(hashA, hashB);
  });

  await t.test('truncates hash for readable UI badges', () => {
    const fullHash = generateSyncSha256('SAMPLE_DATA');
    const truncated = truncateHash(fullHash, 12);
    assert.ok(truncated.endsWith('...'));
    assert.equal(truncated.length, 15);
  });
});

test('CivicTrace Resolution Playbook SOP Engine', async (t) => {
  await t.test('generates category-specific standard operating procedures', () => {
    const potholePlaybook = getPlaybookForCategory('road_damage');
    assert.equal(potholePlaybook.category, 'road_damage');
    assert.ok(potholePlaybook.steps.length >= 4);
    assert.ok(potholePlaybook.sopTitle.includes('Pavement'));

    const sanitationPlaybook = getPlaybookForCategory('garbage_waste');
    assert.equal(sanitationPlaybook.category, 'garbage_waste');
    assert.ok(sanitationPlaybook.steps.some((s) => s.title.includes('Waste')));
  });
});

test('CivicTrace Civic Impact Explorer', async (t) => {
  await t.test('generates structured consequences, affected services and nearby facilities', () => {
    const hospitalPothole = INITIAL_COMPLAINTS.find((c) => c.id === 'CP-8492');
    assert.ok(hospitalPothole);

    const impact = generateCivicImpactAssessment(hospitalPothole);
    assert.ok(impact.potentialConsequences.length >= 2);
    assert.ok(impact.affectedPublicServices.length >= 2);
    assert.ok(impact.urgencyEscalators.length >= 2);
    assert.ok(impact.recommendedAction.length > 5);
    assert.ok(impact.disclaimer.includes('Not a confirmed physical prediction'));
    assert.ok(impact.nearbyFacilities.length > 0);
  });
});

test('CivicTrace Proof-of-Fix & Community Verification', async (t) => {
  await t.test('validates resolution evidence geofence tolerance', () => {
    const awaitingTicket = INITIAL_COMPLAINTS.find((c) => c.id === 'CP-3884');
    assert.ok(awaitingTicket);
    assert.ok(awaitingTicket.resolutionEvidence);
    assert.equal(awaitingTicket.status, 'awaiting_verification');
    assert.ok(awaitingTicket.resolutionEvidence.distanceFromOriginalMeters <= 10);
    assert.equal(awaitingTicket.resolutionEvidence.locationMatchApproved, true);
  });

  await t.test('community consensus correctly counts votes', () => {
    const verifiedTicket = INITIAL_COMPLAINTS.find((c) => c.id === 'CP-2910');
    assert.ok(verifiedTicket);
    assert.equal(verifiedTicket.status, 'verified');
    assert.equal(verifiedTicket.communityConsensus.consensusRate, 100);
    assert.ok(verifiedTicket.communityConsensus.communityChecks);
    assert.ok(verifiedTicket.communityConsensus.communityChecks.length >= 2);
  });
});

test('CivicTrace Demo Dataset Consistency', async (t) => {
  await t.test('all demo complaints have required fields, valid EDPS breakdowns, and audit trails', () => {
    assert.ok(INITIAL_COMPLAINTS.length >= 7);
    for (const c of INITIAL_COMPLAINTS) {
      assert.ok(c.id.startsWith('CP-'));
      assert.ok(c.title.length > 5);
      assert.ok(c.priorityScore >= 0 && c.priorityScore <= 100);
      assert.ok(['critical', 'high', 'medium', 'low'].includes(c.priorityBand));
      assert.ok(c.timeline.length >= 2);
      assert.ok(c.location.lat > 0 && c.location.lng > 0);
      assert.ok(c.evidence.evidenceChecksumSha256);
      assert.ok(c.auditLog && c.auditLog.length >= 2);
      assert.ok(c.playbook && c.playbook.steps.length >= 3);
      assert.ok(c.impactAssessment);
    }
  });

  await t.test('sensitive zones include hospital and school for EDPS proximity weighting', () => {
    const hospital = SENSITIVE_ZONES.find((z) => z.type === 'hospital');
    const school = SENSITIVE_ZONES.find((z) => z.type === 'school');
    assert.ok(hospital);
    assert.ok(school);
  });
});
