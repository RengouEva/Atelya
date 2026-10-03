"""Atelya logo → WebP + déclinaisons (mark, icône app) + nettoyage bords."""
from PIL import Image
import os

SRC = "/home/z/my-project/upload/file_000000000384824391e964329b98fa6f.png"
PUB = "/home/z/my-project/public"
os.makedirs(PUB, exist_ok=True)

im = Image.open(SRC).convert("RGBA")

# --- 1. Débruitage léger des franges (décoloration rouge/jaune des artefacts de contour) ---
px = im.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if 0 < a < 255:
            # artefacts chauds dans la frange -> pousser vers bleu profond transparent
            if r > 90 and g < 110 and b < 130:
                px[x, y] = (10, 22, 70, a)
        elif a == 0 and (r > 0 or g > 0 or b > 0):
            px[x, y] = (0, 0, 0, 0)

# --- 2. Trim des bords transparents ---
bbox = im.getbbox()
logo = im.crop(bbox)
lw, lh = logo.size
print("logo trimmed:", logo.size)

# --- 2b. Variante splash : tagline navy -> or (lisible sur fond navy) ---
splash = logo.copy()
sp = splash.load()
GOLD = (240, 194, 67, 255)
for y in range(int(lh * 0.94), lh):  # bande de la tagline uniquement
    for x in range(lw):
        r, g, b, a = sp[x, y]
        if a > 40 and r < 90 and g < 90 and b < 130:
            sp[x, y] = GOLD
splash.save(f"{PUB}/atelya-logo-splash.webp", "WEBP", quality=92, method=6)

# --- 3. Logo complet -> WebP (landing, central) ---
logo.save(f"{PUB}/atelya-logo.webp", "WEBP", quality=92, method=6)

# --- 4. Composantes connexes : le buste = composante touchant le haut (y<15%) près du centre ---
import numpy as np
arr = np.array(logo)[:, :, 3] > 40
try:
    from scipy import ndimage
    lab, n = ndimage.label(arr)
    h_, w_ = arr.shape
    top_labels = set(lab[:int(h_*0.12), :].ravel()) - {0}
    # prendre la plus grosse composante du haut
    best, best_n = 0, 0
    for L in top_labels:
        n_ = int((lab == L).sum())
        if n_ > best_n:
            best, best_n = L, n_
    ys_, xs_ = np.where(lab == best)
    bx0, bx1, by0, by1 = xs_.min(), xs_.max(), ys_.min(), ys_.max()
except ImportError:
    bx0, bx1, by0, by1 = int(lw*0.15), int(lw*0.72), 0, int(lh*0.66)
print("buste bbox:", bx0, bx1, by0, by1)

# --- 5. Emblème (buste seul) ---
mark = logo.crop((int(bx0)-4, int(by0)-4, int(bx1)+4, int(by1)+4))
mark.save(f"{PUB}/atelya-mark.webp", "WEBP", quality=92, method=6)
print("mark:", mark.size)

# --- 6. Icône app 512x512 (buste centré sur fond bleu nuit dégradé) ---
def make_icon(size):
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # fond dégradé navy -> bleu roi
    grad = Image.new("RGBA", (size, size))
    gp = grad.load()
    top = (0, 16, 64)     # #001040
    bot = (0, 56, 168)    # #0038A8
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(top[0] + (bot[0]-top[0])*t)
        g = int(top[1] + (bot[1]-top[1])*t)
        b = int(top[2] + (bot[2]-top[2])*t)
        for x in range(size):
            gp[x, y] = (r, g, b, 255)
    # arrondi 22%
    mask = Image.new("L", (size, size), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size-1, size-1], radius=int(size*0.22), fill=255)
    icon.paste(grad, (0, 0), mask)
    # buste : 74% de la largeur
    target = int(size * 0.74)
    mw = int(mark.width * target / mark.height)
    m = mark.resize((mw, target), Image.LANCZOS)
    icon.alpha_composite(m, ((size - mw)//2, int(size*0.13)))
    return icon

icon512 = make_icon(512)
icon512.save("/home/z/my-project/src/app/icon.png", "PNG")
icon512.save(f"{PUB}/atelya-icon.webp", "WEBP", quality=90, method=6)
icon192 = make_icon(192)
icon192.save(f"{PUB}/atelya-icon-192.webp", "WEBP", quality=90, method=6)

print("OK — assets générés")
