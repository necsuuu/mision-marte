// 🛡️ Traductores del navegador (Google/Brave/Edge Translate) y algunas extensiones reescriben los textos de la página:
// reemplazan cada texto por una etiqueta <font> propia. React no se entera y, cuando después quiere quitar o
// insertar algo al lado de ese texto, el navegador tira un error ("removeChild"/"insertBefore": el nodo no es hijo)
// que deja toda la pantalla en negro. Acá esas dos operaciones se vuelven tolerantes: si el nodo fue movido
// por el traductor, se trabaja sobre el envoltorio que quedó en su lugar en vez de fallar.
if (typeof Node === 'function' && Node.prototype && !Node.prototype.__mmGuard) {
  Node.prototype.__mmGuard = true
  /** El ancestro de `node` que es hijo directo de `parent` (el envoltorio que puso el traductor), o null. */
  const wrapperIn = (parent, node) => {
    let n = node
    while (n && n.parentNode && n.parentNode !== parent) n = n.parentNode
    return n && n.parentNode === parent ? n : null
  }
  const removeChild = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      // el nodo ya no está acá: si quedó un envoltorio con su traducción, se saca eso
      const w = wrapperIn(this, child)
      if (w) return removeChild.call(this, w)
      if (child.parentNode) { try { child.parentNode.removeChild(child) } catch { /* ya no está */ } }
      return child
    }
    return removeChild.apply(this, arguments)
  }

  const insertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) {
      const w = wrapperIn(this, ref)
      return w ? insertBefore.call(this, node, w) : this.appendChild(node)
    }
    return insertBefore.apply(this, arguments)
  }
}
