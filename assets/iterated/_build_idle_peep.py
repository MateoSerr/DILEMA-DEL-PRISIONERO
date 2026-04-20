"""Genera iterated_peep_idle.png desde iterated_peep0000.

Quita solo ojos (componentes conexas). No se dibujan arcos ni trazos extra: el cierre de cabeza
va unificado con el cuerpo PIXI (Sprite) y el <img> DOM usando este mismo PNG."""
from __future__ import print_function

import os
from collections import deque
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ATLAS = os.path.join(HERE, "iterated_peep.png")
OUT = os.path.join(HERE, "iterated_peep_idle.png")

FRAME_0000 = (10, 10, 10 + 302, 10 + 402)
TARGET = (151, 201)

FILL = (255, 255, 255, 255)
DARK_TH = 118
MAX_EYE_AREA = 28
EYE_CX0, EYE_CX1 = 64.0, 94.0
EYE_CY0, EYE_CY1 = 99.5, 109.5


def _dark(px, x, y, th):
    r, g, b, a = px[x, y]
    return a > 90 and (r + g + b) <= th


def remove_eye_only(im_rgba):
    px = im_rgba.load()
    w, h = im_rgba.size
    th = DARK_TH
    seen = set()
    to_white = []

    for y in range(h):
        for x in range(w):
            if (x, y) in seen or not _dark(px, x, y, th):
                continue
            q = deque([(x, y)])
            seen.add((x, y))
            comp = []
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if (nx, ny) in seen or not _dark(px, nx, ny, th):
                        continue
                    if nx < 0 or nx >= w or ny < 0 or ny >= h:
                        continue
                    seen.add((nx, ny))
                    q.append((nx, ny))
            xs = [p[0] for p in comp]
            ys = [p[1] for p in comp]
            cx = sum(xs) / float(len(comp))
            cy = sum(ys) / float(len(comp))
            if len(comp) > MAX_EYE_AREA:
                continue
            if not (EYE_CX0 <= cx <= EYE_CX1 and EYE_CY0 <= cy <= EYE_CY1):
                continue
            to_white.extend(comp)

    for x, y in to_white:
        px[x, y] = FILL
    return im_rgba


def main():
    im = Image.open(ATLAS).convert("RGBA")
    crop = im.crop(FRAME_0000).resize(TARGET, Image.LANCZOS)
    crop = remove_eye_only(crop)
    crop.save(OUT, "PNG")
    print("Wrote", OUT, crop.size)


if __name__ == "__main__":
    main()
