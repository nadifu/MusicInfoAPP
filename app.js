const API_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

const queryInput = document.getElementById("query");
const searchTypeSelect = document.getElementById("searchType");
const searchBtn = document.getElementById("searchBtn");

const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

const artistImageEl = document.getElementById("artistImage");
const artistNameEl = document.getElementById("artistName");
const artistListenersEl = document.getElementById("artistListeners");
const artistLinkEl = document.getElementById("artistLink");
const genreListEl = document.getElementById("genreList");
const artistBioEl = document.getElementById("artistBio");
const topTracksEl = document.getElementById("topTracks");
const topAlbumsEl = document.getElementById("topAlbums");
const similarArtistsEl = document.getElementById("similarArtists");

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
  genreListEl.innerHTML = "";
  topTracksEl.innerHTML = "";
  topAlbumsEl.innerHTML = "";
  similarArtistsEl.innerHTML = "";
}

function cleanBio(bio = "") {
  const withoutLinks = bio.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
  return withoutLinks.replace(/<[^>]+>/g, "").trim();
}

function formatNumber(value) {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat("id-ID").format(numeric);
}

function getLargestImage(images = []) {
  const sizes = ["extralarge", "large", "medium", "small"];
  for (const size of sizes) {
    const image = images.find((img) => img.size === size && img["#text"]);
    if (image && image["#text"]) {
      return image["#text"];
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

  return {
    artist: artistInfoData.artist,
    topTracks: topTracksData.toptracks?.track || [],
    topAlbums: topAlbumsData.topalbums?.album || [],
    similarArtists: similarArtistsData.similarartists?.artist || []
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

function renderArtistCard(artist) {
  const imageUrl = getLargestImage(artist.image || []);

  if (imageUrl) {
    artistImageEl.src = imageUrl;
    artistImageEl.alt = `Foto ${artist.name}`;
    artistImageEl.classList.remove("hidden");
  } else {
    artistImageEl.src = "";
    artistImageEl.alt = "Tidak ada foto artis";
    artistImageEl.classList.add("hidden");
  }

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

    let targetArtistName = query;

    if (searchType === "track") {
      const trackResult = await findArtistFromTrack(query);
      targetArtistName = trackResult.artistName;
      setStatus(`Lagu ditemukan: ${trackResult.matchedTrackName}. Menampilkan artis ${targetArtistName}...`, "loading");
    }

    const { artist, topTracks, topAlbums, similarArtists } = await fetchArtistByName(targetArtistName);
    renderArtistCard(artist);
    renderTopTracks(topTracks);
    renderTopAlbums(topAlbums);
    renderSimilarArtists(similarArtists);

    resultEl.classList.remove("hidden");
    setStatus(`Berhasil menampilkan informasi untuk ${artist.name}.`);
  } catch (error) {
    setStatus(error.message || "Terjadi kesalahan yang tidak diketahui.", "error");
    clearResult();
  }
}
