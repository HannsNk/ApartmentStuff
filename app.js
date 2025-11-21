// Items are now stored in `items.json` so you can edit that file from your phone.
// image: put files in an "images" folder and reference like "images/chair.jpg"
let items = [];

const grid = document.getElementById("grid");
const searchInput = document.getElementById("search");
const pills = Array.from(document.querySelectorAll(".pill"));
const emptyState = document.getElementById("empty");

let currentFilter = "all";
let currentSearch = "";

function render() {
  grid.innerHTML = "";

  const filtered = items.filter((item) => {
    const matchesStatus =
      currentFilter === "all" ? true : item.status === currentFilter;

    const haystack = (
      item.title +
      " " +
      (item.description || "") +
      " " +
      (item.room || "") +
      " " +
      (item.category || "")
    ).toLowerCase();
    const matchesSearch = haystack.includes(currentSearch.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  if (!filtered.length) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  for (const item of filtered) {
    const card = document.createElement("article");
    card.className = "card";

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "card-img-wrapper";

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title;
      imgWrapper.appendChild(img);
    }

    const badge = document.createElement("div");
    badge.className = "status-badge " + item.status;
    badge.textContent =
      item.status === "available"
        ? "Available"
        : item.status === "reserved"
        ? "Reserved"
        : "Taken";
    imgWrapper.appendChild(badge);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = [item.room, item.category]
      .filter(Boolean)
      .join(" · ");

    const notes = document.createElement("div");
    notes.className = "card-notes";
    notes.textContent = item.description || "";

    body.appendChild(title);
    if (meta.textContent) body.appendChild(meta);
    if (notes.textContent) body.appendChild(notes);

    card.appendChild(imgWrapper);
    card.appendChild(body);
    grid.appendChild(card);
  }
}

// Search + filter handlers
searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value;
  render();
});

pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    pills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.getAttribute("data-filter");
    render();
  });
});

// Load items from items.json, then render.
fetch('items.json')
  .then((res) => {
    if (!res.ok) throw new Error('Failed to load items.json');
    return res.json();
  })
  .then((data) => {
    if (Array.isArray(data)) items = data;
    render();
  })
  .catch((err) => {
    console.error(err);
    // still render (will show empty-state)
    render();
  });
