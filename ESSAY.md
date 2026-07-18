# Narrative Visualization: What Makes a Movie Great?

**by Rahul Joshi &middot; rahulpj2@illinois.edu**
&middot; CS 416 Data Visualization, UIUC MCS-DS
&middot; Summer 2026
&middot; Live: https://rahul-joshi.github.io/cs416-narrative-viz/
&middot; Source code: https://github.com/rahul-joshi/cs416-narrative-viz
&middot; Source dataset: [IMDB Top 1000 films (Kaggle)](https://www.kaggle.com/datasets/harshitshankhdhar/imdb-dataset-of-top-1000-movies-and-tv-shows)

---

## Messaging

*What is the message you are trying to communicate with the narrative visualization?*

The message is that there is no single definition of a "great" film. Greatness is contextual, depending on the era and the genre through which you examine the data.

The visualization argues this by taking the viewer through the IMDB Top 1000 twice - once ordered by decade, once ordered by genre - showing that each slice reshuffles what "greatness" looks like. The 2000s produced the most Top-1000 films (237) but has the lowest average rating (7.90). The 1950s produced only 56 films but has the highest average (8.06). *The Godfather* defines the 1970s while *The Shawshank Redemption* defines the 1990s; the two are incomparable in style yet both are unambiguously "great." Rather than telling the viewer this, the visualization lets them discover it by walking through the scenes themselves.

---

## Narrative Structure

*Which structure was your narrative visualization designed to follow (martini glass, interactive slide show or drop-down story)? How does your narrative visualization follow that structure?*

**Interactive Slide Show with a landing gate**.

The viewer arrives on a single-screen landing page that poses the question, provides one paragraph of context, and offers two entry buttons: *Explore by Decade* and *Explore by Genre*. That initial choice is the drill-down step, letting the viewer pick their lens before any scene is shown.

Inside the chosen path, the experience is a canonical ordered slideshow. Scenes are traversed via *Previous / Home / Next* buttons or by clicking any breadcrumb item to jump directly. Free-form interaction (bubble hover for full film details, click on a genre in the legend to filter) is available on every scene, not gated to the end. A "Switch to X view" link at the top lets the viewer restart the slideshow through the alternate lens.

**Where the drill-down happens.** The primary drill-down opportunity is at the very top of the structure (path selection on the landing page). A secondary, ongoing drill-down opportunity is available on every scene through the tooltip and the legend filter, so the viewer can explore individual films or genres at any point rather than only at the end.

Martini glass was rejected because a fixed non-interactive intro would fight the message: the claim that greatness is personal cannot be delivered by a passive script.

---

## Visual Structure

*What visual structure is used for each scene? How does it ensure the viewer can understand the data and navigate the scene? How does it highlight to urge the viewer to focus on the important parts? How does it help the viewer transition to other scenes?*

Every one of the 17 data-scenes uses the same two-chart template:

- **Primary chart: beeswarm plot.** Every film in the current slice is one bubble on a horizontal IMDB-rating axis. Vertical position is determined by a `d3.forceSimulation` collision solver so no bubble is hidden. Bubble *size* encodes number of votes (square-root scale). Bubble *color* encodes primary genre using a fixed 20-color palette that is stable across every scene.
- **Secondary chart: ranked horizontal bar** of the top 10 films of the slice by IMDB rating, with bar color matching the primary genre color used in the beeswarm.
- **Shared chrome** around both charts: a yellow scene banner naming the current slice, a three-button nav row, a clickable breadcrumb strip, an orange hint line telling the viewer to hover, and a genre legend on the right that doubles as a filter.

**Understanding.** The axis, encoding, and interaction semantics are established on the first scene and never change. Every subsequent scene is cognitively free - the viewer can spend attention on the data, not on decoding the chart.

**Navigation within a scene.** The viewer reads top-to-bottom by default: the beeswarm shape summarizes the slice at a glance, then the ranked bar names the specific standouts. Hovering any bubble opens a dark structured tooltip with full film details (director, genres, IMDB, Metacritic, votes, gross). Clicking a genre in the right-side legend focuses attention on a subset by dimming all other genres to 15% opacity. The orange hint line under the scene banner explicitly tells the viewer that these two interactions exist.

**Focus.** Three overlapping mechanisms direct the eye: bubble size (most-voted films dominate visually), programmatic annotation labels placed inside the plot area, and the legend filter (clicking a genre dims all others to 15% opacity).

**Transitions.** Because axes, palette, encoding, and layout are identical across every scene, moving from *The 1930s* to *The 2000s* is a single Next-click and a re-read of the same axes with new dots. The template itself is the connective tissue between scenes; no narration is required.

---

## Scenes

*What are the scenes of your narrative visualization? How are the scenes ordered, and why?*

**Landing scene** (scene 0). Poses the question, provides context, offers two path buttons. Features an animated mini-beeswarm that gently choreographs all 1000 films into their rating positions on page load, previewing the chart type used inside.

**Decade path** (9 scenes, chronological): the 1930s, 1940s, 1950s, 1960s, 1970s, 1980s, 1990s, **2000s** (default entry), 2010s.

**Genre path** (8 scenes, by prevalence in the Top 1000): **Drama** (default entry), Comedy, Crime, Adventure, Action, Thriller, Biography, Animation.

**Order and rationale.** The decade path is chronological because the viewer's mental model of "cinema evolution" is time-linear. A passive Next-clicker retraces the natural arc from black-and-white classics through the 1970s auteur era into the modern volume era of the 2000s and 2010s. The genre path is ordered by prevalence in the Top 1000 because count is the most stable, audience-neutral ordering: Drama tags 723 of 1000 films, Animation only 82.

Default entry into each path lands the viewer on the most-populated slice (2000s for decade, Drama for genre), so the first impression is dense and visually rich rather than sparse.

---

## Annotations

*What template was followed for the annotations, and why that template? How are the annotations used to support the messaging? Do the annotations change within a single scene, and if so, how and why?*

**Template.** Short underlined serif text connected to a specific bubble by a thin gray dashed line, placed in empty space near but not overlapping the target bubble. This lightweight margin-note style is drawn from the *Modern Olympics* reference visualization shown in class - it stays quiet and lets the beeswarm remain the visual star. An earlier draft used `d3.annotationCalloutCircle` with cream backgrounds and bold titles; it looked polished but drew attention away from the data, so I rewrote them.

**Three annotations per scene, generated programmatically:**

- *"Highest rated"* - film with maximum IMDB rating (the critical peak).
- *"Audience favorite"* - film with the most votes (the popular peak).
- *"Biggest box office"* - film with the highest gross revenue, when available (the commercial peak).

Together these three lenses answer *"what did greatness mean here?"* from three complementary angles. On the 1970s scene, for instance, all three overlap on *The Godfather* except gross, where *Star Wars* dominates.

**Annotations do change within a scene.** When the viewer clicks a genre in the legend, the visualization filters to that genre and recomputes all three annotations using only matching films. On the 2000s scene with Drama filter active, *"Highest rated"* points to *The Departed* rather than *The Dark Knight* (a mixed-genre Action/Crime/Drama). The annotations follow the viewer's attention rather than sitting statically.

---

## Parameters and States

*What are the parameters of the narrative visualization? What are the states of the narrative visualization? How are the parameters used to define the state and each scene?*

**Parameters** (a single JavaScript `state` object; every rendered pixel is a pure function of these four fields):

- **P1: `page`** - `"landing"` or `"viz"`. Top-level page.
- **P2: `path`** - `"decade"` or `"genre"`. Active narrative path.
- **P3: `scene`** - integer `0..N-1`. Index into `DECADES[]` (length 9) or `GENRES[]` (length 8).
- **P4: `filterGenre`** - `null` or one of the 20 genres. Legend filter within a scene.

**States:**

- **S1 (Landing):** `page = "landing"`. Entry buttons are the only interactive elements.
- **S2 (Path-active, no filter):** `page = "viz"`, `filterGenre = null`. A specific scene is rendered; all bubbles at full opacity; annotations reference the full slice.
- **S3 (Path-active, genre filtered):** `page = "viz"`, `filterGenre = X`. Non-matching bubbles dimmed to 15% opacity; annotations recomputed to reference only matching films; a red "clear filter" affordance appears below the legend.

**How parameters define each scene.** The master `render()` function is deterministic: clears both chart containers, updates banner/nav/breadcrumb from `state`, dispatches to `renderDecadePath()` or `renderGenrePath()` based on `P2`, uses `P3` as an index into the path's array to select the data slice, and passes `P4` down to the shared `drawBeeswarm()` and `drawTopNBar()` components. Given the same four field values, the same view renders every time.

---

## Triggers and Affordances

*What are the triggers that connect user actions to changes of state in the narrative visualization? What affordances are provided to the user to communicate to them what options are available to them?*

**Triggers** (each mutates `state` and calls `render()`):

- **T1: Click *Explore by Decade*** on landing → `P1="viz"`, `P2="decade"`, `P3=default` → **S2**
- **T2: Click *Explore by Genre*** on landing → `P1="viz"`, `P2="genre"`, `P3=0` → **S2**
- **T3: Click *&laquo; Previous*** in nav row → `P3--`
- **T4: Click *Home*** in nav row → `P1="landing"` → **S1**
- **T5: Click *Next &raquo;*** in nav row → `P3++`
- **T6: Click a breadcrumb item** (e.g. `1970s`, `Comedy`) → `P3 = target index`, `P4 = null`
- **T7: Click a genre row** in the legend → `P4 = clicked` (or `null` if already active) → toggles **S2 &harr; S3**
- **T8: Click *Switch to X view*** link → `P2` flips, `P3 = default` for new path
- **Hover** any bubble/bar (no state change; opens the shared dark tooltip)

**Affordances:**

- Buttons look tactile: visible border, drop-shadow, hover-lift effect.
- Disabled means unavailable: *Previous* is greyed on the first scene; *Next* on the last.
- The active breadcrumb item is boxed in red; every other item is clickable and shows a gold-hover state.
- The genre legend uses a pointer cursor to signal that swatches are clickable; the active genre becomes bold; a red "clear filter" link appears when a filter is set.
- A defensive one-line hint under every scene banner reads *"Tip 1: hover over any bubble for full film details. Tip 2: use Previous / Next to walk through the story."* Even a viewer who ignores every visual cue is directly told the two primary interactions.
- Redundant paths exist: reaching the 1970s scene can happen through clicking Next repeatedly, Previous, or the `1970s` breadcrumb directly - accommodating linear readers, random-access users, and viewers arriving mid-story.
