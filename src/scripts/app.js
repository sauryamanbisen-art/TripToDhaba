/* -----------------------------------------
   TripToDhaba — app.js
   Handles: search, filter, sort, wishlist,
            booking modal, sign-in modal,
            geolocation, mobile nav
   All card content lives in index.html.
   JS reads data-* attributes to filter/sort.
   ----------------------------------------- */

// ── STATE ─────────────────────────────────────────────────
let activeFilter = "all";
let activeSort   = "default";
let searchQuery  = "";
let wishlist     = new Set(JSON.parse(localStorage.getItem("ttd_wishlist") || "[]"));
let guestCount   = 2;

// ── DOM REFS ──────────────────────────────────────────────
const grid         = document.getElementById("dhabaGrid");
const noResults    = document.getElementById("noResults");
const resultsCount = document.getElementById("resultsCount");
const bookingModal = document.getElementById("bookingModal");
const signInModal  = document.getElementById("signInModal");
const toastMsg     = document.getElementById("toastMsg");
const toastText    = document.getElementById("toastText");
const navMenu      = document.getElementById("navMenu");
const navToggle    = document.getElementById("navToggle");

// All cards — queried once from the HTML
const ALL_CARDS = Array.from(grid.querySelectorAll(".dhaba-card"));

// ── WISHLIST INIT ─────────────────────────────────────────
// Restore heart icons for saved wishlist items on page load
ALL_CARDS.forEach(card => {
  const id  = parseInt(card.dataset.id);
  const btn = card.querySelector(".wishlist-btn");
  if (wishlist.has(id)) {
    btn.classList.add("liked");
    btn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
  }
});

// ── FILTER + SORT + SEARCH ────────────────────────────────
function applyFilters() {
  let visible = ALL_CARDS.filter(card => {
    const tags     = card.dataset.tags || "";
    const name     = (card.dataset.name     || "").toLowerCase();
    const cuisine  = (card.dataset.cuisine  || "").toLowerCase();
    const location = (card.dataset.location || "").toLowerCase();

    const matchesFilter = activeFilter === "all" || tags.includes(activeFilter);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      name.includes(q) || cuisine.includes(q) || location.includes(q);

    return matchesFilter && matchesSearch;
  });

  // Sort visible list
  visible.sort((a, b) => {
    switch (activeSort) {
      case "rating":
        return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
      case "price-asc":
        return parseInt(a.dataset.price) - parseInt(b.dataset.price);
      case "price-desc":
        return parseInt(b.dataset.price) - parseInt(a.dataset.price);
      case "distance":
        return parseFloat(a.dataset.distance) - parseFloat(b.dataset.distance);
      default:
        return 0; // keep original HTML order
    }
  });

  // Hide all, then show + re-order visible ones
  ALL_CARDS.forEach(c => c.style.display = "none");

  if (visible.length === 0) {
    noResults.classList.remove("hidden");
    resultsCount.textContent = "No dhabas found";
    return;
  }

  noResults.classList.add("hidden");
  resultsCount.textContent = `Showing ${visible.length} dhaba${visible.length > 1 ? "s" : ""}`;

  visible.forEach(card => {
    card.style.display = "";   // show
    grid.appendChild(card);    // re-order in DOM for sort
  });
}

// ── FILTER PILLS ─────────────────────────────────────────
document.getElementById("categoryPills").addEventListener("click", e => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  pill.classList.add("active");
  activeFilter = pill.dataset.filter;
  applyFilters();
});

// ── SORT ─────────────────────────────────────────────────
document.getElementById("sortSelect").addEventListener("change", e => {
  activeSort = e.target.value;
  applyFilters();
});

// ── HERO QUICK-FILTER TAGS ───────────────────────────────
document.querySelectorAll(".hero-tag").forEach(tag => {
  tag.addEventListener("click", () => {
    document.querySelectorAll(".hero-tag").forEach(t => t.classList.remove("active"));
    tag.classList.add("active");
    activeFilter = tag.dataset.filter;
    // Sync the pills below
    document.querySelectorAll(".pill").forEach(p => {
      p.classList.toggle("active", p.dataset.filter === activeFilter);
    });
    applyFilters();
    document.getElementById("discover").scrollIntoView({ behavior: "smooth" });
  });
});

// ── SEARCH ───────────────────────────────────────────────
const heroInput = document.getElementById("heroSearchInput");
heroInput.addEventListener("input", e => {
  searchQuery = e.target.value;
  applyFilters();
});
document.getElementById("heroSearchBtn").addEventListener("click", () => {
  document.getElementById("discover").scrollIntoView({ behavior: "smooth" });
});
heroInput.addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("discover").scrollIntoView({ behavior: "smooth" });
});

// ── RESET ─────────────────────────────────────────────────
function resetFilters() {
  activeFilter = "all";
  activeSort   = "default";
  searchQuery  = "";
  heroInput.value = "";
  document.querySelectorAll(".pill").forEach(p => p.classList.toggle("active", p.dataset.filter === "all"));
  document.getElementById("sortSelect").value = "default";
  applyFilters();
}

// ── WISHLIST ─────────────────────────────────────────────
grid.addEventListener("click", e => {
  const wBtn = e.target.closest(".wishlist-btn");
  if (!wBtn) return;
  e.stopPropagation();
  const id = parseInt(wBtn.dataset.id);

  if (wishlist.has(id)) {
    wishlist.delete(id);
    wBtn.classList.remove("liked");
    wBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
    wBtn.setAttribute("aria-label", "Add to wishlist");
    showToast("Removed from wishlist", "#e63946");
  } else {
    wishlist.add(id);
    wBtn.classList.add("liked");
    wBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
    wBtn.setAttribute("aria-label", "Remove from wishlist");
    showToast("Added to wishlist ❤️");
  }
  localStorage.setItem("ttd_wishlist", JSON.stringify([...wishlist]));
});

// ── BOOKING MODAL ─────────────────────────────────────────
grid.addEventListener("click", e => {
  const bookBtn = e.target.closest(".btn-book");
  if (!bookBtn) return;
  e.stopPropagation();

  // Read dhaba info directly from the card's data attributes
  const card = bookBtn.closest(".dhaba-card");
  document.getElementById("modalDhabaName").textContent     = "Book at " + card.dataset.dhabaName;
  document.getElementById("modalDhabaLocation").textContent = card.dataset.dhabaLocation;
  document.getElementById("bookingDate").min = new Date().toISOString().split("T")[0];
  guestCount = 2;
  document.getElementById("guestCount").textContent = guestCount;
  bookingModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

function closeBookingModalFn() {
  bookingModal.classList.add("hidden");
  document.body.style.overflow = "";
  document.getElementById("bookingForm").reset();
}

document.getElementById("closeModal").addEventListener("click", closeBookingModalFn);
bookingModal.addEventListener("click", e => {
  if (e.target === bookingModal) closeBookingModalFn();
});

// Guest stepper
document.getElementById("increaseGuest").addEventListener("click", () => {
  if (guestCount < 20) { guestCount++; document.getElementById("guestCount").textContent = guestCount; }
});
document.getElementById("decreaseGuest").addEventListener("click", () => {
  if (guestCount > 1)  { guestCount--; document.getElementById("guestCount").textContent = guestCount; }
});

// Booking submit
document.getElementById("bookingForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("guestName").value.trim();
  const date = document.getElementById("bookingDate").value;
  const time = document.getElementById("bookingTime").value;
  const dhabaName = document.getElementById("modalDhabaName").textContent.replace("Book at ", "");
  closeBookingModalFn();
  showToast(`🎉 Table booked at ${dhabaName} for ${name} — ${date} at ${time} (${guestCount} guests)`);
});

// ── SIGN IN MODAL ─────────────────────────────────────────
document.getElementById("signInBtn").addEventListener("click", () => {
  signInModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});
document.getElementById("closeSignIn").addEventListener("click", () => {
  signInModal.classList.add("hidden");
  document.body.style.overflow = "";
});
signInModal.addEventListener("click", e => {
  if (e.target === signInModal) {
    signInModal.classList.add("hidden");
    document.body.style.overflow = "";
  }
});
document.getElementById("signInForm").addEventListener("submit", e => {
  e.preventDefault();
  signInModal.classList.add("hidden");
  document.body.style.overflow = "";
  showToast("OTP sent! Check your phone 📱");
});


// ── MENU BUTTONS ──────────────────────────────────────────
grid.addEventListener("click", e => {
  const menuBtn = e.target.closest(".btn-menu");
  if (!menuBtn) return;
  e.stopPropagation();
  const card = menuBtn.closest(".dhaba-card");
  showToast("Menu for " + card.dataset.dhabaName + " coming soon! 🍽️");
});

// ── TOAST ─────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, bg = "#1ab16a") {
  toastText.textContent  = msg;
  toastMsg.style.background = bg;
  toastMsg.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastMsg.classList.add("hidden"), 3500);
}

// ── GEOLOCATION ───────────────────────────────────────────
document.getElementById("detectLocation").addEventListener("click", () => {
  const label = document.getElementById("locationLabel");
  label.textContent = "Detecting…";
  if (!navigator.geolocation) {
    label.textContent = "Location";
    showToast("Geolocation not supported", "#e63946");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
        .then(r => r.json())
        .then(data => {
          const city = data.address?.city || data.address?.town || data.address?.village || "Near You";
          label.textContent = city;
          showToast(`📍 Location set to ${city}`);
        })
        .catch(() => {
          label.textContent = "Near You";
          showToast("📍 Location detected!");
        });
    },
    () => {
      label.textContent = "Location";
      showToast("Could not access location", "#e63946");
    }
  );
});

// ── MOBILE NAV ────────────────────────────────────────────
navToggle.addEventListener("click", () => navMenu.classList.toggle("open"));
navMenu.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => navMenu.classList.remove("open"));
});


// ── SCROLL SPY FOR NAV ────────────────────────────────────
window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll("section[id]");
  const scrollY = window.pageYOffset;
  
  sections.forEach(current => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 100;
    const sectionId = current.getAttribute("id");
    
    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + sectionId) {
          link.classList.add("active");
        }
      });
    }
  });
});

// ── STICKY NAV SHADOW ─────────────────────────────────────
window.addEventListener("scroll", () => {
  document.getElementById("mainNav").style.boxShadow =
    window.scrollY > 10 ? "0 4px 20px rgba(0,0,0,0.1)" : "";
});

// ── INIT ──────────────────────────────────────────────────
// Show count on page load (all cards visible by default)
resultsCount.textContent = `Showing ${ALL_CARDS.length} dhabas`;
