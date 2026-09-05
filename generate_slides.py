import os
import glob
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

os.makedirs("video_build/slides", exist_ok=True)
os.makedirs("video_build/clips", exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"

def get_font(bold=False, size=24):
    path = FONT_BOLD if bold else FONT_REG
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

NAVY = (7, 38, 84)
CARD_BG = (11, 48, 102)
BLUE = (51, 149, 255)
LIGHT_BLUE = (117, 163, 255)
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (200, 215, 240)
GREEN = (46, 204, 113)
RED = (231, 76, 60)
AMBER = (243, 156, 18)

def draw_header(draw, title, subtitle, badge_text, time_text, slide_num, total_slides=7):
    # Top navbar
    draw.rectangle([(0, 0), (1920, 110)], fill=(8, 40, 90))
    draw.line([(0, 110), (1920, 110)], fill=BLUE, width=2)
    
    # Razorpay Glyph Logo
    draw.rounded_rectangle([(50, 25), (110, 85)], radius=12, fill=BLUE)
    draw.text((68, 30), "₹", fill=TEXT_WHITE, font=get_font(bold=True, size=40))
    
    # Header Titles
    draw.text((130, 26), "Razorpay AI Revenue Recovery Command Center", fill=TEXT_WHITE, font=get_font(bold=True, size=28))
    draw.text((130, 64), "Autonomous Payment Dunning & Merchant Revenue Protection", fill=LIGHT_BLUE, font=get_font(size=18))
    
    # Badge
    draw.rounded_rectangle([(1370, 32), (1660, 78)], radius=8, fill=(15, 60, 130), outline=BLUE, width=1)
    draw.text((1390, 43), badge_text, fill=TEXT_WHITE, font=get_font(bold=True, size=16))
    
    # Timecode
    draw.rounded_rectangle([(1690, 32), (1870, 78)], radius=8, fill=(4, 25, 56), outline=LIGHT_BLUE, width=1)
    draw.text((1705, 43), time_text, fill=LIGHT_BLUE, font=get_font(bold=True, size=18))
    
    # Slide Title Banner
    draw.text((60, 140), title, fill=TEXT_WHITE, font=get_font(bold=True, size=40))
    draw.text((60, 195), subtitle, fill=LIGHT_BLUE, font=get_font(size=22))
    
    # Footer
    draw.rectangle([(0, 1020), (1920, 1080)], fill=(5, 30, 68))
    draw.line([(0, 1020), (1920, 1020)], fill=(20, 60, 120), width=1)
    draw.text((60, 1038), "Razorpay Buildathon Showcase • Autonomous Agent Track", fill=TEXT_MUTED, font=get_font(size=16))
    draw.text((1650, 1038), f"Slide {slide_num} of {total_slides}", fill=TEXT_WHITE, font=get_font(bold=True, size=16))
    
    prog_w = int((slide_num / total_slides) * 1920)
    draw.rectangle([(0, 1074), (prog_w, 1080)], fill=BLUE)

def draw_card(draw, box, title, title_color=TEXT_WHITE, bg=CARD_BG, border=BLUE):
    draw.rounded_rectangle(box, radius=14, fill=bg, outline=border, width=2)
    draw.text((box[0] + 25, box[1] + 20), title, fill=title_color, font=get_font(bold=True, size=24))

# ==================== SLIDE 1 ====================
def render_slide_1():
    im = Image.new("RGB", (1920, 1080), NAVY)
    draw = ImageDraw.Draw(im)
    draw_header(draw, "The Revenue Leakage Problem", 
                "Every merchant loses up to 15% of ARR to disjointed transaction failures", 
                "ACT I: THE PROBLEM", "⏱️ 0:00 - 0:47", 1)
    
    cards = [
        ("1. Subscription Mandates", RED, 
         ["• Mandates fail on month-end balance depletion (NSF)", 
          "• Cards expire unnoticed; silent churn increases", 
          "• Static 24-hr retries hit empty accounts repeatedly"]),
        ("2. Checkout Drop-offs", AMBER, 
         ["• Auth friction: OTP timeouts and bank redirects", 
          "• Price hesitation on high-ticket retail carts", 
          "• Abandoned shoppers leave without an easy re-entry link"]),
        ("3. B2B Receivables", BLUE, 
         ["• Invoices sit idle in Accounts Payable queues", 
          "• Manual follow-up is expensive and uncoordinated", 
          "• Lack of structured promise-to-pay tracking"]),
        ("4. Gateway Compliance Risks", (180, 100, 255), 
         ["• Blind retries on stolen/blocked cards trigger bank fines", 
          "• Threatens merchant gateway terminal standing", 
          "• Need intelligent stopping rules to halt fraud retries"])
    ]
    
    for i, (ctitle, ccolor, bullets) in enumerate(cards):
        col = i % 2
        row = i // 2
        x1 = 60 + col * 910
        y1 = 250 + row * 360
        x2 = x1 + 880
        y2 = y1 + 330
        
        draw.rounded_rectangle([(x1, y1), (x2, y2)], radius=14, fill=CARD_BG, outline=ccolor, width=2)
        draw.rounded_rectangle([(x1 + 25, y1 + 25), (x1 + 70, y1 + 70)], radius=8, fill=ccolor)
        draw.text((x1 + 40, y1 + 32), str(i + 1), fill=TEXT_WHITE, font=get_font(bold=True, size=28))
        draw.text((x1 + 90, y1 + 35), ctitle, fill=TEXT_WHITE, font=get_font(bold=True, size=26))
        
        for b_idx, b in enumerate(bullets):
            draw.text((x1 + 35, y1 + 105 + b_idx * 55), b, fill=TEXT_MUTED, font=get_font(size=20))
            
    im.save("video_build/slides/slide_1.png")

# ==================== SLIDE 2 ====================
def render_slide_2():
    im = Image.new("RGB", (1920, 1080), NAVY)
    draw = ImageDraw.Draw(im)
    draw_header(draw, "System Architecture: Autonomous Closed Loop", 
                "Separation of AI diagnostic intelligence from strict policy guardrails", 
                "ACT II: ARCHITECTURE", "⏱️ 0:47 - 1:36", 2)
    
    pillars = [
        ("AI Diagnoser", (51, 149, 255), [
            "Powered by Gemini-Flash-Latest",
            "• Maps raw bank decline codes to root causes",
            "• Calculates risk scores from 0.0 to 1.0",
            "• Synthesizes human-readable audit narratives",
            "• Safe offline rule fallback with 0 crash risk"
        ]),
        ("4 Bounded Playbooks", (117, 163, 255), [
            "Context-Aware Intervention Engines",
            "1. WhatsApp Hinglish: 1-click recovery nudges",
            "2. Mandate Retry Sequencer: Salary-cycle timing",
            "3. Checkout Discounting: Margin-safe coupons",
            "4. B2B Receivables Chaser: 3-tier tone escalation"
        ]),
        ("Policy & Stopping Rules", (46, 204, 113), [
            "Merchant Gateway Protection",
            "• Security Halt: 0.95 fraud flags kill retries",
            "• Max 3 Escalations: Caps customer outreach",
            "• Promise-to-Pay: Freezes cron during grace",
            "• Full Unit Economics Ledger (MDR + Fees)"
        ])
    ]
    
    for i, (ptitle, pcolor, lines) in enumerate(pillars):
        x1 = 60 + i * 610
        y1 = 250
        x2 = x1 + 580
        y2 = y1 + 720
        
        draw.rounded_rectangle([(x1, y1), (x2, y2)], radius=14, fill=CARD_BG, outline=pcolor, width=2)
        draw.rounded_rectangle([(x1, y1), (x2, y1 + 80)], radius=14, fill=(15, 55, 120))
        draw.text((x1 + 30, y1 + 25), ptitle, fill=TEXT_WHITE, font=get_font(bold=True, size=26))
        
        for l_idx, line in enumerate(lines):
            color = TEXT_WHITE if l_idx == 0 else TEXT_MUTED
            bold = True if l_idx == 0 else False
            draw.text((x1 + 25, y1 + 110 + l_idx * 55), line, fill=color, font=get_font(bold=bold, size=20))
            
    im.save("video_build/slides/slide_2.png")

# ==================== SLIDE 3 ====================
def render_slide_3():
    im = Image.new("RGB", (1920, 1080), NAVY)
    draw = ImageDraw.Draw(im)
    draw_header(draw, "Live Playbooks: Hinglish WhatsApp & B2B Invoices", 
                "Personalized omnichannel recovery with voice narration and dunning pauses", 
                "ACT III: PLAYBOOKS PT. 1", "⏱️ 1:36 - 2:33", 3)
    
    # Left Card: Aarav Mehta
    draw.rounded_rectangle([(60, 250), (940, 970)], radius=14, fill=CARD_BG, outline=GREEN, width=2)
    draw.text((95, 280), "Case 1: Aarav Mehta • RECOVERED", fill=GREEN, font=get_font(bold=True, size=26))
    draw.text((95, 325), "Cart Checkout: ₹2,499.00  |  Failure: PIN / OTP Timeout", fill=TEXT_MUTED, font=get_font(size=18))
    
    # Mock WhatsApp Message Bubble
    draw.rounded_rectangle([(95, 380), (905, 620)], radius=12, fill=(10, 80, 60), outline=(37, 211, 102), width=2)
    draw.text((120, 405), "WhatsApp Business • Razorpay PayNudge", fill=(37, 211, 102), font=get_font(bold=True, size=18))
    wa_msg = [
        "Hey Aarav! 👋 Aapka payment of ₹2,499 for Shopping Cart Items",
        "complete nahi ho paya due to OTP timeout.",
        "",
        "No worries! Aap is 1-click link se securely complete kar sakte hain:",
        "🔗 https://rzp.io/l/recov_xyz  • Strictly Secured by Razorpay",
        "Sab set ho jayega! Team Razorpay."
    ]
    for m_idx, ml in enumerate(wa_msg):
        draw.text((120, 445 + m_idx * 28), ml, fill=TEXT_WHITE, font=get_font(size=17))
        
    draw.text((95, 660), "🔊 Web Speech Voice Synthesizer", fill=LIGHT_BLUE, font=get_font(bold=True, size=20))
    draw.text((95, 695), "• Browser native SpeechSynthesisUtterance in Indian-accented English/Hindi", fill=TEXT_MUTED, font=get_font(size=18))
    draw.text((95, 735), "• Enables interactive audio accessibility on recovery links", fill=TEXT_MUTED, font=get_font(size=18))
    draw.text((95, 775), "• Result: Aarav clicked & completed checkout -> ₹2,499 RECOVERED", fill=GREEN, font=get_font(bold=True, size=18))

    # Right Card: Acme Corp
    draw.rounded_rectangle([(980, 250), (1860, 970)], radius=14, fill=CARD_BG, outline=BLUE, width=2)
    draw.text((1015, 280), "Case 2: Acme Corp Finance • PROMISE HONORED", fill=LIGHT_BLUE, font=get_font(bold=True, size=26))
    draw.text((1015, 325), "B2B Invoice #INV-2026-8842: ₹1,25,000.00  |  Net-30 Due", fill=TEXT_MUTED, font=get_font(size=18))
    
    steps = [
        ("Level 1: Friendly Reminder", "Dispatched polite dunning reminder to Accounts Payable"),
        ("Promise-to-Pay Registered", "Buyer promised payment on 15th -> Dunning paused immediately!"),
        ("Grace Period Observed", "Engine froze reminders to preserve high-value client relationship"),
        ("Invoice Settled in Full", "Payment received on promise date -> ₹1,25,000.00 RECOVERED")
    ]
    for s_idx, (stitle, sdesc) in enumerate(steps):
        sy = 390 + s_idx * 135
        draw.rounded_rectangle([(1015, sy), (1825, sy + 110)], radius=10, fill=(15, 55, 120), outline=BLUE, width=1)
        draw.text((1040, sy + 18), stitle, fill=TEXT_WHITE, font=get_font(bold=True, size=20))
        draw.text((1040, sy + 58), sdesc, fill=TEXT_MUTED, font=get_font(size=17))
        
    im.save("video_build/slides/slide_3.png")

# ==================== SLIDE 4 ====================
def render_slide_4():
    im = Image.new("RGB", (1920, 1080), NAVY)
    draw = ImageDraw.Draw(im)
    draw_header(draw, "Live Playbooks: Payroll Timing & Margin Vouchers", 
                "Aligning card retries with liquidity & protecting merchant profit margins", 
                "ACT III: PLAYBOOKS PT. 2", "⏱️ 2:33 - 3:22", 4)
    
    # Left: Salary date lift
    draw.rounded_rectangle([(60, 250), (940, 970)], radius=14, fill=CARD_BG, outline=BLUE, width=2)
    draw.text((95, 280), "Mandate Retry Sequencer", fill=TEXT_WHITE, font=get_font(bold=True, size=26))
    draw.text((95, 325), "Subscription Insufficient Funds (NSF) Retry Timing", fill=LIGHT_BLUE, font=get_font(size=18))
    
    # Chart comparison
    draw.rectangle([(130, 400), (450, 750)], fill=(20, 60, 130), outline=BLUE, width=1)
    draw.text((150, 420), "Standard Days", fill=TEXT_WHITE, font=get_font(bold=True, size=20))
    draw.text((150, 460), "12% Recovery", fill=AMBER, font=get_font(bold=True, size=32))
    draw.text((150, 520), "Mid-month retries hit", fill=TEXT_MUTED, font=get_font(size=17))
    draw.text((150, 550), "depleted debit balances", fill=TEXT_MUTED, font=get_font(size=17))
    draw.text((150, 580), "and high failure rates.", fill=TEXT_MUTED, font=get_font(size=17))
    
    draw.rectangle([(510, 400), (870, 750)], fill=(10, 80, 60), outline=GREEN, width=2)
    draw.text((530, 420), "Salary Payout Dates", fill=TEXT_WHITE, font=get_font(bold=True, size=20))
    draw.text((530, 460), "65% Recovery!", fill=GREEN, font=get_font(bold=True, size=32))
    draw.text((530, 520), "Evaluates calendar day:", fill=TEXT_MUTED, font=get_font(size=17))
    draw.text((530, 550), "Days [1, 2, 3, 30, 31]", fill=TEXT_WHITE, font=get_font(bold=True, size=18))
    draw.text((530, 580), "Liquid accounts clear debits", fill=TEXT_MUTED, font=get_font(size=17))
    draw.text((530, 610), "with 5.4x higher success!", fill=GREEN, font=get_font(bold=True, size=17))
    
    draw.text((95, 800), "• Automatically delays debit retry until salary window", fill=TEXT_MUTED, font=get_font(size=19))
    draw.text((95, 845), "• Silent routing via backup payment gateway switches", fill=TEXT_MUTED, font=get_font(size=19))
    draw.text((95, 890), "• Saves recurring subscribers without annoying SMS spam", fill=GREEN, font=get_font(bold=True, size=19))

    # Right: Margin-Aware Vouchers
    draw.rounded_rectangle([(980, 250), (1860, 970)], radius=14, fill=CARD_BG, outline=AMBER, width=2)
    draw.text((1015, 280), "Margin-Aware Checkout Discounting", fill=TEXT_WHITE, font=get_font(bold=True, size=26))
    draw.text((1015, 325), "Cart Abandonment Dynamic Recovery Coupons", fill=AMBER, font=get_font(size=18))
    
    discounts = [
        ("SAVE150 (₹150 Off)", "Cart < ₹5,000", "Entry-level incentive for impulse shopping carts"),
        ("SAVE500 (₹500 Off)", "Cart ₹5,000 - ₹15,000", "Mid-tier basket size incentive (~10% cap)"),
        ("SAVE1500 (₹1,500 Off)", "Cart > ₹15,000", "High-ticket checkout conversion push")
    ]
    for d_idx, (dcode, dcart, ddesc) in enumerate(discounts):
        dy = 400 + d_idx * 130
        draw.rounded_rectangle([(1015, dy), (1825, dy + 105)], radius=10, fill=(20, 60, 130), outline=AMBER, width=1)
        draw.text((1040, dy + 18), dcode, fill=AMBER, font=get_font(bold=True, size=22))
        draw.text((1400, dy + 20), dcart, fill=TEXT_WHITE, font=get_font(bold=True, size=18))
        draw.text((1040, dy + 60), ddesc, fill=TEXT_MUTED, font=get_font(size=17))
        
    draw.text((1015, 820), "🔒 Margin Guard: Vouchers strictly capped at ~10% order margin", fill=TEXT_WHITE, font=get_font(bold=True, size=19))
    draw.text((1015, 865), "🔒 Zero Stacking: One voucher per customer; deducted from P&L", fill=TEXT_MUTED, font=get_font(size=19))
    draw.text((1015, 910), "🔒 Recovers up to 45% of abandoned carts with positive margin", fill=GREEN, font=get_font(bold=True, size=19))

    im.save("video_build/slides/slide_4.png")

# ==================== SLIDE 5 ====================
def render_slide_5():
    im = Image.new("RGB", (1920, 1080), NAVY)
    draw = ImageDraw.Draw(im)
    draw_header(draw, "Policy Guardrails: Knowing When NOT to Outreach", 
                "Enforcing hard stopping rules to protect merchant standing and compliance", 
                "ACT IV: STOPPING RULES", "⏱️ 3:22 - 4:08", 5)
    
    # Left: Vijay Mallya Fraud Halt
    draw.rounded_rectangle([(60, 250), (940, 970)], radius=14, fill=CARD_BG, outline=RED, width=2)
    draw.text((95, 280), "Case 3: Vijay Mallya • HARD DECLINE HALT", fill=RED, font=get_font(bold=True, size=26))
    draw.text((95, 325), "Transaction: ₹85,000.00  |  Code: suspected_fraud", fill=TEXT_MUTED, font=get_font(size=18))
    
    draw.rounded_rectangle([(95, 380), (905, 540)], radius=12, fill=(80, 20, 20), outline=RED, width=2)
    draw.text((125, 410), "🚨 CRITICAL SECURITY RISK DETECTED", fill=TEXT_WHITE, font=get_font(bold=True, size=22))
    draw.text((125, 455), "AI Diagnoser Risk Score: 0.95 (95% Fraud Probability)", fill=AMBER, font=get_font(bold=True, size=20))
    draw.text((125, 495), "Playbook Assigned: hard_decline_halt", fill=TEXT_WHITE, font=get_font(size=18))
    
    fraud_bullets = [
        "• ZERO automated messages dispatched to user",
        "• ZERO gateway retry requests sent to card networks",
        "• Quarantined immediately for merchant risk review",
        "• 0% recovery rate by design — protects gateway MID rating",
        "• Shields merchant against chargeback fees and bank penalties"
    ]
    for fb_idx, fb in enumerate(fraud_bullets):
        draw.text((95, 590 + fb_idx * 60), fb, fill=TEXT_MUTED, font=get_font(size=20))
        
    # Right: Stopping Rules
    draw.rounded_rectangle([(980, 250), (1860, 970)], radius=14, fill=CARD_BG, outline=BLUE, width=2)
    draw.text((1015, 280), "Deterministic Policy Stopping Rules", fill=TEXT_WHITE, font=get_font(bold=True, size=26))
    draw.text((1015, 325), "Built into engine.py to prevent runaway dunning loops", fill=LIGHT_BLUE, font=get_font(size=18))
    
    rules = [
        ("Max 3 Escalations Cap", "Outreach is strictly halted after 3 failed interventions (58 cases halted in 200 batch). Prevents spam abuse and respects implicit customer opt-outs."),
        ("Promise-to-Pay Suppression", "Freezes dunning clock while a promise date is active. No automated harassment during approved credit grace periods."),
        ("Gateway Health Monitoring", "Halts retries when acquiring bank error rates exceed compliance thresholds to avoid terminal suspension."),
        ("Full Audit Trail", "Every stop, retry, and intervention is permanently logged to database audit ledger with timestamp and actor tags.")
    ]
    for r_idx, (rtitle, rdesc) in enumerate(rules):
        ry = 390 + r_idx * 135
        draw.rounded_rectangle([(1015, ry), (1825, ry + 115)], radius=10, fill=(15, 55, 120), outline=BLUE, width=1)
        draw.text((1040, ry + 18), rtitle, fill=TEXT_WHITE, font=get_font(bold=True, size=21))
        draw.text((1040, ry + 56), rdesc, fill=TEXT_MUTED, font=get_font(size=17))
        
    im.save("video_build/slides/slide_5.png")

# ==================== SLIDE 6 ====================
def render_slide_6():
    im = Image.new("RGB", (1920, 1080), NAVY)
    draw = ImageDraw.Draw(im)
    draw_header(draw, "Grounded Unit Economics & 43.1x Net ROI", 
                "Official locked 203-case batch results with complete P&L itemization", 
                "ACT V: FINANCIAL METRICS", "⏱️ 4:08 - 5:07", 6)
    
    # 3 Big Highlight KPI Cards
    kpis = [
        ("Total Ingested (At Risk)", "₹1,17,37,243", "₹1.17 Crore across 203 cases", BLUE),
        ("Total Net Recovered", "₹83,85,424", "71.44% Success Rate (145 cases)", GREEN),
        ("Net Return on Investment", "43.1x ROI", "4,212.66% Return on Spend", AMBER)
    ]
    for k_idx, (ktitle, kval, ksub, kcolor) in enumerate(kpis):
        kx1 = 60 + k_idx * 610
        ky1 = 250
        kx2 = kx1 + 580
        ky2 = ky1 + 220
        draw.rounded_rectangle([(kx1, ky1), (kx2, ky2)], radius=14, fill=CARD_BG, outline=kcolor, width=2)
        draw.text((kx1 + 30, ky1 + 25), ktitle, fill=TEXT_MUTED, font=get_font(size=20))
        draw.text((kx1 + 30, ky1 + 65), kval, fill=kcolor, font=get_font(bold=True, size=48))
        draw.text((kx1 + 30, ky1 + 145), ksub, fill=TEXT_WHITE, font=get_font(bold=True, size=20))

    # Bottom Cost Table
    draw.rounded_rectangle([(60, 510), (1860, 970)], radius=14, fill=CARD_BG, outline=BLUE, width=2)
    draw.text((95, 540), "Itemized Grounded Recovery Cost Breakdown (Total: ₹1,94,437.53)", fill=TEXT_WHITE, font=get_font(bold=True, size=24))
    draw.line([(95, 585), (1825, 585)], fill=(30, 80, 160), width=1)
    
    cost_items = [
        ("Direct Messaging & Retries", "₹684.05", "WhatsApp (₹2.00/send) + SMS (₹0.25/send) + Email (₹0.10) + Retries (₹5.00)"),
        ("AI Token Infrastructure Fee", "₹3,045.00", "Flat ₹15.00 per case LLM token inference cost across all 203 cases"),
        ("Marketing Discount Coupons Redeemed", "₹23,000.00", "Margin-safe checkout vouchers redeemed by recovered customers"),
        ("Gateway MDR Settlement Fee (2.0%)", "₹1,67,708.48", "Standard 2.0% merchant gateway transaction fee charged on ₹83.85L recovered volume"),
        ("Total Grounded Recovery Expense", "₹1,94,437.53", "Comprehensive operational cost deducted before computing Net ROI multiplier")
    ]
    for ci_idx, (cname, camt, cdetail) in enumerate(cost_items):
        cy = 610 + ci_idx * 68
        cbold = True if ci_idx == 4 else False
        ccolor = AMBER if ci_idx == 4 else TEXT_WHITE
        draw.text((95, cy), cname, fill=ccolor, font=get_font(bold=cbold, size=20))
        draw.text((650, cy), camt, fill=GREEN if ci_idx != 4 else AMBER, font=get_font(bold=True, size=22))
        draw.text((880, cy + 2), cdetail, fill=TEXT_MUTED, font=get_font(size=17))
        
    im.save("video_build/slides/slide_6.png")

# ==================== SLIDE 7 ====================
def render_slide_7():
    im = Image.new("RGB", (1920, 1080), NAVY)
    draw = ImageDraw.Draw(im)
    draw_header(draw, "Summary: Turning Payment Leakage into Profit", 
                "Delivering autonomous revenue recovery directly inside the Razorpay gateway", 
                "CONCLUSION", "⏱️ 5:07 - 5:24", 7)
    
    draw.rounded_rectangle([(60, 250), (1860, 850)], radius=14, fill=CARD_BG, outline=BLUE, width=2)
    
    points = [
        ("✅ Autonomous Closed-Loop Architecture", "From failure detection and root-cause diagnosis to targeted omnichannel execution."),
        ("✅ Localized & Context-Aware Interventions", "Hinglish WhatsApp nudges, salary-window mandate retries, and margin-safe discount coupons."),
        ("✅ Ironclad Merchant Stopping Rules", "Hard fraud halts, max 3-retry caps, and promise-to-pay grace period suppression."),
        ("✅ Grounded, Verified Payments Economics", "43.1x Net ROI (4,212.66%) after factoring in carrier fees, tokens, coupons, and 2.0% gateway MDR.")
    ]
    for p_idx, (pt, pd) in enumerate(points):
        py = 310 + p_idx * 125
        draw.text((120, py), pt, fill=GREEN, font=get_font(bold=True, size=26))
        draw.text((120, py + 45), pd, fill=TEXT_WHITE, font=get_font(size=22))
        
    # Big Thank you banner
    draw.rounded_rectangle([(60, 880), (1860, 970)], radius=14, fill=(15, 60, 130), outline=BLUE, width=1)
    draw.text((680, 905), "Thank You • Built for Razorpay Merchants", fill=TEXT_WHITE, font=get_font(bold=True, size=28))
    
    im.save("video_build/slides/slide_7.png")

# Execute all renders
print("Rendering slides...")
render_slide_1()
render_slide_2()
render_slide_3()
render_slide_4()
render_slide_5()
render_slide_6()
render_slide_7()
print("All 7 slides rendered successfully!")
