"""Arma el fondo (borroso) de la pantalla de selección de personaje.
Uso: python3 tools/armar_fondo_personajes.py
  Lee  src/assets/title/originales/fondo_personajes.png
  Escribe src/assets/title/char_bg.webp, ya borroneado: así el celular no tiene que hacer el desenfoque en cada cuadro.
"""
from PIL import Image, ImageFilter

im = Image.open('src/assets/title/originales/fondo_personajes.png').convert('RGB')
W = 1280
im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
im = im.filter(ImageFilter.GaussianBlur(7))
im.save('src/assets/title/char_bg.webp', quality=78, method=6)
print('listo: src/assets/title/char_bg.webp', im.size)
