(function () {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const revealItems = document.querySelectorAll(".reveal");

  function loadGoogleAnalytics(measurementId) {
    if (!measurementId || window.gtag) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.addEventListener("load", sendLandingVisitEvent, { once: true });
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  function sendLandingVisitEvent() {
    const searchParams = new URLSearchParams(window.location.search);

    window.gtag("event", "landing_visit", {
      utm_source: searchParams.get("utm_source") || "",
      utm_medium: searchParams.get("utm_medium") || "",
      utm_campaign: searchParams.get("utm_campaign") || "",
      utm_content: searchParams.get("utm_content") || "",
      page_location: window.location.href,
      debug_mode: true
    });
  }

  function initGoogleAnalytics() {
    fetch("/api/ga-id")
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (data && data.measurementId) loadGoogleAnalytics(data.measurementId);
      })
      .catch(() => {});
  }

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  }

  function initPhotoMarquee() {
    const track = document.querySelector("[data-photo-track]");
    const marquee = track && track.closest(".program-photo-marquee");
    if (!track || !marquee || track.dataset.marqueeReady) return;

    const originalItems = Array.from(track.children);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let loopWidth = 0;
    let offset = 0;
    let lastTime = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;

    originalItems.forEach((item) => {
      const image = item.querySelector("img");
      if (image) image.setAttribute("draggable", "false");

      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      const cloneImage = clone.querySelector("img");
      if (cloneImage) cloneImage.setAttribute("draggable", "false");
      track.appendChild(clone);
    });

    function measureLoop() {
      loopWidth = originalItems.reduce((total, item) => total + item.getBoundingClientRect().width, 0);
    }

    function normalizeOffset() {
      if (!loopWidth) return;
      offset %= loopWidth;
      if (offset < 0) offset += loopWidth;
    }

    function render() {
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }

    function animate(time) {
      if (!loopWidth) measureLoop();

      if (!isDragging && !reduceMotion) {
        const elapsed = lastTime ? Math.min(time - lastTime, 64) : 0;
        offset += elapsed * 0.045;
        normalizeOffset();
        render();
      }

      lastTime = time;
      requestAnimationFrame(animate);
    }

    marquee.addEventListener("pointerdown", (event) => {
      isDragging = true;
      dragStartX = event.clientX;
      dragStartOffset = offset;
      lastTime = 0;
      marquee.classList.add("is-dragging");
      marquee.setPointerCapture(event.pointerId);
    });

    marquee.addEventListener("pointermove", (event) => {
      if (!isDragging) return;

      offset = dragStartOffset - (event.clientX - dragStartX);
      normalizeOffset();
      render();
    });

    function stopDragging(event) {
      if (!isDragging) return;

      isDragging = false;
      lastTime = 0;
      marquee.classList.remove("is-dragging");

      if (marquee.hasPointerCapture(event.pointerId)) {
        marquee.releasePointerCapture(event.pointerId);
      }
    }

    marquee.addEventListener("pointerup", stopDragging);
    marquee.addEventListener("pointercancel", stopDragging);
    window.addEventListener("resize", measureLoop);
    document.addEventListener("visibilitychange", () => {
      lastTime = 0;
    });

    measureLoop();
    render();
    requestAnimationFrame(animate);
    track.dataset.marqueeReady = "true";
  }

  function closeMenu() {
    header.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else if (entry.boundingClientRect.top > window.innerHeight) {
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -12% 0px" });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  initPhotoMarquee();
  initGoogleAnalytics();
  updateHeader();
}());
