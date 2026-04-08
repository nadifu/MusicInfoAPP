# Dokumentasi Endpoint Last.fm API
 
Aplikasi **Music Info App** menggunakan beberapa endpoint dari Last.fm API. Semua request ditujukan ke Base URL berikut menggunakan HTTP GET.

**Base URL:**  
`https://ws.audioscrobbler.com/2.0/`

**Parameter Wajib (untuk semua request):**
- `api_key`: API key Last.fm Anda.
- `format`: Diatur ke `json` agar respons berupa JSON (bukan XML).

---

## 1. Artist Info (`artist.getinfo`)
Digunakan untuk mengambil informasi detail tentang artis, termasuk biografi, tags (genre), listener stats, dan foto artis.

**Request:**
```http
GET ?method=artist.getinfo&artist=Coldplay&api_key=YOUR_API_KEY&format=json
```

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

## 2. Top Tracks (`artist.gettoptracks`)
Digunakan untuk mengambil daftar lagu (tracks) paling populer dari artis tertentu.

**Request:**
```http
GET ?method=artist.gettoptracks&artist=Coldplay&limit=10&api_key=YOUR_API_KEY&format=json
```

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

## 3. Top Albums (`artist.gettopalbums`)
Digunakan untuk mengambil daftar album paling populer dari artis terkait.

**Request:**
```http
GET ?method=artist.gettopalbums&artist=Coldplay&limit=8&api_key=YOUR_API_KEY&format=json
```

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

## 4. Similar Artists (`artist.getsimilar`)
Digunakan untuk mengambil daftar artis yang memiliki kemiripan (genre/style) dengan artis yang dicari.

**Request:**
```http
GET ?method=artist.getsimilar&artist=Coldplay&limit=8&api_key=YOUR_API_KEY&format=json
```

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

## 5. Track Search (`track.search`)
Digunakan untuk mode **Pencarian Lagu**. Endpoint ini mencari lagu berdasarkan kata kunci, lalu aplikasi akan mengambil nama artis dari lagu di urutan teratas untuk memuat informasi komplit artisnya.

**Request:**
```http
GET ?method=track.search&track=Yellow&limit=1&api_key=YOUR_API_KEY&format=json
```

**Format Response:**
```json
{
  "results": {
    "trackmatches": {
      "track": [
        {
          "name": "Yellow",
          "artist": "Coldplay",
          "url": "https://www.last.fm/music/Coldplay/_/Yellow",
          "listeners": "600000"
        }
      ]
    }
  }
}
```