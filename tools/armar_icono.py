"""Arma el ícono del juego (pestaña del navegador y pantalla de inicio del celular) a partir del casco.
Uso: python3 tools/armar_icono.py
  Lee  src/assets/title/originales/icono_casco.png (el casco en el círculo naranja, sobre fondo blanco)
  Escribe en public/: favicon.png (círculo con fondo transparente) y apple-touch-icon.png, icon-192.png,
  icon-512.png (cuadrados con fondo oscuro, porque el celular les redondea las esquinas y no admite transparencia).
"""
from PIL import Image, ImageDraw
import numpy as np

src = Image.open('src/assets/title/originales/icono_casco.png').convert('RGB')
a = np.array(src).astype(int)
# el círculo es todo lo que no es el fondo blanco
ink = (a.min(axis=2) < 235)
ys, xs = np.where(ink)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
r = max(x1 - x0, y1 - y0) / 2 + 2
box = (int(cx - r), int(cy - r), int(cx + r), int(cy + r))
circle = src.crop(box)
S = circle.width

# máscara redonda suave (4x de resolución para que el borde no quede serruchado)
big = Image.new('L', (S * 4, S * 4), 0)
e = int(S * 4 * 0.012)  # un poquito para adentro: así no queda el borde blanco del dibujo original
ImageDraw.Draw(big).ellipse((e, e, S * 4 - 1 - e, S * 4 - 1 - e), fill=255)
mask = big.resize((S, S), Image.LANCZOS)
badge = circle.convert('RGBA')
badge.putalpha(mask)

BG = (13, 15, 24, 255)  # el mismo azul casi negro del juego


def square(size, fill):
    """Ícono cuadrado: el círculo ocupa casi todo, sobre fondo oscuro."""
    out = Image.new('RGBA', (size, size), BG)
    d = int(size * fill)
    b = badge.resize((d, d), Image.LANCZOS)
    out.alpha_composite(b, ((size - d) // 2, (size - d) // 2))
    return out.convert('RGB')


badge.resize((64, 64), Image.LANCZOS).save('public/favicon.png', optimize=True)
square(180, 0.9).save('public/apple-touch-icon.png', optimize=True)
square(192, 0.82).save('public/icon-192.png', optimize=True)  # Android recorta un círculo: le dejo margen
square(512, 0.82).save('public/icon-512.png', optimize=True)
print('listo: favicon.png, apple-touch-icon.png, icon-192.png, icon-512.png')
