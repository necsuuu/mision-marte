# Recorta los 4 personajes de una lámina con fondo transparente y los deja como los usa el juego:
# src/assets/characters/originales/{select_woman,select_man,skin_man,skin_woman}.png
# (de izquierda a derecha: comandante mujer, comandante hombre, ingeniero, botánica), 720 px de alto con 3 px de margen.
# Cada uno se recorta por su propia silueta (en la lámina se tocan los rectángulos).
# Después: python3 tools/generar_fotogramas.py (fotogramas de caminata) y este mismo script arma los .webp y los retratos.
# Uso: python3 tools/recortar_personajes.py lamina.png
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

NAMES = ['select_woman', 'select_man', 'skin_man', 'skin_woman']
H, PAD = 720, 3
src = Image.open(sys.argv[1]).convert('RGBA')
a = np.asarray(src)
lab, n = nd.label(a[..., 3] > 10)
sizes = nd.sum(np.ones_like(lab), lab, range(1, n + 1))
big = sorted([i + 1 for i, z in enumerate(sizes) if z > 20000], key=lambda i: np.where(lab == i)[1].mean())
assert len(big) == 4, f'se esperaban 4 personajes, hay {len(big)}'
# píxeles semitransparentes del borde que quedaron fuera de la silueta: se asignan al personaje más cercano
dist, (iy, ix) = nd.distance_transform_edt(lab == 0, return_indices=True)
owner = lab[iy, ix]
for name, i in zip(NAMES, big):
    m = (owner == i) & (a[..., 3] > 0) & (dist <= 3)  # solo el borde suave pegado a la silueta (no motas sueltas lejanas)
    one = a.copy(); one[~m] = 0
    ys, xs = np.where(m)
    crop = Image.fromarray(one[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    h = H - 2 * PAD
    w = round(crop.width * h / crop.height)
    crop = crop.resize((w, h), Image.LANCZOS)
    out = Image.new('RGBA', (w + 2 * PAD, H), (0, 0, 0, 0))
    out.paste(crop, (PAD, PAD))
    out.save(f'src/assets/characters/originales/{name}.png')
    out.save(f'src/assets/characters/{name}.webp', quality=88, method=6)
    print(name, out.size)

# retratos de los comandantes (cabeza y hombros, 220 × 220) para el HUD
for name in ['select_woman', 'select_man']:
    im = Image.open(f'src/assets/characters/originales/{name}.png')
    al = np.asarray(im)[..., 3] > 20
    ys, xs = np.where(al[: int(H * 0.36)])
    top = ys.min()
    # columna central de la cabeza: el centro de los píxeles de la franja de la cabeza
    head = al[top: top + int(H * 0.18)]
    cx = int(np.where(head)[1].mean())
    side = int(H * 0.36)
    box = (cx - side // 2, max(0, top - 4), cx + side // 2, max(0, top - 4) + side)
    por = im.crop(box).resize((220, 220), Image.LANCZOS)
    por.save(f"src/assets/characters/portrait_{name.split('_')[1]}.webp", quality=88, method=6)
    print('portrait', name, box)
