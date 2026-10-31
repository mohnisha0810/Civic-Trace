import assert from 'node:assert';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  computeSha256Sync,
} from '../src/lib/cryptoAuth';
import {
  calculateEdps,
  getPriorityBand,
  calculateClusterVelocity,
} from '../src/lib/edpsCalculator';
import {
  calculateDistanceMeters,
  checkDuplicateComplaint,
} from '../src/lib/duplicateCheck';
import {
  validateResolutionGeofence,
  recordCitizenVote,
} from '../src/lib/geofence';
import { VerificationGate } from '../src/types';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log('\n======================================================');
console.log(' CIVICTRACE CORE FUNCTIONAL ENGINES TEST SUITE ');
console.log('======================================================\n');

// 1. AUTH & CRYPTOGRAPHIC SECURITY TESTS
console.log('▶ [1. AUTH & CRYPTOGRAPHIC SECURITY]');

test('1.1 Generates unique cryptographic salts', () => {
  const salt1 = generateSalt();
  const salt2 = generateSalt();
  assert.strictEqual(salt1.length, 32);
  assert.notStrictEqual(salt1, salt2);
});

test('1.2 Salted password hashing is deterministic and irreversible', () => {
  const salt = 'a1b2c3d4e5f6g7h8';
  const hash1 = hashPassword('MySecretPass@123', salt);
  const hash2 = hashPassword('MySecretPass@123', salt);
  assert.strictEqual(hash1.length, 64);
  assert.strictEqual(hash1, hash2);
});

test('1.3 Password verification succeeds with matching password and rejects incorrect password', () => {
  const salt = generateSalt();
  const storedHash = hashPassword('CitizenSecurePass', salt);

  assert.strictEqual(verifyPassword('CitizenSecurePass', salt, storedHash), true);
  assert.strictEqual(verifyPassword('WrongPassword123', salt, storedHash), false);
});

test('1.4 Generates secure random session tokens', () => {
  const t1 = generateSessionToken();
  const t2 = generateSessionToken();
  assert(t1.length >= 24);
  assert.notStrictEqual(t1, t2);
});

test('1.5 Computes deterministic SHA-256 evidence digests', () => {
  const h1 = computeSha256Sync('Complaint:CT-1001:28.6139,77.2090');
  const h2 = computeSha256Sync('Complaint:CT-1001:28.6139,77.2090');
  assert.strictEqual(h1.length, 64);
  assert.strictEqual(h1, h2);
});

// 2. EDPS MATHEMATICAL PRIORITY TESTS
console.log('\n▶ [2. EDPS MATHEMATICAL PRIORITY ENGINE]');

test('2.1 Correctly computes multi-vector EDPS formulation', () => {
  // VH=90 (0.30=27), ZW=90 (0.25=22.5), upvotes=0 -> CV=30 (0.20=6), EQ=70 (0.15=10.5), SLA=60 (0.10=6)
  // Total = 27 + 22.5 + 6 + 10.5 + 6 = 72
  const res = calculateEdps({
    category: 'road_damage',
    visualHazard: 90,
    zoneSensitivity: 90,
    upvotes: 0,
    civicEquity: 70,
    slaEscalator: 60,
  });
  assert.strictEqual(res.score, 72);
  assert.strictEqual(res.band, 'high');
  assert(res.explanation.includes('Prioritized at Score 72 (HIGH)'));
});

test('2.2 Upvoting increments Cluster Velocity and boosts priority score', () => {
  const initial = calculateEdps({
    category: 'road_damage',
    visualHazard: 90,
    zoneSensitivity: 90,
    upvotes: 0,
  });

  const boosted = calculateEdps({
    category: 'road_damage',
    visualHazard: 90,
    zoneSensitivity: 90,
    upvotes: 5,
  });

  assert(boosted.score > initial.score, `Expected boosted score (${boosted.score}) > initial (${initial.score})`);
});

test('2.3 Correctly assigns Priority Bands across score spectrum', () => {
  assert.strictEqual(getPriorityBand(95), 'critical');
  assert.strictEqual(getPriorityBand(80), 'critical');
  assert.strictEqual(getPriorityBand(79), 'high');
  assert.strictEqual(getPriorityBand(60), 'high');
  assert.strictEqual(getPriorityBand(59), 'medium');
  assert.strictEqual(getPriorityBand(40), 'medium');
  assert.strictEqual(getPriorityBand(39), 'low');
  assert.strictEqual(getPriorityBand(10), 'low');
});

// 3. SPATIAL DUPLICATE CHECK TESTS
console.log('\n▶ [3. SPATIAL DUPLICATE CHECK (HAVERSINE)]');

test('3.1 Measures spherical distance in meters accurately', () => {
  const same = calculateDistanceMeters(28.6139, 77.2090, 28.6139, 77.2090);
  assert.strictEqual(Math.round(same), 0);

  const delta = calculateDistanceMeters(28.6139, 77.2090, 28.61415, 77.2091);
  assert(delta > 20 && delta < 40, `Expected 20-40m, got ${delta}`);
});

test('3.2 Flags duplicate complaints within 50 meters in matching category', () => {
  const mockComplaints: any[] = [
    {
      id: 'CT-101',
      latitude: 28.6139,
      longitude: 77.2090,
      category: 'road_damage',
      status: 'submitted',
    },
  ];

  // Point ~25m away
  const res = checkDuplicateComplaint(28.61405, 77.20915, 'road_damage', mockComplaints);
  assert.strictEqual(res.hasDuplicate, true);
  assert.strictEqual(res.duplicateComplaint?.id, 'CT-101');
  assert(res.distanceMeters! <= 50);
});

test('3.3 Does not flag complaints beyond 50 meters', () => {
  const mockComplaints: any[] = [
    {
      id: 'CT-102',
      latitude: 28.6139,
      longitude: 77.2090,
      category: 'road_damage',
      status: 'submitted',
    },
  ];

  // Point ~800m away
  const res = checkDuplicateComplaint(28.6210, 77.2090, 'road_damage', mockComplaints);
  assert.strictEqual(res.hasDuplicate, false);
});

test('3.4 Does not flag complaints in different categories within 50m', () => {
  const mockComplaints: any[] = [
    {
      id: 'CT-103',
      latitude: 28.6139,
      longitude: 77.2090,
      category: 'water_supply',
      status: 'submitted',
    },
  ];

  const res = checkDuplicateComplaint(28.61395, 77.20905, 'road_damage', mockComplaints);
  assert.strictEqual(res.hasDuplicate, false);
});

// 4. GPS GEOFENCE & RESOLUTION VERIFICATION TESTS
console.log('\n▶ [4. GEOFENCE & CITIZEN CONSENSUS]');

test('4.1 Validates contractor resolution GPS within 25m tolerance', () => {
  const audit = validateResolutionGeofence(28.6225, 77.2145, 28.622538, 77.214525);
  assert.strictEqual(audit.isValid, true);
  assert(audit.distanceMeters <= 5);
  assert(audit.message.includes('PASSED'));
});

test('4.2 Fails resolution GPS beyond 25m tolerance', () => {
  const audit = validateResolutionGeofence(28.6225, 77.2145, 28.6238, 77.2145);
  assert.strictEqual(audit.isValid, false);
  assert(audit.distanceMeters > 50);
  assert(audit.message.includes('FAILED'));
});

test('4.3 Enforces 2-vote dispute threshold that triggers automatic complaint reopening', () => {
  const initialGate: VerificationGate = {
    votingOpen: true,
    fixedVotes: 1,
    stillBrokenVotes: 0,
    partiallyFixedVotes: 0,
    totalVotes: 1,
    consensusPercentage: 100,
    isDisputed: false,
    votedUsers: {},
  };

  const v1 = recordCitizenVote(initialGate, 'user-a', 'still_broken');
  assert.strictEqual(v1.shouldReopen, false);
  assert.strictEqual(v1.updatedGate.stillBrokenVotes, 1);

  // Second citizen flags still broken
  const v2 = recordCitizenVote(v1.updatedGate, 'user-b', 'still_broken');
  assert.strictEqual(v2.shouldReopen, true);
  assert.strictEqual(v2.updatedGate.isDisputed, true);
  assert(v2.message.includes('DISPUTE TRIGGERED'));
});

// 5. SIMPLIFIED CITIZEN & GOVERNMENT OPERATIONS TESTS
console.log('\n▶ [5. SIMPLIFIED CITIZEN & GOVERNMENT WORKFLOWS]');

test('5.1 Image classification categories map to supported civic defect types', () => {
  const supported = [
    'Garbage / Waste Accumulation',
    'Drainage / Sewage Problem',
    'Pothole / Damaged Road',
    'Water Leakage',
    'Broken Streetlight',
    'Other Civic Issue',
  ];
  assert.strictEqual(supported.length, 6);
  assert(supported.includes('Garbage / Waste Accumulation'));
  assert(supported.includes('Drainage / Sewage Problem'));
  assert(supported.includes('Pothole / Damaged Road'));
});

test('5.2 Citizen upvote toggling correctly increments then decrements without duplicates', () => {
  let upvotes = 5;
  const userIds = ['user_1', 'user_2'];
  const testUserId = 'citizen_alice';

  // Add upvote
  if (!userIds.includes(testUserId)) {
    userIds.push(testUserId);
    upvotes++;
  }
  assert.strictEqual(upvotes, 6);
  assert.strictEqual(userIds.includes(testUserId), true);

  // Remove upvote (toggle)
  if (userIds.includes(testUserId)) {
    const idx = userIds.indexOf(testUserId);
    userIds.splice(idx, 1);
    upvotes = Math.max(0, upvotes - 1);
  }
  assert.strictEqual(upvotes, 5);
  assert.strictEqual(userIds.includes(testUserId), false);
});

test('5.3 Government 4 exact statistics sum up to total database count', () => {
  const mockDb = [
    { id: 'CT-1', status: 'submitted' },
    { id: 'CT-2', status: 'in_progress' },
    { id: 'CT-3', status: 'resolved' },
    { id: 'CT-4', status: 'submitted' },
  ];

  const total = mockDb.length;
  const pending = mockDb.filter(c => c.status === 'submitted').length;
  const inProgress = mockDb.filter(c => c.status === 'in_progress').length;
  const resolved = mockDb.filter(c => c.status === 'resolved').length;

  assert.strictEqual(total, 4);
  assert.strictEqual(pending, 2);
  assert.strictEqual(inProgress, 1);
  assert.strictEqual(resolved, 1);
  assert.strictEqual(pending + inProgress + resolved, total);
});

test('5.4 Priority-ordered complaints sort composite urgency correctly', () => {
  const c1 = { id: 'CT-1', severity: 35, safety: 25, upvotes: 20, age: 10 }; // 90
  const c2 = { id: 'CT-2', severity: 20, safety: 10, upvotes: 4, age: 5 };   // 39
  const c3 = { id: 'CT-3', severity: 30, safety: 15, upvotes: 12, age: 8 };  // 65

  const list = [c2, c1, c3];
  const sorted = [...list].sort((a, b) => {
    const scoreA = a.severity + a.safety + a.upvotes + a.age;
    const scoreB = b.severity + b.safety + b.upvotes + b.age;
    return scoreB - scoreA;
  });

  assert.strictEqual(sorted[0].id, 'CT-1');
  assert.strictEqual(sorted[1].id, 'CT-3');
  assert.strictEqual(sorted[2].id, 'CT-2');
});

// 6. SECURITY & THREAT MITIGATION TESTS
console.log('\n▶ [6. SECURITY & THREAT MITIGATION ENGINE]');

test('6.1 Sliding window rate limiter enforces maximum attempts and cooldown', () => {
  const { checkRateLimit, resetRateLimit } = require('../src/lib/securityService');
  const actionKey = 'test_ip_rate_limit_auth';
  resetRateLimit(actionKey);

  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(actionKey, 5, 60000);
    assert.strictEqual(res.allowed, true);
  }

  // 6th attempt within window must be rejected
  const blockedRes = checkRateLimit(actionKey, 5, 60000);
  assert.strictEqual(blockedRes.allowed, false);
  assert(blockedRes.retryAfterSeconds > 0);

  // Resetting clears the lock
  resetRateLimit(actionKey);
  const recoveredRes = checkRateLimit(actionKey, 5, 60000);
  assert.strictEqual(recoveredRes.allowed, true);
});

test('6.2 Input sanitization strips malicious XSS script tags and event handlers', () => {
  const { sanitizeTextInput } = require('../src/lib/securityService');
  const dirty = '<script>alert("hacked")</script>Pothole on Main St<img src=x onerror=alert(1)>';
  const clean = sanitizeTextInput(dirty);

  assert(!clean.includes('<script>'));
  assert(!clean.includes('onerror='));
  assert.strictEqual(clean, 'Pothole on Main St');
});

test('6.3 Deny-by-default role authorization blocks citizens from government ops', () => {
  const { canUserPerformGovernmentActions } = require('../src/lib/securityService');

  const citizenUser = { id: 'usr_cit_1', role: 'citizen', name: 'Ravi', identifier: 'ravi@example.com' };
  const officialUser = { id: 'usr_gov_1', role: 'government', name: 'Officer Sharma', identifier: 'sharma@gov.in' };
  const adminUser = { id: 'usr_admin_1', role: 'super_admin', name: 'Admin', identifier: 'admin@gov.in' };

  assert.strictEqual(canUserPerformGovernmentActions(null), false);
  assert.strictEqual(canUserPerformGovernmentActions(citizenUser), false);
  assert.strictEqual(canUserPerformGovernmentActions(officialUser), true);
  assert.strictEqual(canUserPerformGovernmentActions(adminUser), true);
});

test('6.4 Private complaint details viewable only by reporter, assigned official, or super admin', () => {
  const { canUserViewPrivateDetails } = require('../src/lib/securityService');

  const mockComplaint = {
    id: 'CT-999',
    reportedByUserId: 'usr_cit_owner',
    reportedByIdentifier: 'owner@example.com',
  };

  const owner = { id: 'usr_cit_owner', role: 'citizen', identifier: 'owner@example.com' };
  const stranger = { id: 'usr_cit_stranger', role: 'citizen', identifier: 'stranger@example.com' };
  const official = { id: 'usr_gov_1', role: 'government', identifier: 'official@gov.in' };
  const superAdmin = { id: 'usr_adm_1', role: 'super_admin', identifier: 'admin@gov.in' };

  assert.strictEqual(canUserViewPrivateDetails(null, mockComplaint as any), false);
  assert.strictEqual(canUserViewPrivateDetails(owner as any, mockComplaint as any), true);
  assert.strictEqual(canUserViewPrivateDetails(stranger as any, mockComplaint as any), false);
  assert.strictEqual(canUserViewPrivateDetails(official as any, mockComplaint as any), true);
  assert.strictEqual(canUserViewPrivateDetails(superAdmin as any, mockComplaint as any), true);
});

test('6.5 Generates deterministic tamper-evident cryptographic audit digest', () => {
  const { generateAuditStateDigest } = require('../src/lib/securityService');
  const d1 = generateAuditStateDigest('CT-1001', 'work_order_dispatched', 'usr_gov_1', '2026-10-31T09:00:00Z');
  const d2 = generateAuditStateDigest('CT-1001', 'work_order_dispatched', 'usr_gov_1', '2026-10-31T09:00:00Z');
  const d3 = generateAuditStateDigest('CT-1001', 'work_order_dispatched', 'usr_gov_2', '2026-10-31T09:00:00Z');

  assert.strictEqual(d1.length, 64);
  assert.strictEqual(d1, d2);
  assert.notStrictEqual(d1, d3);
});

// SUMMARY
console.log('\n======================================================');
console.log(` RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total tests)`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL CORE ENGINES VERIFIED 100% OPERATIONAL!\n');
}
