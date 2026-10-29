# Builds web brand assets from the source logo (public/brand/source.webp):
#   mark.png        transparent shield mark (works on dark and light)
#   icon.png        favicon, apple-icon.png, og.png (social share card)
# Run: python scripts/brand-assets.py
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "brand" / "source.webp"
OUT = ROOT / "public" / "brand"

img = Image.open(SRC).convert("RGB")
W, H = img.size
px = img.load()

# Background colour: median of the four corners.
corners = [px[2, 2], px[W - 3, 2], px[2, H - 3], px[W - 3, H - 3]]
bg = tuple(sorted(c[i] for c in corners)[1] for i in range(3))

def dist(c):
    return max(abs(c[0] - bg[0]), abs(c[1] - bg[1]), abs(c[2] - bg[2]))

# Mark lives in the left part of the lockup; find its bounding box.
xs, ys = [], []
for y in range(H):
    for x in range(0, int(W * 0.34)):
        if dist(px[x, y]) > 40:
            xs.append(x)
            ys.append(y)
pad = 24
box = (max(0, min(xs) - pad), max(0, min(ys) - pad), min(W, max(xs) + pad), min(H, max(ys) + pad))
mark = img.crop(box)
mw, mh = mark.size
mp = mark.load()

# Flood-fill from the border: only background connected to the outside becomes
# transparent, so the white document inside the shield is kept.
SOFT = 70
outside = [[False] * mh for _ in range(mw)]
q = deque()
for x in range(mw):
    q.append((x, 0)); q.append((x, mh - 1))
for y in range(mh):
    q.append((0, y)); q.append((mw - 1, y))
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= mw or y >= mh or outside[x][y]:
        continue
    c = mp[x, y]
    if dist(c) > SOFT:
        continue
    # The paper and shield interior are near-white but slightly blue-tinted; the
    # background is neutral. Only neutral pixels count as background, except in the
    # soft glow under the mark, which should fade out.
    in_glow = box[1] + y >= 650
    if not in_glow and (c[2] - c[0] > 2 or c[1] - c[0] > 2):
        continue
    outside[x][y] = True
    q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

out = Image.new("RGBA", (mw, mh))
op = out.load()
for y in range(mh):
    for x in range(mw):
        r, g, b = mp[x, y]
        if not outside[x][y]:
            op[x, y] = (r, g, b, 255)
            continue
        d = dist((r, g, b))
        a = max(0.0, min(1.0, (d - 10) / (SOFT - 10)))
        if a <= 0.02:
            op[x, y] = (0, 0, 0, 0)
            continue
        # Un-blend from the background so edges stay crisp on any colour.
        c = [max(0, min(255, round((v - bgv * (1 - a)) / a))) for v, bgv in zip((r, g, b), bg)]
        op[x, y] = (c[0], c[1], c[2], round(a * 255))

# Trim to content and make square.
bbox = out.getbbox()
out = out.crop(bbox)
side = max(out.size) + 16
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(out, ((side - out.size[0]) // 2, (side - out.size[1]) // 2), out)
sq.resize((512, 512), Image.LANCZOS).save(OUT / "mark.png", optimize=True)

# Favicon / app icons: mark on a rounded dark tile so it reads at 16px.
def tile(size, radius_ratio=0.22):
    t = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bgtile = Image.new("RGBA", (size, size), (9, 16, 20, 255))
    mask = Image.new("L", (size, size), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * radius_ratio), fill=255)
    t.paste(bgtile, (0, 0), mask)
    m = sq.resize((int(size * 0.8), int(size * 0.8)), Image.LANCZOS)
    t.paste(m, ((size - m.size[0]) // 2, (size - m.size[1]) // 2), m)
    return t

tile(64).save(ROOT / "app" / "icon.png")
tile(180, 0.2).save(ROOT / "app" / "apple-icon.png")

# Social card: the full lockup on its own light background, 1200x630.
og = Image.new("RGB", (1200, 630), bg)
full = img.copy()
scale = 1200 / W * 1.18
full = full.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
og.paste(full, ((1200 - full.size[0]) // 2, (630 - full.size[1]) // 2))
og.save(ROOT / "app" / "opengraph-image.png", optimize=True)
print("mark box", box, "bg", bg, "-> mark.png, icon.png, apple-icon.png, opengraph-image.png")
