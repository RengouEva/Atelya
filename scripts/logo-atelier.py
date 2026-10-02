"""Atelya — composite du logo sur le fond d'atelier (charte navy/or).

Produit :
- public/atelier-bg.webp          : fond d'atelier compressé (couche CSS du splash)
- public/atelya-logo-atelier.webp : logo complet posé sur le fond atelier (visuel premium)
"""
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

BASE = "/home/z/my-project/public"

# ---------------------------------------------------------------- fond splash
bg = Image.open(f"{BASE}/atelier-bg.png").convert("RGB")
bg = ImageEnhance.Color(bg).enhance(1.06)
bg = ImageEnhance.Contrast(bg).enhance(1.04)
bg.save(f"{BASE}/atelier-bg.webp", "WEBP", quality=80)
print("atelier-bg.webp OK", bg.size)

# ------------------------------------------------- composite logo × atelier
W, H = 1080, 1080
canvas = bg.resize((W, H), Image.LANCZOS)

# Voile navy global (renforce la charte, assombrit la scène)
navy = Image.new("RGB", (W, H), (4, 12, 38))
canvas = Image.blend(canvas, navy, 0.40)

# Dégradé vertical : plus sombre en haut et en bas, scène visible au centre
grad = Image.new("L", (1, H))
for y in range(H):
    t = y / (H - 1)
    if t < 0.45:
        a = int(150 - 88 * (t / 0.45))          # 150 -> 62
    else:
        a = int(62 + 128 * ((t - 0.45) / 0.55)) # 62 -> 190
    grad.putpixel((0, y), a)
grad = grad.resize((W, H))
shade = Image.new("RGB", (W, H), (2, 7, 22))
canvas = Image.composite(shade, canvas, grad)

# Halo doré doux derrière l'emplacement du logo
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
cx, cy, r = W // 2, int(H * 0.46), int(W * 0.44)
for i in range(r, 0, -2):
    a = int(42 * (1 - i / r) ** 1.6)
    gd.ellipse([cx - i, cy - int(i * 0.78), cx + i, cy + int(i * 0.78)], fill=a)
glow = glow.filter(ImageFilter.GaussianBlur(20))
gold = Image.new("RGB", (W, H), (240, 194, 67))
canvas = Image.composite(gold, canvas, glow)

# Vignette : coins plongés dans le navy profond
vig = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vig)
m = int(W * 0.28)
vd.ellipse([-m, -m, W + m, H + m], fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(130))
dark = Image.new("RGB", (W, H), (1, 4, 14))
canvas = Image.composite(canvas, dark, vig)

# Logo complet (buste + wordmark + tagline or) centré, ombre portée douce
logo = Image.open(f"{BASE}/atelya-logo-splash.webp").convert("RGBA")
lw = int(W * 0.78)
lh = round(logo.height * lw / logo.width)
logo = logo.resize((lw, lh), Image.LANCZOS)
pos = ((W - lw) // 2, (H - lh) // 2 - int(H * 0.015))

sh_mask = Image.new("L", (W, H), 0)
sh_mask.paste(logo.split()[3], (pos[0] + 8, pos[1] + 16))
sh_mask = sh_mask.filter(ImageFilter.GaussianBlur(20))
black = Image.new("RGB", (W, H), (0, 0, 0))
canvas = Image.composite(black, canvas, sh_mask.point(lambda a: int(a * 0.55)))

canvas.paste(logo, pos, logo)
canvas.save(f"{BASE}/atelya-logo-atelier.webp", "WEBP", quality=86)
print("atelya-logo-atelier.webp OK", canvas.size)

import os
os.remove(f"{BASE}/atelier-bg.png")
for f in ("atelier-bg.webp", "atelya-logo-atelier.webp"):
    print(f, os.path.getsize(f"{BASE}/{f}") // 1024, "KB")
