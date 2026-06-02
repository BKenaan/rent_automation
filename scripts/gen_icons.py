"""
Generate all RentalMan app icon / splash / favicon assets.
Draws the house-with-keyhole mark in the app's violet brand color.
Run: python scripts/gen_icons.py
"""
import os
from PIL import Image, ImageDraw

# ── Brand ─────────────────────────────────────────────────────────────────────
NAVY       = (27, 43, 78)     # #1B2B4E  logo background
VIOLET     = (139, 92, 246)   # #8b5cf6  app accent
WHITE      = (255, 255, 255)
DARK_BG    = (9, 9, 11)        # #09090b

SS = 4  # supersample factor for crisp anti-aliasing


def draw_mark(draw, cx, cy, box, color):
    """Draw the house + chimney + keyhole centered at (cx, cy) within `box` px."""
    S = box
    x0, y0 = cx - S / 2, cy - S / 2
    def px(fx): return x0 + fx * S
    def py(fy): return y0 + fy * S

    stroke = max(2, int(0.082 * S))
    r = stroke / 2

    # ── Roof (chevron) ──
    peak   = (px(0.50), py(0.06))
    leaveL = (px(0.05), py(0.37))
    leaveR = (px(0.95), py(0.37))
    draw.line([leaveL, peak, leaveR], fill=color, width=stroke, joint="curve")
    for (ex, ey) in (leaveL, leaveR, peak):
        draw.ellipse([ex - r, ey - r, ex + r, ey + r], fill=color)

    # ── Chimney (short vertical stub on the right roof slope) ──
    ch_fx = 0.74
    t = (ch_fx - 0.50) / (0.95 - 0.50)
    ch_base_y = 0.06 + t * (0.37 - 0.06)
    cbase = (px(ch_fx), py(ch_base_y))
    ctop  = (px(ch_fx), py(0.085))
    draw.line([cbase, ctop], fill=color, width=stroke)
    draw.ellipse([ctop[0] - r, ctop[1] - r, ctop[0] + r, ctop[1] + r], fill=color)

    # ── Body (walls + floor, top open for the roof) ──
    bl, br = px(0.155), px(0.845)
    bt, bb = py(0.34),  py(0.93)
    draw.line([(bl, bt), (bl, bb), (br, bb), (br, bt)], fill=color, width=stroke, joint="curve")
    for (ex, ey) in ((bl, bt), (br, bt)):
        draw.ellipse([ex - r, ey - r, ex + r, ey + r], fill=color)

    # ── Keyhole (solid) ──
    kcx, kcy = px(0.50), py(0.50)
    kr = 0.115 * S
    draw.ellipse([kcx - kr, kcy - kr, kcx + kr, kcy + kr], fill=color)
    top_y, bot_y = py(0.54), py(0.78)
    top_hw, bot_hw = 0.052 * S, 0.115 * S
    draw.polygon([
        (kcx - top_hw, top_y), (kcx + top_hw, top_y),
        (kcx + bot_hw, bot_y), (kcx - bot_hw, bot_y),
    ], fill=color)


def rounded_bg(size, radius, color):
    """A rounded-square background (used for web favicon)."""
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=radius * SS, fill=color)
    return img


def make_icon(size, bg, mark_frac, radius=None, mark_color=WHITE):
    """Full icon: optional bg fill + centered mark."""
    canvas = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    if bg is not None:
        if radius:
            canvas = rounded_bg(size, radius, bg)
        else:
            canvas = Image.new("RGBA", (size * SS, size * SS), bg + (255,))
    d = ImageDraw.Draw(canvas)
    draw_mark(d, size * SS / 2, size * SS / 2, size * SS * mark_frac, mark_color)
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mobile_assets = os.path.join(root, "mobile", "assets")
    web_public    = os.path.join(root, "frontend", "public")
    os.makedirs(mobile_assets, exist_ok=True)
    os.makedirs(web_public, exist_ok=True)

    # ── Mobile: full app icon (navy bg, full-bleed; OS masks corners) ──
    make_icon(1024, NAVY, 0.74).save(os.path.join(mobile_assets, "icon.png"))

    # ── Mobile: Android adaptive foreground (transparent, mark in safe zone ~56%) ──
    make_icon(1024, None, 0.56, mark_color=WHITE).save(os.path.join(mobile_assets, "android-icon-foreground.png"))

    # ── Mobile: Android adaptive background (solid navy) ──
    Image.new("RGBA", (1024, 1024), NAVY + (255,)).save(os.path.join(mobile_assets, "android-icon-background.png"))

    # ── Mobile: Android monochrome (white mark on transparent) ──
    make_icon(1024, None, 0.56, mark_color=WHITE).save(os.path.join(mobile_assets, "android-icon-monochrome.png"))

    # ── Mobile: splash (white mark on transparent — shown over navy splash bg) ──
    make_icon(1024, None, 0.40, mark_color=WHITE).save(os.path.join(mobile_assets, "splash-icon.png"))

    # ── Mobile: favicon ──
    make_icon(196, NAVY, 0.72, radius=44).save(os.path.join(mobile_assets, "favicon.png"))

    # ── Web: favicon / logo (rounded navy square + white mark) ──
    make_icon(512, NAVY, 0.72, radius=115).save(os.path.join(web_public, "logo.png"))
    make_icon(64,  NAVY, 0.72, radius=14).save(os.path.join(web_public, "favicon.png"))

    print("Generated:")
    for f in ("icon.png", "android-icon-foreground.png", "android-icon-background.png",
              "android-icon-monochrome.png", "splash-icon.png", "favicon.png"):
        print("  mobile/assets/" + f)
    print("  frontend/public/logo.png")
    print("  frontend/public/favicon.png")


if __name__ == "__main__":
    main()
