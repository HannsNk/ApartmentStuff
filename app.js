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

  // sort so taken items always appear at the end
  const statusOrder = {
    new: -1,
    available: 0,
    reserved: 1,
    taken: 2
  };
  filtered.sort((a, b) => {
    const sa = statusOrder[(a.status || '').toLowerCase()] ?? 0;
    const sb = statusOrder[(b.status || '').toLowerCase()] ?? 0;
    return sa - sb;
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
    // add status as class for styling (.reserved, .taken, etc.)
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
    grid.appendChild(card);

    // open modal when the card is clicked (only if not taken)
    if (String(item.status || '').toLowerCase() !== 'taken') {
      card.addEventListener('click', () => openModal(item));
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
