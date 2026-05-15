const toggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const header = document.getElementById("site-header");
const slides = document.querySelectorAll(".hero-slide");
const revealItems = document.querySelectorAll("[data-reveal]");
const publicLogo = document.querySelector(".logo");
const footerBottom = document.querySelector(".footer-bottom");

function openStaffLogin() {
  window.location.href = "/login";
}

if (toggle && mobileMenu) {
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    mobileMenu.classList.toggle("active");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("active");
      mobileMenu.classList.remove("active");
    });
  });
}

if (publicLogo) {
  publicLogo.addEventListener("dblclick", (event) => {
    event.preventDefault();
    openStaffLogin();
  });
}

if (footerBottom) {
  footerBottom.addEventListener("dblclick", openStaffLogin);
}

window.addEventListener("keydown", (event) => {
  if (event.altKey && event.shiftKey && event.key.toLowerCase() === "w") {
    openStaffLogin();
  }
});

window.addEventListener("scroll", () => {
  if (!header) {
    return;
  }

  if (window.scrollY > 16) {
    header.classList.add("shrink");
  } else {
    header.classList.remove("shrink");
  }
});

let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

if (slides.length > 0) {
  showSlide(currentSlide);
  setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }, 4800);
}

if ("IntersectionObserver" in window && revealItems.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("revealed"));
}

const teamCarousel = document.querySelector("[data-team-carousel]");

if (teamCarousel) {
  const track = teamCarousel.querySelector("[data-carousel-track]");
  const cards = Array.from(track.querySelectorAll(".team-card"));
  const dotsWrap = teamCarousel.querySelector("[data-carousel-dots]");
  const prevButton = teamCarousel.querySelector("[data-carousel-prev]");
  const nextButton = teamCarousel.querySelector("[data-carousel-next]");
  const viewport = teamCarousel.querySelector(".team-carousel-viewport");
  let currentIndex = 0;
  let autoPlayId = null;
  let touchStartX = 0;
  let touchDeltaX = 0;
  let isDragging = false;

  function getVisibleCards() {
    if (window.innerWidth < 720) {
      return 1;
    }

    if (window.innerWidth < 1100) {
      return 2;
    }

    return 3;
  }

  function getMaxIndex() {
    return Math.max(0, cards.length - getVisibleCards());
  }

  function buildDots() {
    if (!dotsWrap) {
      return;
    }

    dotsWrap.innerHTML = "";
    const totalDots = getMaxIndex() + 1;

    for (let i = 0; i < totalDots; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "team-dot";
      dot.setAttribute("aria-label", `Afficher le groupe ${i + 1}`);
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateCarousel();
        restartAutoPlay();
      });
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsWrap) {
      return;
    }

    dotsWrap.querySelectorAll(".team-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  function updateCarousel() {
    const firstCard = cards[0];
    if (!firstCard) {
      return;
    }

    const gap = 24;
    const cardWidth = firstCard.getBoundingClientRect().width;
    currentIndex = Math.min(currentIndex, getMaxIndex());
    const offset = currentIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }

  function moveCarousel(step) {
    const maxIndex = getMaxIndex();
    if (currentIndex + step > maxIndex) {
      currentIndex = 0;
    } else if (currentIndex + step < 0) {
      currentIndex = maxIndex;
    } else {
      currentIndex += step;
    }

    updateCarousel();
  }

  function stopAutoPlay() {
    if (autoPlayId) {
      clearInterval(autoPlayId);
      autoPlayId = null;
    }

    teamCarousel.classList.add("is-paused");
  }

  function startAutoPlay() {
    stopAutoPlay();
    teamCarousel.classList.remove("is-paused");
    autoPlayId = window.setInterval(() => {
      moveCarousel(1);
    }, 3000);
  }

  function restartAutoPlay() {
    startAutoPlay();
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      moveCarousel(-1);
      restartAutoPlay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      moveCarousel(1);
      restartAutoPlay();
    });
  }

  teamCarousel.addEventListener("mouseenter", stopAutoPlay);
  teamCarousel.addEventListener("mouseleave", startAutoPlay);
  teamCarousel.addEventListener("focusin", stopAutoPlay);
  teamCarousel.addEventListener("focusout", startAutoPlay);

  function onTouchStart(event) {
    if (!viewport || event.touches.length !== 1) {
      return;
    }

    isDragging = true;
    touchStartX = event.touches[0].clientX;
    touchDeltaX = 0;
    track.style.transition = "none";
    stopAutoPlay();
  }

  function onTouchMove(event) {
    if (!isDragging || !viewport || event.touches.length !== 1) {
      return;
    }

    const currentX = event.touches[0].clientX;
    touchDeltaX = currentX - touchStartX;
    const firstCard = cards[0];

    if (!firstCard) {
      return;
    }

    const gap = 24;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const baseOffset = currentIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${baseOffset - touchDeltaX}px)`;
  }

  function onTouchEnd() {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    track.style.transition = "";

    if (Math.abs(touchDeltaX) > 55) {
      moveCarousel(touchDeltaX < 0 ? 1 : -1);
    } else {
      updateCarousel();
    }

    restartAutoPlay();
  }

  if (viewport) {
    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: true });
    viewport.addEventListener("touchend", onTouchEnd);
    viewport.addEventListener("touchcancel", onTouchEnd);
  }

  window.addEventListener("resize", () => {
    buildDots();
    updateCarousel();
  });

  buildDots();
  updateCarousel();
  startAutoPlay();
}
