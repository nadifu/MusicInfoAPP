# Dokumentasi Endpoint Last.fm API

Aplikasi **Music Info App** menggunakan beberapa endpoint dari Last.fm API. Semua request ditujukan ke Base URL berikut menggunakan HTTP GET.

**Base URL:**  
`https://ws.audioscrobbler.com/2.0/`

**Parameter Wajib (untuk semua request):**
- `api_key`: API key Last.fm Anda (diisi di `config.js`).
- `format`: Diatur ke `json` agar respons berupa JSON (bukan XML).

---

## Alur Pencarian

Aplikasi memiliki dua mode pencarian yang dipilih via dropdown:

### Mode Artis
Memanggil **3 endpoint secara paralel** menggunakan `Promise.all`:
1. `artist.getinfo` — info & biografi artis
2. `artist.gettoptracks` — top 10 lagu artis
3. `artist.gettopalbums` — top 8 album artis
4. `artist.getsimilar` — artis serupa

### Mode Lagu
Memanggil endpoint secara bertahap:
1. `track.search` — cari lagu, ambil nama artis & judul yang tepat
2. Kemudian **3 endpoint secara paralel**:
   - `track.getInfo` — detail lengkap lagu
   - `artist.gettoptracks` — top 8 lagu dari artis lagu tersebut
   - `artist.getsimilar` — artis serupa

---

## Endpoint yang Digunakan

---

### 1. Artist Info (`artist.getinfo`)
**Mode:** Artis  
Mengambil informasi detail tentang artis, termasuk biografi, tags (genre), statistik listener, dan foto artis.

**Request:**
```http
GET ?method=artist.getinfo&artist=Coldplay&api_key=YOUR_API_KEY&format=json
```

**Field yang digunakan aplikasi:**

| Field | Keterangan |
|---|---|
| `artist.name` | Nama artis |
| `artist.url` | URL profil di Last.fm |
| `artist.image[]` | Array gambar (dipilih ukuran `extralarge` → `large` → `medium` → `small`) |
| `artist.stats.listeners` | Jumlah listener |
| `artist.tags.tag[]` | Daftar tag/genre (maks. 8) |
| `artist.bio.summary` | Ringkasan biografi |
| `artist.bio.content` | Biografi lengkap (fallback) |

**Format Response:**
```json
{
  "artist": {
    "name": "Coldplay",
    "url": "https://www.last.fm/music/Coldplay",
    "image": [
      { "#text": "https://...small.png", "size": "small" },
      { "#text": "https://...extralarge.png", "size": "extralarge" }
    ],
    "stats": {
      "listeners": "5000000",
      "playcount": "150000000"
    },
    "tags": {
      "tag": [
        { "name": "rock", "url": "..." },
        { "name": "alternative", "url": "..." }
      ]
    },
    "bio": {
      "summary": "Coldplay are a British rock band...",
      "content": "Full biography..."
    }
  }
}
```

---

### 2. Top Tracks (`artist.gettoptracks`)
**Mode:** Artis (limit 10) & Lagu (limit 8, untuk kolom kanan)  
Mengambil daftar lagu paling populer dari artis tertentu.

**Request:**
```http
GET ?method=artist.gettoptracks&artist=Coldplay&limit=10&api_key=YOUR_API_KEY&format=json
```

**Field yang digunakan aplikasi:**

| Field | Keterangan |
|---|---|
| `toptracks.track[].name` | Judul lagu |
| `toptracks.track[].playcount` | Jumlah play |
| `toptracks.track[].url` | URL lagu di Last.fm |

**Format Response:**
```json
{
  "toptracks": {
    "track": [
      {
        "name": "Yellow",
        "playcount": "1200000",
        "listeners": "400000",
        "url": "https://www.last.fm/music/Coldplay/_/Yellow",
        "artist": {
          "name": "Coldplay",
          "url": "https://www.last.fm/music/Coldplay"
        }
      }
      // ... (track lainnya)
    ]
  }
}
```

---

### 3. Top Albums (`artist.gettopalbums`)
**Mode:** Artis  
Mengambil daftar album paling populer dari artis. Gambar album juga dipakai sebagai **fallback image** jika foto artis tidak tersedia.

**Request:**
```http
GET ?method=artist.gettopalbums&artist=Coldplay&limit=8&api_key=YOUR_API_KEY&format=json
```

**Field yang digunakan aplikasi:**

| Field | Keterangan |
|---|---|
| `topalbums.album[].name` | Nama album |
| `topalbums.album[].playcount` | Jumlah play album |
| `topalbums.album[].url` | URL album di Last.fm |
| `topalbums.album[].image[]` | Gambar album (digunakan sebagai fallback artis) |

**Format Response:**
```json
{
  "topalbums": {
    "album": [
      {
        "name": "Parachutes",
        "playcount": "5000000",
        "url": "https://www.last.fm/music/Coldplay/Parachutes",
        "artist": {
          "name": "Coldplay",
          "url": "https://www.last.fm/music/Coldplay"
        },
        "image": [ /* ... */ ]
      }
      // ... (album lainnya)
    ]
  }
}
```

---

### 4. Similar Artists (`artist.getsimilar`)
**Mode:** Artis (limit 8) & Lagu (limit 6, untuk kolom kanan)  
Mengambil daftar artis yang memiliki kemiripan genre/style.

**Request:**
```http
GET ?method=artist.getsimilar&artist=Coldplay&limit=8&api_key=YOUR_API_KEY&format=json
```

**Field yang digunakan aplikasi:**

| Field | Keterangan |
|---|---|
| `similarartists.artist[].name` | Nama artis serupa |
| `similarartists.artist[].match` | Skor kemiripan (0–1, ditampilkan sebagai %) |
| `similarartists.artist[].url` | URL artis di Last.fm |
| `similarartists.artist[].image[]` | Gambar (digunakan sebagai fallback image artis) |

**Format Response:**
```json
{
  "similarartists": {
    "artist": [
      {
        "name": "Keane",
        "match": "1",
        "url": "https://www.last.fm/music/Keane",
        "image": [ /* ... */ ]
      },
      {
        "name": "Radiohead",
        "match": "0.95",
        "url": "https://www.last.fm/music/Radiohead",
        "image": [ /* ... */ ]
      }
      // ... (artis lainnya)
    ]
  }
}
```

---

### 5. Track Search (`track.search`)
**Mode:** Lagu (langkah 1)  
Mencari lagu berdasarkan kata kunci. Aplikasi mengambil hasil pertama untuk mendapatkan **nama artis dan judul lagu yang paling tepat**, lalu digunakan sebagai input untuk `track.getInfo`.

**Request:**
```http
GET ?method=track.search&track=Turing+Love&limit=1&api_key=YOUR_API_KEY&format=json
```

**Field yang digunakan aplikasi:**

| Field | Keterangan |
|---|---|
| `results.trackmatches.track[0].name` | Judul lagu yang ditemukan |
| `results.trackmatches.track[0].artist` | Nama artis dari lagu tersebut |

**Format Response:**
```json
{
  "results": {
    "trackmatches": {
      "track": [
        {
          "name": "Turing Love",
          "artist": "Naoakari",
          "url": "https://www.last.fm/music/Naoakari/_/Turing+Love",
          "listeners": "600000"
        }
      ]
    }
  }
}
```

---

### 6. Track Info (`track.getInfo`)
**Mode:** Lagu (langkah 2)  
Mengambil informasi lengkap tentang sebuah lagu: judul, artis, album, cover, statistik, tag, dan deskripsi wiki. Endpoint ini dipanggil setelah `track.search` berhasil menemukan nama artis dan judul yang tepat.

**Request:**
```http
GET ?method=track.getInfo&artist=Naoakari&track=Turing+Love&api_key=YOUR_API_KEY&format=json
```

**Field yang digunakan aplikasi:**

| Field | Keterangan |
|---|---|
| `track.name` | Judul lagu |
| `track.url` | URL lagu di Last.fm |
| `track.duration` | Durasi dalam milidetik |
| `track.listeners` | Jumlah listener |
| `track.playcount` | Jumlah play |
| `track.artist.name` | Nama artis |
| `track.album.title` | Nama album |
| `track.album.image[]` | Cover album (dipilih ukuran terbesar yang tersedia) |
| `track.toptags.tag[]` | Tag/genre lagu (maks. 8) |
| `track.wiki.summary` | Deskripsi/ringkasan lagu |
| `track.wiki.content` | Deskripsi lengkap (fallback) |

**Format Response:**
```json
{
  "track": {
    "name": "Turing Love",
    "url": "https://www.last.fm/music/Naoakari/_/Turing+Love",
    "duration": "252000",
    "listeners": "120000",
    "playcount": "450000",
    "artist": {
      "name": "Naoakari",
      "url": "https://www.last.fm/music/Naoakari"
    },
    "album": {
      "title": "Single",
      "url": "https://www.last.fm/music/Naoakari/Single",
      "image": [
        { "#text": "https://...small.png", "size": "small" },
        { "#text": "https://...extralarge.png", "size": "extralarge" }
      ]
    },
    "toptags": {
      "tag": [
        { "name": "j-pop", "url": "..." },
        { "name": "anime", "url": "..." }
      ]
    },
    "wiki": {
      "summary": "Turing Love is a song by...",
      "content": "Full description..."
    }
  }
}
```

---

## Ringkasan Endpoint per Mode

| Endpoint | Mode Artis | Mode Lagu |
|---|:---:|:---:|
| `artist.getinfo` | ✅ | ❌ |
| `artist.gettoptracks` | ✅ (limit 10) | ✅ (limit 8) |
| `artist.gettopalbums` | ✅ (limit 8) | ❌ |
| `artist.getsimilar` | ✅ (limit 8) | ✅ (limit 6) |
| `track.search` | ❌ | ✅ (langkah 1) |
| `track.getInfo` | ❌ | ✅ (langkah 2) |