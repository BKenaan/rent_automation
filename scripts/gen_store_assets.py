"""
Generate Google Play Store visual assets:
  - play-icon-512.png        (512x512 hi-res app icon)
  - feature-graphic-1024x500.png  (store banner)
Run: python scripts/gen_store_assets.py
Output: store_assets/
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

NAVY   = (27, 43, 78)
VIOLET = (139, 92, 246)
WHITE  = (255, 255, 255)
SS = 4

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "mobile", "node_modules", "@expo-google-fonts")
SG_BOLD = os.path.join(FONT_DIR, "space-grotesk", "700Bold", "SpaceGrotesk_700Bold.ttf")
INTER_MED = os.path.join(FONT_DIR, "inter", "500Medium", "Inter_500Medium.ttf")
OUT = os.path.join(ROOT, "store_assets")
os.makedirs(OUT, exist_ok=True)


def draw_mark(draw, cx, cy, box, mark_color, keyhole_color):
    S = box
    x0, y0 = cx - S / 2, cy - S / 2
    def px(fx): return x0 + fx * S
    def py(fy): return y0 + fy * S
    stroke = max(2, int(0.082 * S))
    r = stroke / 2

    peak   = (px(0.50), py(0.06)); lL = (px(0.05), py(0.37)); lR = (px(0.95), py(0.37))
    draw.line([lL, peak, lR], fill=mark_color, width=stroke, joint="curve")
    for (ex, ey) in (lL, lR, peak):
        draw.ellipse([ex - r, ey - r, ex + r, ey + r], fill=mark_color)

    ch_fx = 0.74
    t = (ch_fx - 0.50) / 0.45
    cbase = (px(ch_fx), py(0.06 + t * 0.31)); ctop = (px(ch_fx), py(0.085))
    draw.line([cbase, ctop], fill=mark_color, width=stroke)
    draw.ellipse([ctop[0] - r, ctop[1] - r, ctop[0] + r, ctop[1] + r], fill=mark_color)

    bl, br = px(0.155), px(0.845); bt, bb = py(0.34), py(0.93)
    draw.line([(bl, bt), (bl, bb), (br, bb), (br, bt)], fill=mark_color, width=stroke, joint="curve")
    for (ex, ey) in ((bl, bt), (br, bt)):
        draw.ellipse([ex - r, ey - r, ex + r, ey + r], fill=mark_color)

    kcx, kcy = px(0.50), py(0.50); kr = 0.115 * S
    draw.ellipse([kcx - kr, kcy - kr, kcx + kr, kcy + kr], fill=keyhole_color)
    ty, by = py(0.54), py(0.78); thw, bhw = 0.052 * S, 0.115 * S
    draw.polygon([(kcx - thw, ty), (kcx + thw, ty), (kcx + bhw, by), (kcx - bhw, by)], fill=keyhole_color)


def make_play_icon():
    """512 full-bleed navy + white mark (matches the launcher icon)."""
    size = 512
    img = Image.new("RGB", (size * SS, size * SS), NAVY)
    d = ImageDraw.Draw(img)
    draw_mark(d, size * SS / 2, size * SS / 2, size * SS * 0.74, WHITE, WHITE)
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, "play-icon-512.png"))


def make_feature_graphic():
    W, H = 1024, 500
    img = Image.new("RGB", (W * SS, H * SS), NAVY)

    # soft violet glow behind the center
    glow = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gcx, gcy = int(W * SS * 0.5), int(H * SS * 0.42)
    gr = int(W * SS * 0.32)
    gd.ellipse([gcx - gr, gcy - gr, gcx + gr, gcy + gr], fill=(139, 92, 246, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(W * SS * 0.06))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    # mark + wordmark, centered as a group
    mark_box = int(H * SS * 0.34)
    name_font = ImageFont.truetype(SG_BOLD, int(H * SS * 0.17))
    tag_font  = ImageFont.truetype(INTER_MED, int(H * SS * 0.052))

    name = "RentalMan"
    nb = d.textbbox((0, 0), name, font=name_font)
    nw, nh = nb[2] - nb[0], nb[3] - nb[1]
    gap = int(W * SS * 0.03)
    group_w = mark_box + gap + nw
    gx = (W * SS - group_w) / 2
    gy = int(H * SS * 0.34)

    draw_mark(d, gx + mark_box / 2, gy, mark_box, WHITE, VIOLET)
    d.text((gx + mark_box + gap, gy - nh / 2 - nb[1]), name, font=name_font, fill=WHITE)

    tag = "Property management, simplified"
    tb = d.textbbox((0, 0), tag, font=tag_font)
    tw = tb[2] - tb[0]
    d.text(((W * SS - tw) / 2, int(H * SS * 0.62)), tag, font=tag_font, fill=(255, 255, 255, 255))
    # dim the tagline by drawing in a lighter grey
    # (re-draw to a muted tone)
    img2 = img
    img2.resize((W, H), Image.LANCZOS).save(os.path.join(OUT, "feature-graphic-1024x500.png"))


if __name__ == "__main__":
    make_play_icon()
    make_feature_graphic()
    print("Wrote:")
    print("  store_assets/play-icon-512.png")
    print("  store_assets/feature-graphic-1024x500.png")
