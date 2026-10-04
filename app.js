/* ============================================================
   ShopAI — Logika Aplikasi
   ============================================================ */
(function () {
  "use strict";

  const { CATEGORIES, PRODUCTS, AI_FEATURED, VOUCHERS } = window.SHOPAI_DATA;

  /* ---------- State ---------- */
  const LS = {
    user: "shopai_user",
    cart: "shopai_cart",
    orders: "shopai_orders",
  };

  const state = {
    user: load(LS.user, null),
    cart: load(LS.cart, []), // [{id, qty}]
    orders: load(LS.orders, []),
    filters: { q: "", cat: "all", min: null, max: null, minRating: 0, sort: "relevan" },
    voucher: null,
    detailQty: 1,
    detailProductId: null,
  };

  /* ---------- Helpers ---------- */
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function starsHtml(rating) {
    let h = "";
    const full = Math.round(rating);
    for (let i = 1; i <= 5; i++) h += `<span class="${i <= full ? "" : "empty"}">★</span>`;
    return `<span class="stars">${h}</span>`;
  }

  function soldLabel(n) {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace(".0", "") + "rb";
    return String(n);
  }

  function toast(msg, type = "") {
    const stack = $("#toastStack");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = msg;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(10px)"; el.style.transition = ".3s"; }, 2200);
    setTimeout(() => el.remove(), 2600);
  }

  /* ============================================================
     1. AUTH
     ============================================================ */
  const authScreen = $("#authScreen");
  const app = $("#app");
  let authMode = "login";

  function initAuth() {
    $$(".auth-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".auth-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        authMode = tab.dataset.tab;
        $("#nameField").hidden = authMode !== "register";
        $("#authSubmit").textContent = authMode === "register" ? "Buat Akun" : "Masuk";
        $("#authError").textContent = "";
      });
    });

    $("#authForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#authEmail").value.trim();
      const pass = $("#authPassword").value;
      const name = $("#authName").value.trim();
      const err = $("#authError");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Format email tidak valid."; return; }
      if (pass.length < 4) { err.textContent = "Password minimal 4 karakter."; return; }
      if (authMode === "register" && !name) { err.textContent = "Nama tidak boleh kosong."; return; }

      const displayName = authMode === "register" ? name : email.split("@")[0];
      loginUser({ name: displayName, email });
      toast(authMode === "register" ? "🎉 Akun berhasil dibuat!" : "👋 Selamat datang kembali!", "success");
    });

    $("#guestBtn").addEventListener("click", () => {
      loginUser({ name: "Tamu", email: "guest@shopai.id", guest: true });
      toast("Masuk sebagai Tamu", "info");
    });
  }

  function loginUser(user) {
    state.user = user;
    save(LS.user, user);
    showApp();
  }

  function logout() {
    state.user = null;
    localStorage.removeItem(LS.user);
    app.hidden = true;
    authScreen.style.display = "grid";
    toast("Kamu telah keluar.");
  }

  function showApp() {
    authScreen.style.display = "none";
    app.hidden = false;
    renderUserChip();
  }

  function renderUserChip() {
    if (!state.user) return;
    const initial = (state.user.name || "U").charAt(0).toUpperCase();
    $("#userAvatar").textContent = initial;
    $("#userName").textContent = state.user.name;
  }

  /* ============================================================
     2 & 3. SEARCH, FILTER, CATEGORIES
     ============================================================ */
  function initCategories() {
    const nav = $("#categoryNav");
    nav.innerHTML = CATEGORIES.map((c) =>
      `<button class="cat-pill ${c.id === "all" ? "active" : ""}" data-cat="${c.id}">${c.icon} ${c.name}</button>`
    ).join("");
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".cat-pill");
      if (!btn) return;
      state.filters.cat = btn.dataset.cat;
      $$(".cat-pill", nav).forEach((b) => b.classList.toggle("active", b === btn));
      syncCatFilters();
      renderGrid();
    });

    // Checkbox category filters in sidebar
    $("#catFilters").innerHTML = CATEGORIES.filter((c) => c.id !== "all").map((c) =>
      `<label><input type="radio" name="catFilter" value="${c.id}"> ${c.icon} ${c.name}</label>`
    ).join("") + `<label><input type="radio" name="catFilter" value="all" checked> 🛍️ Semua</label>`;
    $("#catFilters").addEventListener("change", (e) => {
      state.filters.cat = e.target.value;
      $$(".cat-pill").forEach((b) => b.classList.toggle("active", b.dataset.cat === e.target.value));
      renderGrid();
    });

    // Price quick chips
    const ranges = [
      { l: "< 150rb", min: 0, max: 150000 },
      { l: "150rb–500rb", min: 150000, max: 500000 },
      { l: "500rb–1jt", min: 500000, max: 1000000 },
      { l: "> 1jt", min: 1000000, max: null },
    ];
    $("#priceChips").innerHTML = ranges.map((r, i) =>
      `<button data-min="${r.min}" data-max="${r.max ?? ""}">${r.l}</button>`
    ).join("");
    $("#priceChips").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.filters.min = b.dataset.min ? +b.dataset.min : null;
      state.filters.max = b.dataset.max ? +b.dataset.max : null;
      $("#priceMin").value = state.filters.min || "";
      $("#priceMax").value = state.filters.max || "";
      renderGrid();
    });

    // Rating filter
    $("#ratingFilter").innerHTML = [0, 4, 4.5].map((r) =>
      `<label><input type="radio" name="ratingF" value="${r}" ${r === 0 ? "checked" : ""}> ${r === 0 ? "Semua rating" : starsHtml(r) + " " + r + " ke atas"}</label>`
    ).join("");
    $("#ratingFilter").addEventListener("change", (e) => {
      state.filters.minRating = +e.target.value; renderGrid();
    });
  }

  function syncCatFilters() {
    const radio = $(`#catFilters input[value="${state.filters.cat}"]`);
    if (radio) radio.checked = true;
  }

  function initSearchAndSort() {
    const doSearch = () => { state.filters.q = $("#searchInput").value.trim().toLowerCase(); renderGrid(); };
    $("#searchBtn").addEventListener("click", doSearch);
    $("#searchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
    $("#searchInput").addEventListener("input", () => { if ($("#searchInput").value === "") { state.filters.q = ""; renderGrid(); } });

    $("#sortSelect").addEventListener("change", (e) => { state.filters.sort = e.target.value; renderGrid(); });

    const applyPrice = () => {
      state.filters.min = $("#priceMin").value ? +$("#priceMin").value : null;
      state.filters.max = $("#priceMax").value ? +$("#priceMax").value : null;
      renderGrid();
    };
    $("#priceMin").addEventListener("change", applyPrice);
    $("#priceMax").addEventListener("change", applyPrice);

    $("#resetFilters").addEventListener("click", () => {
      state.filters = { q: "", cat: "all", min: null, max: null, minRating: 0, sort: "relevan" };
      $("#searchInput").value = ""; $("#priceMin").value = ""; $("#priceMax").value = "";
      $("#sortSelect").value = "relevan";
      syncCatFilters();
      const r0 = $('#ratingFilter input[value="0"]'); if (r0) r0.checked = true;
      $$(".cat-pill").forEach((b) => b.classList.toggle("active", b.dataset.cat === "all"));
      renderGrid();
      toast("Filter direset.");
    });
  }

  function filterProducts() {
    let list = PRODUCTS.slice();
    const f = state.filters;
    if (f.cat !== "all") list = list.filter((p) => p.cat === f.cat);
    if (f.q) list = list.filter((p) =>
      p.name.toLowerCase().includes(f.q) ||
      p.cat.toLowerCase().includes(f.q) ||
      p.seller.toLowerCase().includes(f.q) ||
      (CATEGORIES.find((c) => c.id === p.cat)?.name.toLowerCase().includes(f.q))
    );
    if (f.min != null) list = list.filter((p) => p.price >= f.min);
    if (f.max != null) list = list.filter((p) => p.price <= f.max);
    if (f.minRating) list = list.filter((p) => p.rating >= f.minRating);

    switch (f.sort) {
      case "terlaris": list.sort((a, b) => b.sold - a.sold); break;
      case "termurah": list.sort((a, b) => a.price - b.price); break;
      case "termahal": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }
    return list;
  }

  function renderActiveChips() {
    const f = state.filters;
    const chips = [];
    if (f.q) chips.push({ label: `🔍 "${esc(f.q)}"`, clear: () => { f.q = ""; $("#searchInput").value = ""; } });
    if (f.cat !== "all") {
      const c = CATEGORIES.find((x) => x.id === f.cat);
      chips.push({ label: `${c.icon} ${c.name}`, clear: () => { f.cat = "all"; syncCatFilters(); $$(".cat-pill").forEach((b) => b.classList.toggle("active", b.dataset.cat === "all")); } });
    }
    if (f.min != null || f.max != null) {
      chips.push({ label: `💰 ${f.min ? rupiah(f.min) : "0"}–${f.max ? rupiah(f.max) : "∞"}`, clear: () => { f.min = f.max = null; $("#priceMin").value = ""; $("#priceMax").value = ""; } });
    }
    if (f.minRating) chips.push({ label: `⭐ ${f.minRating}+`, clear: () => { f.minRating = 0; const r0 = $('#ratingFilter input[value="0"]'); if (r0) r0.checked = true; } });

    const wrap = $("#activeChips");
    wrap.innerHTML = chips.map((c, i) => `<span class="chip">${c.label}<button data-i="${i}">✕</button></span>`).join("");
    $$("#activeChips .chip button").forEach((btn, i) => btn.addEventListener("click", () => { chips[i].clear(); renderGrid(); }));
  }

  /* ============================================================
     4. PRODUCT GRID
     ============================================================ */
  function productCardHtml(p) {
    const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const cat = CATEGORIES.find((c) => c.id === p.cat);
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="pc-media" data-detail="${p.id}">
          <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" data-fb="${p.fallback}" onerror="if(this.src!==this.dataset.fb){this.src=this.dataset.fb}" />
          ${p.promo ? `<span class="pc-promo">${esc(p.promo)}</span>` : ""}
          ${disc > 0 ? `<span class="pc-disc">-${disc}%</span>` : ""}
        </div>
        <div class="pc-body">
          <div class="pc-name" data-detail="${p.id}">${esc(p.name)}</div>
          <div class="pc-price-row">
            <span class="pc-price">${rupiah(p.price)}</span>
            ${p.oldPrice ? `<span class="pc-old">${rupiah(p.oldPrice)}</span>` : ""}
          </div>
          <div class="pc-meta">
            <span class="pc-rating"><span class="star">★</span> ${p.rating.toFixed(1)}</span>
            <span class="pc-sold">${soldLabel(p.sold)} terjual</span>
          </div>
          <div class="pc-loc">📍 ${esc(cat ? cat.name : p.location)}</div>
          <div class="pc-actions">
            <button class="btn btn-primary btn-sm" data-buy="${p.id}">Beli</button>
            <button class="btn icon-cart-btn" data-add="${p.id}" title="Tambah ke keranjang">🛒</button>
          </div>
        </div>
      </article>`;
  }

  function renderGrid() {
    const list = filterProducts();
    const grid = $("#productGrid");
    const empty = $("#emptyState");
    grid.innerHTML = list.map(productCardHtml).join("");
    empty.hidden = list.length > 0;

    const titleCat = state.filters.cat === "all" ? "Semua Produk" : CATEGORIES.find((c) => c.id === state.filters.cat).name;
    $("#gridTitle").textContent = state.filters.q ? `Hasil "${state.filters.q}" (${list.length})` : `${titleCat} (${list.length})`;

    renderActiveChips();
  }

  function initGridEvents() {
    $("#productGrid").addEventListener("click", (e) => {
      const detail = e.target.closest("[data-detail]");
      const add = e.target.closest("[data-add]");
      const buy = e.target.closest("[data-buy]");
      if (add) { addToCart(add.dataset.add, 1); e.stopPropagation(); return; }
      if (buy) { openDetail(buy.dataset.buy); return; }
      if (detail) { openDetail(detail.dataset.detail); return; }
    });
    $("#heroShopBtn").addEventListener("click", () => {
      $("#productGrid").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#homeBtn").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ============================================================
     5. PRODUCT DETAIL + AI FEATURED
     ============================================================ */
  function initAiGallery() {
    $("#aiGallery").innerHTML = AI_FEATURED.map((f, i) =>
      `<div class="ai-card" data-ai="${i}">
        <span class="ai-tag">✨ AI</span>
        <img src="${f.image}" alt="${esc(f.title)}" loading="lazy" data-fb="${f.fallback}" onerror="if(this.src!==this.dataset.fb){this.src=this.dataset.fb}" />
      </div>`
    ).join("");
    $("#aiGallery").addEventListener("click", (e) => {
      const card = e.target.closest("[data-ai]");
      if (!card) return;
      const cat = AI_FEATURED[+card.dataset.ai].cat;
      state.filters.cat = cat;
      $$(".cat-pill").forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
      syncCatFilters();
      renderGrid();
      $("#productGrid").scrollIntoView({ behavior: "smooth" });
    });
  }

  const productModal = $("#productModal");

  function openDetail(id) {
    const p = byId(id);
    if (!p) return;
    state.detailProductId = id;
    state.detailQty = 1;
    const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const cat = CATEGORIES.find((c) => c.id === p.cat);

    // Galeri detail: foto produk asli + 2 variasi (foto kategori terkait sebagai angle tambahan)
    const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 2);
    const thumbs = [p.image, ...related.map((x) => x.image)];
    while (thumbs.length < 3) thumbs.push(p.image);
    const fb = p.fallback;
    const onerr = `onerror="if(this.src!==this.dataset.fb){this.src=this.dataset.fb}"`;

    $("#detailBody").innerHTML = `
      <div class="detail-gallery">
        <div class="detail-main-img"><img id="detailMainImg" src="${p.image}" alt="${esc(p.name)}" data-fb="${fb}" ${onerr} /></div>
        <div class="detail-thumbs">
          ${thumbs.map((t, i) => `<img src="${t}" class="${i === 0 ? "active" : ""}" data-thumb="${i}" alt="angle ${i + 1}" data-fb="${fb}" ${onerr} />`).join("")}
        </div>
      </div>
      <div class="detail-info">
        <h2>${esc(p.name)}</h2>
        <div class="detail-rating-row">
          <span>${starsHtml(p.rating)} <b>${p.rating.toFixed(1)}</b></span>
          <span>|</span>
          <span><b>${p.ratingCount.toLocaleString("id-ID")}</b> ulasan</span>
          <span>|</span>
          <span><b>${soldLabel(p.sold)}</b> terjual</span>
          ${p.promo ? `<span class="pc-promo" style="position:static">${esc(p.promo)}</span>` : ""}
        </div>
        <div class="detail-price-box">
          <span class="detail-price">${rupiah(p.price)}</span>
          ${p.oldPrice ? `<span class="detail-old">${rupiah(p.oldPrice)}</span><span class="detail-disc-badge">-${disc}%</span>` : ""}
        </div>

        <div class="detail-qty-row">
          <div class="qty-stepper">
            <button data-step="-1">−</button>
            <input id="detailQtyInput" type="text" value="1" readonly />
            <button data-step="1">+</button>
          </div>
          <span class="stock-info">Stok: <b>${p.stock}</b> • ${p.shipping}</span>
        </div>
        <div class="detail-cta">
          <button class="btn btn-outline" id="detailAddCart">🛒 Keranjang</button>
          <button class="btn btn-primary" id="detailBuyNow">Beli Sekarang</button>
        </div>

        <div class="detail-section">
          <h4>Info Penjual & Pengiriman</h4>
          <div class="seller-box">
            <div class="seller-avatar">${esc(p.seller.charAt(0))}</div>
            <div class="seller-info">
              <strong>${esc(p.seller)}</strong>
              <small>📍 ${esc(p.location)} • 🚚 ${esc(p.shipping)}</small>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>Deskripsi</h4>
          <p>${esc(p.desc)}</p>
        </div>

        <div class="detail-section">
          <h4>Spesifikasi</h4>
          <table class="spec-table">
            ${Object.entries(p.specs).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}
            <tr><td>Kategori</td><td>${esc(cat ? cat.name : "-")}</td></tr>
          </table>
        </div>

        <div class="detail-section">
          <h4>Ulasan Pembeli (${p.reviews.length})</h4>
          <div class="reviews-list">
            ${p.reviews.map((r) => `
              <div class="review-item">
                <div class="review-head"><strong>${esc(r.user)}</strong>${starsHtml(r.stars)}</div>
                <p>${esc(r.text)}</p>
              </div>`).join("")}
          </div>
        </div>
      </div>`;

    // Wire detail interactions
    $$("#detailBody [data-thumb]").forEach((img) => img.addEventListener("click", () => {
      $$("#detailBody [data-thumb]").forEach((t) => t.classList.remove("active"));
      img.classList.add("active");
      $("#detailMainImg").src = img.src;
    }));
    $$("#detailBody [data-step]").forEach((b) => b.addEventListener("click", () => {
      state.detailQty = Math.max(1, Math.min(p.stock, state.detailQty + +b.dataset.step));
      $("#detailQtyInput").value = state.detailQty;
    }));
    $("#detailAddCart").addEventListener("click", () => { addToCart(id, state.detailQty); });
    $("#detailBuyNow").addEventListener("click", () => { addToCart(id, state.detailQty, true); closeModal(productModal); openCart(); });

    openModal(productModal);
  }

  /* ============================================================
     6. CART
     ============================================================ */
  const cartDrawer = $("#cartDrawer");

  function cartCount() { return state.cart.reduce((s, i) => s + i.qty, 0); }

  function addToCart(id, qty = 1, silent = false) {
    const existing = state.cart.find((i) => i.id === id);
    if (existing) existing.qty += qty;
    else state.cart.push({ id, qty });
    save(LS.cart, state.cart);
    renderCartBadge();
    if (!silent) {
      const p = byId(id);
      toast(`✓ ${p.name.slice(0, 24)}${p.name.length > 24 ? "…" : ""} ditambahkan`, "success");
    }
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter((i) => i.id !== id);
    save(LS.cart, state.cart);
    renderCartBadge();
    renderCart();
  }

  function setQty(id, qty) {
    const item = state.cart.find((i) => i.id === id);
    if (!item) return;
    const p = byId(id);
    item.qty = Math.max(1, Math.min(p.stock, qty));
    save(LS.cart, state.cart);
    renderCartBadge();
    renderCart();
  }

  function renderCartBadge() {
    const n = cartCount();
    const badge = $("#cartBadge");
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  function cartTotals() {
    const subtotal = state.cart.reduce((s, i) => s + byId(i.id).price * i.qty, 0);
    let shipping = subtotal > 0 ? 20000 : 0;
    let discount = 0;
    const v = state.voucher ? VOUCHERS[state.voucher] : null;
    if (v && subtotal >= v.min) {
      if (v.type === "percent") discount = Math.round(subtotal * v.value / 100);
      else if (v.type === "flat") discount = v.value;
      else if (v.type === "shipping") { discount = shipping; }
    }
    const total = Math.max(0, subtotal + shipping - discount);
    return { subtotal, shipping, discount, total, voucher: v };
  }

  function renderCart() {
    const wrap = $("#cartItems");
    const summary = $("#cartSummary");
    if (state.cart.length === 0) {
      wrap.innerHTML = `<div class="cart-empty"><span>🛒</span><p>Keranjang masih kosong.<br>Yuk cari produk favoritmu!</p></div>`;
      summary.innerHTML = `<button class="btn btn-ghost btn-block" data-close-cart>Lanjut Belanja</button>`;
      $$("[data-close-cart]", summary).forEach((b) => b.addEventListener("click", () => closeCart()));
      return;
    }

    wrap.innerHTML = state.cart.map((item) => {
      const p = byId(item.id);
      return `
      <div class="cart-item" data-id="${p.id}">
        <img src="${p.image}" alt="${esc(p.name)}" data-fb="${p.fallback}" onerror="if(this.src!==this.dataset.fb){this.src=this.dataset.fb}" />
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(p.name)}</div>
          <div class="cart-item-price">${rupiah(p.price)}</div>
          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button data-dec="${p.id}">−</button>
              <input type="text" value="${item.qty}" readonly />
              <button data-inc="${p.id}">+</button>
            </div>
            <button class="cart-remove" data-rem="${p.id}">🗑 Hapus</button>
          </div>
        </div>
      </div>`;
    }).join("");

    const t = cartTotals();
    summary.innerHTML = `
      <div class="voucher-row">
        <input id="voucherInput" placeholder="Kode voucher" value="${state.voucher || ""}" />
        <button class="btn btn-outline btn-sm" id="applyVoucher">Pakai</button>
      </div>
      <div class="voucher-hint">Coba: <code data-v="SHOPAI10">SHOPAI10</code> <code data-v="HEMAT25K">HEMAT25K</code> <code data-v="GRATISONGKIR">GRATISONGKIR</code></div>
      <div class="summary-row"><span>Subtotal (${cartCount()} barang)</span><span>${rupiah(t.subtotal)}</span></div>
      <div class="summary-row"><span>Ongkos kirim</span><span>${rupiah(t.shipping)}</span></div>
      ${t.discount > 0 ? `<div class="summary-row discount"><span>Diskon ${t.voucher ? "(" + state.voucher + ")" : ""}</span><span>− ${rupiah(t.discount)}</span></div>` : ""}
      <div class="summary-total"><span>Total</span><b>${rupiah(t.total)}</b></div>
      <button class="btn btn-primary btn-block" id="goCheckout" style="margin-top:14px">Checkout Sekarang</button>`;

    // wire
    $$("#cartItems [data-inc]").forEach((b) => b.addEventListener("click", () => setQty(b.dataset.inc, state.cart.find((i) => i.id === b.dataset.inc).qty + 1)));
    $$("#cartItems [data-dec]").forEach((b) => b.addEventListener("click", () => setQty(b.dataset.dec, state.cart.find((i) => i.id === b.dataset.dec).qty - 1)));
    $$("#cartItems [data-rem]").forEach((b) => b.addEventListener("click", () => removeFromCart(b.dataset.rem)));
    $("#applyVoucher").addEventListener("click", applyVoucher);
    $("#voucherInput").addEventListener("keydown", (e) => { if (e.key === "Enter") applyVoucher(); });
    $$("#cartSummary [data-v]").forEach((c) => c.addEventListener("click", () => { $("#voucherInput").value = c.dataset.v; applyVoucher(); }));
    $("#goCheckout").addEventListener("click", () => { closeCart(); openCheckout(); });
  }

  function applyVoucher() {
    const code = $("#voucherInput").value.trim().toUpperCase();
    if (!code) { state.voucher = null; renderCart(); return; }
    const v = VOUCHERS[code];
    if (!v) { toast("❌ Kode voucher tidak valid.", ""); state.voucher = null; renderCart(); return; }
    const { subtotal } = cartTotals();
    if (subtotal < v.min) { toast(`Minimal belanja ${rupiah(v.min)} untuk voucher ini.`, ""); return; }
    state.voucher = code;
    toast(`🎟️ Voucher ${code} diterapkan!`, "success");
    renderCart();
  }

  function openCart() { renderCart(); openDrawer(cartDrawer); }
  function closeCart() { closeDrawer(cartDrawer); }

  /* ============================================================
     7. CHECKOUT
     ============================================================ */
  const checkoutModal = $("#checkoutModal");
  const PAYMENTS = [
    { id: "gopay", icon: "🟢", name: "GoPay", desc: "Saldo e-wallet" },
    { id: "ovo", icon: "🟣", name: "OVO", desc: "Saldo e-wallet" },
    { id: "transfer", icon: "🏦", name: "Transfer Bank", desc: "VA otomatis" },
    { id: "cod", icon: "💵", name: "COD", desc: "Bayar di tempat" },
  ];
  let selectedPay = "gopay";

  function openCheckout() {
    if (state.cart.length === 0) { toast("Keranjang kosong."); return; }
    selectedPay = "gopay";
    const t = cartTotals();
    $("#checkoutBody").innerHTML = `
      <div class="checkout-body">
        <h2>✅ Checkout</h2>
        <p class="checkout-sub">Lengkapi data pengiriman dan pembayaran untuk menyelesaikan pesanan.</p>

        <form id="checkoutForm">
          <div class="co-section">
            <h4>📍 Alamat Pengiriman</h4>
            <div class="co-grid">
              <div class="field"><label>Nama Penerima</label><input id="coName" value="${esc(state.user?.name || "")}" required /></div>
              <div class="field"><label>No. Telepon</label><input id="coPhone" placeholder="08xxxxxxxxxx" required /></div>
              <div class="field full"><label>Alamat Lengkap</label><textarea id="coAddr" placeholder="Jalan, nomor rumah, RT/RW, kelurahan" required></textarea></div>
              <div class="field"><label>Kota</label><input id="coCity" placeholder="Kota / Kabupaten" required /></div>
              <div class="field"><label>Kode Pos</label><input id="coZip" placeholder="12345" required /></div>
            </div>
          </div>

          <div class="co-section">
            <h4>💳 Metode Pembayaran</h4>
            <div class="pay-options" id="payOptions">
              ${PAYMENTS.map((p) => `
                <label class="pay-option ${p.id === "gopay" ? "active" : ""}" data-pay="${p.id}">
                  <input type="radio" name="pay" value="${p.id}" ${p.id === "gopay" ? "checked" : ""} hidden />
                  <span class="pay-icon">${p.icon}</span>
                  <span><span class="pay-name">${p.name}</span><br><span class="pay-desc">${p.desc}</span></span>
                </label>`).join("")}
            </div>
          </div>

          <div class="co-section">
            <h4>🧾 Ringkasan Pesanan</h4>
            <div class="co-summary">
              <div class="co-items-mini">
                ${state.cart.map((i) => { const p = byId(i.id); return `<div class="co-item-mini"><span>${esc(p.name)} × ${i.qty}</span><span>${rupiah(p.price * i.qty)}</span></div>`; }).join("")}
              </div>
              <div class="summary-row"><span>Subtotal</span><span>${rupiah(t.subtotal)}</span></div>
              <div class="summary-row"><span>Ongkir</span><span>${rupiah(t.shipping)}</span></div>
              ${t.discount > 0 ? `<div class="summary-row discount"><span>Diskon</span><span>− ${rupiah(t.discount)}</span></div>` : ""}
              <div class="summary-total"><span>Total Bayar</span><b>${rupiah(t.total)}</b></div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Buat Pesanan • ${rupiah(t.total)}</button>
        </form>
      </div>`;

    $("#payOptions").addEventListener("click", (e) => {
      const opt = e.target.closest("[data-pay]"); if (!opt) return;
      selectedPay = opt.dataset.pay;
      $$("#payOptions .pay-option").forEach((o) => o.classList.toggle("active", o === opt));
      $(`#payOptions input[value="${selectedPay}"]`).checked = true;
    });

    $("#checkoutForm").addEventListener("submit", (e) => {
      e.preventDefault();
      placeOrder();
    });

    openModal(checkoutModal);
  }

  function placeOrder() {
    const t = cartTotals();
    const pay = PAYMENTS.find((p) => p.id === selectedPay);
    const orderId = "SA" + Date.now().toString().slice(-8);
    const order = {
      id: orderId,
      date: new Date().toISOString(),
      items: state.cart.map((i) => ({ ...i, name: byId(i.id).name, emoji: byId(i.id).emoji, price: byId(i.id).price })),
      total: t.total,
      payment: pay.name,
      address: { name: $("#coName").value, city: $("#coCity").value },
      status: "Diproses",
    };
    state.orders.unshift(order);
    save(LS.orders, state.orders);
    state.cart = [];
    state.voucher = null;
    save(LS.cart, state.cart);
    renderCartBadge();

    const firstItem = order.items[0];
    $("#checkoutBody").innerHTML = `
      <div class="order-success">
        <div class="check">✓</div>
        <h2>Pesanan Berhasil!</h2>
        <p>Terima kasih, <b>${esc(order.address.name)}</b>. Pesananmu sedang diproses.</p>
        <div class="order-id">${orderId}</div>
        <div class="order-detail-box">
          <div class="summary-row"><span>Total Dibayar</span><b>${rupiah(order.total)}</b></div>
          <div class="summary-row"><span>Metode</span><span>${pay.icon} ${pay.name}</span></div>
          <div class="summary-row"><span>Jumlah Item</span><span>${order.items.reduce((s, i) => s + i.qty, 0)} barang</span></div>
          <div class="summary-row"><span>Estimasi Tiba</span><span>3–5 hari kerja</span></div>
        </div>
        <button class="btn btn-primary btn-block" id="orderDone">Lanjut Belanja</button>
      </div>`;
    $("#orderDone").addEventListener("click", () => closeModal(checkoutModal));
    toast("🎉 Pesanan berhasil dibuat!", "success");
  }

  /* ============================================================
     8. AI RECOMMENDATIONS
     ============================================================ */
  function getRecommendations() {
    // Base on order history / cart category preference, fallback to best sellers
    const prefCats = {};
    [...state.orders.flatMap((o) => o.items), ...state.cart].forEach((i) => {
      const p = byId(i.id); if (p) prefCats[p.cat] = (prefCats[p.cat] || 0) + (i.qty || 1);
    });
    let list = PRODUCTS.slice();
    if (Object.keys(prefCats).length) {
      list.sort((a, b) => (prefCats[b.cat] || 0) - (prefCats[a.cat] || 0) || b.sold - a.sold);
      $("#recoSub").textContent = "Berdasarkan riwayat & minatmu";
    } else {
      list.sort((a, b) => b.sold * b.rating - a.sold * a.rating);
      $("#recoSub").textContent = "Produk terpopuler pilihan AI";
    }
    return list.slice(0, 6);
  }

  function renderReco() {
    const list = getRecommendations();
    $("#recoRail").innerHTML = list.map((p) => `<div class="reco-card">${productCardHtml(p)}</div>`).join("");
    $("#recoRail").addEventListener("click", onRecoClick);
  }
  function onRecoClick(e) {
    const detail = e.target.closest("[data-detail]");
    const add = e.target.closest("[data-add]");
    const buy = e.target.closest("[data-buy]");
    if (add) { addToCart(add.dataset.add, 1); e.stopPropagation(); return; }
    if (buy) { openDetail(buy.dataset.buy); return; }
    if (detail) { openDetail(detail.dataset.detail); }
  }

  /* ============================================================
     9. CHAT SHOPAI
     ============================================================ */
  const chatWidget = $("#chatWidget");
  let chatOpened = false;

  const CHAT_SUGGESTIONS = [
    "Rekomendasi produk terlaris",
    "Produk di bawah 200rb",
    "Gadget terbaik",
    "Cara pakai voucher",
    "Lihat keranjang saya",
  ];

  const chatFab = $("#chatFab");

  function initChat() {
    // Pastikan chat selalu tertutup saat halaman dibuka
    setChatOpen(false);
    $("#chatToggle").addEventListener("click", toggleChat);
    chatFab.addEventListener("click", toggleChat);
    $("#chatClose").addEventListener("click", () => setChatOpen(false));
    $("#chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#chatInput").value.trim();
      if (!text) return;
      sendChat(text);
      $("#chatInput").value = "";
    });
    $("#chatSuggestions").innerHTML = CHAT_SUGGESTIONS.map((s) => `<button>${s}</button>`).join("");
    $("#chatSuggestions").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      sendChat(b.textContent);
    });
  }

  // Satu sumber kebenaran: atur chat + FAB sekaligus
  function setChatOpen(open) {
    chatWidget.hidden = !open;
    chatFab.hidden = open; // sembunyikan tombol mengambang saat chat terbuka
    if (open && !chatOpened) {
      chatOpened = true;
      botSay(`Hai ${state.user?.name || "kamu"}! 👋 Aku <b>ShopAI</b>, asisten belanjamu. Mau cari produk apa hari ini? Coba tanya atau pilih saran di bawah.`);
    }
  }

  function toggleChat() { setChatOpen(chatWidget.hidden); }

  function pushMsg(html, who) {
    const body = $("#chatBody");
    const el = document.createElement("div");
    el.className = "chat-msg " + who;
    el.innerHTML = html;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    // wire mini product
    $$(".mini-product", el).forEach((m) => m.addEventListener("click", () => { openDetail(m.dataset.pid); }));
    return el;
  }

  function botSay(html, delay = 650) {
    const body = $("#chatBody");
    const typing = document.createElement("div");
    typing.className = "chat-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    setTimeout(() => { typing.remove(); pushMsg(html, "bot"); }, delay);
  }

  function sendChat(text) {
    if (chatWidget.hidden) toggleChat();
    pushMsg(esc(text), "user");
    setTimeout(() => botReply(text.toLowerCase()), 100);
  }

  function miniProductHtml(p) {
    return `<div class="mini-product" data-pid="${p.id}">
      <img src="${p.image}" alt="" data-fb="${p.fallback}" onerror="if(this.src!==this.dataset.fb){this.src=this.dataset.fb}" />
      <div><div class="mp-name">${esc(p.name)}</div><div class="mp-price">${rupiah(p.price)} • ⭐${p.rating.toFixed(1)}</div></div>
    </div>`;
  }

  function botReply(q) {
    // Intent: cart
    if (/keranjang|cart/.test(q)) {
      const n = cartCount();
      if (n === 0) botSay("Keranjangmu masih kosong 🛒. Mau aku rekomendasikan produk terlaris?");
      else { const t = cartTotals(); botSay(`Di keranjangmu ada <b>${n} barang</b> dengan total <b>${rupiah(t.total)}</b>. Mau langsung checkout?`); setTimeout(openCart, 700); }
      return;
    }
    // Intent: voucher
    if (/voucher|kode|diskon|promo/.test(q)) {
      botSay(`Kamu bisa pakai voucher ini di keranjang:<br>🎟️ <b>SHOPAI10</b> — diskon 10% (min 100rb)<br>🎟️ <b>HEMAT25K</b> — potong 25rb (min 150rb)<br>🎟️ <b>GRATISONGKIR</b> — bebas ongkir`);
      return;
    }
    // Intent: price limit
    const priceMatch = q.match(/(\d+)\s*(rb|ribu|k|jt|juta)?/);
    if (/bawah|di bawah|dibawah|maksimal|kurang dari|murah/.test(q) && priceMatch) {
      let val = +priceMatch[1];
      const unit = priceMatch[2] || "";
      if (/jt|juta/.test(unit)) val *= 1000000; else if (/rb|ribu|k/.test(unit)) val *= 1000; else if (val < 1000) val *= 1000;
      const list = PRODUCTS.filter((p) => p.price <= val).sort((a, b) => b.sold - a.sold).slice(0, 3);
      if (list.length) botSay(`Ini produk di bawah ${rupiah(val)} yang laris 👇` + list.map(miniProductHtml).join(""));
      else botSay(`Hmm, belum ada produk di bawah ${rupiah(val)}. Coba naikkan budget sedikit ya.`);
      return;
    }
    // Intent: category / keyword search
    const catHit = CATEGORIES.find((c) => c.id !== "all" && q.includes(c.name.toLowerCase().split(" ")[0]));
    const kwHit = PRODUCTS.filter((p) => q.split(" ").some((w) => w.length > 2 && (p.name.toLowerCase().includes(w) || p.cat.includes(w) || p.tags.includes(w))));
    if (/terlaris|populer|best|laris|rekomendasi|saran|bagus/.test(q)) {
      const list = getRecommendations().slice(0, 3);
      botSay(`Ini rekomendasi terbaik dari AI buat kamu ✨` + list.map(miniProductHtml).join(""));
      return;
    }
    if (catHit) {
      const list = PRODUCTS.filter((p) => p.cat === catHit.id).sort((a, b) => b.sold - a.sold).slice(0, 3);
      botSay(`Produk <b>${catHit.name}</b> terbaik 👇` + list.map(miniProductHtml).join(""));
      state.filters.cat = catHit.id;
      $$(".cat-pill").forEach((b) => b.classList.toggle("active", b.dataset.cat === catHit.id));
      syncCatFilters(); renderGrid();
      return;
    }
    if (kwHit.length) {
      botSay(`Aku nemu ${kwHit.length} produk yang cocok 👇` + kwHit.slice(0, 3).map(miniProductHtml).join(""));
      return;
    }
    // Intent: checkout / payment
    if (/checkout|bayar|pembayaran|pesan/.test(q)) {
      botSay("Untuk checkout, buka keranjang lalu klik <b>Checkout</b>. Kami menerima GoPay, OVO, Transfer Bank, dan COD 💳.");
      return;
    }
    if (/halo|hai|hi|hello|pagi|siang|malam/.test(q)) {
      botSay(`Halo juga! 😊 Ada yang bisa aku bantu? Kamu bisa tanya rekomendasi, cek harga, atau soal voucher.`);
      return;
    }
    // Fallback
    botSay(`Aku bantu carikan ya! Coba tanya seperti:<br>• "rekomendasi produk terlaris"<br>• "gadget di bawah 500rb"<br>• "produk kecantikan"<br>• "cara pakai voucher"`);
  }

  /* ============================================================
     DASHBOARD / ORDERS
     ============================================================ */
  function initUserMenu() {
    const chip = $("#userChip");
    const dd = $("#userDropdown");
    chip.addEventListener("click", (e) => { e.stopPropagation(); dd.hidden = !dd.hidden; });
    document.addEventListener("click", () => { dd.hidden = true; });
    dd.addEventListener("click", (e) => {
      const btn = e.target.closest("button"); if (!btn) return;
      const act = btn.dataset.action;
      dd.hidden = true;
      if (act === "logout") logout();
      else if (act === "dashboard") openDashboard();
      else if (act === "orders") openDashboard(true);
    });
  }

  function openDashboard(ordersFocus) {
    const totalSpent = state.orders.reduce((s, o) => s + o.total, 0);
    const totalItems = state.orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
    const html = `
      <div class="modal-panel dash-panel" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <button class="modal-close" data-close-dash>✕</button>
        <div class="dash-body">
          <div class="dash-head">
            <div class="dash-avatar">${esc((state.user?.name || "U").charAt(0).toUpperCase())}</div>
            <div>
              <h2>${esc(state.user?.name || "User")}</h2>
              <p>${esc(state.user?.email || "")}</p>
            </div>
          </div>
          <div class="dash-stats">
            <div class="dash-stat"><div class="num">${state.orders.length}</div><div class="lbl">Total Pesanan</div></div>
            <div class="dash-stat"><div class="num">${totalItems}</div><div class="lbl">Barang Dibeli</div></div>
            <div class="dash-stat"><div class="num">${rupiah(totalSpent)}</div><div class="lbl">Total Belanja</div></div>
          </div>
          <div class="dash-orders">
            <h4>📦 Riwayat Pesanan</h4>
            ${state.orders.length === 0
              ? `<div class="dash-empty">Belum ada pesanan. Yuk mulai belanja! 🛍️</div>`
              : state.orders.map((o) => `
                <div class="order-row">
                  <span class="order-emoji">${o.items[0]?.emoji || "📦"}</span>
                  <div class="order-meta">
                    <strong>${esc(o.id)}</strong>
                    <small>${o.items.length} jenis • ${new Date(o.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • ${esc(o.payment)}</small>
                  </div>
                  <div style="text-align:right">
                    <div style="font-weight:800;color:var(--brand)">${rupiah(o.total)}</div>
                    <span class="order-status">${esc(o.status)}</span>
                  </div>
                </div>`).join("")}
          </div>
        </div>
      </div>`;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `<div class="modal-backdrop" data-close-dash></div>${html}`;
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-dash]")) { modal.remove(); document.body.style.overflow = ""; }
    });
    if (ordersFocus) $(".dash-orders", modal)?.scrollIntoView();
  }

  /* ============================================================
     MODAL / DRAWER HELPERS
     ============================================================ */
  function openModal(m) { m.hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal(m) { m.hidden = true; document.body.style.overflow = ""; }
  function openDrawer(d) { d.hidden = false; document.body.style.overflow = "hidden"; }
  function closeDrawer(d) { d.hidden = true; document.body.style.overflow = ""; }

  function initOverlayClose() {
    productModal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(productModal); });
    checkoutModal.addEventListener("click", (e) => { if (e.target.closest("[data-close-checkout]")) closeModal(checkoutModal); });
    cartDrawer.addEventListener("click", (e) => { if (e.target.closest("[data-close-cart]")) closeCart(); });
    $("#cartBtn").addEventListener("click", openCart);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!productModal.hidden) closeModal(productModal);
        if (!checkoutModal.hidden) closeModal(checkoutModal);
        if (!cartDrawer.hidden) closeCart();
      }
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initAuth();
    initCategories();
    initSearchAndSort();
    initGridEvents();
    initAiGallery();
    initUserMenu();
    initChat();
    initOverlayClose();

    renderGrid();
    renderReco();
    renderCartBadge();

    if (state.user) showApp();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
