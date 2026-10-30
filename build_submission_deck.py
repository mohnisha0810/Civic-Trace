import os
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = pptx.Presentation()
    # 16:9 Widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Modern High-Impact Color Palette
    BG_DARK = RGBColor(11, 15, 25)          # Deep Tech Navy/Black
    CARD_BG = RGBColor(22, 30, 49)          # Elevated Slate
    CARD_BORDER = RGBColor(45, 59, 87)      # Slate Border
    TEXT_WHITE = RGBColor(255, 255, 255)    # High contrast white
    TEXT_MUTED = RGBColor(160, 174, 192)    # Slate 300
    ACCENT_CYAN = RGBColor(56, 189, 248)    # Bright Sky/Cyan
    ACCENT_EMERALD = RGBColor(52, 211, 153) # Vibrant Green
    ACCENT_AMBER = RGBColor(251, 191, 36)   # Vibrant Warning
    ACCENT_INDIGO = RGBColor(129, 140, 248) # Violet/Indigo

    ASSETS_DIR = "/Users/apple/Downloads/Prototype/assets"

    def set_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_slide_header(slide, tag_text, title_text, subtitle_text="", tag_color=ACCENT_CYAN):
        # Tag Badge
        tag = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(3.4), Inches(0.38))
        tag.fill.solid()
        tag.fill.fore_color.rgb = RGBColor(24, 38, 62)
        tag.line.color.rgb = tag_color
        tag.line.width = Pt(1.5)
        tf = tag.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"● {tag_text.upper()}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = tag_color
        p.alignment = PP_ALIGN.CENTER

        # Main Title Box
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.82), Inches(11.73), Inches(0.9))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(30)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE

        if subtitle_text:
            p_sub = tf_t.add_paragraph()
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(14)
            p_sub.font.color.rgb = TEXT_MUTED
            p_sub.space_before = Pt(3)

    # =========================================================================
    # SLIDE 1: HERO COVER SLIDE (With 3D App Illustration)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_bg(slide1)

    tb1 = slide1.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(6.8), Inches(5.8))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    p_hack = tf1.paragraphs[0]
    p_hack.text = "HACKNOVATE 2026  •  PROBLEM STATEMENT 9"
    p_hack.font.size = Pt(13)
    p_hack.font.bold = True
    p_hack.font.color.rgb = ACCENT_CYAN
    p_hack.space_after = Pt(14)

    p_title = tf1.add_paragraph()
    p_title.text = "CivicPulse AI"
    p_title.font.size = Pt(52)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE
    p_title.space_after = Pt(8)

    p_sub = tf1.add_paragraph()
    p_sub.text = "Autonomous Civic Issue Intelligence & Transparent Resolution Protocol"
    p_sub.font.size = Pt(21)
    p_sub.font.bold = True
    p_sub.font.color.rgb = ACCENT_INDIGO
    p_sub.space_after = Pt(18)

    p_desc = tf1.add_paragraph()
    p_desc.text = "Solving the Civic Black Hole through Explainable AI Priority Scoring (EDPS), Duplicate Ticket Suppression, and Verifiable Before/After Proof-of-Fix."
    p_desc.font.size = Pt(16)
    p_desc.font.color.rgb = TEXT_MUTED
    p_desc.space_after = Pt(28)

    badges = [
        ("AI Dynamic Priority (EDPS)", ACCENT_CYAN),
        ("Duplicate Shield (+1 Upvotes)", ACCENT_EMERALD),
        ("Proof-of-Fix CV Verification", ACCENT_AMBER)
    ]
    for b_text, b_color in badges:
        bp = tf1.add_paragraph()
        bp.text = f"✔  {b_text}"
        bp.font.size = Pt(15)
        bp.font.bold = True
        bp.font.color.rgb = b_color
        bp.space_before = Pt(6)

    hero_img = os.path.join(ASSETS_DIR, "hero_illustration.jpg")
    if os.path.exists(hero_img):
        frame = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(0.9), Inches(4.7), Inches(5.7))
        frame.fill.solid()
        frame.fill.fore_color.rgb = CARD_BG
        frame.line.color.rgb = ACCENT_CYAN
        frame.line.width = Pt(2)
        slide1.shapes.add_picture(hero_img, Inches(7.9), Inches(1.0), width=Inches(4.5), height=Inches(5.5))

    # =========================================================================
    # SLIDE 2: THE SOLUTION AT A GLANCE (3 GIANT PILLARS)
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_bg(slide2)
    add_slide_header(slide2, "Our Proposed Solution", "CivicPulse: The 3 Pillars of Our Solution",
                     "A complete, closed-loop ecosystem bridging Citizens, AI Prioritization, and Municipal Field Teams.")

    pillars = [
        ("PILLAR 1: SMART REPORTING", "Frictionless Edge Capture", [
            ("Instant Geo-Tagging", "1-click photo automatically parses EXIF GPS metadata & reverse geocodes the exact street address."),
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

        ("PILLAR 3: VERIFIABLE TRUST", "Proof-of-Fix Protocol", [
            ("Before / After AI Audit", "Repair crews must upload an After photo at the exact GPS coordinates; CV verifies fix."),
            ("Community Consensus", "Original reporter & nearby citizens vote to confirm quality before ticket archives."),
            ("Public Milestone Tracker", "Full public visibility from Reported → Triaged → Dispatched → Verified."),
            ("Ward SLA Scorecards", "Live ward rankings holding municipal contractors accountable.")
        ], ACCENT_INDIGO)
    ]

    for i, (tag, title, points, color) in enumerate(pillars):
        left = 0.8 + i * 3.98
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(1.85), Inches(3.78), Inches(5.15))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = color
        card.line.width = Pt(1.5)

        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_right = ctf.margin_top = ctf.margin_bottom = Inches(0.25)

        p_tag = ctf.paragraphs[0]
        p_tag.text = tag
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = color
        p_tag.space_after = Pt(4)

        p_t = ctf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(20)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_after = Pt(14)

        for p_head, p_body in points:
            pp = ctf.add_paragraph()
            pp.text = f"• {p_head}: "
            pp.font.size = Pt(13.5)
            pp.font.bold = True
            pp.font.color.rgb = TEXT_WHITE
            run = pp.add_run()
            run.text = p_body
            run.font.bold = False
            run.font.color.rgb = TEXT_MUTED
            pp.space_before = Pt(8)

    # =========================================================================
    # SLIDE 3: HOW IT WORKS: THE 4-STEP PIPELINE
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_bg(slide3)
    add_slide_header(slide3, "System Workflow", "How It Works: 4 Transparent Steps to Resolution",
                     "From citizen smartphone to automated triage, field repair, and public verification.")

    pipe_img = os.path.join(ASSETS_DIR, "pipeline_graphic.png")
    if os.path.exists(pipe_img):
        slide3.shapes.add_picture(pipe_img, Inches(0.8), Inches(1.8), width=Inches(11.73), height=Inches(3.2))

    step_details = [
        ("Step 1: Smart Capture", "Citizen snaps photo. GPS coordinates, timestamp, and AI hazard bounding box are locked instantly.", ACCENT_EMERALD),
        ("Step 2: AI Triage (EDPS)", "Calculates dynamic 0–100 priority score factoring in depth, hospital proximity, and crowd upvotes.", ACCENT_CYAN),
        ("Step 3: Ward Dispatch", "Auto-routed to the specific Ward Department (PWD/Sanitation) with a strict SLA countdown timer.", ACCENT_AMBER),
        ("Step 4: Proof-of-Fix", "Contractor uploads geotagged after-photo. AI diff checks repair, and citizens cast a verification vote.", ACCENT_INDIGO),
    ]

    for i, (s_title, s_desc, s_color) in enumerate(step_details):
        left = 0.8 + i * 2.98
        box = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(5.2), Inches(2.78), Inches(1.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER
        box.line.width = Pt(1)

        btf = box.text_frame
        btf.word_wrap = True
        btf.margin_left = btf.margin_right = btf.margin_top = btf.margin_bottom = Inches(0.18)

        bp1 = btf.paragraphs[0]
        bp1.text = s_title
        bp1.font.size = Pt(14)
        bp1.font.bold = True
        bp1.font.color.rgb = s_color
        bp1.space_after = Pt(4)

        bp2 = btf.add_paragraph()
        bp2.text = s_desc
        bp2.font.size = Pt(12)
        bp2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 4: THE CORE CHALLENGE: EDPS ENGINE
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_bg(slide4)
    add_slide_header(slide4, "The Algorithmic Core", "Explainable Dynamic Priority Scoring (EDPS Engine)",
                     "Directly tackling the hackathon challenge: genuine mathematical prioritization with transparent reasoning.")

    dial_img = os.path.join(ASSETS_DIR, "priority_dial.png")
    if os.path.exists(dial_img):
        slide4.shapes.add_picture(dial_img, Inches(0.8), Inches(1.85), width=Inches(11.73), height=Inches(4.5))

    form_box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.45), Inches(11.73), Inches(0.65))
    form_box.fill.solid()
    form_box.fill.fore_color.rgb = RGBColor(14, 116, 144)
    form_box.line.fill.background()
    ftf = form_box.text_frame
    fp = ftf.paragraphs[0]
    fp.text = "THE FORMULA:  Priority = min( 100,  0.30·Sv [Hazard] + 0.25·Zw [Zone] + 0.20·Cv [Velocity] + 0.15·Eq [Equity] + 0.10·Te [SLA] )"
    fp.font.size = Pt(12.5)
    fp.font.bold = True
    fp.font.color.rgb = TEXT_WHITE
    fp.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 5: INNOVATION #2: THE "DUPLICATE SHIELD"
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_bg(slide5)
    add_slide_header(slide5, "Municipal Efficiency", "The 'Duplicate Shield': Eliminating Alert Fatigue",
                     "How CivicPulse solves the avalanche of redundant complaints that paralyze city engineers.")

    dup_img = os.path.join(ASSETS_DIR, "duplicate_shield_graphic.png")
    if os.path.exists(dup_img):
        slide5.shapes.add_picture(dup_img, Inches(0.8), Inches(1.85), width=Inches(11.73), height=Inches(4.6))

    stat_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.55), Inches(11.73), Inches(0.55))
    stat_box.fill.solid()
    stat_box.fill.fore_color.rgb = RGBColor(16, 75, 45)
    stat_box.line.fill.background()
    stf = stat_box.text_frame
    sp = stf.paragraphs[0]
    sp.text = "IMPACT: 75% Reduction in Database Bloat  •  Zero Alert Fatigue  •  Instant Emergency Surge Detection"
    sp.font.size = Pt(13)
    sp.font.bold = True
    sp.font.color.rgb = ACCENT_EMERALD
    sp.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 6: INNOVATION #3: "PROOF-OF-FIX" PROTOCOL
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_bg(slide6)
    add_slide_header(slide6, "Public Accountability", "The 'Proof-of-Fix' Protocol: Verifiable Closures",
                     "Restoring citizen trust through Computer Vision Before/After verification and community consensus.")

    ba_img = os.path.join(ASSETS_DIR, "before_after_proof.png")
    if os.path.exists(ba_img):
        slide6.shapes.add_picture(ba_img, Inches(0.8), Inches(1.85), width=Inches(11.73), height=Inches(4.6))

    trust_box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.55), Inches(11.73), Inches(0.55))
    trust_box.fill.solid()
    trust_box.fill.fore_color.rgb = RGBColor(49, 46, 129)
    trust_box.line.fill.background()
    ttf = trust_box.text_frame
    tp = ttf.paragraphs[0]
    tp.text = "CLOSING THE LOOP: Geotagged Photo Lock  •  AI Computer Vision Difference Analysis  •  24-Hour Community Consensus Gate"
    tp.font.size = Pt(12.5)
    tp.font.bold = True
    tp.font.color.rgb = ACCENT_INDIGO
    tp.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 7: TWO-SIDED PLATFORM: TRACKER & COMMAND CENTER
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_bg(slide7)
    add_slide_header(slide7, "Two-Sided Platform", "Public Resolution Tracker & Municipal Command Center",
                     "Empowering both citizens and city administration through real-time geospatial intelligence.")

    # Left: Citizen Public Tracker
    card_l = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.85), Inches(5.75), Inches(5.15))
    card_l.fill.solid()
    card_l.fill.fore_color.rgb = CARD_BG
    card_l.line.color.rgb = ACCENT_CYAN
    card_l.line.width = Pt(1.5)

    ltf = card_l.text_frame
    ltf.word_wrap = True
    ltf.margin_left = ltf.margin_right = ltf.margin_top = ltf.margin_bottom = Inches(0.28)

    lp1 = ltf.paragraphs[0]
    lp1.text = "FOR CITIZENS: PUBLIC RESOLUTION TRACKER"
    lp1.font.size = Pt(12)
    lp1.font.bold = True
    lp1.font.color.rgb = ACCENT_CYAN
    lp1.space_after = Pt(8)

    lp2 = ltf.add_paragraph()
    lp2.text = "100% Transparent Civic Governance"
    lp2.font.size = Pt(22)
    lp2.font.bold = True
    lp2.font.color.rgb = TEXT_WHITE
    lp2.space_after = Pt(14)

    items_l = [
        ("Live 5-Stage Journey", "Real-time tracking: Submitted → AI Triaged → Dispatched → Repaired → Verified."),
        ("Interactive GIS City Map", "Search any neighborhood or ward to see active, in-progress, and resolved repairs."),
        ("Explainability Cards", "Every ticket displays the exact reason for its assigned priority score."),
        ("Community Voice", "Vote on the quality of completed repairs directly from your phone.")
    ]
    for h, b in items_l:
        p = ltf.add_paragraph()
        p.text = f"• {h}: "
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(8)

    # Right: Municipal Command Center
    card_r = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.78), Inches(1.85), Inches(5.75), Inches(5.15))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = CARD_BG
    card_r.line.color.rgb = ACCENT_AMBER
    card_r.line.width = Pt(1.5)

    rtf = card_r.text_frame
    rtf.word_wrap = True
    rtf.margin_left = rtf.margin_right = rtf.margin_top = rtf.margin_bottom = Inches(0.28)

    rp1 = rtf.paragraphs[0]
    rp1.text = "FOR CITY OFFICIALS: COMMAND CENTER"
    rp1.font.size = Pt(12)
    rp1.font.bold = True
    rp1.font.color.rgb = ACCENT_AMBER
    rp1.space_after = Pt(8)

    rp2 = rtf.add_paragraph()
    rp2.text = "Data-Driven Municipal Operations"
    rp2.font.size = Pt(22)
    rp2.font.bold = True
    rp2.font.color.rgb = TEXT_WHITE
    rp2.space_after = Pt(14)

    items_r = [
        ("Geospatial Hotspot Heatmap", "Pinpoints civic failure density across urban sectors in real time."),
        ("Automated SLA Countdown", "Critical tickets trigger strict 24-hour clocks with auto-escalation to commissioners."),
        ("Work-Order Routing", "Automatically dispatches tickets to specific ward departments (PWD, Electricity, Sanitation)."),
        ("Ward Performance Leaderboard", "Ranks contractors and ward officers by fix speed, quality, and citizen satisfaction.")
    ]
    for h, b in items_r:
        p = rtf.add_paragraph()
        p.text = f"• {h}: "
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(8)

    # =========================================================================
    # SLIDE 8: THANK YOU SLIDE
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_bg(slide8)

    center_card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.0), Inches(10.33), Inches(5.5))
    center_card.fill.solid()
    center_card.fill.fore_color.rgb = CARD_BG
    center_card.line.color.rgb = ACCENT_CYAN
    center_card.line.width = Pt(2)

    ctf = center_card.text_frame
    ctf.word_wrap = True
    ctf.margin_left = Inches(0.5)
    ctf.margin_right = Inches(0.5)
    ctf.margin_top = Inches(0.7)

    p_badge = ctf.paragraphs[0]
    p_badge.text = "HACKNOVATE 2026  •  PROBLEM STATEMENT 9"
    p_badge.font.size = Pt(13)
    p_badge.font.bold = True
    p_badge.font.color.rgb = ACCENT_CYAN
    p_badge.alignment = PP_ALIGN.CENTER
    p_badge.space_after = Pt(16)

    p_ty = ctf.add_paragraph()
    p_ty.text = "Thank You!"
    p_ty.font.size = Pt(64)
    p_ty.font.bold = True
    p_ty.font.color.rgb = TEXT_WHITE
    p_ty.alignment = PP_ALIGN.CENTER
    p_ty.space_after = Pt(12)

    p_subt = ctf.add_paragraph()
    p_subt.text = "CivicPulse AI: Turning Civic Frustration into Prioritized, Transparent Civic Action."
    p_subt.font.size = Pt(20)
    p_subt.font.bold = True
    p_subt.font.color.rgb = ACCENT_INDIGO
    p_subt.alignment = PP_ALIGN.CENTER
    p_subt.space_after = Pt(24)

    p_qa = ctf.add_paragraph()
    p_qa.text = "We are open for Questions & Feedback."
    p_qa.font.size = Pt(18)
    p_qa.font.bold = True
    p_qa.font.color.rgb = ACCENT_EMERALD
    p_qa.alignment = PP_ALIGN.CENTER
    p_qa.space_after = Pt(28)

    p_meta = ctf.add_paragraph()
    p_meta.text = "AI Explainable Dynamic Priority Scoring  •  Duplicate Shield  •  Verifiable Proof-of-Fix Protocol"
    p_meta.font.size = Pt(14)
    p_meta.font.color.rgb = TEXT_MUTED
    p_meta.alignment = PP_ALIGN.CENTER

    out_file = "/Users/apple/Downloads/Prototype/CivicPulse_Solution_Pitch.pptx"
    prs.save(out_file)
    print(f"Presentation successfully updated and saved to: {out_file}")

if __name__ == "__main__":
    build_presentation()
