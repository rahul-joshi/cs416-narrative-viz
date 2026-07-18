// ================================================================
// CS416 Final Project - "What makes a movie great?"
// Interactive slideshow with 2 entry paths (decade + genre)
// Libraries: D3 v7, d3-annotation
// ================================================================

// -------------------- CONFIG --------------------
const WIDTH  = 1000;
const H_MAIN = 480;   // beeswarm (primary chart)
const H_BAR  = 320;   // top-10 bar (secondary chart)
const MARGIN = { top: 30, right: 190, bottom: 60, left: 70 };
const IW = WIDTH - MARGIN.left - MARGIN.right;

const DECADES = [1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010];
const GENRES  = ["Drama", "Comedy", "Crime", "Adventure",
                 "Action", "Thriller", "Biography", "Animation"];

// Category palette used everywhere (Tableau10-ish, stable across scenes)
const GENRE_COLORS = {
  "Drama":     "#4e79a7",
  "Comedy":    "#f28e2b",
  "Crime":     "#e15759",
  "Adventure": "#76b7b2",
  "Action":    "#59a14f",
  "Thriller":  "#edc948",
  "Biography": "#b07aa1",
  "Animation": "#ff9da7",
  "Romance":   "#9c755f",
  "Mystery":   "#bab0ac",
  "Horror":    "#7b3f00",
  "Fantasy":   "#8cd17d",
  "Sci-Fi":    "#8175aa",
  "History":   "#d4a6c8",
  "Family":    "#f1ce63",
  "War":       "#a0cbe8",
  "Western":   "#c49c94",
  "Musical":   "#d37295",
  "Film-Noir": "#79706e",
  "Sport":     "#8dd3c7"
};
const genreColor = g => GENRE_COLORS[g] || "#888";

// -------------------- STATE (parameters) --------------------
const state = {
  page: "landing",       // "landing" | "viz"
  path: "decade",        // "decade" | "genre"
  scene: 0,              // 0..N-1  (direct index into DECADES / GENRES)
  filterGenre: null      // legend filter within a scene (null = show all)
};

// Default entry scene when a user clicks a landing button
const DEFAULT_DECADE_SCENE = DECADES.indexOf(2000); // 2000s = prime decade (most films)
const DEFAULT_GENRE_SCENE  = 0;                     // Drama = most common genre

// -------------------- DATA --------------------
let RAW = [];

d3.csv("imdb_top_1000.csv", d => {
  const yr = +d.Released_Year;
  if (!Number.isFinite(yr)) return null;
  const dec = Math.floor(yr / 10) * 10;
  if (dec < 1930 || dec > 2010) return null;  // drop 1920s (10 films) and 2020s (6 films)
  const gross = d.Gross ? +d.Gross.replace(/,/g, "") : null;
  const genres = d.Genre.split(",").map(g => g.trim());
  return {
    title:   d.Series_Title,
    year:    yr,
    decade:  dec,
    genres:  genres,
    primary: genres[0],
    imdb:    +d.IMDB_Rating,
    meta:    d.Meta_score ? +d.Meta_score : null,
    votes:   +d.No_of_Votes,
    gross:   gross,
    director: d.Director,
    runtime: d.Runtime ? +d.Runtime.replace(" min", "") : null
  };
}).then(data => {
  RAW = data.filter(d => d !== null);
  init();
});

// -------------------- INIT --------------------
function init() {
  // Landing page triggers
  d3.selectAll(".entry-btn").on("click", function () {
    state.path = this.dataset.path;
    state.page = "viz";
    state.scene = state.path === "decade" ? DEFAULT_DECADE_SCENE : DEFAULT_GENRE_SCENE;
    state.filterGenre = null;
    showPage();
    render();
  });

  // Back-to-landing trigger
  d3.select("#back-to-landing").on("click", (e) => {
    e.preventDefault();
    state.page = "landing";
    showPage();
  });

  // Switch-view trigger
  d3.select("#switch-path").on("click", (e) => {
    e.preventDefault();
    state.path = state.path === "decade" ? "genre" : "decade";
    state.scene = state.path === "decade" ? DEFAULT_DECADE_SCENE : DEFAULT_GENRE_SCENE;
    state.filterGenre = null;
    render();
  });

  // Nav triggers
  d3.select("#prev-btn").on("click", () => {
    if (state.scene > 0) { state.scene--; state.filterGenre = null; render(); }
  });
  d3.select("#home-btn").on("click", () => {
    state.page = "landing";
    showPage();
  });
  d3.select("#next-btn").on("click", () => {
    if (state.scene < sceneCount() - 1) { state.scene++; state.filterGenre = null; render(); }
  });

  // Landing animated hook
  drawLandingHook();

  // Start on landing
  showPage();
}

// -------------------- PAGE SWITCH --------------------
function showPage() {
  d3.select("#landing").classed("hidden", state.page !== "landing");
  d3.select("#viz").classed("hidden", state.page !== "viz");
  if (state.page === "landing") drawLandingHook();
}

function sceneCount() {
  return state.path === "decade" ? DECADES.length : GENRES.length;
}

// -------------------- MASTER RENDER --------------------
function render() {
  // Reset chart containers
  d3.select("#chart-primary").html("");
  d3.select("#chart-secondary").html("");

  // Update switch link
  d3.select("#switch-path").text(state.path === "decade"
    ? "Switch to Genre view \u2192"
    : "Switch to Decade view \u2192");

  // Update nav enable state
  d3.select("#prev-btn").property("disabled", state.scene === 0);
  d3.select("#next-btn").property("disabled", state.scene === sceneCount() - 1);

  // Breadcrumb
  drawBreadcrumb();

  // Scene banner and content
  if (state.path === "decade") {
    renderDecadePath();
  } else {
    renderGenrePath();
  }
}

// -------------------- BREADCRUMB --------------------
function drawBreadcrumb() {
  const bc = d3.select("#breadcrumb").html("");
  bc.append("span").attr("class", "bc-label")
    .text(state.path === "decade" ? "Decades:" : "Genres:");

  const items = state.path === "decade"
    ? DECADES.map((d, i) => ({ key: d, label: `${d}s`, idx: i }))
    : GENRES.map((g, i)  => ({ key: g, label: g,         idx: i }));

  items.forEach((it, i) => {
    if (i > 0) bc.append("span").attr("class", "bc-sep").text(" | ");
    bc.append("span").attr("class", "bc-item" + (state.scene === it.idx ? " active" : ""))
      .text(it.label)
      .on("click", () => { state.scene = it.idx; state.filterGenre = null; render(); });
  });
}

// ================================================================
// DECADE PATH
// ================================================================
function renderDecadePath() {
  const decade = DECADES[state.scene];
  d3.select("#scene-banner-text").text(`The ${decade}s`);
  drawBeeswarmForDecade(decade);
  drawTop10ForDecade(decade);
}

// ---------- Decade N: Beeswarm ----------
function drawBeeswarmForDecade(decade) {
  const films = RAW.filter(d => d.decade === decade);
  drawBeeswarm(films,
    `${decade}s films by IMDB rating (bubble size = # votes, color = primary genre)`);
}

// ---------- Decade N: Top 10 bar ----------
function drawTop10ForDecade(decade) {
  const films = RAW.filter(d => d.decade === decade);
  drawTopNBar(films, 10, `Top 10 highest-rated films of the ${decade}s`);
}

// ================================================================
// GENRE PATH
// ================================================================
function renderGenrePath() {
  const genre = GENRES[state.scene];
  d3.select("#scene-banner-text").text(`Genre: ${genre}`);
  drawBeeswarmForGenre(genre);
  drawTop10ForGenre(genre);
}

// ---------- Genre N: Beeswarm ----------
function drawBeeswarmForGenre(genre) {
  const films = RAW.filter(d => d.genres.includes(genre));
  drawBeeswarm(films,
    `All ${genre} films in the Top 1000 (bubble size = # votes, color = primary genre)`);
}

// ---------- Genre N: Top 10 bar ----------
function drawTop10ForGenre(genre) {
  const films = RAW.filter(d => d.genres.includes(genre));
  drawTopNBar(films, 10, `Top 10 highest-rated ${genre} films of the Top 1000`);
}

// ================================================================
// SHARED CHART: BEESWARM (Y = IMDB rating)
// ================================================================
function drawBeeswarm(films, axisLabelText) {
  const container = d3.select("#chart-primary");
  const height = H_MAIN;
  const svg = container.append("svg").attr("viewBox", `0 0 ${WIDTH} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const x = d3.scaleLinear()
    .domain(d3.extent(films, d => d.imdb)).nice()
    .range([80, innerW - 20]);
  const r = d3.scaleSqrt()
    .domain(d3.extent(films, d => d.votes))
    .range([3, 15]);

  // Grid & axis
  g.append("g").attr("class", "gridline")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(8).tickSize(-innerH).tickFormat(""));
  g.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(8));
  g.append("text").attr("class", "axis-label")
    .attr("x", innerW / 2).attr("y", innerH + 42)
    .attr("text-anchor", "middle")
    .text(axisLabelText);

  // Force layout: horizontal position by rating, vertical spread to avoid overlap
  const nodes = films.map(d => ({ ...d, x: x(d.imdb), y: innerH * 0.6 }));
  const sim = d3.forceSimulation(nodes)
    .force("x", d3.forceX(d => x(d.imdb)).strength(0.85))
    .force("y", d3.forceY(innerH * 0.55).strength(0.06))
    .force("collide", d3.forceCollide(d => r(d.votes) + 1))
    .stop();
  for (let i = 0; i < 180; i++) sim.tick();

  // Apply legend filter (dim non-matching)
  const activeGenre = state.filterGenre;
  const isActive = d => !activeGenre || d.primary === activeGenre;

  g.selectAll(".dot").data(nodes).enter()
    .append("circle").attr("class", "dot")
    .attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("r", d => r(d.votes))
    .style("fill", d => genreColor(d.primary))
    .style("opacity", d => isActive(d) ? 0.85 : 0.15)
    .on("mousemove", (e, d) => showTip(e, filmTooltip(d)))
    .on("mouseout", hideTip);

  // Legend
  drawGenreLegend(g, innerW);

  // Simple annotations on notable films (only among active/visible dots)
  const visible = nodes.filter(isActive);
  if (visible.length >= 3) {
    const topRated = visible.reduce((a, b) => a.imdb > b.imdb ? a : b);
    const mostVoted = visible.reduce((a, b) => a.votes > b.votes ? a : b);
    const withGross = visible.filter(d => d.gross !== null);
    const bigGross = withGross.length
      ? withGross.reduce((a, b) => a.gross > b.gross ? a : b) : null;

    // Position annotation labels above the bee cloud
    addSimpleAnnotation(g,
      topRated.x, topRated.y,
      topRated.x + 30, topRated.y - 60,
      `Highest rated: ${topRated.title} (${topRated.imdb})`);

    if (mostVoted !== topRated) {
      addSimpleAnnotation(g,
        mostVoted.x, mostVoted.y,
        mostVoted.x - 30, mostVoted.y - 90,
        `Audience favorite: ${mostVoted.title}`);
    }

    if (bigGross && bigGross !== topRated && bigGross !== mostVoted) {
      addSimpleAnnotation(g,
        bigGross.x, bigGross.y,
        bigGross.x + 40, bigGross.y + 60,
        `Biggest box office: ${bigGross.title}`);
    }
  }
}

// ================================================================
// SHARED CHART: TOP-N HORIZONTAL BAR
// ================================================================
function drawTopNBar(films, N, axisLabelText) {
  const top = films.filter(d => !state.filterGenre || d.primary === state.filterGenre)
    .slice().sort((a, b) => b.imdb - a.imdb || b.votes - a.votes)
    .slice(0, N);

  const container = d3.select("#chart-secondary");
  const height = H_BAR;
  const svg = container.append("svg").attr("viewBox", `0 0 ${WIDTH} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${MARGIN.left + 90},${MARGIN.top})`);

  const innerW = WIDTH - MARGIN.left - MARGIN.right - 90;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const y = d3.scaleBand().domain(top.map(d => d.title)).range([0, innerH]).padding(0.18);
  const xMin = d3.min(top, d => d.imdb) - 0.2;
  const xMax = d3.max(top, d => d.imdb) + 0.05;
  const x = d3.scaleLinear().domain([Math.max(xMin, 7), xMax]).range([0, innerW]);

  g.append("g").attr("class", "gridline")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(""));
  g.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5));
  g.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text").style("font-size", "11px");

  g.append("text").attr("class", "axis-label")
    .attr("x", innerW / 2).attr("y", innerH + 42)
    .attr("text-anchor", "middle")
    .text(axisLabelText);

  g.selectAll(".bar").data(top).enter().append("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.title)).attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.imdb))
    .style("fill", d => genreColor(d.primary))
    .on("mousemove", (e, d) => showTip(e, filmTooltip(d)))
    .on("mouseout", hideTip);

  g.selectAll(".bar-label").data(top).enter().append("text")
    .attr("x", d => x(d.imdb) + 6)
    .attr("y", d => y(d.title) + y.bandwidth() / 2 + 4)
    .style("font-size", "11px").style("fill", "#333")
    .text(d => `${d.imdb} (${d.year})`);
}

// ================================================================
// SHARED: GENRE LEGEND (interactive filter)
// ================================================================
function drawGenreLegend(g, innerW) {
  const legend = g.append("g")
    .attr("transform", `translate(${innerW + 20}, 0)`);
  legend.append("text").attr("class", "legend-title").text("Genre (click to filter)");
  const items = GENRES;
  const item = legend.selectAll(".legend-row").data(items).enter()
    .append("g").attr("class", "legend-row")
    .attr("transform", (d, i) => `translate(0, ${18 + i * 18})`)
    .style("cursor", "pointer")
    .on("click", (e, d) => {
      state.filterGenre = state.filterGenre === d ? null : d;
      render();
    });
  item.append("circle").attr("class", "legend-swatch")
    .attr("cx", 6).attr("cy", -4).attr("r", 6)
    .style("fill", d => genreColor(d))
    .style("opacity", d => state.filterGenre && state.filterGenre !== d ? 0.25 : 1);
  item.append("text").attr("class", "legend-item")
    .attr("x", 18).attr("y", 0)
    .text(d => d)
    .style("opacity", d => state.filterGenre && state.filterGenre !== d ? 0.25 : 1)
    .style("font-weight", d => state.filterGenre === d ? "700" : "400");

  if (state.filterGenre) {
    legend.append("text").attr("x", 0).attr("y", GENRES.length * 18 + 28)
      .style("font-size", "10px").style("fill", "#c00")
      .style("cursor", "pointer")
      .text("clear filter")
      .on("click", () => { state.filterGenre = null; render(); });
  }
}

// ================================================================
// SHARED: SIMPLE ANNOTATION (underlined text + dashed leader line)
// ================================================================
function addSimpleAnnotation(g, targetX, targetY, labelX, labelY, text) {
  g.append("line")
    .attr("class", "mv-annotation-line")
    .attr("x1", labelX).attr("y1", labelY)
    .attr("x2", targetX).attr("y2", targetY);
  g.append("text")
    .attr("class", "mv-annotation")
    .attr("x", labelX).attr("y", labelY - 4)
    .attr("text-anchor", labelX < targetX ? "end" : "start")
    .text(text);
}

// ================================================================
// LANDING HOOK: animated mini-beeswarm
// ================================================================
function drawLandingHook() {
  const container = d3.select("#landing-hook").html("");
  const W = 700, H = 160;
  const svg = container.append("svg").attr("viewBox", `0 0 ${W} ${H}`);

  const x = d3.scaleLinear().domain([7.4, 9.4]).range([40, W - 40]);
  const r = d3.scaleSqrt()
    .domain(d3.extent(RAW, d => d.votes)).range([2, 5]);

  const nodes = RAW.map(d => ({
    genre: d.primary,
    r: r(d.votes),
    tx: x(d.imdb),
    x: Math.random() * W,
    y: Math.random() * H
  }));

  const dots = svg.selectAll("circle").data(nodes).enter()
    .append("circle")
    .attr("r", d => d.r)
    .style("fill", d => genreColor(d.genre))
    .style("opacity", 0.75)
    .attr("cx", d => d.x).attr("cy", d => d.y);

  const sim = d3.forceSimulation(nodes)
    .alphaDecay(0.02)
    .force("x", d3.forceX(d => d.tx).strength(0.35))
    .force("y", d3.forceY(H / 2).strength(0.12))
    .force("collide", d3.forceCollide(d => d.r + 0.6))
    .on("tick", () => dots.attr("cx", d => d.x).attr("cy", d => d.y));

  setTimeout(() => sim.stop(), 3500);
}

// ================================================================
// TOOLTIP
// ================================================================
function filmTooltip(d) {
  return `<div class="tt-title">${d.title} (${d.year})</div>` +
    `<div class="tt-item">Director: <strong>${d.director}</strong></div>` +
    `<div class="tt-item">Genre: <strong>${d.genres.join(", ")}</strong></div>` +
    `<div class="tt-section">Ratings</div>` +
    `<div class="tt-item">IMDB (audience): <strong>${d.imdb}</strong> / 10</div>` +
    (d.meta !== null ? `<div class="tt-item">Metacritic (critic): <strong>${d.meta}</strong> / 100</div>` : "") +
    `<div class="tt-section">Reach</div>` +
    `<div class="tt-item">Votes: <strong>${d3.format(",")(d.votes)}</strong></div>` +
    (d.gross !== null ? `<div class="tt-item">Gross: <strong>$${d3.format(",")(d.gross)}</strong></div>` : "");
}

function showTip(event, html) {
  const tip = d3.select("#tooltip");
  tip.classed("hidden", false).html(html);
  const pad = 14;
  const w = tip.node().offsetWidth;
  const h = tip.node().offsetHeight;
  let left = event.clientX + pad;
  let top  = event.clientY + pad;
  if (left + w > window.innerWidth)  left = event.clientX - w - pad;
  if (top  + h > window.innerHeight) top  = event.clientY - h - pad;
  tip.style("left", left + "px").style("top", top + "px");
}
function hideTip() { d3.select("#tooltip").classed("hidden", true); }
