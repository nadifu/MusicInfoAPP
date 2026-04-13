const API_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

const queryInput = document.getElementById("query");
const searchTypeSelect = document.getElementById("searchType");
const searchBtn = document.getElementById("searchBtn");

const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

// Elemen untuk mode artis
const artistImageEl = document.getElementById("artistImage");
const artistNameEl = document.getElementById("artistName");
const artistListenersEl = document.getElementById("artistListeners");
const artistLinkEl = document.getElementById("artistLink");
const genreListEl = document.getElementById("genreList");
const artistBioEl = document.getElementById("artistBio");
const topTracksEl = document.getElementById("topTracks");
const topAlbumsEl = document.getElementById("topAlbums");
const similarArtistsEl = document.getElementById("similarArtists");

// Elemen untuk mode LAGU
const trackResultEl = document.getElementById("trackResult");
const trackAlbumImageEl = document.getElementById("trackAlbumImage");
const trackTitleEl = document.getElementById("trackTitle");
const trackArtistNameEl = document.getElementById("trackArtistName");
const trackAlbumNameEl = document.getElementById("trackAlbumName");
const trackListenersEl = document.getElementById("trackListeners");
const trackPlaycountEl = document.getElementById("trackPlaycount");
const trackDurationEl = document.getElementById("trackDuration");
const trackLinkEl = document.getElementById("trackLink");
const trackTagListEl = document.getElementById("trackTagList");
const trackWikiEl = document.getElementById("trackWiki");
const artistTopTracksForTrackEl = document.getElementById("artistTopTracksForTrack");
const trackAlbumDetailEl = document.getElementById("trackAlbumDetail");
const trackSimilarArtistsEl = document.getElementById("trackSimilarArtists");

searchBtn.addEventListener("click", onSearch);
queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    onSearch();
  }
});

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function clearResult() {
  resultEl.classList.add("hidden");
  trackResultEl.classList.add("hidden");
  genreListEl.innerHTML = "";
  topTracksEl.innerHTML = "";
  topAlbumsEl.innerHTML = "";
  similarArtistsEl.innerHTML = "";
  trackTagListEl.innerHTML = "";
  artistTopTracksForTrackEl.innerHTML = "";
  trackSimilarArtistsEl.innerHTML = "";
}

function cleanBio(bio = "") {
  const withoutLinks = bio.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
  return withoutLinks.replace(/<[^>]+>/g, "").trim();
}

function formatNumber(value) {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat("id-ID").format(numeric);
}

function normalizeImageUrl(url = "") {
  if (!url) {
    return "";
  }

  const trimmedUrl = String(url).trim();
  if (!trimmedUrl) {
    return "";
  }

  if (trimmedUrl.startsWith("//")) {
    return `https:${trimmedUrl}`;
  }

  return trimmedUrl;
}

function isPlaceholderImage(url = "") {
  const lowerUrl = String(url).toLowerCase();
  return lowerUrl.includes("2a96cbd8b46e442fc41c2b86b821562f") || lowerUrl.includes("4128a6eb29f94943c9d206c08e625904");
}

function isUsableImage(url = "") {
  const normalized = normalizeImageUrl(url);
  if (!normalized) {
    return false;
  }

  return !isPlaceholderImage(normalized);
}

function getLargestImage(images = []) {
  const sizes = ["extralarge", "large", "medium", "small"];
  for (const size of sizes) {
    const image = images.find((img) => img.size === size && isUsableImage(img["#text"]));
    if (image && image["#text"]) {
      return normalizeImageUrl(image["#text"]);
    }
  }
  return "";
}

function getFallbackImageFromCollections(topAlbums = [], similarArtists = []) {
  for (const album of topAlbums) {
    const imageUrl = getLargestImage(album.image || []);
    if (imageUrl) {
      return imageUrl;
    }
  }

  for (const artist of similarArtists) {
    const imageUrl = getLargestImage(artist.image || []);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
}

async function requestLastFm(params) {
  const finalParams = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY,
    format: "json"
  });

  const response = await fetch(`${API_BASE_URL}?${finalParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Gagal mengambil data (${response.status})`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.message || "Terjadi kesalahan dari API Last.fm");
  }

  return data;
}

async function fetchArtistByName(artistName) {
  const [artistInfoData, topTracksData, topAlbumsData, similarArtistsData] = await Promise.all([
    requestLastFm({ method: "artist.getinfo", artist: artistName }),
    requestLastFm({ method: "artist.gettoptracks", artist: artistName, limit: "10" }),
    requestLastFm({ method: "artist.gettopalbums", artist: artistName, limit: "8" }),
    requestLastFm({ method: "artist.getsimilar", artist: artistName, limit: "8" })
  ]);

  const topAlbums = topAlbumsData.topalbums?.album || [];
  const similarArtists = similarArtistsData.similarartists?.artist || [];

  return {
    artist: artistInfoData.artist,
    topTracks: topTracksData.toptracks?.track || [],
    topAlbums,
    similarArtists,
    fallbackImageUrl: getFallbackImageFromCollections(topAlbums, similarArtists)
  };
}

async function findArtistFromTrack(trackQuery) {
  const result = await requestLastFm({
    method: "track.search",
    track: trackQuery,
    limit: "1"
  });

  const tracks = result.results?.trackmatches?.track;
  const firstTrack = Array.isArray(tracks) ? tracks[0] : tracks;

  if (!firstTrack || !firstTrack.artist) {
    throw new Error("Lagu tidak ditemukan. Coba kata kunci lain.");
  }

  return {
    artistName: firstTrack.artist,
    matchedTrackName: firstTrack.name
  };
}

async function fetchTrackInfo(trackQuery) {
  // 1. Cari lagu dulu untuk mendapatkan nama artis & judul yang tepat
  const searchResult = await requestLastFm({
    method: "track.search",
    track: trackQuery,
    limit: "1"
  });

  const tracks = searchResult.results?.trackmatches?.track;
  const firstTrack = Array.isArray(tracks) ? tracks[0] : tracks;

  if (!firstTrack || !firstTrack.artist) {
    throw new Error("Lagu tidak ditemukan. Coba kata kunci lain.");
  }

  const artistName = firstTrack.artist;
  const trackName = firstTrack.name;

  // 2. Ambil detail lagu dan top tracks artis secara paralel
  const [trackInfoData, artistTopTracksData, similarArtistsData] = await Promise.all([
    requestLastFm({ method: "track.getInfo", artist: artistName, track: trackName }),
    requestLastFm({ method: "artist.gettoptracks", artist: artistName, limit: "8" }),
    requestLastFm({ method: "artist.getsimilar", artist: artistName, limit: "6" })
  ]);

  return {
    track: trackInfoData.track,
    artistTopTracks: artistTopTracksData.toptracks?.track || [],
    similarArtists: similarArtistsData.similarartists?.artist || []
  };
}

function renderArtistCard(artist, fallbackImageUrl = "") {
  const imageUrl = getLargestImage(artist.image || []) || fallbackImageUrl;

  if (imageUrl) {
    artistImageEl.src = imageUrl;
    artistImageEl.alt = `Foto ${artist.name}`;
    artistImageEl.classList.remove("hidden");
  } else {
    artistImageEl.src = "";
    artistImageEl.alt = "Tidak ada foto artis";
    artistImageEl.classList.add("hidden");
  }

  artistImageEl.onerror = () => {
    artistImageEl.src = "";
    artistImageEl.alt = "Tidak ada foto artis";
    artistImageEl.classList.add("hidden");
  };

  artistNameEl.textContent = artist.name || "Tidak diketahui";
  artistListenersEl.textContent = `Listeners: ${formatNumber(artist.stats?.listeners)}`;
  artistLinkEl.href = artist.url || "#";

  const tags = artist.tags?.tag || [];
  genreListEl.innerHTML = "";

  if (tags.length === 0) {
    const emptyTag = document.createElement("span");
    emptyTag.textContent = "Genre belum tersedia";
    genreListEl.appendChild(emptyTag);
  } else {
    tags.slice(0, 8).forEach((tag) => {
      const pill = document.createElement("span");
      pill.textContent = tag.name;
      genreListEl.appendChild(pill);
    });
  }

  const summary = cleanBio(artist.bio?.summary || artist.bio?.content || "");
  artistBioEl.textContent = summary || "Biografi belum tersedia untuk artis ini.";
}

function renderTopTracks(topTracks) {
  topTracksEl.innerHTML = "";

  if (!topTracks || topTracks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Top tracks belum tersedia.";
    topTracksEl.appendChild(li);
    return;
  }

  topTracks.slice(0, 10).forEach((track) => {
    const li = document.createElement("li");
    if (track.url) {
      const link = document.createElement("a");
      link.href = track.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = track.name;
      li.appendChild(link);
    } else {
      li.textContent = track.name;
    }

    const playCount = track.playcount ? ` (${formatNumber(track.playcount)} plays)` : "";
    li.appendChild(document.createTextNode(playCount));
    topTracksEl.appendChild(li);
  });
}

function renderTopAlbums(topAlbums) {
  topAlbumsEl.innerHTML = "";

  if (!topAlbums || topAlbums.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Top albums belum tersedia.";
    topAlbumsEl.appendChild(li);
    return;
  }

  topAlbums.slice(0, 8).forEach((album) => {
    const li = document.createElement("li");
    if (album.url) {
      const link = document.createElement("a");
      link.href = album.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = album.name;
      li.appendChild(link);
    } else {
      li.textContent = album.name;
    }

    const playCount = album.playcount ? ` (${formatNumber(album.playcount)} plays)` : "";
    li.appendChild(document.createTextNode(playCount));
    topAlbumsEl.appendChild(li);
  });
}

function renderSimilarArtists(similarArtists) {
  similarArtistsEl.innerHTML = "";

  if (!similarArtists || similarArtists.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Similar artists belum tersedia.";
    similarArtistsEl.appendChild(li);
    return;
  }

  similarArtists.slice(0, 8).forEach((artist) => {
    const li = document.createElement("li");
    if (artist.url) {
      const link = document.createElement("a");
      link.href = artist.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = artist.name;
      li.appendChild(link);
    } else {
      li.textContent = artist.name;
    }

    const matchText = artist.match ? ` (${Math.round(Number(artist.match) * 100)}% match)` : "";
    li.appendChild(document.createTextNode(matchText));
    similarArtistsEl.appendChild(li);
  });
}

function renderTrackCard(track, artistTopTracks, similarArtists) {
  // Judul & artis
  trackTitleEl.textContent = track.name || "Tidak diketahui";
  trackArtistNameEl.textContent = `Artis: ${track.artist?.name || "-"}`;

  // Album
  const albumName = track.album?.title;
  if (albumName) {
    trackAlbumNameEl.textContent = `Album: ${albumName}`;
    trackAlbumNameEl.classList.remove("hidden");
    trackAlbumDetailEl.textContent = albumName;
  } else {
    trackAlbumNameEl.textContent = "";
    trackAlbumDetailEl.textContent = "Tidak tersedia";
  }

  // Gambar cover album
  const albumImages = track.album?.image || [];
  const albumImgUrl = getLargestImage(albumImages);
  if (albumImgUrl) {
    trackAlbumImageEl.src = albumImgUrl;
    trackAlbumImageEl.alt = `Cover ${albumName || track.name}`;
    trackAlbumImageEl.classList.remove("hidden");
  } else {
    trackAlbumImageEl.src = "";
    trackAlbumImageEl.classList.add("hidden");
  }

  trackAlbumImageEl.onerror = () => {
    trackAlbumImageEl.src = "";
    trackAlbumImageEl.classList.add("hidden");
  };

  // Stats
  const listeners = track.listeners ? `👤 ${formatNumber(track.listeners)} listeners` : "";
  const playcount = track.playcount ? `▶ ${formatNumber(track.playcount)} plays` : "";
  const durationMs = Number(track.duration || 0);
  const durationText = durationMs > 0
    ? `⏱ ${Math.floor(durationMs / 60000)}:${String(Math.floor((durationMs % 60000) / 1000)).padStart(2, "0")}`
    : "";

  trackListenersEl.textContent = listeners;
  trackPlaycountEl.textContent = playcount;
  trackDurationEl.textContent = durationText;

  trackLinkEl.href = track.url || "#";

  // Tag / Genre
  trackTagListEl.innerHTML = "";
  const tags = track.toptags?.tag || [];
  if (tags.length === 0) {
    const span = document.createElement("span");
    span.textContent = "Belum ada tag";
    trackTagListEl.appendChild(span);
  } else {
    tags.slice(0, 8).forEach((tag) => {
      const pill = document.createElement("span");
      pill.textContent = tag.name;
      trackTagListEl.appendChild(pill);
    });
  }

  // Wiki / deskripsi lagu
  const wiki = cleanBio(track.wiki?.summary || track.wiki?.content || "");
  trackWikiEl.textContent = wiki || "Deskripsi lagu belum tersedia.";

  // Top tracks artis
  artistTopTracksForTrackEl.innerHTML = "";
  if (!artistTopTracks || artistTopTracks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Belum tersedia.";
    artistTopTracksForTrackEl.appendChild(li);
  } else {
    artistTopTracks.slice(0, 8).forEach((t) => {
      const li = document.createElement("li");
      if (t.url) {
        const link = document.createElement("a");
        link.href = t.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = t.name;
        li.appendChild(link);
      } else {
        li.textContent = t.name;
      }
      const pc = t.playcount ? ` (${formatNumber(t.playcount)} plays)` : "";
      li.appendChild(document.createTextNode(pc));
      artistTopTracksForTrackEl.appendChild(li);
    });
  }

  // Artis serupa
  trackSimilarArtistsEl.innerHTML = "";
  if (!similarArtists || similarArtists.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Belum tersedia.";
    trackSimilarArtistsEl.appendChild(li);
  } else {
    similarArtists.slice(0, 6).forEach((artist) => {
      const li = document.createElement("li");
      if (artist.url) {
        const link = document.createElement("a");
        link.href = artist.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = artist.name;
        li.appendChild(link);
      } else {
        li.textContent = artist.name;
      }
      const matchText = artist.match ? ` (${Math.round(Number(artist.match) * 100)}% match)` : "";
      li.appendChild(document.createTextNode(matchText));
      trackSimilarArtistsEl.appendChild(li);
    });
  }
}

async function onSearch() {
  if (typeof LASTFM_API_KEY === "undefined" || !LASTFM_API_KEY || LASTFM_API_KEY === "YOUR_LASTFM_API_KEY") {
    setStatus("Masukkan API key Last.fm di file config.js terlebih dahulu.", "error");
    clearResult();
    return;
  }

  const query = queryInput.value.trim();
  const searchType = searchTypeSelect.value;

  if (!query) {
    setStatus("Masukkan kata kunci pencarian dulu.", "error");
    clearResult();
    return;
  }

  try {
    setStatus("Mengambil data dari Last.fm...", "loading");
    clearResult();

    if (searchType === "track") {
      // === MODE LAGU ===
      const { track, artistTopTracks, similarArtists } = await fetchTrackInfo(query);
      renderTrackCard(track, artistTopTracks, similarArtists);
      trackResultEl.classList.remove("hidden");
      setStatus(`Berhasil menampilkan info lagu: ${track.name} — ${track.artist?.name}.`);
    } else {
      // === MODE ARTIS ===
      const { artist, topTracks, topAlbums, similarArtists, fallbackImageUrl } = await fetchArtistByName(query);
      renderArtistCard(artist, fallbackImageUrl);
      renderTopTracks(topTracks);
      renderTopAlbums(topAlbums);
      renderSimilarArtists(similarArtists);
      resultEl.classList.remove("hidden");
      setStatus(`Berhasil menampilkan informasi untuk ${artist.name}.`);
    }
  } catch (error) {
    setStatus(error.message || "Terjadi kesalahan yang tidak diketahui.", "error");
    clearResult();
  }
}
