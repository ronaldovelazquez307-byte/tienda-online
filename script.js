/* =========================================================
   AURUM & LEY — lógica de la tienda
   HTML/CSS/JS puro, sin frameworks ni backend.

   IMPORTANTE — LÉELO ANTES DE PUBLICAR:
   El "sistema de usuarios" de este archivo guarda todo en el
   localStorage del NAVEGADOR del cliente (contraseñas incluidas,
   con un hash simple solo para no guardarlas en texto plano).
   Esto es una demostración funcional, NO un sistema de login
   seguro de producción: no hay servidor, no hay envío real de
   correos para recuperar contraseña, y el login con Google no
   puede completarse sin un backend con OAuth. Para una tienda
   real se necesita un backend (Node/Express, Firebase, Supabase,
   etc.) que maneje auth, pagos y base de datos de verdad.
   ========================================================= */

// ---------- Configuración ----------
var WHATSAPP_NUMBER = "52"; // pon aquí tu número completo, ej. "5215512345678"
var SHIPPING_FLAT = 150;
var FREE_SHIPPING_FROM = 3000;

// ---------- Metadatos fijos ----------
// Fotografías de referencia (Pexels, licencia libre de uso comercial, sin atribución
// obligatoria — pexels.com/license). Son fotos GENÉRICAS de joyería que ilustran cada
// categoría mientras subes tus propias fotos de producto; no son fotos de tus piezas
// exactas. Crédito principal: COPPERTIST WU, Arif khan, say straight, Noelle Otto
// y monicore, vía pexels.com.
var CATEGORY_IMAGE = {
  "cadenas-cubanas": "https://images.pexels.com/photos/16109298/pexels-photo-16109298.jpeg?auto=compress&cs=tinysrgb&w=900",
  "cadenas-cartier": "https://images.pexels.com/photos/16109266/pexels-photo-16109266.jpeg?auto=compress&cs=tinysrgb&w=900",
  "cadenas-gucci": "https://images.pexels.com/photos/16109301/pexels-photo-16109301.jpeg?auto=compress&cs=tinysrgb&w=900",
  "pulseras": "https://images.pexels.com/photos/16109244/pexels-photo-16109244.jpeg?auto=compress&cs=tinysrgb&w=900",
  "anillos": "https://images.pexels.com/photos/15684127/pexels-photo-15684127.jpeg?auto=compress&cs=tinysrgb&w=900",
  "aretes": "https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg?auto=compress&cs=tinysrgb&w=900",
  "dijes": "https://images.pexels.com/photos/906056/pexels-photo-906056.jpeg?auto=compress&cs=tinysrgb&w=900",
  "esclavas": "https://images.pexels.com/photos/16109230/pexels-photo-16109230.jpeg?auto=compress&cs=tinysrgb&w=900",
  "rosarios": "https://images.pexels.com/photos/135486/pexels-photo-135486.jpeg?auto=compress&cs=tinysrgb&w=900",
  "tobilleras": "https://images.pexels.com/photos/16109256/pexels-photo-16109256.jpeg?auto=compress&cs=tinysrgb&w=900",
  "juegos": "https://images.pexels.com/photos/16124717/pexels-photo-16124717.jpeg?auto=compress&cs=tinysrgb&w=900",
  "personalizados": "https://images.pexels.com/photos/16109268/pexels-photo-16109268.jpeg?auto=compress&cs=tinysrgb&w=900"
};

var CATEGORIES = [
  { slug: "cadenas-cubanas", label: "Cadenas Cubanas", icon: "link" },
  { slug: "cadenas-cartier", label: "Cadenas Cartier", icon: "link" },
  { slug: "cadenas-gucci", label: "Cadenas Gucci", icon: "link" },
  { slug: "pulseras", label: "Pulseras", icon: "circle" },
  { slug: "anillos", label: "Anillos", icon: "ring" },
  { slug: "aretes", label: "Aretes", icon: "drop" },
  { slug: "dijes", label: "Dijes", icon: "heart" },
  { slug: "esclavas", label: "Esclavas", icon: "disc" },
  { slug: "rosarios", label: "Rosarios", icon: "cross" },
  { slug: "tobilleras", label: "Tobilleras", icon: "circle" },
  { slug: "juegos", label: "Juegos", icon: "grid" },
  { slug: "personalizados", label: "Personalizados", icon: "edit" }
];
var MATERIALS = [
  { slug: "plata-925", label: "Plata .925", desc: "Plata esterlina con acabado rodinado, ligera y versátil." },
  { slug: "oro-10k", label: "Oro de 10K", desc: "Aleación más resistente al uso diario, tono dorado clásico." },
  { slug: "oro-14k", label: "Oro de 14K", desc: "Mayor pureza de oro, brillo intenso y acabado premium." }
];
var PAGO_OPTS = [
  { id: "transferencia", name: "Transferencia bancaria", desc: "Datos de la cuenta al confirmar por WhatsApp" },
  { id: "tarjeta-credito", name: "Tarjeta de crédito", desc: "Liga de pago enviada por WhatsApp" },
  { id: "tarjeta-debito", name: "Tarjeta de débito", desc: "Liga de pago enviada por WhatsApp" },
  { id: "mercado-pago", name: "Mercado Pago", desc: "Liga de pago enviada por WhatsApp" },
  { id: "paypal", name: "PayPal", desc: "Liga de pago enviada por WhatsApp" },
  { id: "contra-entrega", name: "Pago contra entrega", desc: "Disponible según tu código postal" }
];

// ---------- Estado ----------
var PRODUCTS = [];
var VARIANT_INDEX = {};      // codigo -> {product, variant}
var cart = {};                // { codigo: qty }
var favorites = [];           // [productId]
var USERS = [];
var currentUser = null;       // objeto usuario o null
var fichaSelByProduct = {};   // id -> {material, largo, ancho, talla}
var listadoFiltros = {};      // clave de vista -> filtros
var checkoutStep = 1;
var checkoutMetodoPago = null;
var authView = "login";
var cuentaTab = "pedidos";
var reviewStars = 0;

var appEl, cartItemsEl, cartSubtotalRow, cartShippingRow, cartTotalRow, cartBadge,
    cartDrawer, cartOverlay, checkoutOverlay, authOverlay, authModal;

// ---------- Utilidades ----------
function money(n) { return "$" + Math.round(n).toLocaleString("es-MX"); }
function catBySlug(slug) { for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].slug === slug) return CATEGORIES[i]; return null; }
function matBySlug(slug) { for (var i = 0; i < MATERIALS.length; i++) if (MATERIALS[i].slug === slug) return MATERIALS[i]; return null; }
function productById(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; }
function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }

function simpleHash(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) { h = ((h << 5) + h) + str.charCodeAt(i); h |= 0; }
  return (h >>> 0).toString(36);
}

function iconPath(name) {
  switch (name) {
    case "link": return '<path d="M9 15L15 9M10 6l1.5-1.5a3.5 3.5 0 015 5L15 11M14 18l-1.5 1.5a3.5 3.5 0 01-5-5L9 13" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    case "circle": return '<circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.4" fill="none"/>';
    case "ring": return '<circle cx="12" cy="13.5" r="6" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M9.5 8.5L12 4l2.5 4.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    case "drop": return '<path d="M12 4c3 3.2 5 6 5 8.5a5 5 0 01-10 0C7 10 9 7.2 12 4z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/>';
    case "heart": return '<path d="M12 19s-6.5-4.2-6.5-9A3.8 3.8 0 0112 7.5 3.8 3.8 0 0118.5 10c0 4.8-6.5 9-6.5 9z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/>';
    case "disc": return '<circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.2" fill="none"/>';
    case "cross": return '<path d="M12 5v14M8 9h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1" fill="none" opacity="0.4"/>';
    case "grid": return '<rect x="5" y="5" width="6" height="6" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="13" y="5" width="6" height="6" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="5" y="13" width="6" height="6" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="13" y="13" width="6" height="6" stroke="currentColor" stroke-width="1.3" fill="none"/>';
    case "edit": return '<path d="M4 20l1-4.2L15.5 5.3a1.5 1.5 0 012.1 0l1.1 1.1a1.5 1.5 0 010 2.1L8.2 19 4 20z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/>';
    default: return '<circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.4" fill="none"/>';
  }
}

// Emblema tipo medallón — placeholder elegante mientras se agregan fotografías reales
function placeholderSVG(opts) {
  var label = opts.label || "";
  var icon = opts.icon || "circle";
  var materialSlug = opts.material || "";
  var size = opts.size || 200;
  var variant = opts.variant || 0;
  var isSilver = materialSlug.indexOf("plata") === 0;
  var strokeColor = isSilver ? "#b9bec4" : "#e3c977";
  var initials = label.split(" ").slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
  var rot = variant * 18;
  return (
    '<svg viewBox="0 0 200 200" width="' + size + '" height="' + size + '" role="img" aria-label="' + label.replace(/"/g, "") + '">' +
      '<circle cx="100" cy="100" r="82" fill="none" stroke="' + strokeColor + '" stroke-width="1" opacity="0.35" transform="rotate(' + rot + ' 100 100)"/>' +
      '<circle cx="100" cy="100" r="66" fill="none" stroke="' + strokeColor + '" stroke-width="1.4"/>' +
      '<g transform="translate(100 92)" color="' + strokeColor + '" opacity="0.9"><g transform="translate(-12 -12)">' + iconPath(icon) + '</g></g>' +
      '<text x="100" y="128" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="2" fill="' + strokeColor + '">' + initials + '</text>' +
    '</svg>'
  );
}
function phWrap(opts) { return '<div class="ph-inner">' + placeholderSVG(opts) + '</div>'; }

// Devuelve una <img> con la foto real de referencia de la categoría si existe,
// o si no, el emblema SVG de respaldo (placeholder).
function mediaWrap(opts) {
  var catSlug = opts.catSlug;
  var url = catSlug && CATEGORY_IMAGE[catSlug];
  if (url) {
    return '<img class="prod-photo" src="' + url + '" alt="' + (opts.label || "").replace(/"/g, "") + '" loading="lazy">';
  }
  return phWrap(opts);
}

// ---------- Helpers de variantes / precios ----------
function buildVariantIndex() {
  VARIANT_INDEX = {};
  PRODUCTS.forEach(function (p) {
    p.variantes.forEach(function (v) { VARIANT_INDEX[v.codigo] = { product: p, variant: v }; });
  });
}
function variantesDe(p, materiales) {
  return p.variantes.filter(function (v) { return materiales.indexOf(v.material) !== -1; });
}
function rangoPrecio(vs) {
  var precios = vs.map(function (v) { return v.precio; });
  return { min: Math.min.apply(null, precios), max: Math.max.apply(null, precios) };
}
function anyStock(vs) { return vs.some(function (v) { return v.stock; }); }
function priceLabel(vs) {
  var r = rangoPrecio(vs);
  return r.min === r.max ? money(r.min) : '<span class="desde">Desde</span>' + money(r.min);
}

// ---------- LocalStorage: carrito / favoritos ----------
function cartKey() { return "aurumCart_" + (currentUser ? currentUser.id : "guest"); }
function favKey() { return "aurumFavs_" + (currentUser ? currentUser.id : "guest"); }

function loadCart() { try { cart = JSON.parse(localStorage.getItem(cartKey())) || {}; } catch (e) { cart = {}; } }
function saveCart() { try { localStorage.setItem(cartKey(), JSON.stringify(cart)); } catch (e) {} }
function loadFavs() { try { favorites = JSON.parse(localStorage.getItem(favKey())) || []; } catch (e) { favorites = []; } }
function saveFavs() { try { localStorage.setItem(favKey(), JSON.stringify(favorites)); } catch (e) {} }

function toggleFavorite(productId) {
  var idx = favorites.indexOf(productId);
  if (idx === -1) favorites.push(productId); else favorites.splice(idx, 1);
  saveFavs();
}

// ---------- Usuarios / sesión ----------
function saveUsers() { try { localStorage.setItem("aurumUsers", JSON.stringify(USERS)); } catch (e) {} }

function initUsers(seed) {
  var raw = localStorage.getItem("aurumUsers");
  if (raw) { USERS = JSON.parse(raw); return; }
  USERS = (seed.usuarios || []).map(function (u) {
    return { id: u.id, nombre: u.nombre, correo: u.correo.toLowerCase(), passwordHash: simpleHash(u.passwordDemo), direcciones: u.direcciones || [], pedidos: [] };
  });
  saveUsers();
}

function findUserByEmail(correo) {
  correo = (correo || "").toLowerCase().trim();
  for (var i = 0; i < USERS.length; i++) if (USERS[i].correo === correo) return USERS[i];
  return null;
}

function mergeGuestInto(userId) {
  var guestCart = JSON.parse(localStorage.getItem("aurumCart_guest") || "{}");
  var userCart = JSON.parse(localStorage.getItem("aurumCart_" + userId) || "{}");
  Object.keys(guestCart).forEach(function (k) { userCart[k] = (userCart[k] || 0) + guestCart[k]; });
  localStorage.setItem("aurumCart_" + userId, JSON.stringify(userCart));
  localStorage.removeItem("aurumCart_guest");

  var guestFav = JSON.parse(localStorage.getItem("aurumFavs_guest") || "[]");
  var userFav = JSON.parse(localStorage.getItem("aurumFavs_" + userId) || "[]");
  guestFav.forEach(function (id) { if (userFav.indexOf(id) === -1) userFav.push(id); });
  localStorage.setItem("aurumFavs_" + userId, JSON.stringify(userFav));
  localStorage.removeItem("aurumFavs_guest");
}

function setSession(userId) {
  mergeGuestInto(userId);
  localStorage.setItem("aurumSession", userId);
  currentUser = USERS.filter(function (u) { return u.id === userId; })[0] || null;
  loadCart(); loadFavs(); renderCart(); refreshAccountIcon();
}
function logout() {
  localStorage.removeItem("aurumSession");
  currentUser = null;
  loadCart(); loadFavs(); renderCart(); refreshAccountIcon();
  navigate("/");
}
function restoreSession() {
  var id = localStorage.getItem("aurumSession");
  if (id) currentUser = USERS.filter(function (u) { return u.id === id; })[0] || null;
}
function refreshAccountIcon() {
  var btn = document.getElementById("accountToggle");
  btn.title = currentUser ? ("Cuenta: " + currentUser.nombre) : "Iniciar sesión";
}

function registrar(nombre, correo, password) {
  if (findUserByEmail(correo)) return { ok: false, error: "Ya existe una cuenta con ese correo." };
  var user = { id: "u" + Date.now().toString(36), nombre: nombre, correo: correo.toLowerCase().trim(), passwordHash: simpleHash(password), direcciones: [], pedidos: [] };
  USERS.push(user); saveUsers();
  setSession(user.id);
  return { ok: true };
}
function iniciarSesion(correo, password) {
  var user = findUserByEmail(correo);
  if (!user || user.passwordHash !== simpleHash(password)) return { ok: false, error: "Correo o contraseña incorrectos." };
  setSession(user.id);
  return { ok: true };
}
function recuperarPassword(correo, nueva) {
  var user = findUserByEmail(correo);
  if (!user) return { ok: false, error: "No encontramos una cuenta con ese correo." };
  user.passwordHash = simpleHash(nueva);
  saveUsers();
  return { ok: true };
}

// ---------- Router ----------
function parseHash() { return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean); }
function navigate(hash) { location.hash = hash; }

function route() {
  var parts = parseHash();
  if (parts.length === 0) renderHome();
  else if (parts[0] === "categoria" && parts.length === 2) renderMaterialSelect(parts[1]);
  else if (parts[0] === "categoria" && parts.length === 4 && parts[2] === "material") renderListado(parts[1], parts[3]);
  else if (parts[0] === "producto" && parts.length === 2) renderFicha(parts[1]);
  else if (parts[0] === "buscar") renderBuscar(decodeURIComponent(parts.slice(1).join("/") || ""));
  else if (parts[0] === "favoritos") renderFavoritos();
  else if (parts[0] === "cuenta") renderCuenta();
  else renderHome();
  window.scrollTo(0, 0);
}

// ---------- Home ----------
function renderHome() {
  var catCards = CATEGORIES.map(function (c) {
    var count = PRODUCTS.filter(function (p) { return p.categoria === c.slug; }).length;
    return (
      '<button class="cat-card" data-nav="#/categoria/' + c.slug + '">' +
        '<div class="cat-visual">' + mediaWrap({ label: c.label, icon: c.icon, material: "oro-14k", catSlug: c.slug }) + '</div>' +
        '<div class="cat-body"><h3>' + c.label + '</h3><div class="cat-count">' + count + ' modelos</div><div class="cat-go">Ver materiales →</div></div>' +
      '</button>'
    );
  }).join("");

  appEl.innerHTML =
    '<section class="hero"><div class="wrap"><div>' +
      '<div class="eyebrow">Ley .925 · 10K · 14K</div>' +
      '<h1>Joyería en oro y plata que <span class="accent">perdura</span></h1>' +
      '<p class="lead">Cadenas, anillos, aretas, pulseras y piezas personalizadas. Elige categoría, material, largo y ancho — precio fijo, sin sorpresas.</p>' +
      '<div class="hero-ctas"><a href="#catalogo-inicio" class="btn-primary">Ver catálogo</a><button class="btn-ghost" data-action="open-cart">Ver mi carrito</button></div>' +
    '</div><div class="medallion-wrap">' +
      '<svg class="medallion" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e3c977"/><stop offset="50%" stop-color="#a9822f"/><stop offset="100%" stop-color="#e3c977"/></linearGradient>' +
        '<path id="circlePath" d="M 150,150 m -110,0 a 110,110 0 1,1 220,0 a 110,110 0 1,1 -220,0"/></defs>' +
        '<circle cx="150" cy="150" r="140" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>' +
        '<circle cx="150" cy="150" r="118" fill="none" stroke="#c8a24a" stroke-width="1" opacity="0.5"/>' +
        '<text font-family="IBM Plex Mono, monospace" font-size="12.5" letter-spacing="4" fill="#e3c977"><textPath href="#circlePath" startOffset="0%">AURUM &amp; LEY · ORO · PLATA · </textPath></text>' +
      '</svg>' +
      '<div class="medallion-static"><svg width="140" height="140" viewBox="0 0 150 150">' +
        '<circle cx="75" cy="75" r="70" fill="#1b1916" stroke="#c8a24a" stroke-width="1.5"/>' +
        '<text x="75" y="68" text-anchor="middle" font-family="Spectral SC, serif" font-size="30" fill="#e3c977">A&amp;L</text>' +
        '<text x="75" y="92" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="2" fill="#b9bec4">FINO · JOYERÍA</text>' +
      '</svg></div>' +
    '</div></div></section>' +
    '<div class="trust"><div class="wrap">' +
      '<div class="trust-item"><span class="mark">✓</span> Ley verificada por pieza</div>' +
      '<div class="trust-item"><span class="mark">$</span> Precio fijo por variante</div>' +
      '<div class="trust-item"><span class="mark">↻</span> Cambios dentro de 5 días</div>' +
      '<div class="trust-item"><span class="mark">→</span> Envío a todo México</div>' +
    '</div></div>' +
    '<section id="catalogo-inicio"><div class="wrap">' +
      '<div class="section-head"><h2>Catálogo por categoría</h2><p>Elige categoría, luego material — cada combinación tiene precio y disponibilidad propios.</p></div>' +
      '<div class="grid-categorias">' + catCards + '</div>' +
    '</div></section>' +
    '<div class="proceso"><div class="wrap">' +
      '<div class="section-head"><h2>Cómo comprar</h2><p>Del catálogo a tu puerta.</p></div>' +
      '<div class="steps">' +
        '<div class="step"><span class="step-num">01</span><h3>Elige</h3><p>Categoría, material, largo/ancho o talla.</p></div>' +
        '<div class="step"><span class="step-num">02</span><h3>Agrega</h3><p>Súmalo al carrito, ajusta cantidades.</p></div>' +
        '<div class="step"><span class="step-num">03</span><h3>Checkout</h3><p>Elige forma de pago y tu dirección.</p></div>' +
        '<div class="step"><span class="step-num">04</span><h3>Confirma</h3><p>Enviamos tu pedido por WhatsApp.</p></div>' +
      '</div>' +
    '</div></div>' +
    '<section class="cita"><div class="wrap">' +
      '<blockquote>"Cada pieza sale de tienda con su ley y su peso verificados frente al cliente."</blockquote>' +
      '<cite>— AURUM & LEY, joyería desde 2010</cite>' +
    '</div></section>';
}

// ---------- Selección de material ----------
function renderMaterialSelect(catSlug) {
  var cat = catBySlug(catSlug);
  if (!cat) { renderHome(); return; }
  var enCategoria = PRODUCTS.filter(function (p) { return p.categoria === catSlug; });

  var cards = MATERIALS.map(function (m) {
    var count = enCategoria.filter(function (p) { return p.variantes.some(function (v) { return v.material === m.slug; }); }).length;
    return (
      '<button class="mat-card" data-nav="#/categoria/' + catSlug + '/material/' + m.slug + '">' +
        '<div class="mat-icon">' + m.slug.slice(0, 2).toUpperCase() + '</div>' +
        '<h3>' + m.label + '</h3><p>' + m.desc + '</p>' +
        '<div class="mat-go">' + count + ' modelos disponibles →</div>' +
      '</button>'
    );
  }).join("");

  appEl.innerHTML =
    '<div class="wrap"><div class="breadcrumb"><a data-nav="#/">Inicio</a><span class="sep">/</span><span class="current">' + cat.label + '</span></div></div>' +
    '<div class="material-view wrap"><h1>' + cat.label + '</h1><p class="sub">¿En qué material deseas esta joya?</p>' +
    '<div class="grid-materiales">' + cards + '</div></div>';
}

// ---------- Tarjeta de producto reutilizable ----------
function productCardHTML(p, materialesFiltro, navHash) {
  var vs = variantesDe(p, materialesFiltro.length ? materialesFiltro : p.variantes.map(function (v) { return v.material; }));
  if (!vs.length) vs = p.variantes;
  var stockOff = !anyStock(vs);
  var isFav = favorites.indexOf(p.id) !== -1;
  return (
    '<div class="prod-card-wrap">' +
    '<button class="prod-card" data-nav="' + navHash + '">' +
      '<div class="prod-visual">' +
        (stockOff ? '<span class="stock-off">Agotado</span>' : '') +
        mediaWrap({ label: p.nombre, icon: p.icon, material: vs[0].material, catSlug: p.categoria }) +
      '</div>' +
      '<div class="prod-body">' +
        '<span class="prod-tag">' + p.categoriaLabel + '</span>' +
        '<h3>' + p.nombre + '</h3>' +
        '<div class="prod-meta-row"><span>' + vs.length + ' variante' + (vs.length === 1 ? '' : 's') + '</span></div>' +
        '<div class="prod-price">' + priceLabel(vs) + '</div>' +
      '</div>' +
    '</button>' +
    '<button class="fav-heart ' + (isFav ? "active" : "") + '" data-action="toggle-fav" data-id="' + p.id + '" aria-label="Favorito">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19s-6.5-4.2-6.5-9A3.8 3.8 0 0112 7.5 3.8 3.8 0 0118.5 10c0 4.8-6.5 9-6.5 9z"/></svg>' +
    '</button></div>'
  );
}

// ---------- Filtros compartidos ----------
function renderFiltrosPanel(key, opciones) {
  var f = listadoFiltros[key];
  var matChecks = MATERIALS.map(function (m) {
    var checked = f.materiales.indexOf(m.slug) !== -1 ? "checked" : "";
    return '<label class="filtro-check"><input type="checkbox" data-filtro="material" data-key="' + key + '" value="' + m.slug + '" ' + checked + '> ' + m.label + '</label>';
  }).join("");

  var catSelect = "";
  if (opciones.mostrarCategoria) {
    var opts = '<option value="">Todas</option>' + CATEGORIES.map(function (c) {
      return '<option value="' + c.slug + '" ' + (f.categoria === c.slug ? "selected" : "") + '>' + c.label + '</option>';
    }).join("");
    catSelect = '<h4>Categoría</h4><div class="filtro-grupo"><select data-filtro="categoria" data-key="' + key + '" class="field">' + opts + '</select></div>';
  }

  return (
    '<aside class="filtros">' +
      catSelect +
      '<h4>Material</h4><div class="filtro-grupo">' + matChecks + '</div>' +
      '<h4>Precio</h4><div class="filtro-grupo">' +
        '<input type="range" min="0" max="' + f.precioMax + '" value="' + f.precioTope + '" data-filtro="precio" data-key="' + key + '">' +
        '<div class="filtro-vals"><span>$0</span><span>hasta ' + money(f.precioTope) + '</span></div>' +
      '</div>' +
      '<h4>Peso</h4><div class="filtro-grupo">' +
        '<input type="range" min="0" max="' + f.pesoMax + '" step="0.5" value="' + f.pesoTope + '" data-filtro="peso" data-key="' + key + '">' +
        '<div class="filtro-vals"><span>0 g</span><span>hasta ' + f.pesoTope + ' g</span></div>' +
      '</div>' +
      (f.largoMax ? ('<h4>Largo</h4><div class="filtro-grupo">' +
        '<input type="range" min="0" max="' + f.largoMax + '" value="' + f.largoTope + '" data-filtro="largo" data-key="' + key + '">' +
        '<div class="filtro-vals"><span>0 cm</span><span>hasta ' + f.largoTope + ' cm</span></div></div>') : '') +
      '<div class="filtro-grupo"><label class="filtro-check"><input type="checkbox" data-filtro="disponible" data-key="' + key + '" ' + (f.soloDisponibles ? "checked" : "") + '> Solo disponibles</label></div>' +
      '<button class="filtro-reset" data-action="reset-filtros" data-key="' + key + '">Limpiar filtros</button>' +
    '</aside>'
  );
}

function initFiltros(key, baseList) {
  if (listadoFiltros[key]) return;
  var todasVariantes = [];
  baseList.forEach(function (p) { todasVariantes = todasVariantes.concat(p.variantes); });
  var precios = todasVariantes.map(function (v) { return v.precio; });
  var pesos = todasVariantes.map(function (v) { return v.peso; });
  var largos = todasVariantes.map(function (v) { return v.largo; }).filter(function (l) { return l !== null; });
  listadoFiltros[key] = {
    materiales: MATERIALS.map(function (m) { return m.slug; }),
    categoria: "",
    precioMax: precios.length ? Math.max.apply(null, precios) : 1000,
    precioTope: precios.length ? Math.max.apply(null, precios) : 1000,
    pesoMax: pesos.length ? Math.max.apply(null, pesos) : 50,
    pesoTope: pesos.length ? Math.max.apply(null, pesos) : 50,
    largoMax: largos.length ? Math.max.apply(null, largos) : 0,
    largoTope: largos.length ? Math.max.apply(null, largos) : 0,
    soloDisponibles: false
  };
}

function aplicaFiltros(p, f) {
  return p.variantes.filter(function (v) {
    if (f.materiales.indexOf(v.material) === -1) return false;
    if (v.precio > f.precioTope) return false;
    if (v.peso > f.pesoTope) return false;
    if (v.largo !== null && f.largoMax && v.largo > f.largoTope) return false;
    if (f.soloDisponibles && !v.stock) return false;
    return true;
  });
}

// ---------- Listado por categoría + material ----------
function renderListado(catSlug, matSlug) {
  var cat = catBySlug(catSlug), mat = matBySlug(matSlug);
  if (!cat || !mat) { renderHome(); return; }
  var key = "cat:" + catSlug;
  var baseList = PRODUCTS.filter(function (p) { return p.categoria === catSlug; });
  initFiltros(key, baseList);
  if (listadoFiltros[key]._matInit !== matSlug) {
    listadoFiltros[key].materiales = [matSlug];
    listadoFiltros[key]._matInit = matSlug;
  }
  var f = listadoFiltros[key];
  var results = baseList.map(function (p) { return { p: p, vs: aplicaFiltros(p, f) }; }).filter(function (r) { return r.vs.length; });
  var cards = results.map(function (r) { return productCardHTML(r.p, f.materiales, "#/producto/" + r.p.id); }).join("");

  appEl.innerHTML =
    '<div class="wrap"><div class="breadcrumb"><a data-nav="#/">Inicio</a><span class="sep">/</span><a data-nav="#/categoria/' + catSlug + '">' + cat.label + '</a><span class="sep">/</span><span class="current">' + mat.label + '</span></div></div>' +
    '<div class="listado wrap">' +
      '<div class="listado-head"><h1>' + cat.label + ' · ' + mat.label + '</h1><span class="count">' + results.length + ' resultado' + (results.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="listado-layout">' + renderFiltrosPanel(key, { mostrarCategoria: false }) +
        '<div class="grid-productos">' + (results.length ? cards : '<div class="no-results">No hay piezas con estos filtros. Prueba ampliar el rango de precio o peso.</div>') + '</div>' +
      '</div>' +
    '</div>';
}

// ---------- Buscador / catálogo completo ----------
function renderBuscar(query) {
  var key = "buscar:" + query;
  var q = (query || "").toLowerCase().trim();
  var baseList = !q ? PRODUCTS.slice() : PRODUCTS.filter(function (p) {
    if (p.nombre.toLowerCase().indexOf(q) !== -1) return true;
    if (p.categoriaLabel.toLowerCase().indexOf(q) !== -1) return true;
    return p.variantes.some(function (v) { return v.materialLabel.toLowerCase().indexOf(q) !== -1; });
  });
  initFiltros(key, baseList);
  var f = listadoFiltros[key];
  var listaCat = f.categoria ? baseList.filter(function (p) { return p.categoria === f.categoria; }) : baseList;
  var results = listaCat.map(function (p) { return { p: p, vs: aplicaFiltros(p, f) }; }).filter(function (r) { return r.vs.length; });
  var cards = results.map(function (r) { return productCardHTML(r.p, f.materiales, "#/producto/" + r.p.id); }).join("");
  var titulo = q ? ('Resultados para "' + query + '"') : "Todo el catálogo";

  appEl.innerHTML =
    '<div class="wrap"><div class="breadcrumb"><a data-nav="#/">Inicio</a><span class="sep">/</span><span class="current">' + titulo + '</span></div></div>' +
    '<div class="listado wrap">' +
      '<div class="listado-head"><h1>' + titulo + '</h1><span class="count">' + results.length + ' resultado' + (results.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="listado-layout">' + renderFiltrosPanel(key, { mostrarCategoria: true }) +
        '<div class="grid-productos">' + (results.length ? cards : '<div class="no-results">No encontramos piezas con esa búsqueda o esos filtros.</div>') + '</div>' +
      '</div>' +
    '</div>';
}

// ---------- Favoritos ----------
function renderFavoritos() {
  var lista = favorites.map(productById).filter(Boolean);
  var cards = lista.map(function (p) { return productCardHTML(p, [], "#/producto/" + p.id); }).join("");
  appEl.innerHTML =
    '<div class="wrap"><div class="breadcrumb"><a data-nav="#/">Inicio</a><span class="sep">/</span><span class="current">Favoritos</span></div></div>' +
    '<div class="listado wrap">' +
      '<div class="listado-head"><h1>Tus favoritos</h1><span class="count">' + lista.length + ' pieza' + (lista.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="grid-productos">' + (lista.length ? cards : '<div class="no-results">Aún no agregas piezas a favoritos — toca el corazón en cualquier producto.</div>') + '</div>' +
    '</div>';
}

// ---------- Ficha de producto ----------
function initSel(p) {
  var v0 = p.variantes[0];
  return { material: v0.material, largo: v0.largo, ancho: v0.ancho, talla: v0.talla };
}
function pillGroup(field, opciones, seleccionado, sufijo) {
  return opciones.map(function (op) {
    var sel = op === seleccionado ? "selected" : "";
    return '<button type="button" class="pill ' + sel + '" data-vfield="' + field + '" data-vval="' + op + '">' + op + (sufijo || '') + '</button>';
  }).join("");
}

function renderFicha(id) {
  var p = productById(id);
  if (!p) { renderHome(); return; }

  var sel = fichaSelByProduct[id] || initSel(p);
  var materiales = uniq(p.variantes.map(function (v) { return v.material; }));
  if (materiales.indexOf(sel.material) === -1) sel.material = materiales[0];

  var largos = uniq(p.variantes.filter(function (v) { return v.material === sel.material && v.largo !== null; }).map(function (v) { return v.largo; })).sort(function (a, b) { return a - b; });
  if (largos.length && largos.indexOf(sel.largo) === -1) sel.largo = largos[0];

  var anchos = uniq(p.variantes.filter(function (v) { return v.material === sel.material && v.largo === sel.largo && v.ancho !== null; }).map(function (v) { return v.ancho; })).sort(function (a, b) { return a - b; });
  if (anchos.length && anchos.indexOf(sel.ancho) === -1) sel.ancho = anchos[0];

  var tallas = uniq(p.variantes.filter(function (v) { return v.material === sel.material && v.talla !== null; }).map(function (v) { return v.talla; })).sort(function (a, b) { return a - b; });
  if (tallas.length && tallas.indexOf(sel.talla) === -1) sel.talla = tallas[0];

  fichaSelByProduct[id] = sel;

  var variant = p.variantes.filter(function (v) {
    return v.material === sel.material &&
      (largos.length ? v.largo === sel.largo : true) &&
      (anchos.length ? v.ancho === sel.ancho : true) &&
      (tallas.length ? v.talla === sel.talla : true);
  })[0] || p.variantes.filter(function (v) { return v.material === sel.material; })[0];

  var thumbs = p.imagenes.map(function (tag, i) {
    var thumbInner = i === 0 ? mediaWrap({ label: p.nombre, icon: p.icon, material: variant.material, catSlug: p.categoria }) : placeholderSVG({ label: p.nombre, icon: p.icon, material: variant.material, size: 40, variant: i });
    return '<button class="thumb ' + (i === 0 ? "active" : "") + '" data-thumb="' + i + '" data-tag="' + tag + '">' + thumbInner + '</button>';
  }).join("");

  var relacionados = PRODUCTS.filter(function (rp) { return rp.categoria === p.categoria && rp.id !== p.id; }).slice(0, 4);
  var relCards = relacionados.map(function (rp) { return productCardHTML(rp, [], "#/producto/" + rp.id); }).join("");

  var isFav = favorites.indexOf(p.id) !== -1;
  var reviews = getReviews(p.id);
  var avg = reviews.length ? (reviews.reduce(function (s, r) { return s + r.estrellas; }, 0) / reviews.length) : 0;

  appEl.innerHTML =
    '<div class="wrap"><div class="breadcrumb">' +
      '<a data-nav="#/">Inicio</a><span class="sep">/</span>' +
      '<a data-nav="#/categoria/' + p.categoria + '">' + p.categoriaLabel + '</a><span class="sep">/</span>' +
      '<span class="current">' + p.nombre + '</span>' +
    '</div></div>' +
    '<div class="ficha wrap" data-product-id="' + p.id + '">' +
      '<div class="ficha-layout">' +
        '<div>' +
          '<div class="galeria-main" id="galeriaMain" data-action="toggle-zoom">' + mediaWrap({ label: p.nombre, icon: p.icon, material: variant.material, catSlug: p.categoria, size: 260 }) + '</div>' +
          '<div class="galeria-tag" id="galeriaTag">Vista: ' + p.imagenes[0] + '</div>' +
          '<div class="galeria-thumbs">' + thumbs + '</div>' +
        '</div>' +
        '<div class="ficha-info">' +
          '<span class="prod-tag">' + p.categoriaLabel + '</span>' +
          '<h1>' + p.nombre + '</h1>' +
          (reviews.length ? '<div class="stars" style="margin-bottom:14px;">' + starsHTML(avg) + ' <span style="color:var(--ivory-dim);font-family:\'IBM Plex Mono\',monospace;font-size:12px;">(' + reviews.length + ')</span></div>' : '') +
          '<div class="ficha-price">' + money(variant.precio) + '</div>' +
          '<div class="variante-grupo"><h4>Material</h4><div class="variante-pills">' +
            materiales.map(function (m) { return '<button type="button" class="pill ' + (m === sel.material ? "selected" : "") + '" data-vfield="material" data-vval="' + m + '">' + matBySlug(m).label + '</button>'; }).join("") +
          '</div></div>' +
          (largos.length ? '<div class="variante-grupo"><h4>Largo</h4><div class="variante-pills">' + pillGroup("largo", largos, sel.largo, " cm") + '</div></div>' : '') +
          (anchos.length ? '<div class="variante-grupo"><h4>Ancho</h4><div class="variante-pills">' + pillGroup("ancho", anchos, sel.ancho, " mm") + '</div></div>' : '') +
          (tallas.length ? '<div class="variante-grupo"><h4>Talla</h4><div class="variante-pills">' + pillGroup("talla", tallas, sel.talla, "") + '</div></div>' : '') +
          '<div class="variante-codigo">Código: ' + variant.codigo + '</div>' +
          '<p class="ficha-desc">' + p.descripcion + '</p>' +
          '<div class="ficha-disponibilidad"><span class="dot ' + (variant.stock ? "ok" : "off") + '"></span>' + (variant.stock ? "Disponible, envío en 2-4 días hábiles" : "Agotado en esta variante, disponible bajo pedido (10-15 días)") + '</div>' +
          '<div class="specs">' +
            '<div class="spec-row"><span>Peso</span><span>' + variant.peso + ' g</span></div>' +
            (variant.largo ? '<div class="spec-row"><span>Largo</span><span>' + variant.largo + ' cm</span></div>' : '') +
            (variant.ancho ? '<div class="spec-row"><span>Ancho</span><span>' + variant.ancho + ' mm</span></div>' : '') +
            (variant.talla ? '<div class="spec-row"><span>Talla</span><span>' + variant.talla + '</span></div>' : '') +
            '<div class="spec-row"><span>Garantía</span><span>' + p.garantia + '</span></div>' +
          '</div>' +
          '<div class="ficha-qty"><span class="mono" style="font-size:12px;color:var(--ivory-dim);">Cantidad</span>' +
            '<div class="qty-ctrl" id="fichaQty" data-qty="1"><button data-action="ficha-qty-dec">−</button><span id="fichaQtyVal">1</span><button data-action="ficha-qty-inc">+</button></div>' +
          '</div>' +
          '<div class="ficha-actions">' +
            '<button class="btn-primary" data-action="add-cart" data-codigo="' + variant.codigo + '" ' + (variant.stock ? "" : "disabled") + '>Agregar al carrito</button>' +
            '<button class="btn-ghost" data-action="buy-now" data-codigo="' + variant.codigo + '" ' + (variant.stock ? "" : "disabled") + '>Comprar ahora</button>' +
            '<button class="ficha-fav ' + (isFav ? "active" : "") + '" data-action="toggle-fav" data-id="' + p.id + '">' + (isFav ? "♥ En favoritos" : "♡ Agregar a favoritos") + '</button>' +
          '</div>' +
          '<a class="wa-inline" data-action="wa-product" data-codigo="' + variant.codigo + '" href="#">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.06-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" opacity="0"/></svg>Preguntar por WhatsApp' +
          '</a>' +
        '</div>' +
      '</div>' +
      (relCards ? '<div class="relacionados"><h2>También te puede interesar</h2><div class="grid-productos">' + relCards + '</div></div>' : '') +
      renderResenasHTML(p.id) +
    '</div>';
}

// ---------- Reseñas ----------
function reviewsKey(pid) { return "aurumReviews_" + pid; }
function getReviews(pid) { try { return JSON.parse(localStorage.getItem(reviewsKey(pid))) || []; } catch (e) { return []; } }
function saveReviews(pid, list) { try { localStorage.setItem(reviewsKey(pid), JSON.stringify(list)); } catch (e) {} }
function starsHTML(n) {
  var full = Math.round(n), html = "";
  for (var i = 1; i <= 5; i++) html += '<span class="' + (i > full ? "off" : "") + '">★</span>';
  return html;
}
function renderResenasHTML(pid) {
  var reviews = getReviews(pid);
  var avg = reviews.length ? (reviews.reduce(function (s, r) { return s + r.estrellas; }, 0) / reviews.length) : 0;
  var lista = reviews.slice().reverse().map(function (r) {
    return '<div class="resena-item"><div class="stars">' + starsHTML(r.estrellas) + '</div><div class="resena-meta">' + r.nombre + ' · ' + r.fecha + '</div><p>' + r.comentario + '</p>' + (r.foto ? '<img class="resena-foto" src="' + r.foto + '" alt="Foto de cliente">' : '') + '</div>';
  }).join("");

  return (
    '<div class="resenas">' +
      '<div class="resenas-head">' +
        (reviews.length ? '<div class="resenas-avg">' + avg.toFixed(1) + '</div><div><div class="stars">' + starsHTML(avg) + '</div><div class="mono" style="font-size:12px;color:var(--ivory-dim);">' + reviews.length + ' reseña' + (reviews.length === 1 ? '' : 's') + '</div></div>' : '<h2 style="font-size:22px;">Reseñas</h2>') +
      '</div>' +
      (reviews.length ? lista : '<p class="empty-panel">Aún no hay reseñas de esta pieza.</p>') +
      '<div class="resena-form"><h4 class="serif">Deja tu reseña</h4>' +
        '<div class="star-input" id="starInput">' + [1, 2, 3, 4, 5].map(function (n) { return '<span data-star="' + n + '">★</span>'; }).join("") + '</div>' +
        (currentUser ? '' : '<div class="field" style="margin-bottom:12px;"><label>Tu nombre</label><input id="resenaNombre" placeholder="Nombre"></div>') +
        '<div class="field" style="margin-bottom:12px;"><label>Comentario</label><textarea id="resenaComentario" placeholder="¿Qué te pareció la pieza?"></textarea></div>' +
        '<div class="field" style="margin-bottom:16px;"><label>Foto (opcional)</label><input type="file" id="resenaFoto" accept="image/*"></div>' +
        '<button class="btn-primary btn-sm" id="resenaEnviar" data-pid="' + pid + '">Publicar reseña</button>' +
      '</div>' +
    '</div>'
  );
}

// ---------- Carrito ----------
function cartCount() { var n = 0; Object.keys(cart).forEach(function (k) { n += cart[k]; }); return n; }
function cartSubtotal() { var sum = 0; Object.keys(cart).forEach(function (k) { var vi = VARIANT_INDEX[k]; if (vi) sum += vi.variant.precio * cart[k]; }); return sum; }
function cartShipping() { var sub = cartSubtotal(); if (sub === 0) return 0; return sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT; }
function addToCart(codigo, qty) { qty = qty || 1; cart[codigo] = (cart[codigo] || 0) + qty; saveCart(); renderCart(); }
function setQty(codigo, qty) { if (qty <= 0) delete cart[codigo]; else cart[codigo] = qty; saveCart(); renderCart(); }
function removeFromCart(codigo) { delete cart[codigo]; saveCart(); renderCart(); }

function renderCart() {
  var keys = Object.keys(cart);
  var count = cartCount();
  cartBadge.style.display = count > 0 ? "flex" : "none";
  cartBadge.textContent = count;

  if (keys.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Tu carrito está vacío. Explora el catálogo y agrega alguna pieza.</p>';
  } else {
    cartItemsEl.innerHTML = keys.map(function (codigo) {
      var vi = VARIANT_INDEX[codigo];
      if (!vi) return "";
      var p = vi.product, v = vi.variant, qty = cart[codigo];
      var detalle = [v.materialLabel, v.largo ? v.largo + " cm" : null, v.ancho ? v.ancho + " mm" : null, v.talla ? "Talla " + v.talla : null].filter(Boolean).join(" · ");
      return (
        '<div class="cart-item">' +
          '<div class="cart-item-thumb">' + mediaWrap({ label: p.nombre, icon: p.icon, material: v.material, catSlug: p.categoria, size: 40 }) + '</div>' +
          '<div><div class="cart-item-name">' + p.nombre + '</div><div class="cart-item-meta">' + detalle + ' · ' + money(v.precio) + ' c/u</div>' +
            '<button class="cart-item-remove" data-action="cart-remove" data-codigo="' + codigo + '">Quitar</button></div>' +
          '<div class="qty-ctrl"><button data-action="cart-dec" data-codigo="' + codigo + '">−</button><span>' + qty + '</span><button data-action="cart-inc" data-codigo="' + codigo + '">+</button></div>' +
        '</div>'
      );
    }).join("");
  }

  var sub = cartSubtotal(), ship = cartShipping();
  cartSubtotalRow.textContent = money(sub);
  cartShippingRow.textContent = sub === 0 ? "—" : (ship === 0 ? "Gratis" : money(ship));
  cartTotalRow.textContent = money(sub + ship);
}
function openCart() { cartDrawer.classList.add("open"); cartOverlay.classList.add("open"); }
function closeCart() { cartDrawer.classList.remove("open"); cartOverlay.classList.remove("open"); }

// ---------- Checkout ----------
function openCheckout() {
  if (cartCount() === 0) return;
  checkoutStep = 1; checkoutMetodoPago = null;
  renderCheckout(); closeCart(); checkoutOverlay.classList.add("open");
}
function closeCheckout() { checkoutOverlay.classList.remove("open"); }
function checkoutSummaryHTML() {
  var sub = cartSubtotal(), ship = cartShipping();
  return '<div class="checkout-summary"><div class="cart-line"><span>Subtotal (' + cartCount() + ' piezas)</span><span class="amt">' + money(sub) + '</span></div>' +
    '<div class="cart-line"><span>Envío</span><span class="amt">' + (ship === 0 ? "Gratis" : money(ship)) + '</span></div>' +
    '<div class="cart-line total"><span>Total</span><span class="amt">' + money(sub + ship) + '</span></div></div>';
}

function renderCheckout() {
  var modal = checkoutOverlay.querySelector(".checkout-modal");
  if (checkoutStep === 1) {
    var opts = PAGO_OPTS.map(function (o) {
      return '<button class="pago-opt ' + (checkoutMetodoPago === o.id ? "selected" : "") + '" data-pago="' + o.id + '"><div class="pago-name">' + o.name + '</div><div class="pago-desc">' + o.desc + '</div></button>';
    }).join("");
    modal.innerHTML =
      '<div class="checkout-head"><h2 class="serif">Finalizar pedido</h2><button class="checkout-close" data-action="close-checkout">&times;</button></div>' +
      '<div class="checkout-steps-label">Paso 1 de 2 · Método de pago</div>' +
      '<div class="pago-grid">' + opts + '</div>' + checkoutSummaryHTML() +
      '<div class="checkout-actions"><span></span><button class="btn-primary" id="checkoutContinuar" ' + (checkoutMetodoPago ? "" : "disabled") + '>Continuar</button></div>';
  } else {
    var direccionesHTML = "";
    if (currentUser && currentUser.direcciones.length) {
      direccionesHTML = '<div class="field"><label>Dirección guardada</label><select id="ckDireccionSel"><option value="">Escribir una nueva dirección</option>' +
        currentUser.direcciones.map(function (d) { return '<option value="' + d.id + '">' + d.etiqueta + ' — ' + d.direccion + '</option>'; }).join("") + '</select></div>';
    }
    modal.innerHTML =
      '<div class="checkout-head"><h2 class="serif">Finalizar pedido</h2><button class="checkout-close" data-action="close-checkout">&times;</button></div>' +
      '<div class="checkout-steps-label">Paso 2 de 2 · Datos de envío</div>' +
      '<form id="checkoutForm">' +
        '<div class="field-row"><div class="field"><label for="ckNombre">Nombre</label><input id="ckNombre" required value="' + (currentUser ? currentUser.nombre : "") + '"></div>' +
        '<div class="field"><label for="ckTelefono">Teléfono</label><input id="ckTelefono" required></div></div>' +
        '<div class="field"><label for="ckCorreo">Correo</label><input id="ckCorreo" type="email" value="' + (currentUser ? currentUser.correo : "") + '"></div>' +
        direccionesHTML +
        '<div class="field"><label for="ckDireccion">Dirección</label><input id="ckDireccion" required></div>' +
        '<div class="field-row"><div class="field"><label for="ckCiudad">Ciudad</label><input id="ckCiudad" required></div>' +
        '<div class="field"><label for="ckCP">Código postal</label><input id="ckCP" required></div></div>' +
        (currentUser ? '<label class="filtro-check" style="margin-bottom:16px;"><input type="checkbox" id="ckGuardarDir"> Guardar esta dirección en mi cuenta</label>' : '') +
        '<div class="field"><label for="ckNotas">Notas del pedido</label><textarea id="ckNotas" placeholder="Tallas, grabados, referencias de entrega..."></textarea></div>' +
      '</form>' + checkoutSummaryHTML() +
      '<div class="checkout-actions"><button class="checkout-back" id="checkoutRegresar">← Regresar</button>' +
        '<button class="wa-send" id="checkoutEnviar"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.06-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>Enviar pedido por WhatsApp</button></div>';

    if (currentUser && currentUser.direcciones.length) {
      document.getElementById("ckDireccionSel").addEventListener("change", function (e) {
        var d = currentUser.direcciones.filter(function (x) { return x.id === e.target.value; })[0];
        if (d) { document.getElementById("ckDireccion").value = d.direccion; document.getElementById("ckCiudad").value = d.ciudad; document.getElementById("ckCP").value = d.cp; }
      });
    }
  }
}

function buildOrderMessage(datos, items) {
  var lines = ["Hola, quiero confirmar mi pedido:", ""];
  items.forEach(function (it) { lines.push("• " + it.qty + "x " + it.nombre + " (" + it.detalle + ") — " + money(it.precio * it.qty)); });
  lines.push("", "Subtotal: " + money(datos.subtotal), "Envío: " + (datos.envio === 0 ? "Gratis" : money(datos.envio)), "Total: " + money(datos.total));
  lines.push("", "Forma de pago: " + datos.metodoPagoLabel);
  lines.push("", "Nombre: " + datos.nombre, "Teléfono: " + datos.telefono);
  if (datos.correo) lines.push("Correo: " + datos.correo);
  lines.push("Dirección: " + datos.direccion + ", " + datos.ciudad + ", CP " + datos.cp);
  if (datos.notas) lines.push("Notas: " + datos.notas);
  return lines.join("\n");
}

function finalizarCheckout() {
  var form = document.getElementById("checkoutForm");
  if (!form.checkValidity()) { form.reportValidity(); return; }

  var items = Object.keys(cart).map(function (codigo) {
    var vi = VARIANT_INDEX[codigo], v = vi.variant, p = vi.product;
    var detalle = [v.materialLabel, v.largo ? v.largo + " cm" : null, v.ancho ? v.ancho + " mm" : null, v.talla ? "Talla " + v.talla : null].filter(Boolean).join(" · ");
    return { nombre: p.nombre, detalle: detalle, precio: v.precio, qty: cart[codigo] };
  });

  var sub = cartSubtotal(), ship = cartShipping();
  var pago = PAGO_OPTS.filter(function (o) { return o.id === checkoutMetodoPago; })[0];
  var datos = {
    nombre: document.getElementById("ckNombre").value.trim(),
    telefono: document.getElementById("ckTelefono").value.trim(),
    correo: document.getElementById("ckCorreo").value.trim(),
    direccion: document.getElementById("ckDireccion").value.trim(),
    ciudad: document.getElementById("ckCiudad").value.trim(),
    cp: document.getElementById("ckCP").value.trim(),
    notas: document.getElementById("ckNotas").value.trim(),
    subtotal: sub, envio: ship, total: sub + ship,
    metodoPagoLabel: pago ? pago.name : ""
  };

  if (currentUser) {
    var guardar = document.getElementById("ckGuardarDir");
    if (guardar && guardar.checked) {
      currentUser.direcciones.push({ id: "d" + Date.now().toString(36), etiqueta: "Dirección " + (currentUser.direcciones.length + 1), direccion: datos.direccion, ciudad: datos.ciudad, cp: datos.cp, predeterminada: false });
    }
    currentUser.pedidos.push({ id: "o" + Date.now().toString(36), fecha: new Date().toLocaleDateString("es-MX"), items: items, subtotal: sub, envio: ship, total: sub + ship, metodoPago: datos.metodoPagoLabel, direccion: datos.direccion + ", " + datos.ciudad + ", CP " + datos.cp });
    saveUsers();
  }

  var msg = buildOrderMessage(datos, items);
  window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
  cart = {}; saveCart(); renderCart(); closeCheckout(); navigate("/");
}

// ---------- Autenticación (modal) ----------
function renderAuthModal(view) {
  authView = view;
  var html = "";
  if (view === "login") {
    html =
      '<div class="auth-head"><h2 class="serif">Inicia sesión</h2><button class="auth-close" data-action="close-auth">&times;</button></div>' +
      '<p class="auth-error" id="authError"></p>' +
      '<div class="field" style="margin-bottom:14px;"><label>Correo</label><input id="authCorreo" type="email"></div>' +
      '<div class="field" style="margin-bottom:6px;"><label>Contraseña</label><input id="authPassword" type="password"></div>' +
      '<div class="auth-forgot"><a data-authview="recuperar">¿Olvidaste tu contraseña?</a></div>' +
      '<button class="btn-primary" style="width:100%;margin-top:10px;" id="authSubmit">Entrar</button>' +
      '<button class="auth-google" id="authGoogle"><svg width="16" height="16" viewBox="0 0 24 24"><path fill="#e3c977" d="M12 11v2.8h6.5c-.3 1.6-2.1 4.7-6.5 4.7-3.9 0-7-3.2-7-7.2s3.1-7.2 7-7.2c2.2 0 3.7.9 4.5 1.7l3-2.9C17.6 1 15 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2H12z"/></svg>Continuar con Google</button>' +
      '<p class="auth-switch">¿No tienes cuenta? <a data-authview="registro">Crear cuenta</a> · <a data-action="guest-checkout">Comprar como invitado</a></p>';
  } else if (view === "registro") {
    html =
      '<div class="auth-head"><h2 class="serif">Crear cuenta</h2><button class="auth-close" data-action="close-auth">&times;</button></div>' +
      '<p class="auth-error" id="authError"></p>' +
      '<div class="field" style="margin-bottom:14px;"><label>Nombre</label><input id="authNombre"></div>' +
      '<div class="field" style="margin-bottom:14px;"><label>Correo</label><input id="authCorreo" type="email"></div>' +
      '<div class="field" style="margin-bottom:6px;"><label>Contraseña</label><input id="authPassword" type="password"></div>' +
      '<button class="btn-primary" style="width:100%;margin-top:10px;" id="authSubmit">Crear cuenta</button>' +
      '<p class="auth-switch">¿Ya tienes cuenta? <a data-authview="login">Inicia sesión</a> · <a data-action="guest-checkout">Comprar como invitado</a></p>' +
      '<p class="auth-note">Tu contraseña se guarda solo en este navegador (localStorage), no en un servidor. No la reutilices de otras cuentas importantes.</p>';
  } else {
    html =
      '<div class="auth-head"><h2 class="serif">Recuperar contraseña</h2><button class="auth-close" data-action="close-auth">&times;</button></div>' +
      '<p class="auth-error" id="authError"></p>' +
      '<div class="field" style="margin-bottom:14px;"><label>Correo</label><input id="authCorreo" type="email"></div>' +
      '<div class="field" style="margin-bottom:6px;"><label>Nueva contraseña</label><input id="authPassword" type="password"></div>' +
      '<button class="btn-primary" style="width:100%;margin-top:10px;" id="authSubmit">Restablecer</button>' +
      '<p class="auth-switch"><a data-authview="login">Volver a iniciar sesión</a></p>' +
      '<p class="auth-note">Como esta demo no tiene servidor de correo, la contraseña se restablece directamente aquí. En un sitio real esto llegaría por un enlace enviado a tu correo.</p>';
  }
  authModal.innerHTML = html;
}
function openAuth(view) { renderAuthModal(view || "login"); authOverlay.classList.add("open"); }
function closeAuth() { authOverlay.classList.remove("open"); }
function showAuthError(msg) { var e = document.getElementById("authError"); e.textContent = msg; e.classList.add("show"); }

// ---------- Panel de cuenta ----------
function renderCuenta() {
  if (!currentUser) {
    appEl.innerHTML = '<div class="cuenta-view wrap"><div class="empty-panel">Inicia sesión para ver tu cuenta.<br><br><button class="btn-primary btn-sm" data-action="open-login">Iniciar sesión</button></div></div>';
    return;
  }
  var tabs = [["pedidos", "Mis pedidos"], ["favoritos", "Mis favoritos"], ["direcciones", "Mis direcciones"], ["perfil", "Mi perfil"], ["password", "Cambiar contraseña"]];
  var navHTML = tabs.map(function (t) { return '<button class="' + (cuentaTab === t[0] ? "active" : "") + '" data-cuenta-tab="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '<button data-action="logout">Cerrar sesión</button>';

  var panel = "";
  if (cuentaTab === "pedidos") {
    panel = currentUser.pedidos.length ? currentUser.pedidos.slice().reverse().map(function (o) {
      var items = o.items.map(function (it) { return it.qty + "x " + it.nombre + " (" + it.detalle + ")"; }).join(", ");
      return '<div class="pedido-card"><div class="pedido-head"><span>' + o.id + ' · ' + o.fecha + '</span><span>' + o.metodoPago + '</span></div><div class="pedido-items">' + items + '</div><div class="pedido-items">Envío a: ' + o.direccion + '</div><div class="pedido-total">' + money(o.total) + '</div></div>';
    }).join("") : '<p class="empty-panel">Aún no tienes pedidos.</p>';
  } else if (cuentaTab === "favoritos") {
    var favs = favorites.map(productById).filter(Boolean);
    panel = favs.length ? '<div class="grid-productos">' + favs.map(function (p) { return productCardHTML(p, [], "#/producto/" + p.id); }).join("") + '</div>' : '<p class="empty-panel">No tienes favoritos guardados.</p>';
  } else if (cuentaTab === "direcciones") {
    panel = currentUser.direcciones.length ? currentUser.direcciones.map(function (d) {
      return '<div class="direccion-card"><div><div class="etiqueta">' + d.etiqueta + '</div>' + d.direccion + ', ' + d.ciudad + ', CP ' + d.cp + '</div><div class="direccion-actions"><button data-action="del-direccion" data-id="' + d.id + '">Eliminar</button></div></div>';
    }).join("") : '<p class="empty-panel">No tienes direcciones guardadas. Se agregan automáticamente al finalizar una compra.</p>';
  } else if (cuentaTab === "perfil") {
    panel = '<form id="perfilForm" style="max-width:420px;"><div class="field" style="margin-bottom:14px;"><label>Nombre</label><input id="perfilNombre" value="' + currentUser.nombre + '"></div>' +
      '<div class="field" style="margin-bottom:16px;"><label>Correo</label><input id="perfilCorreo" type="email" value="' + currentUser.correo + '"></div>' +
      '<button class="btn-primary btn-sm" id="perfilGuardar">Guardar cambios</button></form>';
  } else if (cuentaTab === "password") {
    panel = '<form id="passForm" style="max-width:420px;"><div class="field" style="margin-bottom:14px;"><label>Contraseña actual</label><input id="passActual" type="password"></div>' +
      '<div class="field" style="margin-bottom:16px;"><label>Nueva contraseña</label><input id="passNueva" type="password"></div>' +
      '<p class="auth-error" id="passError"></p><button class="btn-primary btn-sm" id="passGuardar">Actualizar contraseña</button></form>';
  }

  appEl.innerHTML = '<div class="cuenta-view wrap"><div class="cuenta-layout"><nav class="cuenta-nav">' + navHTML + '</nav>' +
    '<div class="cuenta-panel"><h2>Hola, ' + currentUser.nombre + '</h2>' + panel + '</div></div></div>';
}

// ---------- Eventos ----------
function bindEvents() {
  document.body.addEventListener("click", function (e) {
    var navEl = e.target.closest("[data-nav]");
    if (navEl) { e.preventDefault(); navigate(navEl.getAttribute("data-nav").replace("#", "")); return; }

    var authViewEl = e.target.closest("[data-authview]");
    if (authViewEl) { renderAuthModal(authViewEl.getAttribute("data-authview")); return; }

    var cuentaTabEl = e.target.closest("[data-cuenta-tab]");
    if (cuentaTabEl) { cuentaTab = cuentaTabEl.getAttribute("data-cuenta-tab"); renderCuenta(); return; }

    var vfield = e.target.closest("[data-vfield]");
    if (vfield) {
      var pidEl = e.target.closest("[data-product-id]");
      var pid = pidEl.getAttribute("data-product-id");
      var field = vfield.getAttribute("data-vfield");
      var raw = vfield.getAttribute("data-vval");
      var val = field === "material" ? raw : parseFloat(raw);
      var sel = fichaSelByProduct[pid];
      sel[field] = val;
      if (field === "material") { sel.largo = null; sel.ancho = null; sel.talla = null; }
      if (field === "largo") sel.ancho = null;
      renderFicha(pid);
      return;
    }

    var thumb = e.target.closest("[data-thumb]");
    if (thumb) {
      var galEl = e.target.closest("[data-product-id]");
      var gp = productById(galEl.getAttribute("data-product-id"));
      var gsel = fichaSelByProduct[gp.id];
      var gv = gp.variantes.filter(function (v) { return v.material === gsel.material; })[0] || gp.variantes[0];
      var idx = parseInt(thumb.getAttribute("data-thumb"), 10);
      document.querySelectorAll(".thumb").forEach(function (t) { t.classList.remove("active"); });
      thumb.classList.add("active");
      document.getElementById("galeriaTag").textContent = "Vista: " + thumb.getAttribute("data-tag");
      var mainEl = document.getElementById("galeriaMain");
      mainEl.classList.remove("zoomed");
      mainEl.innerHTML = idx === 0
        ? mediaWrap({ label: gp.nombre, icon: gp.icon, material: gv.material, catSlug: gp.categoria, size: 260 })
        : phWrap({ label: gp.nombre, icon: gp.icon, material: gv.material, size: 260, variant: idx });
      return;
    }

    var pagoBtn = e.target.closest("[data-pago]");
    if (pagoBtn) { checkoutMetodoPago = pagoBtn.getAttribute("data-pago"); renderCheckout(); return; }

    var starEl = e.target.closest("[data-star]");
    if (starEl) {
      reviewStars = parseInt(starEl.getAttribute("data-star"), 10);
      document.querySelectorAll("#starInput span").forEach(function (s) { s.classList.toggle("on", parseInt(s.getAttribute("data-star"), 10) <= reviewStars); });
      return;
    }

    var action = e.target.closest("[data-action]");
    if (action) {
      var act = action.getAttribute("data-action");
      if (act === "open-cart") openCart();
      else if (act === "open-login") openAuth("login");
      else if (act === "close-auth") closeAuth();
      else if (act === "guest-checkout") closeAuth();
      else if (act === "logout") logout();
      else if (act === "toggle-fav") { toggleFavorite(action.getAttribute("data-id")); route(); }
      else if (act === "reset-filtros") { delete listadoFiltros[action.getAttribute("data-key")]; route(); }
      else if (act === "toggle-zoom") action.classList.toggle("zoomed");
      else if (act === "ficha-qty-inc") { var b = document.getElementById("fichaQty"), v = parseInt(b.getAttribute("data-qty"), 10) + 1; b.setAttribute("data-qty", v); document.getElementById("fichaQtyVal").textContent = v; }
      else if (act === "ficha-qty-dec") { var b2 = document.getElementById("fichaQty"), v2 = Math.max(1, parseInt(b2.getAttribute("data-qty"), 10) - 1); b2.setAttribute("data-qty", v2); document.getElementById("fichaQtyVal").textContent = v2; }
      else if (act === "add-cart") { var qb = document.getElementById("fichaQty"); addToCart(action.getAttribute("data-codigo"), qb ? parseInt(qb.getAttribute("data-qty"), 10) : 1); openCart(); }
      else if (act === "buy-now") { var qb2 = document.getElementById("fichaQty"); addToCart(action.getAttribute("data-codigo"), qb2 ? parseInt(qb2.getAttribute("data-qty"), 10) : 1); openCheckout(); }
      else if (act === "wa-product") { e.preventDefault(); var vi = VARIANT_INDEX[action.getAttribute("data-codigo")]; if (vi) { var text = encodeURIComponent("Hola, me interesa esta pieza:\n" + vi.product.nombre + " (" + vi.variant.materialLabel + ") — " + money(vi.variant.precio)); window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text, "_blank"); } }
      else if (act === "cart-inc") { var c1 = action.getAttribute("data-codigo"); setQty(c1, (cart[c1] || 0) + 1); }
      else if (act === "cart-dec") { var c2 = action.getAttribute("data-codigo"); setQty(c2, (cart[c2] || 0) - 1); }
      else if (act === "cart-remove") removeFromCart(action.getAttribute("data-codigo"));
      else if (act === "close-checkout") closeCheckout();
      else if (act === "del-direccion") { currentUser.direcciones = currentUser.direcciones.filter(function (d) { return d.id !== action.getAttribute("data-id"); }); saveUsers(); renderCuenta(); }
      return;
    }

    if (e.target.id === "checkoutContinuar") { checkoutStep = 2; renderCheckout(); return; }
    if (e.target.id === "checkoutRegresar") { checkoutStep = 1; renderCheckout(); return; }
    if (e.target.id === "checkoutEnviar") { finalizarCheckout(); return; }

    if (e.target.id === "authGoogle") { showAuthError("El inicio de sesión con Google requiere un backend con OAuth — no disponible en esta demo estática."); return; }
    if (e.target.id === "authSubmit") {
      var correo = document.getElementById("authCorreo").value;
      var pass = document.getElementById("authPassword").value;
      var res;
      if (authView === "login") res = iniciarSesion(correo, pass);
      else if (authView === "registro") { var nom = document.getElementById("authNombre").value.trim(); if (!nom || !correo || !pass) { showAuthError("Completa todos los campos."); return; } res = registrar(nom, correo, pass); }
      else res = recuperarPassword(correo, pass);
      if (res.ok) { closeAuth(); if (authView !== "recuperar") route(); else openAuth("login"); }
      else showAuthError(res.error);
      return;
    }
    if (e.target.id === "perfilGuardar") {
      e.preventDefault();
      currentUser.nombre = document.getElementById("perfilNombre").value.trim();
      currentUser.correo = document.getElementById("perfilCorreo").value.trim().toLowerCase();
      saveUsers(); refreshAccountIcon(); renderCuenta();
      return;
    }
    if (e.target.id === "passGuardar") {
      e.preventDefault();
      var actual = document.getElementById("passActual").value;
      var nueva = document.getElementById("passNueva").value;
      if (currentUser.passwordHash !== simpleHash(actual)) { document.getElementById("passError").textContent = "La contraseña actual no coincide."; document.getElementById("passError").classList.add("show"); return; }
      currentUser.passwordHash = simpleHash(nueva); saveUsers();
      document.getElementById("passError").classList.remove("show");
      renderCuenta();
      return;
    }
    if (e.target.id === "resenaEnviar") {
      var pid2 = e.target.getAttribute("data-pid");
      var comentario = document.getElementById("resenaComentario").value.trim();
      var nombreCampo = document.getElementById("resenaNombre");
      var nombre = currentUser ? currentUser.nombre : (nombreCampo ? nombreCampo.value.trim() : "");
      if (!reviewStars || !comentario || !nombre) { alert("Agrega tu nombre, calificación y comentario."); return; }
      var fotoInput = document.getElementById("resenaFoto");
      var guardar = function (fotoDataUrl) {
        var list = getReviews(pid2);
        list.push({ nombre: nombre, estrellas: reviewStars, comentario: comentario, foto: fotoDataUrl || null, fecha: new Date().toLocaleDateString("es-MX") });
        saveReviews(pid2, list);
        reviewStars = 0;
        renderFicha(pid2);
      };
      if (fotoInput && fotoInput.files && fotoInput.files[0]) { var reader = new FileReader(); reader.onload = function (ev) { guardar(ev.target.result); }; reader.readAsDataURL(fotoInput.files[0]); }
      else guardar(null);
      return;
    }

    if (e.target === cartOverlay) closeCart();
    if (e.target === authOverlay) closeAuth();
  });

  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);
  document.getElementById("cartCheckout").addEventListener("click", openCheckout);
  document.getElementById("accountToggle").addEventListener("click", function () { if (currentUser) navigate("/cuenta"); else openAuth("login"); });

  document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = document.getElementById("searchInput").value.trim();
    navigate("/buscar/" + encodeURIComponent(q));
  });

  appEl.addEventListener("input", function (e) {
    var filtro = e.target.getAttribute("data-filtro");
    if (!filtro) return;
    var f = listadoFiltros[e.target.getAttribute("data-key")];
    if (filtro === "precio") f.precioTope = parseFloat(e.target.value);
    else if (filtro === "peso") f.pesoTope = parseFloat(e.target.value);
    else if (filtro === "largo") f.largoTope = parseFloat(e.target.value);
    else return;
    route();
  });
  appEl.addEventListener("change", function (e) {
    var filtro = e.target.getAttribute("data-filtro");
    if (!filtro) return;
    var f = listadoFiltros[e.target.getAttribute("data-key")];
    if (filtro === "material") {
      var val = e.target.value, idx = f.materiales.indexOf(val);
      if (e.target.checked && idx === -1) f.materiales.push(val);
      if (!e.target.checked && idx !== -1) f.materiales.splice(idx, 1);
      if (f.materiales.length === 0) f.materiales.push(val);
    } else if (filtro === "disponible") f.soloDisponibles = e.target.checked;
    else if (filtro === "categoria") f.categoria = e.target.value;
    else return;
    route();
  });

  window.addEventListener("hashchange", route);
}

// ---------- Arranque ----------
function init() {
  appEl = document.getElementById("app");
  cartItemsEl = document.getElementById("cartItems");
  cartSubtotalRow = document.getElementById("cartSubtotal");
  cartShippingRow = document.getElementById("cartShipping");
  cartTotalRow = document.getElementById("cartTotal");
  cartBadge = document.getElementById("cartBadge");
  cartDrawer = document.getElementById("cartDrawer");
  cartOverlay = document.getElementById("cartOverlay");
  checkoutOverlay = document.getElementById("checkoutOverlay");
  authOverlay = document.getElementById("authOverlay");
  authModal = document.getElementById("authModal");

  bindEvents();

  Promise.all([
    fetch("products.json").then(function (r) { return r.json(); }),
    fetch("users.json").then(function (r) { return r.json(); }).catch(function () { return { usuarios: [] }; })
  ]).then(function (res) {
    PRODUCTS = res[0];
    buildVariantIndex();
    initUsers(res[1]);
    restoreSession();
    loadCart(); loadFavs();
    renderCart(); refreshAccountIcon();
    route();
  }).catch(function () {
    appEl.innerHTML = '<div class="wrap" style="padding:80px 0;text-align:center;color:var(--ivory-dim);">' +
      'No se pudo cargar el catálogo. Si abriste el archivo con doble clic, los navegadores bloquean esa carga por seguridad: ' +
      'usa un servidor local (extensión "Live Server" en VS Code) o sube estos archivos a tu hosting.</div>';
  });
}

document.addEventListener("DOMContentLoaded", init);
