(function () {
  "use strict";
  const form = document.getElementById("dinner-form");
  const status = document.getElementById("form-status");
  const submit = document.getElementById("confirm");
  const allowedDates = ["Viernes 20 de noviembre de 2026", "Sábado 21 de noviembre de 2026", "Viernes 27 de noviembre de 2026", "Sábado 28 de noviembre de 2026"];
  let sending = false;
  let sent = false;
  const fields = ["Nombre", "Comida_favorita", "Fecha", "Hora", "Mensaje"];
  try {
    const saved = JSON.parse(sessionStorage.getItem("cena-esteysi-v5") || "{}");
    fields.forEach(function (name) { if (saved[name]) form.elements[name].value = saved[name]; });
  } catch (_) { /* Storage is optional. */ }
  form.addEventListener("input", function () {
    try {
      const data = new FormData(form);
      const saved = {};
      fields.forEach(function (name) { saved[name] = data.get(name); });
      sessionStorage.setItem("cena-esteysi-v5", JSON.stringify(saved));
    } catch (_) { /* Storage is optional. */ }
  });
  document.querySelectorAll("[data-food]").forEach(function (button) {
    button.addEventListener("click", function () {
      form.elements.Comida_favorita.value = button.dataset.food === "Otra" ? "" : button.dataset.food;
      document.querySelectorAll("[data-food]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      form.elements.Comida_favorita.dispatchEvent(new Event("input", { bubbles: true }));
      form.elements.Comida_favorita.focus();
    });
  });
  const noMessages = ["¿Segura?", "Apuesto a que te gustará", "Prometo una bonita conversación", "¿Y si lo piensas con calma?", "La invitación sigue aquí ♥"];
  let noCount = 0;
  document.getElementById("no-button").addEventListener("click", function () {
    this.textContent = noMessages[noCount++ % noMessages.length];
    document.getElementById("no-message").textContent = "Sin presión. Solo me encantaría conocerte mejor.";
  });
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (sending || sent || !form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form));
    if (!allowedDates.includes(payload.Fecha)) { status.textContent = "Elige uno de los viernes o sábados disponibles."; return; }
    if (!payload.Nombre.trim() || !payload.Comida_favorita.trim() || !/^\d{2}:\d{2}$/.test(payload.Hora)) { status.textContent = "Completa tu nombre, comida, fecha y hora."; return; }
    payload.Zona_horaria = "America/Caracas (Venezuela, UTC−04:00)";
    payload.website = window.location.href.split("#")[0];
    if (/^PRUEBA TECNICA/i.test(payload.Nombre)) payload.subject = "PRUEBA TECNICA · no es una respuesta de Esteysi";
    sending = true;
    submit.disabled = true;
    submit.textContent = "Enviando tu respuesta…";
    status.textContent = "";
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 25000);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams(payload), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== "true")) { console.warn("Envío rechazado", response.status, result.message || "Sin mensaje"); throw new Error("Submission rejected"); }
      sent = true;
      document.getElementById("summary").textContent = payload.Comida_favorita + " · " + payload.Fecha + " · " + payload.Hora + " (Venezuela)";
      form.hidden = true;
      document.getElementById("form-title").hidden = true;
      document.querySelector("#elegir .lead").hidden = true;
      document.getElementById("confirmation").hidden = false;
      document.getElementById("confirmation").scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("thanks-title").focus({ preventScroll: true });
    } catch (_) {
      status.textContent = "No pudimos confirmar el envío. Tu elección sigue aquí; revisa la conexión e inténtalo otra vez.";
    } finally {
      clearTimeout(timeout); sending = false; submit.disabled = sent; submit.textContent = "Confirmar nuestra cita ♥";
    }
  });
})();
