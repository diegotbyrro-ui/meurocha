/* ROCHA R9 — reidratação dos carrosséis capturados.
 * Restaura somente os nós originais antes do OwlCarousel do site inicializar.
 * Não remove itens, imagens, links ou atributos internos dos slides originais.
 */
(function () {
  'use strict';
  var elements = document.querySelectorAll('.owl-carousel.owl-loaded');
  for (var i = 0; i < elements.length; i += 1) {
    var carousel = elements[i];
    var stage = carousel.querySelector('.owl-stage-outer > .owl-stage');
    if (!stage) continue;
    var items = stage.children;
    var originals = [];
    for (var j = 0; j < items.length; j += 1) {
      if (!items[j].classList.contains('owl-item')) continue;
      if (items[j].classList.contains('cloned')) continue;
      originals.push(items[j]);
    }
    if (!originals.length) continue;
    var fragment = document.createDocumentFragment();
    for (var k = 0; k < originals.length; k += 1) {
      var item = originals[k];
      while (item.firstChild) fragment.appendChild(item.firstChild);
    }
    while (carousel.firstChild) carousel.removeChild(carousel.firstChild);
    carousel.appendChild(fragment);
    carousel.classList.remove('owl-loaded', 'owl-drag', 'owl-hidden', 'owl-loading', 'owl-refresh', 'owl-center', 'owl-responsive');
    carousel.removeAttribute('style');
  }
})();
