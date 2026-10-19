"use strict";

/* =========================================
   GREEN OPTICALS INC.
   Complete website interactions
========================================= */

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

const finePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
);

document.documentElement.classList.add("js");

/* CURRENT YEAR */

document.querySelectorAll("[data-current-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

/* MOBILE NAVIGATION */

const menuButton = document.querySelector("#menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const mobileBreakpoint = window.matchMedia("(max-width: 960px)");

if (menuButton && navigation) {
  menuButton.hidden = false;

  function closeMenu(restoreFocus = false) {
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");

    if (restoreFocus) menuButton.focus();
  }

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMenu();
      return;
    }

    navigation.classList.add("is-open");
    document.body.classList.add("menu-open");

    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close navigation");
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("click", (event) => {
    if (
      navigation.classList.contains("is-open") &&
      !navigation.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!navigation.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeMenu(true);
      return;
    }

    if (event.key !== "Tab") return;

    const items = [
      menuButton,
      ...navigation.querySelectorAll(
        "a[href], button:not([disabled])"
      )
    ].filter((item) => item.getClientRects().length);

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });

  mobileBreakpoint.addEventListener("change", () => closeMenu());
}

/* HEADER AND BACK TO TOP */

const header = document.querySelector(".site-header");
const backToTop = document.querySelector("#back-to-top");

let scrollFrame = 0;

function updateScrollState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);

  if (backToTop) {
    backToTop.hidden = window.scrollY < 550;
  }

  scrollFrame = 0;
}

window.addEventListener(
  "scroll",
  () => {
    if (!scrollFrame) {
      scrollFrame = requestAnimationFrame(updateScrollState);
    }
  },
  { passive: true }
);

updateScrollState();

/* SCROLL REVEALS */

const revealElements = document.querySelectorAll("[data-reveal]");
let revealObserver;

function revealEverything() {
  revealObserver?.disconnect();

  revealElements.forEach((element) => {
    element.classList.remove("reveal-ready");
    element.classList.add("is-visible");
  });
}

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.06,
      rootMargin: "0px 0px -15px 0px"
    }
  );

  revealElements.forEach((element) => {
    if (element.closest("[hidden]")) return;

    const bounds = element.getBoundingClientRect();

    if (bounds.top < window.innerHeight && bounds.bottom > 0) {
      element.classList.add("is-visible");
    } else {
      element.classList.add("reveal-ready");
      revealObserver.observe(element);
    }
  });
} else {
  revealEverything();
}

/* GENTLE CARD TILT */

const tiltItems = document.querySelectorAll("[data-tilt]");
const tiltFrames = new Map();

function resetTilts() {
  tiltItems.forEach((item) => {
    cancelAnimationFrame(tiltFrames.get(item) || 0);
    item.style.transform = "";
  });
}

tiltItems.forEach((item) => {
  function reset() {
    cancelAnimationFrame(tiltFrames.get(item) || 0);
    item.style.transform = "";
  }

  item.addEventListener("pointermove", (event) => {
    if (
      !finePointer.matches ||
      reducedMotion.matches ||
      event.pointerType !== "mouse"
    ) {
      return;
    }

    const box = item.getBoundingClientRect();

    if (!box.width || !box.height) return;

    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;

    cancelAnimationFrame(tiltFrames.get(item) || 0);

    tiltFrames.set(
      item,
      requestAnimationFrame(() => {
        item.style.transform =
          `perspective(1200px) rotateX(${-y * 4}deg) ` +
          `rotateY(${x * 4}deg)`;
      })
    );
  });

  item.addEventListener("pointerleave", reset);
  item.addEventListener("focusin", reset);
});

/* OPTICAL CURSOR */

const cursor = document.querySelector("#lens-cursor");

let cursorEnabled = false;
let cursorVisible = false;
let cursorFrame = 0;

let cursorX = 0;
let cursorY = 0;
let targetX = 0;
let targetY = 0;

function hideCursor() {
  cursorVisible = false;

  cancelAnimationFrame(cursorFrame);
  cursorFrame = 0;

  cursor?.classList.remove("is-visible", "is-link");
}

function updateCursorAvailability() {
  if (!cursor) return;

  cursorEnabled = finePointer.matches && !reducedMotion.matches;
  cursor.hidden = !cursorEnabled;

  if (!cursorEnabled) hideCursor();
}

if (cursor) {
  const cursorLabel = cursor.querySelector(".lens-cursor__label");

  function drawCursor() {
    if (!cursorEnabled || !cursorVisible) {
      cursorFrame = 0;
      return;
    }

    cursorX += (targetX - cursorX) * 0.24;
    cursorY += (targetY - cursorY) * 0.24;

    cursor.style.transform =
      `translate3d(${cursorX - 23}px, ${cursorY - 23}px, 0)`;

    if (
      Math.abs(targetX - cursorX) < 0.1 &&
      Math.abs(targetY - cursorY) < 0.1
    ) {
      cursorFrame = 0;
      return;
    }

    cursorFrame = requestAnimationFrame(drawCursor);
  }

  updateCursorAvailability();

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!cursorEnabled || event.pointerType !== "mouse") return;

      const target =
        event.target instanceof Element ? event.target : null;

      if (
        target?.closest(
          "input, textarea, select, iframe, #glasses-viewer"
        )
      ) {
        hideCursor();
        return;
      }

      targetX = event.clientX;
      targetY = event.clientY;

      if (!cursorVisible) {
        cursorX = targetX;
        cursorY = targetY;
      }

      cursorVisible = true;
      cursor.classList.add("is-visible");

      const interactive = target?.closest("a, button, summary");

      cursor.classList.toggle("is-link", Boolean(interactive));

      if (cursorLabel) {
        cursorLabel.textContent = interactive
          ? interactive.dataset.cursor || "VIEW"
          : "";
      }

      if (!cursorFrame) {
        cursorFrame = requestAnimationFrame(drawCursor);
      }
    },
    { passive: true }
  );

  document.addEventListener("pointerdown", (event) => {
    if (
      !cursorEnabled ||
      event.pointerType !== "mouse" ||
      event.button !== 0
    ) {
      return;
    }

    const target =
      event.target instanceof Element ? event.target : null;

    if (
      target?.closest(
        "input, textarea, select, iframe, #glasses-viewer"
      )
    ) {
      return;
    }

    const pulse = document.createElement("span");
    pulse.setAttribute("aria-hidden", "true");

    Object.assign(pulse.style, {
      position: "fixed",
      left: `${event.clientX}px`,
      top: `${event.clientY}px`,
      width: "36px",
      height: "36px",
      border: "1px solid rgba(103,165,71,0.8)",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "9999"
    });

    document.body.appendChild(pulse);

    if (typeof pulse.animate === "function") {
      const animation = pulse.animate(
        [
          {
            opacity: 0.8,
            transform: "translate(-50%, -50%) scale(0.45)"
          },
          {
            opacity: 0,
            transform: "translate(-50%, -50%) scale(1.8)"
          }
        ],
        {
          duration: 500,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)"
        }
      );

      animation.finished.then(
        () => pulse.remove(),
        () => pulse.remove()
      );
    }

    window.setTimeout(() => pulse.remove(), 600);
  });

  document.documentElement.addEventListener(
    "pointerleave",
    hideCursor
  );

  window.addEventListener("blur", hideCursor);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hideCursor();
  });
}

/* CINEMATIC LOGO OPENING */

const intro = document.querySelector("#intro");

if (intro) {
  const logo = intro.querySelector(".intro__logo");
  const caption = intro.querySelector(".intro__caption");
  const progress = intro.querySelector(".intro__progress span");

  const introAnimations = [];
  let introFinished = false;
  let introTimer;

  function finishIntro() {
    if (introFinished) return;

    introFinished = true;
    intro.hidden = true;

    document.body.classList.remove("intro-running");
    window.clearTimeout(introTimer);

    introAnimations.forEach((animation) => animation.cancel());

    document.removeEventListener("keydown", finishIntro);
    document.removeEventListener("pointerdown", finishIntro);
  }

  function animateIntro(element, frames, options) {
    if (!element || typeof element.animate !== "function") {
      return null;
    }

    const animation = element.animate(frames, options);
    introAnimations.push(animation);

    return animation;
  }

  if (reducedMotion.matches) {
    intro.hidden = true;
  } else {
    intro.hidden = false;
    document.body.classList.add("intro-running");

    introTimer = window.setTimeout(finishIntro, 3300);

    document.addEventListener("keydown", finishIntro);
    document.addEventListener("pointerdown", finishIntro);

    try {
      animateIntro(
        logo,
        [
          {
            opacity: 0,
            transform:
              "perspective(900px) translateY(30px) rotateX(22deg) scale(0.85)",
            filter: "blur(10px)"
          },
          {
            opacity: 1,
            transform:
              "perspective(900px) translateY(-4px) rotateX(-3deg) scale(1.02)",
            filter: "blur(0px)",
            offset: 0.8
          },
          {
            opacity: 1,
            transform:
              "perspective(900px) translateY(0) rotateX(0) scale(1)",
            filter: "blur(0px)"
          }
        ],
        {
          duration: 1100,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        }
      );

      animateIntro(
        caption,
        [
          { opacity: 0, transform: "translateY(15px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        {
          duration: 700,
          delay: 450,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        }
      );

      animateIntro(
        progress,
        [
          { transform: "scaleX(0)" },
          { transform: "scaleX(1)" }
        ],
        {
          duration: 1600,
          delay: 350,
          easing: "ease-in-out",
          fill: "forwards"
        }
      );

      const exit = animateIntro(
        intro,
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-35px)" }
        ],
        {
          duration: 700,
          delay: 2100,
          easing: "cubic-bezier(0.76, 0, 0.24, 1)",
          fill: "forwards"
        }
      );

      exit?.finished.then(finishIntro, finishIntro);
    } catch {
      finishIntro();
    }

    reducedMotion.addEventListener("change", (event) => {
      if (event.matches) finishIntro();
    });
  }
}

/* PREFERENCE CHANGES */

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    revealEverything();
    resetTilts();
  }

  updateCursorAvailability();
});

finePointer.addEventListener("change", () => {
  resetTilts();
  updateCursorAvailability();
});

/* LOCAL INTERACTIVE 3D GLASSES */

const viewer = document.querySelector("#glasses-viewer");

if (viewer) {
  const stage = document.querySelector("#optical-stage");
  const status = document.querySelector("#model-status");
  const panel = document.querySelector("#model-controls");
  const poster = document.querySelector("#model-poster");
  const rotationButton = document.querySelector("#rotation-toggle");
  const resetButton = document.querySelector("#model-reset");

  if (poster) poster.hidden = true;

  function setModelStatus(message) {
    if (!status) return;

    status.textContent = message;
    status.hidden = !message;
  }

  async function loadGlasses() {
    if (location.protocol === "file:") {
      setModelStatus("Please open this website with Live Server.");
      return;
    }

    let timeout;
    let model;

    try {
      setModelStatus("Loading glasses…");

      await import("./vendor/model-viewer.min.js");

      if (!customElements.get("model-viewer")) {
        throw new Error("Local viewer did not initialise.");
      }

      model = document.createElement("model-viewer");

      model.setAttribute(
        "alt",
        "Interactive eyeglasses. Drag or use arrow keys to rotate."
      );

      model.setAttribute("camera-controls", "");
      model.setAttribute("disable-zoom", "");
      model.setAttribute("disable-pan", "");
      model.setAttribute("touch-action", "pan-y");
      model.setAttribute("interaction-prompt", "none");

      model.setAttribute("loading", "eager");
      model.setAttribute("reveal", "auto");

      model.setAttribute("camera-orbit", "25deg 80deg auto");
      model.setAttribute("field-of-view", "32deg");

      model.setAttribute("exposure", "1.2");
      model.setAttribute("shadow-intensity", "0");

      model.setAttribute("auto-rotate-delay", "1000");
      model.setAttribute("rotation-per-second", "10deg");

      model.style.cssText =
        "display:block;width:100%;height:100%;background:transparent;";

      let paused = false;
      let inView = true;

      function updateRotation() {
        const stop = paused || reducedMotion.matches;

        model.toggleAttribute(
          "auto-rotate",
          !stop && inView && !document.hidden
        );

        if (rotationButton) {
          rotationButton.textContent = stop
            ? "Resume rotation"
            : "Pause rotation";

          rotationButton.setAttribute(
            "aria-pressed",
            String(stop)
          );

          rotationButton.dataset.cursor = stop ? "PLAY" : "PAUSE";
          rotationButton.disabled = reducedMotion.matches;
        }
      }

      model.addEventListener("load", () => {
        window.clearTimeout(timeout);

        setModelStatus("");
        stage?.classList.add("is-loaded");

        if (panel) panel.hidden = false;

        updateRotation();
      });

      model.addEventListener("error", (event) => {
        window.clearTimeout(timeout);

        console.error("Glasses loading error:", event.detail);

        setModelStatus(
          "Glasses could not load. Check Models/eye_glasses_ready.glb."
        );

        if (panel) panel.hidden = true;
      });

      rotationButton?.addEventListener("click", () => {
        if (reducedMotion.matches) return;

        paused = !paused;
        updateRotation();
      });

      resetButton?.addEventListener("click", () => {
        paused = true;

        model.resetTurntableRotation();
        model.cameraOrbit = "25deg 80deg auto";
        model.fieldOfView = "32deg";
        model.jumpCameraToGoal();

        updateRotation();
      });

      /* Pause rotation while the visitor interacts. */
      model.addEventListener("camera-change", (event) => {
        if (event.detail.source !== "user-interaction") return;

        paused = true;
        updateRotation();
      });

      reducedMotion.addEventListener("change", updateRotation);
      document.addEventListener("visibilitychange", updateRotation);

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            inView = entries[0].isIntersecting;
            updateRotation();
          },
          { threshold: 0.05 }
        );

        observer.observe(stage || viewer);
      }

      viewer.replaceChildren(model);

      timeout = window.setTimeout(() => {
        if (!model.loaded) {
          setModelStatus(
            "3D loading is taking longer than expected. Check the browser Console."
          );
        }
      }, 45000);

      /* Use the compatible model included in the ZIP. */
      model.src = "Models/eye_glasses_ready.glb";

      updateRotation();

    } catch (error) {
      window.clearTimeout(timeout);

      console.error("Local 3D viewer error:", error);

      setModelStatus(
        "Viewer unavailable. Check vendor/model-viewer.min.js."
      );

      if (panel) panel.hidden = true;
    }
  }

  loadGlasses();
}

/* APPOINTMENT REQUEST FORM */

const appointmentForm = document.querySelector("#appointment-form");

if (appointmentForm) {
  const formStatus = appointmentForm.querySelector("#form-status");
  const submitButton = appointmentForm.querySelector('[type="submit"]');

  let sending = false;

  function setFormStatus(message, type = "") {
    if (!formStatus) return;

    formStatus.textContent = message;
    formStatus.classList.remove("is-success", "is-error");

    if (type) {
      formStatus.classList.add(`is-${type}`);
    }
  }

  appointmentForm.addEventListener("input", (event) => {
    const field = event.target;

    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement
    ) {
      field.setCustomValidity("");
    }
  });

  appointmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (sending) return;

    setFormStatus("");

    appointmentForm
      .querySelectorAll("input[required], textarea[required]")
      .forEach((field) => {
        if (field.value && !field.value.trim()) {
          field.setCustomValidity("Please complete this field.");
        }
      });

    if (!appointmentForm.reportValidity()) return;

    /*
     * Add a real Formspree endpoint to the form's
     * data-endpoint attribute when the account is ready.
     */
    const endpoint = appointmentForm.dataset.endpoint?.trim() || "";

    if (!endpoint) {
      setFormStatus(
        "Online requests are being set up. Please call +1 (416) 752-7434.",
        "error"
      );
      return;
    }

    let endpointUrl;

    try {
      endpointUrl = new URL(endpoint);

      if (
        endpointUrl.protocol !== "https:" ||
        endpointUrl.hostname !== "formspree.io" ||
        !endpointUrl.pathname.startsWith("/f/")
      ) {
        throw new Error("Invalid form endpoint.");
      }
    } catch {
      setFormStatus(
        "Online requests are being set up. Please call +1 (416) 752-7434.",
        "error"
      );
      return;
    }

    sending = true;

    const originalButtonText = submitButton?.textContent;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending request…";
    }

    appointmentForm.setAttribute("aria-busy", "true");
    setFormStatus("Sending your request…");

    const controller = new AbortController();

    const timer = window.setTimeout(
      () => controller.abort(),
      20000
    );

    try {
      const data = new FormData(appointmentForm);

      data.forEach((value, key) => {
        if (typeof value === "string") {
          data.set(key, value.trim());
        }
      });

      const response = await fetch(endpointUrl.href, {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: data,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("The request was not accepted.");
      }

      appointmentForm.reset();

      setFormStatus(
        "Your request has been received. The clinic will contact you to confirm availability.",
        "success"
      );

    } catch (error) {
      const message = error?.name === "AbortError"
        ? "We could not confirm whether your request arrived. Please call +1 (416) 752-7434 before sending again."
        : "We could not confirm delivery. Please call +1 (416) 752-7434.";

      setFormStatus(message, "error");

    } finally {
      window.clearTimeout(timer);

      sending = false;
      appointmentForm.removeAttribute("aria-busy");

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent =
          originalButtonText || "Send appointment request";
      }
    }
  });
}