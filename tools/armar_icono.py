"""Arma el ícono del juego (pestaña del navegador y pantalla de inicio del celular).
Uso: python3 tools/armar_icono.py   → escribe public/icon-512.png, icon-192.png, apple-touch-icon.png y favicon.png
"""
from PIL import Image, ImageDraw, ImageFilter
import random

S = 1024
random.seed(7)
# cielo de Marte: naranja arriba, rojo oscuro abajo
bg = Image.new('RGB', (S, S))
px = bg.load()
for y in range(S):
    t = y / S
    r = int(250 - 120 * t); g = int(150 - 110 * t); b = int(70 - 45 * t)
    for x in range(S):
        px[x, y] = (r, g, b)
d = ImageDraw.Draw(bg, 'RGBA')
# sol pálido y suelo
d.ellipse((640, 90, 900, 350), fill=(255, 226, 170, 150))
bg = bg.filter(ImageFilter.GaussianBlur(6))
d = ImageDraw.Draw(bg, 'RGBA')
d.ellipse((-300, 760, S + 300, S + 520), fill=(110, 38, 22, 255))
for _ in range(26):
    x = random.randint(0, S); y = random.randint(820, S); r = random.randint(8, 26)
    d.ellipse((x - r, y - r // 2, x + r, y + r // 2), fill=(80, 26, 16, 160))

# comandante (busto) desde la ilustración de selección de personaje
ch = Image.open('src/assets/characters/select_man.webp').convert('RGBA')
w, h = ch.size
bust = ch.crop((0, 0, w, int(h * 0.52)))
scale = (S * 0.98) / bust.height
bust = bust.resize((int(bust.width * scale), int(bust.height * scale)), Image.LANCZOS)
sh = Image.new('RGBA', bust.size, (0, 0, 0, 0)); sh.putalpha(bust.getchannel('A').point(lambda a: int(a * 0.45)))
x0 = (S - bust.width) // 2
bg.paste(sh.filter(ImageFilter.GaussianBlur(14)), (x0 + 14, S - bust.height + 30), sh.filter(ImageFilter.GaussianBlur(14)))
bg.paste(bust, (x0, S - bust.height + 12), bust)

for name, size in [('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180), ('favicon.png', 64)]:
    bg.resize((size, size), Image.LANCZOS).save('public/' + name, optimize=True)
    print('public/' + name)
