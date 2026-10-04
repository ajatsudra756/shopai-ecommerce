/* ============================================================
   ShopAI — Data Produk & Generator Gambar
   Gambar produk dibuat sebagai SVG gradient (data URI) agar
   tampil tanpa koneksi internet, menyerupai "foto produk AI".
   ============================================================ */

(function () {
  // Palet warna untuk gambar produk yang di-generate
  const PALETTES = {
    electronics: ["#6d28d9", "#2563eb"],
    fashion: ["#db2777", "#f59e0b"],
    home: ["#059669", "#10b981"],
    beauty: ["#e11d48", "#fb7185"],
    sports: ["#0ea5e9", "#22d3ee"],
    gadget: ["#7c3aed", "#ec4899"],
  };

  // Membuat gambar produk SVG (data URI) dengan ikon emoji besar
  function makeImage(emoji, cat, label) {
    const [c1, c2] = PALETTES[cat] || ["#6366f1", "#8b5cf6"];
    const id = "g" + Math.random().toString(36).slice(2, 8);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="${id}b" cx="0.5" cy="0.35" r="0.75">
      <stop offset="0" stop-color="rgba(255,255,255,0.35)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#${id})"/>
  <rect width="600" height="600" fill="url(#${id}b)"/>
  <circle cx="300" cy="250" r="150" fill="rgba(255,255,255,0.14)"/>
  <text x="300" y="300" font-size="200" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  <text x="300" y="500" font-size="34" font-family="Plus Jakarta Sans, Arial" font-weight="700" fill="rgba(255,255,255,0.92)" text-anchor="middle">${label}</text>
</svg>`.trim();
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  const CATEGORIES = [
    { id: "all", name: "Semua", icon: "🛍️" },
    { id: "electronics", name: "Elektronik", icon: "💻" },
    { id: "gadget", name: "Gadget", icon: "📱" },
    { id: "fashion", name: "Fashion", icon: "👟" },
    { id: "home", name: "Rumah Tangga", icon: "🏠" },
    { id: "beauty", name: "Kecantikan", icon: "💄" },
    { id: "sports", name: "Olahraga", icon: "🏀" },
  ];

  // Helper membuat review
  const rv = (user, stars, text) => ({ user, stars, text });

  const PRODUCTS = [
    {
      id: "p1",
      name: "Headphone Nirkabel ANC Pro",
      emoji: "🎧",
      cat: "electronics",
      price: 749000,
      oldPrice: 1199000,
      rating: 4.8,
      ratingCount: 2143,
      sold: 12800,
      promo: "FLASH SALE",
      seller: "AudioTech Official",
      location: "Jakarta Pusat",
      shipping: "Gratis Ongkir",
      stock: 48,
      tags: ["best", "audio"],
      desc: "Headphone over-ear dengan Active Noise Cancelling, driver 40mm, dan baterai tahan 40 jam. Nyaman dipakai seharian dengan bantalan memory foam.",
      specs: {
        "Konektivitas": "Bluetooth 5.3",
        "Baterai": "40 jam (ANC off)",
        "Driver": "40mm Dynamic",
        "Fitur": "ANC, Multipoint, Fast Charge",
        "Garansi": "1 Tahun Resmi",
      },
      reviews: [
        rv("Dika A.", 5, "Suaranya jernih, ANC-nya benar-benar bikin fokus. Worth it!"),
        rv("Rina S.", 5, "Baterai awet banget, sehari penuh gak habis."),
        rv("Bagus P.", 4, "Mantap, cuma case-nya agak besar."),
      ],
    },
    {
      id: "p2",
      name: "Smartphone Nova X5 128GB",
      emoji: "📱",
      cat: "gadget",
      price: 2999000,
      oldPrice: 3499000,
      rating: 4.7,
      ratingCount: 5321,
      sold: 23400,
      promo: "TERLARIS",
      seller: "Nova Official Store",
      location: "Jakarta Barat",
      shipping: "Gratis Ongkir",
      stock: 120,
      tags: ["best", "phone"],
      desc: "Smartphone layar AMOLED 6.6\" 120Hz, kamera 108MP, baterai 5000mAh dengan fast charging 67W. Performa gesit untuk harian dan gaming.",
      specs: {
        "Layar": "6.6\" AMOLED 120Hz",
        "Kamera": "108MP + 8MP + 2MP",
        "Baterai": "5000mAh 67W",
        "RAM/ROM": "8GB / 128GB",
        "Garansi": "1 Tahun Resmi",
      },
      reviews: [
        rv("Fajar M.", 5, "Kamera jernih, layar mulus 120Hz. Puas banget."),
        rv("Siti N.", 5, "Fast charging-nya cepet, 30 menit udah 70%."),
        rv("Tono W.", 4, "Bagus di harga segini, bodi agak licin."),
      ],
    },
    {
      id: "p3",
      name: "Sepatu Lari Aero Boost",
      emoji: "👟",
      cat: "fashion",
      price: 459000,
      oldPrice: 699000,
      rating: 4.6,
      ratingCount: 1890,
      sold: 9800,
      promo: "DISKON 34%",
      seller: "SportStyle ID",
      location: "Bandung",
      shipping: "Gratis Ongkir",
      stock: 64,
      tags: ["sport"],
      desc: "Sepatu lari ringan dengan midsole busa responsif dan upa knit yang breathable. Cocok untuk lari harian maupun olahraga ringan.",
      specs: {
        "Berat": "238 gram",
        "Material": "Knit + Rubber Outsole",
        "Teknologi": "Responsive Foam",
        "Ukuran": "39 - 44",
        "Garansi": "Tukar 7 Hari",
      },
      reviews: [
        rv("Andre K.", 5, "Enteng dan empuk, enak buat lari pagi."),
        rv("Mega L.", 4, "Modelnya kece, ukuran pas."),
        rv("Yoga T.", 5, "Grip bagus, gak licin di aspal basah."),
      ],
    },
    {
      id: "p4",
      name: "Smart Watch FitPulse 2",
      emoji: "⌚",
      cat: "gadget",
      price: 389000,
      oldPrice: 599000,
      rating: 4.5,
      ratingCount: 3120,
      sold: 15600,
      promo: "HEMAT 35%",
      seller: "Nova Official Store",
      location: "Jakarta Barat",
      shipping: "Gratis Ongkir",
      stock: 90,
      tags: ["best", "wearable"],
      desc: "Smartwatch dengan layar AMOLED 1.43\", monitor detak jantung, SpO2, 100+ mode olahraga, dan tahan air 5ATM. Baterai hingga 14 hari.",
      specs: {
        "Layar": "1.43\" AMOLED",
        "Sensor": "Heart Rate, SpO2, Sleep",
        "Baterai": "14 hari",
        "Tahan Air": "5ATM",
        "Garansi": "1 Tahun Resmi",
      },
      reviews: [
        rv("Lia P.", 5, "Baterai awet, fitur lengkap buat harga segini."),
        rv("Rizal F.", 4, "Akurasi detak jantung oke, layar cerah."),
        rv("Nina D.", 5, "Desain elegan, banyak watch face lucu."),
      ],
    },
    {
      id: "p5",
      name: "Blender Portabel Juicer 400ml",
      emoji: "🧃",
      cat: "home",
      price: 159000,
      oldPrice: 259000,
      rating: 4.4,
      ratingCount: 980,
      sold: 7400,
      promo: "DISKON",
      seller: "HomeLife Store",
      location: "Surabaya",
      shipping: "Gratis Ongkir",
      stock: 150,
      tags: ["home"],
      desc: "Blender portabel rechargeable USB-C, 6 pisau stainless, cocok untuk jus, smoothie, dan MPASI. Ringan dibawa ke mana saja.",
      specs: {
        "Kapasitas": "400ml",
        "Daya": "USB-C Rechargeable",
        "Pisau": "6 Stainless Steel",
        "Material": "BPA Free",
        "Garansi": "6 Bulan",
      },
      reviews: [
        rv("Wati S.", 5, "Praktis buat bikin jus di kantor."),
        rv("Hendra", 4, "Lumayan kuat, buat buah lunak oke."),
        rv("Dewi R.", 4, "Mudah dibersihkan, baterai cukup awet."),
      ],
    },
    {
      id: "p6",
      name: "Serum Vitamin C Glow 30ml",
      emoji: "🧴",
      cat: "beauty",
      price: 89000,
      oldPrice: 149000,
      rating: 4.9,
      ratingCount: 6730,
      sold: 41200,
      promo: "TERLARIS",
      seller: "GlowCare Official",
      location: "Jakarta Selatan",
      shipping: "Gratis Ongkir",
      stock: 300,
      tags: ["best", "beauty"],
      desc: "Serum wajah dengan 10% Vitamin C + Hyaluronic Acid untuk mencerahkan dan melembapkan. Tekstur ringan cepat meresap.",
      specs: {
        "Isi": "30ml",
        "Kandungan": "10% Vit C, HA, Niacinamide",
        "Jenis Kulit": "Semua jenis",
        "BPOM": "Terdaftar",
        "Garansi": "Original 100%",
      },
      reviews: [
        rv("Putri A.", 5, "Kulit jadi lebih cerah dalam 2 minggu!"),
        rv("Sari M.", 5, "Gak lengket, cepat meresap. Suka banget."),
        rv("Intan K.", 5, "Repurchase ke-3 kali, cocok di kulitku."),
      ],
    },
    {
      id: "p7",
      name: "Keyboard Mechanical RGB 87 Key",
      emoji: "⌨️",
      cat: "electronics",
      price: 329000,
      oldPrice: 499000,
      rating: 4.7,
      ratingCount: 2410,
      sold: 11200,
      promo: "DISKON 34%",
      seller: "AudioTech Official",
      location: "Jakarta Pusat",
      shipping: "Gratis Ongkir",
      stock: 70,
      tags: ["gaming"],
      desc: "Keyboard mechanical TKL dengan hot-swappable switch, backlight RGB, dan keycap PBT. Cocok untuk gaming dan mengetik.",
      specs: {
        "Layout": "TKL 87 Key",
        "Switch": "Hot-swappable Red",
        "Backlight": "RGB per-key",
        "Koneksi": "USB-C",
        "Garansi": "1 Tahun",
      },
      reviews: [
        rv("Galih R.", 5, "Typing-nya enak, RGB-nya cakep."),
        rv("Vino", 4, "Switch empuk, bisa diganti sendiri."),
        rv("Arya P.", 5, "Build quality solid banget."),
      ],
    },
    {
      id: "p8",
      name: "Tas Ransel Anti Air 25L",
      emoji: "🎒",
      cat: "fashion",
      price: 215000,
      oldPrice: 320000,
      rating: 4.6,
      ratingCount: 1560,
      sold: 8900,
      promo: "DISKON",
      seller: "SportStyle ID",
      location: "Bandung",
      shipping: "Gratis Ongkir",
      stock: 110,
      tags: ["daily"],
      desc: "Ransel multifungsi dengan kompartemen laptop 15.6\", bahan anti air, port USB charging, dan desain ergonomis untuk harian & travel.",
      specs: {
        "Kapasitas": "25 Liter",
        "Slot Laptop": "15.6 inci",
        "Material": "Polyester Anti Air",
        "Fitur": "USB Port, Anti Maling",
        "Garansi": "Tukar 7 Hari",
      },
      reviews: [
        rv("Fikri H.", 5, "Muat banyak, nyaman di punggung."),
        rv("Tari L.", 4, "Bahan tebal, beneran anti air."),
        rv("Oka W.", 5, "Worth it, banyak kantong."),
      ],
    },
    {
      id: "p9",
      name: "Bola Basket Indoor/Outdoor Size 7",
      emoji: "🏀",
      cat: "sports",
      price: 185000,
      oldPrice: 275000,
      rating: 4.5,
      ratingCount: 740,
      sold: 4300,
      promo: "DISKON",
      seller: "SportStyle ID",
      location: "Bandung",
      shipping: "Gratis Ongkir",
      stock: 85,
      tags: ["sport"],
      desc: "Bola basket komposit size 7 dengan grip maksimal, cocok untuk lapangan indoor maupun outdoor. Tahan lama dan tidak licin.",
      specs: {
        "Ukuran": "Size 7 (Resmi)",
        "Material": "Composite Leather",
        "Penggunaan": "Indoor & Outdoor",
        "Grip": "Deep Channel",
        "Garansi": "Tukar 7 Hari",
      },
      reviews: [
        rv("Reza B.", 5, "Grip-nya mantap, gak licin."),
        rv("Dani S.", 4, "Pantulan konsisten, awet."),
        rv("Ello", 5, "Kualitas bagus di harganya."),
      ],
    },
    {
      id: "p10",
      name: "Lampu Meja LED Pintar Dimmable",
      emoji: "💡",
      cat: "home",
      price: 139000,
      oldPrice: 229000,
      rating: 4.6,
      ratingCount: 1120,
      sold: 6100,
      promo: "HEMAT 39%",
      seller: "HomeLife Store",
      location: "Surabaya",
      shipping: "Gratis Ongkir",
      stock: 95,
      tags: ["home"],
      desc: "Lampu meja LED dengan 3 mode warna, kecerahan dimmable sentuh, dan port USB charging. Hemat energi dan ramah mata.",
      specs: {
        "Mode Warna": "3 (Warm/Netral/Cool)",
        "Kontrol": "Touch Dimmable",
        "Daya": "USB / Rechargeable",
        "Fitur": "Timer, USB Port",
        "Garansi": "6 Bulan",
      },
      reviews: [
        rv("Nanda", 5, "Cahayanya adem, enak buat belajar."),
        rv("Prita", 4, "Bisa di-charge, fleksibel ditaruh."),
        rv("Guntur", 5, "Desain minimalis, suka."),
      ],
    },
    {
      id: "p11",
      name: "Parfum EDP Signature 50ml",
      emoji: "🌸",
      cat: "beauty",
      price: 129000,
      oldPrice: 199000,
      rating: 4.8,
      ratingCount: 2890,
      sold: 18700,
      promo: "TERLARIS",
      seller: "GlowCare Official",
      location: "Jakarta Selatan",
      shipping: "Gratis Ongkir",
      stock: 200,
      tags: ["beauty"],
      desc: "Eau de Parfum dengan aroma floral woody yang tahan lama hingga 8 jam. Cocok untuk aktivitas harian maupun acara spesial.",
      specs: {
        "Isi": "50ml",
        "Konsentrasi": "EDP",
        "Aroma": "Floral Woody",
        "Ketahanan": "8 jam",
        "BPOM": "Terdaftar",
      },
      reviews: [
        rv("Alya", 5, "Wanginya elegan dan tahan lama."),
        rv("Bimo", 5, "Dapat banyak pujian pas pakai ini."),
        rv("Citra", 4, "Suka, projection-nya pas."),
      ],
    },
    {
      id: "p12",
      name: "Power Bank 20000mAh Fast Charge",
      emoji: "🔋",
      cat: "gadget",
      price: 199000,
      oldPrice: 349000,
      rating: 4.7,
      ratingCount: 4210,
      sold: 27300,
      promo: "FLASH SALE",
      seller: "Nova Official Store",
      location: "Jakarta Barat",
      shipping: "Gratis Ongkir",
      stock: 180,
      tags: ["best", "gadget"],
      desc: "Power bank 20000mAh dengan dukungan fast charge 22.5W, triple output, dan layar indikator digital. Aman untuk semua gadget.",
      specs: {
        "Kapasitas": "20000mAh",
        "Output": "22.5W PD/QC",
        "Port": "2x USB-A, 1x USB-C",
        "Fitur": "Layar Digital",
        "Garansi": "1 Tahun",
      },
      reviews: [
        rv("Hafiz", 5, "Ngisi cepet, bisa buat beberapa device."),
        rv("Mira", 5, "Kapasitas asli, awet seharian."),
        rv("Teguh", 4, "Agak berat tapi worth it."),
      ],
    },
  ];

  // ---- Foto produk ASLI (disimpan lokal di assets/products, bukan vektor) ----
  // Foto diunduh dari Unsplash dan disimpan lokal agar andal (tanpa rate-limit,
  // bekerja offline, dan konsisten saat di-deploy ke Vercel).
  // Jika sebuah foto gagal dimuat, otomatis beralih ke SVG fallback (lihat onerror di app.js).
  PRODUCTS.forEach((p) => {
    p.fallback = makeImage(p.emoji, p.cat, p.name.split(" ").slice(0, 2).join(" "));
    p.image = `assets/products/${p.id}.jpg`;
  });

  // 3 Foto unggulan ASLI untuk hero gallery
  const AI_FEATURED = [
    { title: "Koleksi Gadget Premium", emoji: "📱", cat: "gadget", sub: "Dikurasi oleh AI" },
    { title: "Audio Experience", emoji: "🎧", cat: "electronics", sub: "Rekomendasi teratas" },
    { title: "Glow & Beauty", emoji: "✨", cat: "beauty", sub: "Favorit pembeli" },
  ].map((f, i) => ({
    ...f,
    image: `assets/products/feat${i}.jpg`,
    fallback: makeImage(f.emoji, f.cat, f.title),
  }));

  // Voucher yang tersedia
  const VOUCHERS = {
    "SHOPAI10": { type: "percent", value: 10, min: 100000, label: "Diskon 10% (min. Rp100.000)" },
    "HEMAT25K": { type: "flat", value: 25000, min: 150000, label: "Potongan Rp25.000 (min. Rp150.000)" },
    "GRATISONGKIR": { type: "shipping", value: 0, min: 0, label: "Gratis Ongkir" },
  };

  // Expose ke global
  window.SHOPAI_DATA = { CATEGORIES, PRODUCTS, AI_FEATURED, VOUCHERS, makeImage };
})();
