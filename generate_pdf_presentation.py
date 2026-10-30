import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080

FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

def get_f(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

# Colors
BG_DARK = (11, 15, 25)
CARD_BG = (22, 30, 49)
CARD_BORDER = (45, 59, 87)
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (160, 174, 192)
TEXT_DIM = (100, 116, 139)

ACCENT_CYAN = (56, 189, 248)
ACCENT_EMERALD = (52, 211, 153)
ACCENT_AMBER = (251, 191, 36)
ACCENT_ROSE = (244, 63, 94)
ACCENT_INDIGO = (129, 140, 248)

ASSETS = "/Users/apple/Downloads/Prototype/assets"

def create_base_slide():
    img = Image.new("RGB", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)
    # Subtle ambient radial glow at top
    for r in range(400, 0, -10):
        alpha = int(18 * (1 - r / 400))
        draw.ellipse([500 - r, 100 - r, 500 + r, 100 + r], fill=(56, 189, 248))
    # Subtle ambient glow at bottom right
    for r in range(350, 0, -10):
        alpha = int(14 * (1 - r / 350))
        draw.ellipse([1600 - r, 900 - r, 1600 + r, 900 + r], fill=(52, 211, 153))
    return img, draw

def add_header(draw, tag_text, title_text, subtitle_text="", tag_color=ACCENT_CYAN):
    # Tag Badge
    draw.rounded_rectangle([100, 45, 540, 95], radius=12, fill=(24, 38, 62), outline=tag_color, width=2)
    draw.text((120, 56), f"●  {tag_text.upper()}", font=get_f(FONT_BOLD, 20), fill=tag_color)

    # Main Title
    draw.text((100, 115), title_text, font=get_f(FONT_BLACK, 44), fill=TEXT_WHITE)

    if subtitle_text:
        draw.text((100, 175), subtitle_text, font=get_f(FONT_REG, 22), fill=TEXT_MUTED)

# -------------------------------------------------------------
# SLIDE 1: COVER SLIDE
# -------------------------------------------------------------
def make_slide_1():
    img, draw = create_base_slide()

    # Left content
    draw.rounded_rectangle([100, 90, 540, 140], radius=12, fill=(24, 38, 62), outline=ACCENT_CYAN, width=2)
    draw.text((120, 102), "HACKNOVATE 2026  •  PROBLEM STATEMENT 9", font=get_f(FONT_BOLD, 18), fill=ACCENT_CYAN)

    draw.text((100, 175), "CivicPulse AI", font=get_f(FONT_BLACK, 76), fill=TEXT_WHITE)
    draw.text((100, 270), "Autonomous Civic Issue Intelligence &\nTransparent Resolution Protocol", font=get_f(FONT_BOLD, 30), fill=ACCENT_INDIGO)

    desc = ("Transforming civic complaints from an opaque black hole into an active,\n"
            "verifiable governance pipeline powered by Explainable AI Priority Scoring,\n"
            "Duplicate Ticket Suppression, and Before/After Proof-of-Fix.")
    draw.text((100, 370), desc, font=get_f(FONT_REG, 23), fill=TEXT_MUTED)

    # 3 Glowing Badges
    badges = [
        ("✔  Explainable Dynamic Priority Scoring (0–100 EDPS Engine)", ACCENT_CYAN),
        ("✔  Intelligent 'Duplicate Shield' (+1 Crowd Upvoting)", ACCENT_EMERALD),
        ("✔  Verifiable 'Proof-of-Fix' Protocol (CV Diff & Consensus)", ACCENT_AMBER)
    ]
    for i, (b_text, col) in enumerate(badges):
        y = 520 + i * 75
        draw.rounded_rectangle([100, y, 980, y + 60], radius=12, fill=(22, 30, 49), outline=col, width=2)
        draw.text((125, y + 16), b_text, font=get_f(FONT_BOLD, 22), fill=col)

    # Right Image
    hero_path = os.path.join(ASSETS, "hero_illustration.jpg")
    if os.path.exists(hero_path):
        hero = Image.open(hero_path).convert("RGB")
        hero = hero.resize((760, 840))
        img.paste(hero, (1060, 110))
        draw.rectangle([1060, 110, 1820, 950], outline=ACCENT_CYAN, width=3)

    return img

# -------------------------------------------------------------
# SLIDE 2: 3 PILLARS
# -------------------------------------------------------------
def make_slide_2():
    img, draw = create_base_slide()
    add_header(draw, "Our Proposed Solution", "CivicPulse: The 3 Pillars of Our Solution",
               "A balanced tri-party platform uniting Citizens, Algorithmic Prioritization, and Municipal Field Teams.")

    pillars = [
        ("PILLAR 1: SMART REPORTING", "Frictionless Edge Capture", [
            ("Instant Geo-Tagging", "1-click photo auto-extracts EXIF GPS coordinates & reverse geocodes the exact street address."),
            ("AI Multimodal Vision", "Pre-classifies defect category (Pothole, Waste, Streetlight) with confidence score."),
            ("Voice-First Ingestion", "Speak grievances naturally in Hindi or English with real-time speech transcription."),
            ("Zero Barriers", "No tedious logins required. Designed for 100% citizen adoption.")
        ], ACCENT_EMERALD),

        ("PILLAR 2: ALGORITHMIC TRIAGE", "Explainable Priority (EDPS)", [
            ("Mathematical Formulation", "Calculates a dynamic 0–100 severity index combining 5 real-time vectors."),
            ("Geospatial Zone Proximity", "Distance-decay boost for defects near hospitals, schools, and transit hubs."),
            ("Civic Equity Guarantee", "Prevents less digitized wards from being deprioritized due to smartphone disparity."),
            ("Plain-English Reasoning", "Generates a human-readable audit card explaining why the score was assigned.")
        ], ACCENT_CYAN),

        ("PILLAR 3: PUBLIC ACCOUNTABILITY", "Verifiable Proof-of-Fix", [
            ("Before / After AI Audit", "Repair crews must upload an After photo at the exact GPS coordinates; CV verifies fix."),
            ("Community Consensus", "Original reporter & nearby citizens vote to confirm quality before ticket archives."),
            ("Public Milestone Tracker", "Full public visibility from Reported → Triaged → Dispatched → Verified."),
            ("Ward SLA Scorecards", "Live ward rankings holding municipal contractors accountable.")
        ], ACCENT_INDIGO)
    ]

    for i, (tag, title, points, color) in enumerate(pillars):
        x = 100 + i * 580
        draw.rounded_rectangle([x, 230, x + 550, 980], radius=18, fill=CARD_BG, outline=color, width=3)
        draw.text((x + 35, 260), tag, font=get_f(FONT_BOLD, 16), fill=color)
        draw.text((x + 35, 295), title, font=get_f(FONT_BLACK, 28), fill=TEXT_WHITE)

        y_pt = 370
        for head, body in points:
            draw.text((x + 35, y_pt), f"• {head}", font=get_f(FONT_BOLD, 20), fill=TEXT_WHITE)
            # Simple text wrap
            words = body.split()
            line = ""
            lines = []
            for w in words:
                if len(line + " " + w) < 38:
                    line += " " + w if line else w
                else:
                    lines.append(line)
                    line = w
            if line:
                lines.append(line)

            for l_idx, l in enumerate(lines):
                draw.text((x + 50, y_pt + 28 + l_idx * 24), l, font=get_f(FONT_REG, 17), fill=TEXT_MUTED)
            y_pt += 45 + len(lines) * 24 + 15

    return img

# -------------------------------------------------------------
# SLIDE 3: WORKFLOW PIPELINE
# -------------------------------------------------------------
def make_slide_3():
    img, draw = create_base_slide()
    add_header(draw, "System Workflow", "How It Works: 4 Transparent Steps to Resolution",
               "From citizen smartphone to automated triage, field repair, and public verification.")

    pipe_path = os.path.join(ASSETS, "pipeline_graphic.png")
    if os.path.exists(pipe_path):
        pipe_img = Image.open(pipe_path).convert("RGB")
        pipe_img = pipe_img.resize((1720, 500))
        img.paste(pipe_img, (100, 230))
        draw.rectangle([100, 230, 1820, 730], outline=CARD_BORDER, width=2)

    # 4 Bottom Cards
    steps = [
        ("Step 1: Smart Capture", "Citizen snaps photo. GPS coordinates, timestamp, and AI hazard bounding box are locked instantly.", ACCENT_EMERALD),
        ("Step 2: AI Triage (EDPS)", "Calculates dynamic 0–100 priority score factoring in depth, hospital proximity, and crowd upvotes.", ACCENT_CYAN),
        ("Step 3: Ward Dispatch", "Auto-routed to the specific Ward Department (PWD/Sanitation) with a strict SLA countdown timer.", ACCENT_AMBER),
        ("Step 4: Proof-of-Fix", "Contractor uploads geotagged after-photo. AI diff checks repair, and citizens cast a verification vote.", ACCENT_INDIGO),
    ]

    for i, (title, desc, color) in enumerate(steps):
        x = 100 + i * 440
        draw.rounded_rectangle([x, 760, x + 415, 980], radius=16, fill=CARD_BG, outline=color, width=2)
        draw.text((x + 25, 785), title, font=get_f(FONT_BOLD, 22), fill=color)

        words = desc.split()
        line = ""
        lines = []
        for w in words:
            if len(line + " " + w) < 30:
                line += " " + w if line else w
            else:
                lines.append(line)
                line = w
        if line:
            lines.append(line)

        for l_idx, l in enumerate(lines):
            draw.text((x + 25, 830 + l_idx * 28), l, font=get_f(FONT_REG, 18), fill=TEXT_MUTED)

    return img

# -------------------------------------------------------------
# SLIDE 4: EDPS ENGINE
# -------------------------------------------------------------
def make_slide_4():
    img, draw = create_base_slide()
    add_header(draw, "The Algorithmic Core", "Explainable Dynamic Priority Scoring (EDPS Engine)",
               "Directly tackling the hackathon challenge: genuine mathematical prioritization with transparent reasoning.")

    dial_path = os.path.join(ASSETS, "priority_dial.png")
    if os.path.exists(dial_path):
        dial = Image.open(dial_path).convert("RGB")
        dial = dial.resize((1720, 650))
        img.paste(dial, (100, 230))
        draw.rectangle([100, 230, 1820, 880], outline=ACCENT_CYAN, width=2)

    # Bottom Formula Banner
    draw.rounded_rectangle([100, 910, 1820, 980], radius=14, fill=(14, 116, 144), outline=ACCENT_CYAN, width=2)
    f_text = "THE FORMULA:  Priority = min( 100,  0.30·Sv [Hazard] + 0.25·Zw [Zone] + 0.20·Cv [Velocity] + 0.15·Eq [Equity] + 0.10·Te [SLA] )"
    draw.text((180, 935), f_text, font=get_f(FONT_BOLD, 22), fill=TEXT_WHITE)

    return img

# -------------------------------------------------------------
# SLIDE 5: DUPLICATE SHIELD
# -------------------------------------------------------------
def make_slide_5():
    img, draw = create_base_slide()
    add_header(draw, "Municipal Efficiency", "The 'Duplicate Shield': Eliminating Alert Fatigue",
               "How CivicPulse solves the avalanche of redundant complaints that paralyze city engineers.")

    dup_path = os.path.join(ASSETS, "duplicate_shield_graphic.png")
    if os.path.exists(dup_path):
        dup = Image.open(dup_path).convert("RGB")
        dup = dup.resize((1720, 650))
        img.paste(dup, (100, 230))
        draw.rectangle([100, 230, 1820, 880], outline=ACCENT_EMERALD, width=2)

    draw.rounded_rectangle([100, 910, 1820, 980], radius=14, fill=(16, 75, 45), outline=ACCENT_EMERALD, width=2)
    stat = "IMPACT: 75% Reduction in Database Bloat  •  Zero Alert Fatigue  •  Instant Emergency Surge Detection"
    draw.text((280, 935), stat, font=get_f(FONT_BOLD, 24), fill=ACCENT_EMERALD)

    return img

# -------------------------------------------------------------
# SLIDE 6: PROOF-OF-FIX PROTOCOL
# -------------------------------------------------------------
def make_slide_6():
    img, draw = create_base_slide()
    add_header(draw, "Public Accountability", "The 'Proof-of-Fix' Protocol: Verifiable Closures",
               "Restoring citizen trust through Computer Vision Before/After verification and community consensus.")

    ba_path = os.path.join(ASSETS, "before_after_proof.png")
    if os.path.exists(ba_path):
        ba = Image.open(ba_path).convert("RGB")
        ba = ba.resize((1720, 650))
        img.paste(ba, (100, 230))
        draw.rectangle([100, 230, 1820, 880], outline=ACCENT_INDIGO, width=2)

    draw.rounded_rectangle([100, 910, 1820, 980], radius=14, fill=(49, 46, 129), outline=ACCENT_INDIGO, width=2)
    trust = "CLOSING THE LOOP: Geotagged Photo Lock  •  AI Computer Vision Difference Analysis  •  24h Community Consensus Gate"
    draw.text((180, 935), trust, font=get_f(FONT_BOLD, 22), fill=ACCENT_INDIGO)

    return img

# -------------------------------------------------------------
# SLIDE 7: TWO-SIDED PLATFORM
# -------------------------------------------------------------
def make_slide_7():
    img, draw = create_base_slide()
    add_header(draw, "Two-Sided Platform", "Public Resolution Tracker & Municipal Command Center",
               "Empowering both citizens and city administration through real-time geospatial intelligence.")

    # Left: Citizen Tracker
    draw.rounded_rectangle([100, 230, 930, 980], radius=20, fill=CARD_BG, outline=ACCENT_CYAN, width=3)
    draw.text((140, 270), "FOR CITIZENS: PUBLIC RESOLUTION TRACKER", font=get_f(FONT_BOLD, 18), fill=ACCENT_CYAN)
    draw.text((140, 310), "100% Transparent Civic Governance", font=get_f(FONT_BLACK, 32), fill=TEXT_WHITE)

    items_l = [
        ("Live 5-Stage Journey", "Real-time tracking: Submitted → AI Triaged → Dispatched → Repaired → Verified."),
        ("Interactive GIS City Map", "Search any neighborhood or ward to see active, in-progress, and resolved repairs."),
        ("Explainability Cards", "Every ticket displays the exact reason for its assigned priority score."),
        ("Community Voice", "Vote on the quality of completed repairs directly from your phone.")
    ]
    y_l = 400
    for h, b in items_l:
        draw.text((140, y_l), f"• {h}", font=get_f(FONT_BOLD, 22), fill=TEXT_WHITE)
        words = b.split()
        line = ""
        lines = []
        for w in words:
            if len(line + " " + w) < 50:
                line += " " + w if line else w
            else:
                lines.append(line)
                line = w
        if line:
            lines.append(line)
        for l_idx, l in enumerate(lines):
            draw.text((160, y_l + 32 + l_idx * 26), l, font=get_f(FONT_REG, 19), fill=TEXT_MUTED)
        y_l += 50 + len(lines) * 26 + 18

    # Right: Municipal Command Center
    draw.rounded_rectangle([990, 230, 1820, 980], radius=20, fill=CARD_BG, outline=ACCENT_AMBER, width=3)
    draw.text((1030, 270), "FOR CITY OFFICIALS: COMMAND CENTER", font=get_f(FONT_BOLD, 18), fill=ACCENT_AMBER)
    draw.text((1030, 310), "Data-Driven Municipal Operations", font=get_f(FONT_BLACK, 32), fill=TEXT_WHITE)

    items_r = [
        ("Geospatial Hotspot Heatmap", "Pinpoints civic failure density across urban sectors in real time."),
        ("Automated SLA Countdown", "Critical tickets trigger strict 24-hour clocks with auto-escalation to commissioners."),
        ("Work-Order Routing", "Automatically dispatches tickets to specific ward departments (PWD, Electricity, Sanitation)."),
        ("Ward Performance Leaderboard", "Ranks contractors and ward officers by fix speed, quality, and citizen satisfaction.")
    ]
    y_r = 400
    for h, b in items_r:
        draw.text((1030, y_r), f"• {h}", font=get_f(FONT_BOLD, 22), fill=TEXT_WHITE)
        words = b.split()
        line = ""
        lines = []
        for w in words:
            if len(line + " " + w) < 50:
                line += " " + w if line else w
            else:
                lines.append(line)
                line = w
        if line:
            lines.append(line)
        for l_idx, l in enumerate(lines):
            draw.text((1050, y_r + 32 + l_idx * 26), l, font=get_f(FONT_REG, 19), fill=TEXT_MUTED)
        y_r += 50 + len(lines) * 26 + 18

    return img

# -------------------------------------------------------------
# SLIDE 8: THANK YOU SLIDE
# -------------------------------------------------------------
def make_slide_8():
    img, draw = create_base_slide()

    # Giant Centered Card
    draw.rounded_rectangle([200, 120, 1720, 940], radius=24, fill=CARD_BG, outline=ACCENT_CYAN, width=3)

    draw.rounded_rectangle([680, 180, 1240, 230], radius=12, fill=(24, 38, 62), outline=ACCENT_CYAN, width=2)
    draw.text((710, 192), "HACKNOVATE 2026  •  PROBLEM STATEMENT 9", font=get_f(FONT_BOLD, 20), fill=ACCENT_CYAN)

    draw.text((720, 270), "Thank You!", font=get_f(FONT_BLACK, 96), fill=TEXT_WHITE)

    tagline = "CivicPulse AI: Turning Civic Frustration into Prioritized, Transparent Civic Action."
    draw.text((360, 420), tagline, font=get_f(FONT_BOLD, 28), fill=ACCENT_INDIGO)

    # Question Prompt Box
    draw.rounded_rectangle([540, 510, 1380, 600], radius=16, fill=(16, 75, 45), outline=ACCENT_EMERALD, width=2)
    draw.text((620, 535), "We are open for Questions & Feedback", font=get_f(FONT_BOLD, 32), fill=ACCENT_EMERALD)

    # 3 Summary Tags
    pills = [
        ("AI Explainable Dynamic Priority (EDPS)", ACCENT_CYAN),
        ("Duplicate Shield (+1 Upvoting)", ACCENT_EMERALD),
        ("Verifiable Proof-of-Fix Protocol", ACCENT_AMBER)
    ]
    for i, (p_text, col) in enumerate(pills):
        x = 280 + i * 460
        draw.rounded_rectangle([x, 700, x + 440, 770], radius=12, fill=(15, 23, 42), outline=CARD_BORDER, width=2)
        draw.text((x + 25, 725), p_text, font=get_f(FONT_BOLD, 17), fill=col)

    draw.text((580, 850), "Designed & Engineered for Problem Statement 9  |  Hacknovate 2026", font=get_f(FONT_REG, 20), fill=TEXT_DIM)

    return img

def main():
    print("Generating Slide 1...")
    s1 = make_slide_1()
    print("Generating Slide 2...")
    s2 = make_slide_2()
    print("Generating Slide 3...")
    s3 = make_slide_3()
    print("Generating Slide 4...")
    s4 = make_slide_4()
    print("Generating Slide 5...")
    s5 = make_slide_5()
    print("Generating Slide 6...")
    s6 = make_slide_6()
    print("Generating Slide 7...")
    s7 = make_slide_7()
    print("Generating Slide 8...")
    s8 = make_slide_8()

    out_pdf = "/Users/apple/Downloads/Prototype/CivicPulse_Solution_Pitch.pdf"
    print(f"Compiling PDF into: {out_pdf}...")
    s1.save(out_pdf, save_all=True, append_images=[s2, s3, s4, s5, s6, s7, s8], resolution=100.0)
    print("Done! PDF generated successfully.")

if __name__ == "__main__":
    main()
