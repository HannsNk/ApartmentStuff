// Items are now stored in `items.json` so you can edit that file from your phone.
// image: put files in an "images" folder and reference like "images/chair.jpg"
let items = [];

const grid = document.getElementById("grid");
const searchInput = document.getElementById("search");
const pills = Array.from(document.querySelectorAll(".pill"));
const emptyState = document.getElementById("empty");
const categorySelect = document.getElementById('category-filter');
// Modal elements
const modal = document.getElementById('modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const modalNotes = document.getElementById('modal-notes');
const modalStatus = document.getElementById('modal-status');

let currentFilter = "all";
let currentSearch = "";
let currentCategory = "all";

function populateCategories() {
  if (!categorySelect) return;
  // collect unique categories (non-empty)
  const set = new Set();
  for (const it of items) {
    if (it.category && String(it.category).trim()) {
      set.add(String(it.category).trim());
    }
  }
  const categories = Array.from(set).sort((a, b) => a.localeCompare(b));

  // reset options
  categorySelect.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All categories';
  categorySelect.appendChild(allOpt);

  for (const cat of categories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  }

  // restore previous selection if possible
  try {
    categorySelect.value = currentCategory || 'all';
  } catch (e) {
    categorySelect.value = 'all';
  }
}

function render() {
  grid.innerHTML = "";

  const filtered = items.filter((item) => {
    const matchesStatus =
      currentFilter === "all" ? true : item.status === currentFilter;

    const matchesCategory =
      currentCategory === "all"
        ? true
        : (item.category || "").toLowerCase() === currentCategory.toLowerCase();

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

    return matchesStatus && matchesSearch && matchesCategory;
  });

  // We'll render in this order: available items (including new) grouped by category, reserved items, taken items (end)
  const availableItems = filtered.filter((i) => ['new', 'available'].includes(String(i.status || '').toLowerCase()));
  const reservedItems = filtered.filter((i) => String(i.status || '').toLowerCase() === 'reserved');
  const takenItems = filtered.filter((i) => String(i.status || '').toLowerCase() === 'taken');

  // Helper to create a card element for an item
  function createCard(item) {
    const card = document.createElement("article");
    card.className = "card";
    if (item.status) card.classList.add(String(item.status).toLowerCase());

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
    const st = String(item.status || '').toLowerCase();
    badge.textContent = st === 'available' ? 'Available' : st === 'reserved' ? 'Reserved' : st === 'new' ? 'New' : 'Taken';
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

    // attach click handler unless taken
    if (String(item.status || '').toLowerCase() !== 'taken') {
      card.addEventListener('click', () => openModal(item));
    }

    return card;
  }

  // sort items within groups by title
  const sortByTitle = (a, b) => (a.title || '').localeCompare(b.title || '');
  reservedItems.sort(sortByTitle);
  takenItems.sort(sortByTitle);

  if (!filtered.length) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  // Group available items by category and render with headings
  if (availableItems.length) {
    const map = new Map();
    for (const it of availableItems) {
      const cat = (it.category || 'Uncategorized');
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(it);
    }
    const cats = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    for (const cat of cats) {
      const heading = document.createElement('div');
      heading.className = 'category-heading';
      heading.textContent = cat;
      grid.appendChild(heading);
      const list = map.get(cat).sort((a, b) => {
        const aStatus = String(a.status || '').toLowerCase();
        const bStatus = String(b.status || '').toLowerCase();
        if (aStatus === 'new' && bStatus !== 'new') return -1;
        if (bStatus === 'new' && aStatus !== 'new') return 1;
        return (a.title || '').localeCompare(b.title || '');
      });
      for (const it of list) {
        const card = createCard(it);
        grid.appendChild(card);
      }
    }
  }

  // Render reserved items (after available) — no category subheadings
  if (reservedItems.length) {
    const sectionHeading = document.createElement('div');
    sectionHeading.className = 'section-heading';
    sectionHeading.textContent = 'Reserved';
    grid.appendChild(sectionHeading);

    reservedItems.sort(sortByTitle);
    for (const it of reservedItems) {
      const card = createCard(it);
      grid.appendChild(card);
    }
  }

  // Render taken items at the end under a 'Taken' section — no category subheadings
  if (takenItems.length) {
    const sectionHeading = document.createElement('div');
    sectionHeading.className = 'section-heading';
    sectionHeading.textContent = 'Taken';
    grid.appendChild(sectionHeading);

    takenItems.sort(sortByTitle);
    for (const it of takenItems) {
      const card = createCard(it);
      grid.appendChild(card);
    }
  }
}

function openModal(item) {
  if (!modal) return;
  modalImage.src = item.image || 'images/placeholder.jpg';
  modalImage.alt = item.title || '';
  modalTitle.textContent = item.title || '';
  modalMeta.textContent = [item.room, item.category].filter(Boolean).join(' · ');
  modalNotes.textContent = item.description || '';

  // set status badge class
  const mst = String(item.status || 'available').toLowerCase();
  modalStatus.className = 'status-badge ' + mst;
  modalStatus.textContent = mst === 'available' ? 'Available' : mst === 'reserved' ? 'Reserved' : mst === 'new' ? 'New' : 'Taken';

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  // clear image to stop possible playback
  modalImage.src = '';
}

// modal close handlers
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

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

// Category select handler
if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    currentCategory = e.target.value || 'all';
    render();
  });
}

// Load items from items.json, then render.
fetch('items.json')
  .then((res) => {
    if (!res.ok) throw new Error('Failed to load items.json');
    return res.json();
  })
  .then((data) => {
    if (Array.isArray(data)) items = data;
    // populate categories
    populateCategories();
    render();
  })
  .catch((err) => {
    console.error(err);
    // still render (will show empty-state)
    render();
  });
