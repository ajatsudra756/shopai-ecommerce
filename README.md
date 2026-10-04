# 🛍️ ShopAI — E-Commerce Interaktif

Web app e-commerce interaktif dengan UI/UX modern, dibangun menggunakan **HTML, CSS, dan JavaScript murni** (tanpa framework, tanpa build step).

## ✨ Fitur

1. **🔐 Login/Register** — simulasi autentikasi + dashboard user (data disimpan di `localStorage`)
2. **🔍 Pencarian & Filter** — kata kunci, kategori, rentang harga, rating, dan sorting
3. **🖼️ Grid Produk** — nama, gambar, harga, rating ⭐, jumlah terjual, badge promo
4. **📸 Foto Produk AI** — gambar unggulan di hero
5. **📦 Detail Produk** — spesifikasi, deskripsi, ulasan, info penjual & pengiriman
6. **🛒 Keranjang** — kalkulasi subtotal, ongkir, dan diskon voucher
7. **✅ Checkout** — form alamat + metode pembayaran (GoPay, OVO, Transfer, COD)
8. **🤖 Rekomendasi AI** — rekomendasi personal berbasis riwayat & minat
9. **💬 Chat ShopAI** — asisten belanja interaktif

## 🚀 Menjalankan secara lokal

Cukup buka `index.html` di browser, atau jalankan server statis:

```bash
python -m http.server 8123
```

Lalu buka `http://localhost:8123`.

## 📦 Struktur

```
.
├── index.html   # Struktur & semua panel UI
├── styles.css   # Design system & styling
├── data.js      # Data produk, foto AI, voucher
├── app.js       # Seluruh logika aplikasi
└── vercel.json  # Konfigurasi hosting Vercel
```

## 🌐 Deploy

Situs statis — di-deploy ke [Vercel](https://vercel.com) tanpa konfigurasi build.
