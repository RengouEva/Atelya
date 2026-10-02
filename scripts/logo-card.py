"""Atelya — le logo est sombre : on lui donne un fond clair = couleur de la
page atelier (#F1F4FC, fond du mode clair de l'app) pour le faire ressortir.

Produit :
- public/atelya-logo-card.webp : logo complet sur carte claire arrondie (splash)
- public/atelya-mark-tile.webp : emblème buste sur tuile claire carrée (CTA, footer, header)
"""
from PIL import Image, ImageDraw

BASE = "/home/z/my-project/public"
PAGE = (241, 244, 252)      # #F1F4FC — fond de la page atelier (mode clair)
BORDER = (213, 221, 240)    # #D5DDF0 — hairline --border


def rounded_card(w: int, h: int, radius: int) -> Image.Image:
    """Carte #F1F4FC coins arrondis, hairline border, alpha hors coins."""
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=PAGE + (255,))
    # hairline intérieure pour la définition sur fonds très clairs
    d.rounded_rectangle(
        [0, 0, w - 1, h - 1], radius=radius, outline=BORDER + (255,), width=2
    )
    return card


def center_paste(card: Image.Image, art: Image.Image, art_w: int, lift: int = 0):
    aw = art_w
    ah = round(art.height * aw / art.width)
    art = art.resize((aw, ah), Image.LANCZOS)
    pos = ((card.width - aw) // 2, (card.height - ah) // 2 - lift)
    card.paste(art, pos, art)
    return card


# ------------------------------------------------- 1) logo complet sur carte
logo = Image.open(f"{BASE}/atelya-logo-splash.webp").convert("RGBA")
W, H, R = 1560, 1160, 84
card = rounded_card(W, H, R)
card = center_paste(card, logo, int(W * 0.80))
card.save(f"{BASE}/atelya-logo-card.webp", "WEBP", quality=88)
print("atelya-logo-card.webp OK", card.size)

# ------------------------------------------------- 2) emblème sur tuile
mark = Image.open(f"{BASE}/atelya-mark.webp").convert("RGBA")
W2, H2, R2 = 400, 400, 96
tile = rounded_card(W2, H2, R2)
tile = center_paste(tile, mark, 230)
tile.save(f"{BASE}/atelya-mark-tile.webp", "WEBP", quality=88)
print("atelya-mark-tile.webp OK", tile.size)

import os
for f in ("atelya-logo-card.webp", "atelya-mark-tile.webp"):
    print(f, os.path.getsize(f"{BASE}/{f}") // 1024, "KB")
