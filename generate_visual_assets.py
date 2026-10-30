import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("/Users/apple/Downloads/Prototype/assets", exist_ok=True)

FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

# -------------------------------------------------------------
# 1. PRIORITY DIAL & EXPLAINABILITY INFOGRAPHIC (1200 x 700)
# -------------------------------------------------------------
def make_priority_dial():
    w, h = 1200, 700
    img = Image.new("RGBA", (w, h), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    # Background gradient glow
    for r in range(250, 0, -5):
        alpha = int(35 * (1 - r / 250))
        draw.ellipse([300 - r, 350 - r, 300 + r, 350 + r], fill=(244, 63, 94, alpha))

    # Outer arc track
    draw.arc([120, 170, 480, 530], start=135, end=405, fill=(51, 65, 85, 255), width=24)
    # Active high-priority arc (from 135 to 370 degrees for 88%)
    draw.arc([120, 170, 480, 530], start=135, end=380, fill=(244, 63, 94, 255), width=24)

    # Dial text
    f_huge = get_font(FONT_BLACK, 86)
    f_med = get_font(FONT_BOLD, 22)
    f_small = get_font(FONT_BOLD, 16)
    f_body = get_font(FONT_REG, 18)

    draw.text((245, 260), "88", font=f_huge, fill=(255, 255, 255, 255))
    draw.text((230, 370), "OUT OF 100", font=f_small, fill=(148, 163, 184, 255))
    
    # Priority badge
    draw.rounded_rectangle([200, 420, 400, 465], radius=12, fill=(244, 63, 94, 255))
    draw.text((225, 430), "CRITICAL HAZARD", font=f_med, fill=(255, 255, 255, 255))

    # Right side: The 5 Vector Breakdown Cards
    vectors = [
        ("Visual Hazard Depth (Sv)", "18cm deep crater, exposed sub-base rock", "+30 pts", (244, 63, 94)),
        ("Zone Proximity (Zw)", "40 meters from St. Jude Hospital Emergency Bay", "+25 pts", (245, 158, 11)),
        ("Cluster Velocity (Cv)", "9 citizen reports in 90 mins (Surge multiplier)", "+20 pts", (56, 189, 248)),
        ("Civic Equity Index (Eq)", "Under-reported ward baseline parity applied", "+15 pts", (52, 211, 153)),
    ]

    x_start = 540
    y_start = 130
    draw.text((x_start, 70), "EXPLAINABLE AI BREAKDOWN", font=f_med, fill=(56, 189, 248, 255))
    draw.text((x_start, 98), "Transparent audit trail for citizens and municipal engineers", font=f_body, fill=(148, 163, 184, 255))

    for i, (v_name, v_sub, v_pts, color) in enumerate(vectors):
        card_y = y_start + i * 115
        draw.rounded_rectangle([x_start, card_y, 1140, card_y + 95], radius=14, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=2)
        # Left color pill
        draw.rounded_rectangle([x_start + 12, card_y + 16, x_start + 18, card_y + 79], radius=3, fill=color)
        draw.text((x_start + 35, card_y + 18), v_name, font=get_font(FONT_BOLD, 20), fill=(255, 255, 255, 255))
        draw.text((x_start + 35, card_y + 52), v_sub, font=f_body, fill=(148, 163, 184, 255))
        # Points badge
        draw.rounded_rectangle([1020, card_y + 25, 1120, card_y + 70], radius=10, fill=(color[0], color[1], color[2], 50), outline=color, width=1)
        draw.text((1035, card_y + 35), v_pts, font=get_font(FONT_BOLD, 18), fill=color)

    out = "/Users/apple/Downloads/Prototype/assets/priority_dial.png"
    img.save(out)
    print("Saved", out)

# -------------------------------------------------------------
# 2. BEFORE / AFTER PROOF-OF-FIX SPLIT CARD (1200 x 600)
# -------------------------------------------------------------
def make_before_after():
    w, h = 1200, 600
    img = Image.new("RGBA", (w, h), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    f_title = get_font(FONT_BLACK, 28)
    f_sub = get_font(FONT_BOLD, 20)
    f_body = get_font(FONT_REG, 17)
    f_badge = get_font(FONT_BOLD, 15)

    # Left Card: BEFORE (Citizen Report)
    draw.rounded_rectangle([60, 60, 570, 540], radius=18, fill=(30, 41, 59, 255), outline=(244, 63, 94, 200), width=3)
    # Simulated Photo area
    draw.rounded_rectangle([85, 130, 545, 390], radius=12, fill=(15, 23, 42, 255))
    # Draw simulated pothole graphic
    draw.ellipse([200, 210, 430, 310], fill=(45, 55, 72, 255), outline=(244, 63, 94, 255), width=3)
    draw.ellipse([250, 235, 380, 285], fill=(26, 32, 44, 255))
    # AI Bounding Box overlay
    draw.rectangle([180, 190, 450, 330], outline=(56, 189, 248, 255), width=2)
    draw.rectangle([180, 170, 370, 192], fill=(56, 189, 248, 255))
    draw.text((188, 172), "AI: POTHOLE HAZARD 96%", font=get_font(FONT_BOLD, 12), fill=(15, 23, 42, 255))

    # Badge Before
    draw.rounded_rectangle([85, 80, 250, 118], radius=8, fill=(244, 63, 94, 255))
    draw.text((105, 88), "1. REPORTED ISSUE", font=f_badge, fill=(255, 255, 255, 255))
    draw.text((85, 415), "GPS: 28.6139° N, 77.2090° E (EXIF Locked)", font=f_sub, fill=(255, 255, 255, 255))
    draw.text((85, 450), "Status: Unpaved Crater (18cm depth) • Oct 28", font=f_body, fill=(148, 163, 184, 255))
    draw.text((85, 480), "Assigned Priority: 88/100 (Critical)", font=f_body, fill=(244, 63, 94, 255))

    # Right Card: AFTER (Verified Resolution)
    draw.rounded_rectangle([630, 60, 1140, 540], radius=18, fill=(30, 41, 59, 255), outline=(52, 211, 153, 200), width=3)
    # Simulated Photo area
    draw.rounded_rectangle([655, 130, 1115, 390], radius=12, fill=(15, 23, 42, 255))
    # Smooth paved road graphic
    draw.rectangle([655, 230, 1115, 290], fill=(51, 65, 85, 255))
    draw.line([655, 260, 1115, 260], fill=(251, 191, 36, 255), width=4)
    # Stamp: VERIFIED BY AI
    draw.rounded_rectangle([780, 200, 1000, 280], radius=12, fill=(52, 211, 153, 40), outline=(52, 211, 153, 255), width=3)
    draw.text((805, 215), "VERIFIED FIX", font=get_font(FONT_BLACK, 22), fill=(52, 211, 153, 255))
    draw.text((815, 248), "CV Match: 98.4%", font=get_font(FONT_BOLD, 15), fill=(255, 255, 255, 255))

    # Badge After
    draw.rounded_rectangle([655, 80, 840, 118], radius=8, fill=(52, 211, 153, 255))
    draw.text((675, 88), "2. RESOLVED & AUDITED", font=f_badge, fill=(15, 23, 42, 255))
    draw.text((655, 415), "GPS Verified: Within 4.2m of coordinates", font=f_sub, fill=(255, 255, 255, 255))
    draw.text((655, 450), "Repaired with Hot-Mix Asphalt • Contractor #PWD-41", font=f_body, fill=(148, 163, 184, 255))
    draw.text((655, 480), "Community Consensus: 4/4 Citizens Confirmed Fixed", font=f_body, fill=(52, 211, 153, 255))

    out = "/Users/apple/Downloads/Prototype/assets/before_after_proof.png"
    img.save(out)
    print("Saved", out)

# -------------------------------------------------------------
# 3. DUPLICATE SHIELD INFOGRAPHIC (1200 x 550)
# -------------------------------------------------------------
def make_duplicate_shield():
    w, h = 1200, 550
    img = Image.new("RGBA", (w, h), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    f_title = get_font(FONT_BLACK, 24)
    f_sub = get_font(FONT_BOLD, 18)
    f_body = get_font(FONT_REG, 16)
    f_badge = get_font(FONT_BOLD, 14)

    # Left: Old Way (Spam / Alert Fatigue)
    draw.rounded_rectangle([60, 50, 570, 500], radius=16, fill=(30, 41, 59, 255), outline=(244, 63, 94, 150), width=2)
    draw.rounded_rectangle([85, 75, 270, 110], radius=8, fill=(244, 63, 94, 255))
    draw.text((105, 83), "TRADITIONAL PORTAL", font=f_badge, fill=(255, 255, 255, 255))
    draw.text((85, 130), "The Duplicate Disaster", font=f_title, fill=(255, 255, 255, 255))

    # Red boxes showing 40 redundant tickets
    for row in range(3):
        for col in range(4):
            x = 85 + col * 115
            y = 180 + row * 65
            draw.rounded_rectangle([x, y, x + 105, y + 50], radius=6, fill=(15, 23, 42, 255), outline=(244, 63, 94, 200), width=1)
            draw.text((x + 12, y + 10), "Ticket #" + str(row*4 + col + 101), font=get_font(FONT_BOLD, 12), fill=(244, 63, 94, 255))
            draw.text((x + 12, y + 28), "Pothole", font=get_font(FONT_REG, 11), fill=(148, 163, 184, 255))

    draw.text((85, 395), "Result: 40 identical tickets jam the database", font=f_sub, fill=(244, 63, 94, 255))
    draw.text((85, 430), "• Municipal officers waste hours manually sorting", font=f_body, fill=(148, 163, 184, 255))
    draw.text((85, 458), "• Leads to alert fatigue and ignored complaints", font=f_body, fill=(148, 163, 184, 255))

    # Right: CivicPulse Duplicate Shield
    draw.rounded_rectangle([630, 50, 1140, 500], radius=16, fill=(30, 41, 59, 255), outline=(52, 211, 153, 200), width=2)
    draw.rounded_rectangle([655, 75, 885, 110], radius=8, fill=(52, 211, 153, 255))
    draw.text((675, 83), "CIVICPULSE INNOVATION", font=f_badge, fill=(15, 23, 42, 255))
    draw.text((655, 130), "The 'Duplicate Shield'", font=f_title, fill=(255, 255, 255, 255))

    # Clean unified master card
    draw.rounded_rectangle([655, 180, 1115, 365], radius=14, fill=(15, 23, 42, 255), outline=(56, 189, 248, 255), width=2)
    draw.text((680, 200), "1 MASTER TICKET CREATED", font=f_sub, fill=(56, 189, 248, 255))
    draw.text((680, 235), "GPS: Sector 14 Junction • Initial Report: 10:15 AM", font=f_body, fill=(148, 163, 184, 255))
    
    # +39 crowd upvotes pill
    draw.rounded_rectangle([680, 280, 1080, 340], radius=10, fill=(52, 211, 153, 30), outline=(52, 211, 153, 255), width=1)
    draw.text((700, 295), "+ 39 CITIZENS UPVOTED THIS ('I ALSO SEE THIS')", font=f_sub, fill=(52, 211, 153, 255))

    draw.text((655, 395), "Result: 75% Less Database Bloat + Surge Alert", font=f_sub, fill=(52, 211, 153, 255))
    draw.text((655, 430), "• Proactively prompts users within 50 meters to upvote", font=f_body, fill=(148, 163, 184, 255))
    draw.text((655, 458), "• Increases Cluster Velocity score while keeping data clean", font=f_body, fill=(148, 163, 184, 255))

    out = "/Users/apple/Downloads/Prototype/assets/duplicate_shield_graphic.png"
    img.save(out)
    print("Saved", out)

# -------------------------------------------------------------
# 4. WORKFLOW PIPELINE 4-STEP GRAPHIC (1200 x 360)
# -------------------------------------------------------------
def make_pipeline():
    w, h = 1200, 360
    img = Image.new("RGBA", (w, h), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    f_num = get_font(FONT_BLACK, 32)
    f_title = get_font(FONT_BOLD, 20)
    f_sub = get_font(FONT_REG, 15)

    steps = [
        ("1", "CAPTURE", "Auto EXIF GPS\nAI vision category\nVoice in Hindi/Eng", (52, 211, 153)),
        ("2", "AI TRIAGE", "EDPS 0-100 score\nSchool/hospital check\nExplainability card", (56, 189, 248)),
        ("3", "DISPATCH", "Ward auto-routing\nStrict SLA timer\nContractor queue", (245, 158, 11)),
        ("4", "PROOF-OF-FIX", "Geotagged after photo\nCV difference audit\nCitizen consensus", (129, 140, 248)),
    ]

    for i, (num, title, body, color) in enumerate(steps):
        x = 50 + i * 280
        # Card
        draw.rounded_rectangle([x, 30, x + 250, 330], radius=16, fill=(30, 41, 59, 255), outline=color, width=2)
        # Step Circle
        draw.ellipse([x + 25, 55, x + 85, 115], fill=color)
        draw.text((x + 42, 65), num, font=f_num, fill=(15, 23, 42, 255))
        # Title
        draw.text((x + 100, 75), title, font=f_title, fill=(255, 255, 255, 255))
        # Body
        draw.text((x + 25, 150), body, font=f_sub, fill=(148, 163, 184, 255))

    out = "/Users/apple/Downloads/Prototype/assets/pipeline_graphic.png"
    img.save(out)
    print("Saved", out)

if __name__ == "__main__":
    make_priority_dial()
    make_before_after()
    make_duplicate_shield()
    make_pipeline()
