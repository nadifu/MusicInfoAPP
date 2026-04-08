# Music Info App (Last.fm)

Aplikasi web sederhana untuk mencari informasi artis atau lagu menggunakan API Last.fm.

## Fitur

- Cari berdasarkan nama artis.
- Cari berdasarkan judul lagu (otomatis menampilkan artis dari hasil lagu pertama).
- Menampilkan genre (tags), biografi, jumlah listeners, dan top tracks.
- UI responsif untuk desktop dan mobile.

## Cara Menjalankan

1. Buka file `config.js`, lalu isi API key:

```js
const LASTFM_API_KEY = "API_KEY_KAMU";
```

2. Jalankan melalui XAMPP (Apache), lalu buka:

```txt
http://localhost/MusicInfoAPP/
```

## Sumber API

- Last.fm API docs: https://www.last.fm/api
