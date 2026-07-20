// Service Worker untuk Monitor Baki Gabungan (Teguh Resources & Services)
// Corak: network-first — sentiasa cuba dapatkan versi terkini dari internet dahulu;
// jika offline / gagal sambung, fallback guna versi tersimpan dalam cache.

const CACHE_NAME = "trs-baki-gabungan-v1";
const ASET_UNTUK_CACHE = [
  "./trs.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// INSTALL — simpan aset utama ke cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASET_UNTUK_CACHE))
  );
  self.skipWaiting();
});

// ACTIVATE — buang cache versi lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((namaSemua) =>
      Promise.all(
        namaSemua
          .filter((nama) => nama !== CACHE_NAME)
          .map((nama) => caches.delete(nama))
      )
    )
  );
  self.clients.claim();
});

// FETCH — network-first, fallback ke cache
self.addEventListener("fetch", (event) => {
  // Hanya urus permintaan GET; biar permintaan lain (POST ke Apps Script, dsb.) terus ke rangkaian
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((responseRangkaian) => {
        // Salin & simpan versi terkini ke cache untuk kegunaan offline kelak
        const responseUntukCache = responseRangkaian.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseUntukCache);
        });
        return responseRangkaian;
      })
      .catch(() => {
        // Rangkaian gagal (offline) — cuba ambil dari cache
        return caches.match(event.request).then((responseCache) => {
          return responseCache || caches.match("./trs.html");
        });
      })
  );
});
