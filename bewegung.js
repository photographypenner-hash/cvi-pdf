// Übergänge der gestalteten Ansicht von sichtnah.com (angelehnt an capsules.moyra.co).
// Ohne JavaScript oder mit «Bewegung reduzieren» bleibt alles sofort sichtbar und ruhig.
// Was beim Laden schon im Bild ist, wird nie versteckt – nur Inhalte weiter unten warten aufs Hineinscrollen.
(() => {
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)");
  if (ruhig.matches || !("IntersectionObserver" in window)) return;
  const alle = (s) => [...document.querySelectorAll(s)];
  const begrenzen = (x) => Math.min(1, Math.max(0, x));
  const zeigen = (el) => el.classList.remove("wartet");
  let beobachter, leuchten = [], aus = false;

  function allesZeigen() {
    aus = true;
    if (beobachter) beobachter.disconnect();
    alle(".wartet").forEach(zeigen);
    alle(".wort").forEach((w) => { w.style.opacity = ""; });
    alle(".wortmarke .zeile, .unterseite-kopf .gross").forEach((el) => { el.style.transform = ""; });
  }

  try {
    beobachter = new IntersectionObserver((eintraege) => {
      for (const e of eintraege) if (e.isIntersecting) { zeigen(e.target); beobachter.unobserve(e.target); }
    }, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });

    // Grosse Titel: jede Zeile gleitet aus einer Maske nach oben – auch die schon sichtbaren beim Laden
    for (const titel of alle(".gross")) {
      const teile = titel.classList.contains("wortmarke") ? [...titel.children].map((k) => k.innerHTML) : titel.innerHTML.split(/<br\s*\/?>/i);
      titel.innerHTML = teile.map((t, i) => `<span class="zeile"><span style="--i:${i}">${t}</span></span>`).join("");
      titel.classList.add("maske", "wartet");
      beobachter.observe(titel);
    }
    // Sicherheitsnetz: was im Bild ist, steht spätestens nach 1,5 s da
    setTimeout(() => alle(".wartet").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) zeigen(el);
    }), 1500);

    // Abschnitte, Listen und Bilder tauchen nacheinander auf
    const auftauchen = alle(".liste > li, .schritte > li, .apps > li, .punkte > li, .ueber > img, .ueber > div, .vergleich, .bildschirm figure > img, " +
      ".abschluss > .innen > p, .inhalt .innen > :is(h2, h3, p:not(.einleitung), details), .inhalt .innen > :is(ul, ol) > li");
    for (const el of auftauchen) {
      el.classList.add("auftauchen");
      if (el.matches("img, .vergleich")) el.classList.add("bild");
      if (el.tagName === "LI") el.style.setProperty("--i", [...el.parentNode.children].indexOf(el) % 6);
      if (el.getBoundingClientRect().top >= innerHeight) { el.classList.add("wartet"); beobachter.observe(el); }
    }

    // Einleitungen: Wort für Wort, damit der Text beim Scrollen aufhellt
    leuchten = alle(".lead, .einleitung, .text-gross");
    for (const absatz of leuchten) {
      const gang = document.createTreeWalker(absatz, NodeFilter.SHOW_TEXT), knoten = [];
      while (gang.nextNode()) knoten.push(gang.currentNode);
      for (const k of knoten) {
        const teil = document.createDocumentFragment();
        for (const stueck of k.textContent.split(/(\s+)/)) {
          if (!stueck) continue;
          if (/^\s+$/.test(stueck)) { teil.append(stueck); continue; }
          const wort = document.createElement("span");
          wort.className = "wort"; wort.textContent = stueck; teil.append(wort);
        }
        k.replaceWith(teil);
      }
      absatz.woerter = [...absatz.querySelectorAll(".wort")];
    }

    // Was an der Bildlaufposition hängt: aufhellende Wörter und der wandernde Schriftzug
    const marke = alle(".wortmarke .zeile");
    const riesig = document.querySelector(".unterseite-kopf .gross");
    let geplant = false;
    function aktualisieren() {
      geplant = false;
      if (aus) return;
      const h = innerHeight, y = scrollY;
      const amEnde = y + h >= document.documentElement.scrollHeight - 4;
      for (const absatz of leuchten) {
        const r = absatz.getBoundingClientRect();
        const p = amEnde ? 1 : begrenzen((h * .95 - r.top) / (r.height + h * .3));
        const n = absatz.woerter.length;
        absatz.woerter.forEach((w, i) => { w.style.opacity = (.3 + .7 * begrenzen(p * n * 1.25 - i)).toFixed(3); });
      }
      marke.forEach((z, i) => { z.style.transform = `translateX(${((i ? 1 : -1) * Math.min(y, h) * .15).toFixed(1)}px)`; });
      if (riesig) riesig.style.transform = `translateX(${(-Math.min(y, h) * .25).toFixed(1)}px)`;
      if (amEnde) alle(".wartet").forEach(zeigen);  // ganz unten: auch zeigen, was nie ganz ins Bild rücken kann
    }
    addEventListener("scroll", () => { if (!geplant) { geplant = true; requestAnimationFrame(aktualisieren); } }, { passive: true });
    addEventListener("resize", aktualisieren);
    aktualisieren();

    // Tastaturfokus, Zurück-Taste und nachträglich eingeschaltetes «Bewegung reduzieren»: sofort alles zeigen
    document.addEventListener("focusin", (e) => {
      const el = e.target.closest(".wartet");
      if (el) { zeigen(el); beobachter.unobserve(el); }
      const absatz = leuchten.find((a) => a.contains(e.target));
      if (absatz) absatz.woerter.forEach((w) => { w.style.opacity = "1"; });
    });
    addEventListener("pageshow", (e) => { if (e.persisted) alle(".wartet").forEach(zeigen); });
    const geaendert = (e) => { if (e.matches) allesZeigen(); };
    ruhig.addEventListener ? ruhig.addEventListener("change", geaendert) : ruhig.addListener(geaendert);
  } catch (fehler) { allesZeigen(); }
})();
