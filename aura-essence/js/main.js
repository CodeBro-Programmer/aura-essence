/* ==========================================================================
   AURA ESSENCE — main.js
   Plain JavaScript, no dependencies. Each feature lives in its own init
   function so it can be read, changed or removed on its own.
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIGURATION
   Replace the placeholder with the real WhatsApp number: country code first,
   digits only, no "+" or spaces (for example "2348012345678").
   -------------------------------------------------------------------------- */
const WHATSAPP_NUMBER = "2347048373702";

(function () {
  "use strict";

  const BOOKING_LIMITS = { minPeople: 1, maxPeople: 20 };
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = reducedMotionQuery.matches;

  // Lets the stylesheet hide elements for scroll reveals only when scripts run.
  document.documentElement.classList.add("js");

  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /** Runs registered callbacks at most once per animation frame on scroll/resize. */
  function createScrollScheduler() {
    const tasks = [];
    let ticking = false;

    function run() {
      ticking = false;
      tasks.forEach((task) => task());
    }

    function request() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(run);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    return {
      add(task) {
        tasks.push(task);
        task();
      },
    };
  }

  function getWhatsAppDigits() {
    return String(WHATSAPP_NUMBER).replace(/\D/g, "");
  }

  function isWhatsAppConfigured() {
    return /^\d{8,15}$/.test(getWhatsAppDigits()) && !/x/i.test(String(WHATSAPP_NUMBER));
  }

  /* ------------------------------------------------------------------------
     Header: solid background after scrolling
     ------------------------------------------------------------------------ */
  function initHeader(scheduler) {
    const header = document.getElementById("site-header");
    if (!header) return;

    scheduler.add(() => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    });
  }

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */
  function initMobileMenu() {
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    const desktopQuery = window.matchMedia("(min-width: 75em)");

    function setMenu(open, { returnFocus = false } = {}) {
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("is-menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      if (open) {
        const firstLink = nav.querySelector("a");
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else if (returnFocus) {
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (toggle.getAttribute("aria-expanded") !== "true") return;

      if (event.key === "Escape") {
        setMenu(false, { returnFocus: true });
        return;
      }

      // Keep keyboard focus inside the open menu
      if (event.key === "Tab") {
        const focusable = [toggle, ...nav.querySelectorAll("a[href]")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    desktopQuery.addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     Scroll reveals (fade-up, line draw, image reveal)
     ------------------------------------------------------------------------ */
  function initScrollReveal() {
    const targets = document.querySelectorAll("[data-reveal], [data-reveal-line], [data-reveal-image]");
    if (!targets.length) return;

    targets.forEach((element) => {
      const delay = element.getAttribute("data-reveal-delay");
      if (delay) element.style.setProperty("--reveal-delay", `${Number(delay)}ms`);
    });

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    // Image frames start fully clipped, which can hide them from the observer,
    // so their parent is watched instead and the class is applied to the frame.
    const revealMap = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (revealMap.get(entry.target) || []).forEach((element) => element.classList.add("is-visible"));
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    targets.forEach((element) => {
      const watched = element.hasAttribute("data-reveal-image") ? element.parentElement : element;
      revealMap.set(watched, [...(revealMap.get(watched) || []), element]);
    });

    revealMap.forEach((_, watched) => observer.observe(watched));
  }

  /* ------------------------------------------------------------------------
     Subtle parallax: images drift slightly slower than the page
     ------------------------------------------------------------------------ */
  function initParallax(scheduler) {
    if (prefersReducedMotion) return;

    const images = Array.from(document.querySelectorAll("[data-parallax]"));
    if (!images.length) return;

    scheduler.add(() => {
      const viewportHeight = window.innerHeight;

      images.forEach((image) => {
        const frame = image.parentElement;
        const frameRect = frame.getBoundingClientRect();

        // Skip work for frames that are far outside the viewport
        if (frameRect.bottom < -200 || frameRect.top > viewportHeight + 200) return;

        const strength = Number(image.getAttribute("data-parallax")) || 0.5;
        const slack = Math.max(0, (image.offsetHeight - frameRect.height) / 2);
        const frameCenter = frameRect.top + frameRect.height / 2;
        const progress = clamp(
          (frameCenter - viewportHeight / 2) / (viewportHeight / 2 + frameRect.height / 2),
          -1,
          1
        );

        image.style.setProperty("--parallax-y", `${(-progress * slack * strength).toFixed(1)}px`);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Fragrance notes: gold line fills and each stage lights up as you scroll
     ------------------------------------------------------------------------ */
  function initNotes(scheduler) {
    const list = document.querySelector("[data-notes]");
    if (!list) return;

    const notes = Array.from(list.querySelectorAll("[data-note]"));

    if (prefersReducedMotion) {
      list.style.setProperty("--notes-progress", "1");
      notes.forEach((note) => note.classList.add("is-active"));
      return;
    }

    scheduler.add(() => {
      const viewportHeight = window.innerHeight;
      const trigger = viewportHeight * 0.64;
      const rect = list.getBoundingClientRect();
      const progress = clamp((trigger - rect.top) / rect.height, 0, 1);

      list.style.setProperty("--notes-progress", progress.toFixed(3));
      notes.forEach((note) => {
        note.classList.toggle("is-active", note.getBoundingClientRect().top < trigger);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Brand film: clean poster first, native controls once playback starts.
     Nothing downloads until the visitor presses play (preload="none").
     ------------------------------------------------------------------------ */
  function initVideo() {
    const frame = document.querySelector("[data-video-frame]");
    const video = frame ? frame.querySelector("video") : null;
    const playButton = frame ? frame.querySelector("[data-video-play]") : null;
    if (!video || !playButton) return;

    video.removeAttribute("controls");
    playButton.hidden = false;

    playButton.addEventListener("click", () => {
      video.setAttribute("controls", "");
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        // If the browser blocks playback, the native controls remain available.
        attempt.catch(() => frame.classList.add("is-playing"));
      }
    });

    video.addEventListener("play", () => {
      video.setAttribute("controls", "");
      frame.classList.add("is-playing");
    });

    video.addEventListener("ended", () => {
      frame.classList.remove("is-playing");
      video.removeAttribute("controls");
      video.load(); // returns to the poster frame
    });
  }

  /* ------------------------------------------------------------------------
     Collection buttons pre-select the fragrance in the booking form
     ------------------------------------------------------------------------ */
  function initFragranceLinks() {
    const select = document.getElementById("booking-fragrance");
    if (!select) return;

    document.querySelectorAll("[data-fragrance]").forEach((link) => {
      link.addEventListener("click", () => {
        const value = link.getAttribute("data-fragrance");
        const hasOption = Array.from(select.options).some((option) => option.value === value);
        if (hasOption) {
          select.value = value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     WhatsApp booking form
     ------------------------------------------------------------------------ */
  function parseISODate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    const date = new Date(year, month - 1, day);
    const isReal =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    return isReal ? date : null;
  }

  function toISODate(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function formatDate(value) {
    const date = parseISODate(value);
    if (!date) return value;
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(value) {
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return value;
    const hours = Number(match[1]);
    const suffix = hours < 12 ? "AM" : "PM";
    return `${hours % 12 || 12}:${match[2]} ${suffix}`;
  }

  const bookingValidators = {
    name(value) {
      return value.trim().length >= 2 ? "" : "Please enter your full name.";
    },
    phone(value) {
      const trimmed = value.trim();
      if (!trimmed) return "Please enter your phone number.";
      const digits = trimmed.replace(/\D/g, "");
      const validCharacters = /^[+\d\s\-().]+$/.test(trimmed);
      if (!validCharacters || digits.length < 7 || digits.length > 15) {
        return "Enter a valid phone number, for example +234 801 234 5678.";
      }
      return "";
    },
    fragrance(value) {
      return value ? "" : "Please choose a fragrance, or ask for guidance.";
    },
    date(value) {
      if (!value) return "Please choose a preferred date.";
      const date = parseISODate(value);
      if (!date) return "Please enter a valid date.";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today ? "Please choose today or a future date." : "";
    },
    time(value) {
      return value ? "" : "Please choose a preferred time.";
    },
    people(value) {
      if (!String(value).trim()) return "Please enter the number of people.";
      const count = Number(value);
      const { minPeople, maxPeople } = BOOKING_LIMITS;
      if (!Number.isInteger(count) || count < minPeople || count > maxPeople) {
        return `Enter a whole number between ${minPeople} and ${maxPeople}.`;
      }
      return "";
    },
  };

  function buildWhatsAppMessage(data) {
    const lines = [
      "Hello AURA ESSENCE,",
      "",
      "I would like to book a Fragrance Experience.",
      "",
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      `Preferred Fragrance: ${data.fragrance}`,
      `Preferred Date: ${formatDate(data.date)}`,
      `Preferred Time: ${formatTime(data.time)}`,
      `Number of People: ${data.people}`,
    ];

    if (data.message) {
      lines.push("", "Additional Message:", data.message);
    }

    return lines.join("\n");
  }

  function buildWhatsAppUrl(message) {
    return `https://wa.me/${getWhatsAppDigits()}?text=${encodeURIComponent(message)}`;
  }

  function openUrlInNewTab(url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function initBookingForm() {
    const form = document.getElementById("booking-form");
    if (!form) return;

    const status = document.getElementById("booking-status");
    const fieldNames = Object.keys(bookingValidators);

    // Earliest selectable date is today (local time)
    const dateInput = form.elements.date;
    if (dateInput) dateInput.min = toISODate(new Date());

    function setStatus(type, content) {
      status.className = "form__status";
      status.textContent = "";
      if (!type) return;
      status.classList.add(type === "success" ? "is-success" : "is-error");
      if (typeof content === "string") {
        status.textContent = content;
      } else if (content) {
        status.appendChild(content);
      }
    }

    function validateField(name) {
      const control = form.elements[name];
      const wrapper = control.closest(".field");
      const errorElement = form.querySelector(`[data-error-for="${name}"]`);
      const message = bookingValidators[name](control.value);

      wrapper.classList.toggle("has-error", Boolean(message));
      control.setAttribute("aria-invalid", message ? "true" : "false");
      errorElement.textContent = message;
      errorElement.hidden = !message;

      return message === "";
    }

    // Once a field has shown an error, re-check it as the visitor corrects it
    form.addEventListener("input", (event) => {
      const name = event.target.name;
      if (fieldNames.includes(name) && event.target.closest(".field").classList.contains("has-error")) {
        validateField(name);
      }
    });

    form.addEventListener("change", (event) => {
      const name = event.target.name;
      if (fieldNames.includes(name) && event.target.closest(".field").classList.contains("has-error")) {
        validateField(name);
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setStatus(null);

      const results = fieldNames.map((name) => ({ name, valid: validateField(name) }));
      const firstInvalid = results.find((result) => !result.valid);

      if (firstInvalid) {
        form.elements[firstInvalid.name].focus();
        setStatus("error", "Please check the highlighted fields and try again.");
        return;
      }

      const data = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        fragrance: form.elements.fragrance.value,
        date: form.elements.date.value,
        time: form.elements.time.value,
        people: String(Number(form.elements.people.value)),
        message: form.elements.message.value.trim(),
      };

      const message = buildWhatsAppMessage(data);

      if (!isWhatsAppConfigured()) {
        console.warn(
          "[AURA ESSENCE] WHATSAPP_NUMBER is still a placeholder. Set it in js/main.js to enable booking. Generated message:\n\n" +
            message
        );
        setStatus("error", "WhatsApp booking is not available just yet. Please check back shortly.");
        return;
      }

      const url = buildWhatsAppUrl(message);
      openUrlInNewTab(url);

      const fallback = document.createElement("span");
      fallback.append("Opening WhatsApp with your details. If nothing happens, ");
      const fallbackLink = document.createElement("a");
      fallbackLink.href = url;
      fallbackLink.target = "_blank";
      fallbackLink.rel = "noopener noreferrer";
      fallbackLink.textContent = "open WhatsApp here";
      fallback.append(fallbackLink, ".");
      setStatus("success", fallback);
    });
  }

  /* ------------------------------------------------------------------------
     Footer WhatsApp link uses the same number once it has been configured
     ------------------------------------------------------------------------ */
  function initWhatsAppLinks() {
    if (!isWhatsAppConfigured()) return;

    document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
      link.href = `https://wa.me/${getWhatsAppDigits()}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `WhatsApp: +${getWhatsAppDigits()}`;
    });
  }

  /* ------------------------------------------------------------------------
     Start
     ------------------------------------------------------------------------ */
  function init() {
    const scheduler = createScrollScheduler();

    initHeader(scheduler);
    initMobileMenu();
    initScrollReveal();
    initParallax(scheduler);
    initNotes(scheduler);
    initVideo();
    initFragranceLinks();
    initBookingForm();
    initWhatsAppLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


  /* ------------------------------------------------------------------------
     Collection filter: Male, Female and Unisex
     ------------------------------------------------------------------------ */
  function initCollectionFilter() {
    const filterButtons = Array.from(
      document.querySelectorAll("[data-filter]")
    );

    const products = Array.from(
      document.querySelectorAll(".product[data-category]")
    );

    if (!filterButtons.length || !products.length) return;

    function filterCollection(category) {
      products.forEach((product, index) => {
        const productCategory = product.getAttribute("data-category");
        const shouldShow =
          category === "all" || productCategory === category;

        if (shouldShow) {
          product.hidden = false;
          product.classList.remove("is-filtering-out");

          // Re-trigger the entrance animation
          product.classList.remove("is-filtering-in");

          requestAnimationFrame(() => {
            product.classList.add("is-filtering-in");
          });
        } else {
          product.classList.remove("is-filtering-in");
          product.classList.add("is-filtering-out");

          // Wait for the fade/slide animation before removing it
          window.setTimeout(() => {
            if (product.classList.contains("is-filtering-out")) {
              product.hidden = true;
            }
          }, 350);
        }
      });
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.getAttribute("data-filter");

        filterButtons.forEach((filterButton) => {
          const isActive = filterButton === button;

          filterButton.classList.toggle("is-active", isActive);
          filterButton.setAttribute("aria-pressed", String(isActive));
        });

        filterCollection(category);
      });
    });
  }



    initCollectionFilter();




