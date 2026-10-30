# CivicTrace — Autonomous Civic Issue Intelligence, Priority Scoring & Transparent Verification Platform

> **Hacknovate 2026 — Domain C: Digital & Civic-Tech — Problem Statement 9**  
> *"Every Issue Tracked. Every Resolution Verified."*

---

## 1. Executive Summary & Problem Solved

Traditional municipal grievance portals (CPGRAMS, WhatsApp chatbots, 311 webforms) suffer from three structural points of failure:
1. **The Civic Black Hole**: Complaints vanish into opaque bureaucratic queues with zero progress tracking. Over 70% of citizens experience civic apathy and stop reporting after two unaddressed tickets.
2. **Municipal Alert Fatigue & Duplicate Flooding**: A single crater on an arterial road triggers dozens of redundant tickets, flooding databases and blinding operations crews to genuine emergencies.
3. **Ghost Resolutions**: Contractors mark complaints "Resolved" to meet internal SLA deadlines without verifiable geotagged photographic proof or citizen consensus.

**CivicTrace** transforms civic reporting from an opaque inbox into an **objective, mathematically prioritized, trackable, and cryptographically verified municipal operations platform**.

---

## 2. Core Algorithmic Engines (Pure TypeScript)

### 2.1 Explainable Dynamic Priority Scoring (EDPS Engine)
Priority is never assigned arbitrarily. Every grievance receives an objective score from $0$ to $100$ computed across five mathematical vectors:

$$\text{Priority Score} = \min\left(100, \; 0.30 \cdot V_H + 0.25 \cdot Z_W + 0.20 \cdot C_V + 0.15 \cdot E_Q + 0.10 \cdot \text{SLA}\right)$$

* **$V_H$ — Visual Hazard Depth ($30\%$)**: Defect severity index (road crater $>15\text{cm} = 92$; exposed high-voltage wiring $= 90$; raw sewage backflow $= 82$).
* **$Z_W$ — Zone Sensitivity Kernel ($25\%$)**: Proximity-decay kernel to critical infrastructure (Hospital Emergency Route $<50\text{m} = 95$; School zone $<100\text{m} = 85$; Transit hub $= 75$).
* **$C_V$ — Cluster Velocity & Citizen Echo ($20\%$)**: Crowd urgency signal ($C_V = \min(100, 30 + 12 \times \text{upvotes})$).
* **$E_Q$ — Civic Equity Normalization Index ($15\%$)**: Demographic balancing boost to historically under-reported or less digitally connected wards.
* **$\text{SLA}$ — Ward SLA Time-Decay Escalator ($10\%$)**: Escalates towards $100$ as tickets approach or exceed departmental SLA limits.

**Priority Bands**:
* `Critical`: Score $80 - 100$ (24h SLA target)
* `High`: Score $60 - 79$ (48h SLA target)
* `Medium`: Score $40 - 59$ (72h SLA target)
* `Low`: Score $0 - 39$ (120h SLA target)

### 2.2 Spatial Duplicate Shield Radar
Eliminates duplicate municipal ticket flooding using the authentic **Haversine spherical distance formula**:
$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lng}}{2}\right)}\right)$$
* If an active report in the same category exists within **50 meters** ($d \le 50\text{m}$), the radar triggers in real time during intake.
* Offers a single-tap **"+1 Crowd Upvote"** button that increments cluster velocity without creating redundant work orders (average $83.3\%$ duplicate reduction rate).

### 2.3 Civic Memory Engine (Chronic Defect Detection)
* Scans a $100\text{m}$ radius for historical defects in the same category resolved within the past 12 months.
* If 2 or more past incidents exist, computes a **Recurrence Score ($0-100$)** and flags the ticket as a **Chronic Infrastructure Failure**, alerting municipal engineers that standard quick-patching has failed and structural base-course relaying is required.

### 2.4 Priority Radar (Dynamic Urgency Index)
$$\text{Urgency Index} = \text{EDPS} + (\text{Aging Hours} \times 0.6) + (\text{Is Chronic} ? 12 : 0) + (\text{Is Overdue} ? 25 : 0)$$
Ranks the municipal command center triage queue with explanatory rationale badges (*SLA Overdue +25*, *Chronic Defect +12*, *Critical Hazard*).

### 2.5 Standard Operating Procedure (SOP) Resolution Playbooks
Pre-configured, domain-specific checklists for:
* **Roads & Potholes**: Safety perimeter $\rightarrow$ Sub-base moisture check $\rightarrow$ Hot-mix asphalt compaction ($>95\%$ Proctor) $\rightarrow$ Surface leveling $\rightarrow$ Geotagged After-photo.
* **Drainage & Sanitation**: High-pressure hydraulic jetting $\rightarrow$ Silt trap de-sludging $\rightarrow$ Free-flow gradient confirmation.
* **Water Leaks**: Main pressure shutoff $\rightarrow$ Collar sleeve replacement $\rightarrow$ Hydrostatic pressure test ($>4.5\text{ bar}$) $\rightarrow$ Backfill leveling.
* **Streetlights / Electrical**: Phase voltage check ($230\text{V} \pm 10\%$) $\rightarrow$ Cable grounding test $\rightarrow$ Photocell sensor test.

### 2.6 Cryptographic Citizen Evidence Chain (SHA-256)
* Computes deterministic SHA-256 digests (`SHA-256: 7f8a9...b41c`) using native Web Crypto API (`crypto.subtle.digest`) with synchronous fallback for headless test runners.
* Chains report intake, municipal dispatch, contractor completion, and final consensus sealing.

### 2.7 4-Way Community Check Consensus Gate
* When contractors submit completion evidence, a 24-hour Community Check gate opens for local verified residents:
  1. **Fixed** (*"The defect is fully repaired."*)
  2. **Still Broken** (*"Work was not done or was poorly done."*)
  3. **Partially Fixed** (*"Temporary fix; debris or hazard remains."*)
  4. **Unsure / More Evidence Needed**
* **Dispute Threshold**: If 2 or more citizens vote **"Still Broken"**, the ticket is automatically reopened at **Priority 95** and escalated to the Department Head.

---

## 3. User Roles & Persona Switcher

Instant role persona switcher accessible from the header and sidebar:
1. **Citizen Persona (`Aarav Sharma`)**: Ward 12 resident reporting defects, upvoting neighborhood priorities, and voting in community verification gates.
2. **Municipal Engineer Persona (`Eng. Rajesh Verma`)**: Lead Executive Engineer (PWD & Roads) managing triage queues, issuing work orders, and auditing SOP playbooks.
3. **Public Auditor Persona (`Open Citizen Access`)**: Independent civic auditor inspecting cryptographic evidence chains, SLA compliance, and ward leaderboards.

---

## 4. Showcase Incidents (Delhi Municipal Seed Data)

1. **`CP-8492` (Critical Pothole — The Showcase Incident)**:
   - Outer Ring Rd, opposite Metro Hospital Emergency Gate 2, Ward 12.
   - Priority Score: **88 (Critical)** (VH: 92, ZW: 96, CV: 85, EQ: 74, SLA: 83).
   - Proximity: Hospital emergency bay ($<45\text{m}$).
   - Status: Active work order assigned to Apex Asphalt Infra Ltd.
2. **`CP-3884` (Completed Repair — Proof-of-Fix Showcase)**:
   - School Road, near Model Public School, Ward 12.
   - Status: `awaiting_verification` with Before and After photos attached.
   - GPS Geofence: **4.2m** separation (well within $25\text{m}$ tolerance).
   - Community Gate: Active 24h consensus gate.
3. **`CP-6924` (Solid Waste Dump — Duplicate Shield Showcase)**:
   - Shankar Market Lane, Connaught Place.
   - Priority Score: **72 (High)**, 6 redundant complaints consolidated into 1 master ticket.
4. **`CP-7319` (Blocked Drainage & Sewage — Civic Memory Showcase)**:
   - School Road, Sector 4 Junction.
   - Recurrence Score: **92/100**, 5 past recurring incidents detected.
5. **`CP-2910` (Verified Resolved Repair)**:
   - Vikas Marg, Near Laxmi Nagar Bus Stand, Ward 8.
   - Status: `verified` with 100% community consensus approval.

---

## 5. Verification & Testing

### Run Automated Algorithmic Engine Tests
```bash
npm test
```
**Output: 30/30 tests passing (100% pass rate, 0 failures)** covering:
- EDPS mathematical formulas & bounding
- Haversine sub-50m calculations & duplicate reduction %
- Civic Memory 100m recurrence detection
- Priority Radar Urgency Index ranking
- SHA-256 cryptographic digests & collision resistance
- SOP playbook generation
- Proof-of-Fix geofence tolerance ($\le 25\text{m}$) & 2-vote dispute auto-reopening

### Run Production Build
```bash
npm run build
```
**Output: Compiled with 0 TypeScript errors.**

---

## 6. Official Brand Color Palette

| Color Token | Hex Code | Purpose |
|:---|:---:|:---|
| **Deep Forest Teal** | `#0F3A36` | Primary brand color, dominant headings, primary buttons |
| **Secondary Teal** | `#1D534D` | Hover states, secondary action buttons |
| **Burnt Orange** | `#E05B2D` | Active radar pins, urgent priority badges, CTA accent |
| **Warm Ivory** | `#F9F6EE` | Input container surfaces, neutral card backgrounds |
| **Soft White** | `#FFFDF8` | Card background canvas, modal surfaces |
| **Pale Sage** | `#E2EDE7` | Sidebar active item backgrounds, card borders |
| **Light Peach** | `#FAE7DC` | Warning card background tints, radar pulse glow |
| **Charcoal Text** | `#1C2B29` | High-contrast body typography |
| **Muted Gray-Green** | `#67756F` | Secondary subtitles, helper text, timestamps |
