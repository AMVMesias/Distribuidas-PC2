import {
  store, request, authLogin, authRegister, authRefresh, authLogout, authMe,
  onSessionChange, clearSession, setSession,
} from "./api.js";
import { decodeJwt, extractClaims, formatExpiresIn, isExpired, prettyClaims } from "./jwt.js";
import { SECTIONS } from "./endpoints.js";

// ---------- Estado local ----------
const history = [];
const MAX_HISTORY = 50;

// ---------- Utilidades DOM ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function toast(title, msg = "", type = "info", ms = 4000) {
  const wrap = $(".toasts") || el("div", { class: "toasts" });
  if (!wrap.parentElement) document.body.appendChild(wrap);
  const t = el("div", { class: `toast toast--${type}` }, [
    el("div", { class: "toast__title" }, title),
    msg ? el("div", { class: "toast__msg" }, msg) : null,
  ]);
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 0.3s"; setTimeout(() => t.remove(), 300); }, ms);
}

function prettyJson(value) {
  if (value === "" || value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function syncStoreBackedFields(root = document) {
  $$('[data-from-store="refresh"]', root).forEach((input) => {
    input.value = store.refreshToken || "";
  });
  $$('[data-from-store="username"]', root).forEach((input) => {
    input.value = store.lastUsername || input.value || "";
  });
}

function syntaxHighlight(json) {
  if (typeof json !== "string") json = prettyJson(json);
  if (!json) return "";
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    (m) => {
      let cls = "n";
      if (/^"/.test(m)) cls = /:$/.test(m) ? "k" : "s";
      else if (/true|false/.test(m)) cls = "b";
      else if (/null/.test(m)) cls = "b";
      return `<span class="${cls}">${m}</span>`;
    }
  );
}

function statusClass(code) {
  if (code >= 200 && code < 300) return "is-2xx";
  if (code >= 300 && code < 400) return "is-3xx";
  if (code >= 400 && code < 500) return "is-4xx";
  if (code >= 500) return "is-5xx";
  return "is-err";
}

function methodToColor(method) {
  return { GET: "GET", POST: "POST", PUT: "PUT", PATCH: "PATCH", DELETE: "DELETE" }[method] || "GET";
}

// ---------- Render de secciones ----------
const content = $("#content");

function renderIntro() {
  content.innerHTML = "";
  content.appendChild(el("div", { class: "intro" }, [
    el("div", null, [
      el("div", { class: "section__title" }, [
        el("h2", {}, "Bienvenido al cliente de pruebas"),
        el("p", {}, "Explora y prueba la API detrás de Kong sin escribir curl."),
      ]),
      el("p", { class: "section__lead", html:
        "Esta página es <strong>standalone</strong>: sólo HTML, CSS y JS. Habla directamente con Kong en " +
        "<code id='introBaseUrl'></code>. La sesión se guarda en <code>localStorage</code>." }),
    ]),
    el("div", { class: "intro__cards" }, [
      el("div", { class: "intro__card" }, [
        el("div", { class: "icon" }, "1"),
        el("h3", {}, "Configura Kong arriba"),
        el("p", {}, "Ajusta la URL base si Kong no está en localhost:8000."),
      ]),
      el("div", { class: "intro__card" }, [
        el("div", { class: "icon" }, "2"),
        el("h3", {}, "Inicia sesión"),
        el("p", {}, "Ve a Autenticación y haz login. El access token se guardará solo."),
      ]),
      el("div", { class: "intro__card" }, [
        el("div", { class: "icon" }, "3"),
        el("h3", {}, "Prueba cada endpoint"),
        el("p", {}, "Cada tarjeta tiene un formulario, el cuerpo esperado y la respuesta real."),
      ]),
      el("div", { class: "intro__card" }, [
        el("div", { class: "icon" }, "4"),
        el("h3", {}, "Inspecciona el JWT"),
        el("p", {}, "Mira los claims, la expiración y los roles sin salir del cliente."),
      ]),
    ]),
    el("div", null, [
      el("h3", { style: "margin: 18px 0 8px;" }, "Documentación interactiva"),
      el("p", { style: "color: var(--text-muted);" },
        "Cada microservicio publica su propio Swagger UI a través de Kong. " +
        "En la barra lateral, abre <strong>Documentación API</strong> para entrar a la UI, " +
        "pegar tu access token y probar las rutas sin escribir curl."),
    ]),

    el("div", null, [
      el("h3", { style: "margin: 18px 0 8px;" }, "Pasos para levantar el backend"),
      el("ol", { class: "steps" }, [
        el("li", {}, "En la raíz del repo ejecuta .\\scripts\\bootstrap.ps1 para generar .env, par RSA y kong.yml."),
        el("li", {}, "Levanta todo: wsl -d Ubuntu -- bash -lc \"cd /mnt/c/.../2P && docker compose up --build -d\""),
        el("li", {}, "Espera a que los healthchecks pasen (docker compose ps)."),
        el("li", {}, "Vuelve aquí y haz login con el usuario admin configurado en .env."),
        el("li", {}, "(Opcional) Carga datos demo con .\\scripts\\seed-demo.ps1 --reset."),
      ]),
    ]),
    el("div", null, [
      el("h3", { style: "margin: 18px 0 8px;" }, "Rutas públicas y permisos"),
      el("table", { class: "card", style: "width: 100%; border-collapse: collapse;" }, [
        el("thead", {}, el("tr", {}, [
          el("th", { style: "text-align: left; padding: 8px; border-bottom: 1px solid var(--border);" }, "Recurso"),
          el("th", { style: "text-align: left; padding: 8px; border-bottom: 1px solid var(--border);" }, "Acceso"),
        ])),
        el("tbody", {}, [
          ["auth/register, login, refresh, logout", "Público"],
          ["auth/me", "CLIENTE o ADMIN"],
          ["usuarios, personas, roles", "Sólo ADMIN"],
          ["zonas (GET), espacios (GET)", "CLIENTE, RECAUDADOR o ADMIN"],
          ["zonas, espacios (escritura)", "Sólo ADMIN"],
          ["vehiculos", "CLIENTE sobre los propios · RECAUDADOR consulta · ADMIN sobre todos"],
        ].map(([r, p]) => el("tr", {}, [
          el("td", { style: "padding: 8px; border-bottom: 1px dashed var(--border); font-family: var(--mono); font-size: 12px;" }, r),
          el("td", { style: "padding: 8px; border-bottom: 1px dashed var(--border); font-size: 12px;" }, p),
        ]))),
      ]),
    ]),
  ]));
  const base = $("#introBaseUrl");
  if (base) base.textContent = store.baseUrl;
}

function renderEndpointCard(ep) {
  const tpl = $("#tpl-endpoint").content.cloneNode(true);
  const card = tpl.querySelector("[data-endpoint]");

  tpl.querySelector("[data-method]").textContent = ep.method;
  tpl.querySelector("[data-method]").dataset.m = methodToColor(ep.method);
  tpl.querySelector("[data-path]").textContent = ep.path;
  const perm = tpl.querySelector("[data-perm]");
  perm.textContent = ep.perm === "public" ? "Público" : ep.perm;
  perm.dataset.p = ep.perm;
  tpl.querySelector("[data-desc]").textContent = ep.desc;
  tpl.querySelector("[data-hint]").innerHTML = ep.hint;

  const fieldsWrap = tpl.querySelector("[data-fields]");
  if (ep.fields.length === 0) {
    fieldsWrap.appendChild(el("p", { style: "color: var(--text-muted); margin: 0; font-size: 12px;" }, "Sin parámetros. Pulsa Enviar."));
  } else {
    fieldsWrap.classList.add("card__fields--row");
    for (const f of ep.fields) {
      const label = el("label", { class: "field" }, [el("span", {}, f.label)]);
      let input;
      if (f.type === "select") {
        input = el("select", { name: f.name, dataset: { field: f.name, fromStore: f.fromStore || "" } });
        for (const opt of f.options) {
          const o = el("option", { value: opt }, opt);
          if (opt === f.value) o.selected = true;
          input.appendChild(o);
        }
      } else if (f.type === "textarea") {
        input = el("textarea", { name: f.name, dataset: { field: f.name, fromStore: f.fromStore || "" }, placeholder: f.placeholder || "", rows: "3" });
        if (f.value != null) input.value = f.value;
      } else {
        input = el("input", { type: f.type || "text", name: f.name, dataset: { field: f.name, fromStore: f.fromStore || "" }, placeholder: f.placeholder || "" });
        if (f.value != null) input.value = f.value;
      }
      if (f.required) input.required = true;
      label.appendChild(input);
      fieldsWrap.appendChild(label);
    }
  }

  syncStoreBackedFields(fieldsWrap);

  const form = tpl.querySelector("[data-form]");
  const responseBox = tpl.querySelector("[data-response]");
  const cardEl = tpl.querySelector("[data-endpoint]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await sendRequest(ep, cardEl);
  });

  form.querySelector('[data-action="reset"]').addEventListener("click", () => {
    for (const f of ep.fields) {
      const input = fieldsWrap.querySelector(`[data-field="${f.name}"]`);
      if (input) input.value = f.value ?? "";
    }
    responseBox.hidden = true;
  });

  form.querySelector('[data-action="copy"]').addEventListener("click", () => {
    const { path, body } = ep.build(collectValues(cardEl));
    const url = store.baseUrl + path;
    const cmd = buildCurl(ep.method, url, body, ep.perm === "public" ? null : "<accessToken>");
    navigator.clipboard.writeText(cmd);
    toast("cURL copiado", "Pégalo en una terminal.", "success");
  });

  responseBox.querySelector('[data-action="copyResp"]').addEventListener("click", () => {
    const body = responseBox.querySelector("[data-body]").textContent;
    navigator.clipboard.writeText(body);
    toast("Respuesta copiada", "", "success", 2000);
  });

  return tpl;
}

function collectValues(card) {
  const values = {};
  card.querySelectorAll("[data-field]").forEach((input) => {
    values[input.dataset.field] = input.value;
  });
  return values;
}

function buildCurl(method, url, body, token) {
  const parts = [`curl -X ${method} '${url}'`];
  parts.push("-H 'Accept: application/json'");
  if (body !== null && body !== undefined) parts.push("-H 'Content-Type: application/json'");
  if (token) parts.push(`-H 'Authorization: Bearer ${token}'`);
  if (body !== null && body !== undefined) parts.push(`-d '${JSON.stringify(body)}'`);
  return parts.join(" \\\n  ");
}

async function sendRequest(ep, card) {
  const values = collectValues(card);
  const form = card.querySelector("[data-form]");
  const responseBox = card.querySelector("[data-response]");
  const statusEl = card.querySelector("[data-status]");
  const timeEl = card.querySelector("[data-time]");
  const bodyEl = card.querySelector("[data-body]");
  const headersEl = card.querySelector("[data-headers]");

  if (ep.perm !== "public" && !store.isAuthenticated) {
    toast("No autenticado", "Inicia sesión primero en la sección Autenticación.", "warn");
    return;
  }

  let built;
  try { built = ep.build(values); }
  catch (e) { toast("Formulario inválido", String(e), "error"); return; }
  const path = built.path || ep.path;
  const body = built.body;

  form.classList.add("is-loading");
  const submit = form.querySelector('button[type="submit"]');
  const original = submit.textContent;
  submit.disabled = true;
  submit.innerHTML = '<span class="spinner"></span> Enviando…';

  let res;
  try {
    if (ep.special === "login") res = await authLogin(values.username, values.password);
    else if (ep.special === "register") res = await authRegister(body);
    else if (ep.special === "refresh") res = await authRefresh(values.refreshToken);
    else if (ep.special === "logout") res = await authLogout(values.refreshToken);
    else if (ep.special === "me") res = await authMe();
    else res = await request(ep.method, path, { body, auth: ep.perm !== "public" });
  } catch (e) {
    res = { ok: false, status: e.status || 0, body: e.body || { error: e.message }, headers: {}, ms: 0 };
    if (e.status === 401) toast("Sesión caducada", "Inicia sesión de nuevo.", "warn");
  } finally {
    form.classList.remove("is-loading");
    submit.disabled = false;
    submit.textContent = original;
  }

  responseBox.hidden = false;
  statusEl.textContent = res.status ? `${res.status}` : "ERR";
  statusEl.className = `status ${statusClass(res.status)}`;
  timeEl.textContent = res.ms ? `${res.ms} ms` : "";
  bodyEl.innerHTML = syntaxHighlight(res.body);
  headersEl.textContent = Object.entries(res.headers).map(([k, v]) => `${k}: ${v}`).join("\n");

  // Notificaciones
  if (res.ok) {
    if (ep.special === "login" || ep.special === "register") toast("Sesión guardada", "Token almacenado en el navegador.", "success");
  } else if (res.status === 401 && !ep.special) {
    toast("401 No autorizado", "Token ausente, inválido o expirado.", "error");
  } else if (res.status === 403) {
    toast("403 Prohibido", "Tu rol no permite esta operación.", "error");
  } else if (res.status === 429) {
    toast("429 Demasiadas peticiones", "Rate limit de Kong activo.", "warn");
  }

  // Historial
  addHistory({
    time: new Date().toISOString(),
    method: ep.method, path, status: res.status, ms: res.ms,
    request: body, response: res.body, headers: res.headers,
  });

  responseBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderSection(key) {
  if (key === "intro") return renderIntro();
  if (key === "jwt") return renderJwtInspector();
  if (key === "history") return renderHistory();
  if (key === "help") return renderHelp();
  if (key === "docs") return renderDocs();

  const sec = SECTIONS[key];
  if (!sec) return;
  content.innerHTML = "";
  content.appendChild(el("div", {}, [
    el("div", { class: "section__title" }, [
      el("h2", {}, sec.title),
      el("p", {}, `${sec.endpoints.length} endpoints`),
    ]),
    el("p", { class: "section__lead", html: sec.lead }),
    el("div", { class: "grid" }, sec.endpoints.map(renderEndpointCard)),
  ]));
}

const DOCS_SERVICES = [
  { id: "usuarios", title: "Servicio de Usuarios", desc: "Auth, personas, usuarios y roles (Spring Boot + springdoc-openapi).", stack: "Spring Boot 4.1" },
  { id: "zonas", title: "Servicio de Zonas y Espacios", desc: "Zonas de parking y sus espacios (Spring Boot + springdoc-openapi).", stack: "Spring Boot 4.0" },
  { id: "vehiculos", title: "Servicio de Vehículos", desc: "Vehículos por dueño (NestJS + @nestjs/swagger).", stack: "NestJS 11" },
  { id: "tickets", title: "Servicio de Tickets", desc: "Emisión, pago y cancelación de tickets de parqueadero (NestJS + @nestjs/swagger).", stack: "NestJS 11" },
];

async function checkDocsHealth() {
  const results = await Promise.all(DOCS_SERVICES.map(async (s) => {
    const url = `${store.baseUrl}/${s.id}/v3/api-docs`;
    try {
      const res = await fetch(url, { method: "GET" });
      return { id: s.id, ok: res.ok, status: res.status };
    } catch (e) {
      return { id: s.id, ok: false, status: 0, error: e.message };
    }
  }));
  return Object.fromEntries(results.map((r) => [r.id, r]));
}

function renderDocs() {
  content.innerHTML = "";
  const wrap = el("div", {}, [
    el("div", { class: "section__title" }, [
      el("h2", {}, "Documentación API"),
      el("p", {}, "Swagger UI y OpenAPI de cada servicio, expuesto por Kong"),
    ]),
    el("p", { class: "section__lead" },
      "Cada servicio publica su propio Swagger UI. Kong los enruta bajo el prefijo del servicio. " +
      "Pega tu access token en el botón Authorize para probar las rutas protegidas."),

    el("div", { class: "card", style: "margin: 12px 0;" }, [
      el("h3", {}, "Estado en tiempo real"),
      el("div", { id: "docsHealth" }, [el("p", { style: "color: var(--text-muted);" }, "Comprobando…")]),
      el("div", { class: "card__actions" }, [
        el("button", { class: "btn btn--ghost", onclick: () => renderDocs() }, "Reintentar"),
      ]),
    ]),

    el("div", { class: "grid", id: "docsGrid" },
      DOCS_SERVICES.map((s) => el("div", { class: "card", dataset: { docService: s.id } }, [
        el("div", { class: "card__head" }, [
          el("span", { class: "method", "data-m": "GET" }, "DOCS"),
          el("code", { class: "path" }, `/${s.id}`),
        ]),
        el("p", { class: "card__desc" }, s.desc),
        el("p", { style: "color: var(--text-muted); font-size: 12px; margin: 4px 0 8px;" }, s.stack),
        el("div", { class: "card__actions" }, [
          el("a", { class: "btn btn--primary", href: `${store.baseUrl}/${s.id}/swagger-ui/index.html`, target: "_blank", rel: "noopener" }, "Abrir Swagger UI"),
          el("a", { class: "btn btn--ghost", href: `${store.baseUrl}/${s.id}/v3/api-docs`, target: "_blank", rel: "noopener" }, "Ver OpenAPI (JSON)"),
        ]),
      ]))
    ),

    el("div", { class: "card", style: "margin-top: 14px;" }, [
      el("h3", {}, "Cómo se enruta"),
      el("p", { style: "color: var(--text-muted); font-size: 13px;" },
        "Cada servicio se monta en Kong bajo un prefijo. strip_path quita el prefijo y reenvía " +
        "la ruta original (/v3/api-docs, /swagger-ui/...) al backend. No requieren JWT."),
      el("ul", { style: "font-family: var(--mono); font-size: 12px; color: var(--text-muted);" }, [
        el("li", {}, "GET /usuarios/swagger-ui/index.html  → UI Spring Boot (usuarios)"),
        el("li", {}, "GET /usuarios/v3/api-docs           → spec usuarios"),
        el("li", {}, "GET /zonas/swagger-ui/index.html     → UI Spring Boot (zonas)"),
        el("li", {}, "GET /zonas/v3/api-docs               → spec zonas"),
        el("li", {}, "GET /vehiculos/swagger-ui            → UI NestJS (vehículos)"),
        el("li", {}, "GET /vehiculos/v3/api-docs           → spec vehículos"),
        el("li", {}, "GET /tickets/swagger-ui              → UI NestJS (tickets)"),
        el("li", {}, "GET /tickets/v3/api-docs             → spec tickets"),
      ]),
    ]),
  ]);
  content.appendChild(wrap);

  checkDocsHealth().then((status) => {
    const box = $("#docsHealth");
    if (!box) return;
    box.innerHTML = "";
    DOCS_SERVICES.forEach((s) => {
      const st = status[s.id];
      const cls = st?.ok ? "is-2xx" : "is-err";
      const text = st?.ok ? `OK · ${st.status}` : `No disponible (${st?.status || "ERR"})`;
      box.appendChild(el("div", { class: "jwt__claim" }, [
        el("span", { class: "k" }, `${s.title}`),
        el("span", { class: `status ${cls}` }, text),
      ]));
    });
  });
}

function renderJwtInspector() {
  content.innerHTML = "";
  const access = store.accessToken;
  const decoded = access ? decodeJwt(access) : null;
  const claims = decoded?.payload || null;

  const card = el("div", { class: "card" }, [
    el("div", { class: "card__head" }, [
      el("span", { class: "method", "data-m": "GET" }, "JWT"),
      el("code", { class: "path" }, "access token (inspección local)"),
    ]),
    el("p", { class: "card__desc" }, "Decodifica el access token actual. La firma NO se verifica aquí, sólo se inspecciona el contenido."),
  ]);

  if (!access) {
    card.appendChild(el("p", { style: "color: var(--text-muted);" }, "No hay access token. Inicia sesión en Autenticación."));
  } else {
    card.appendChild(el("div", { class: "jwt" }, [
      el("div", { class: "jwt__raw field" }, [
        el("span", {}, "Token crudo"),
        (() => { const ta = el("textarea", { readonly: "", rows: "4" }); ta.value = access; return ta; })(),
      ]),
      el("div", { class: "jwt__grid" }, [
        el("div", { class: "jwt__panel" }, [
          el("h3", {}, "Header"),
          el("pre", { class: "code code--sm" }, prettyJson(decoded.header)),
        ]),
        el("div", { class: "jwt__panel" }, [
          el("h3", {}, "Payload"),
          el("pre", { class: "code code--sm code--json", html: syntaxHighlight(claims) }),
        ]),
        el("div", { class: "jwt__panel" }, [
          el("h3", {}, "Claims clave"),
          el("div", { class: "jwt__claims" }, [
            claimRow("sub", claims?.sub),
            claimRow("username", claims?.username),
            claimRow("roles", claims?.roles ? JSON.stringify(claims.roles) : null),
            claimRow("iss", claims?.iss),
            claimRow("aud", claims?.aud),
            claimRow("jti", claims?.jti),
            claimRow("iat", claims?.iat ? new Date(claims.iat * 1000).toLocaleString() : null),
            claimRow("exp", claims?.exp ? new Date(claims.exp * 1000).toLocaleString() : null),
          ]),
        ]),
        el("div", { class: "jwt__panel" }, [
          el("h3", {}, "Estado"),
          el("div", { class: "jwt__claims" }, [
            claimRow("Expira en", formatExpiresIn(claims)),
            claimRow("Expirado", isExpired(claims, 0) ? "Sí" : "No"),
            claimRow("Refresh token", store.refreshToken ? "guardado" : "—"),
          ]),
        ]),
      ]),
      el("div", { class: "card__actions" }, [
        el("button", { class: "btn btn--ghost", onclick: () => {
          navigator.clipboard.writeText(access); toast("Token copiado", "", "success", 2000);
        }}, "Copiar token"),
        el("button", { class: "btn btn--ghost", onclick: async () => {
          if (!store.refreshToken) return toast("Sin refresh", "No hay refresh token.", "warn");
          const res = await authRefresh(store.refreshToken);
          toast(res.ok ? "Token renovado" : "Error", res.ok ? "Nuevo access token guardado." : "Reinicia sesión.", res.ok ? "success" : "error");
          renderJwtInspector();
        }}, "Renovar ahora"),
      ]),
    ]));
  }
  content.appendChild(card);
}

function claimRow(key, value) {
  return el("div", { class: "jwt__claim" }, [
    el("span", { class: "k" }, key),
    el("span", { class: "v" }, value == null ? "—" : String(value)),
  ]);
}

function addHistory(entry) {
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
  if (currentSection === "history") renderHistory();
}

let currentSection = "intro";
function renderHistory() {
  content.innerHTML = "";
  content.appendChild(el("div", {}, [
    el("div", { class: "section__title" }, [
      el("h2", {}, "Historial"),
      el("p", {}, `${history.length} peticiones en esta sesión`),
    ]),
    el("p", { class: "section__lead" }, "Las últimas peticiones realizadas desde el cliente. Click para ver detalles."),
    el("div", { class: "history" },
      history.length === 0
        ? [el("div", { class: "history__empty" }, "Aún no has hecho peticiones.")]
        : history.map((h) => el("div", { class: "history__item", onclick: () => showHistoryDetail(h) }, [
            el("div", { class: "history__item-head" }, [
              el("span", { class: "method", "data-m": methodToColor(h.method), style: "font-size: 10px;" }, h.method),
              el("code", { class: "path", style: "font-size: 12px;" }, h.path),
              el("span", { class: `status ${statusClass(h.status)}` }, h.status || "ERR"),
              el("span", { class: "history__item-time" }, new Date(h.time).toLocaleTimeString()),
            ]),
          ]))
    ),
  ]));
}

function showHistoryDetail(h) {
  const card = el("div", { class: "card", style: "margin-top: 14px;" }, [
    el("div", { class: "card__head" }, [
      el("span", { class: "method", "data-m": methodToColor(h.method) }, h.method),
      el("code", { class: "path" }, h.path),
      el("span", { class: `status ${statusClass(h.status)}` }, h.status || "ERR"),
      el("span", { class: "time" }, `${h.ms} ms · ${new Date(h.time).toLocaleString()}`),
    ]),
    el("div", {}, [
      el("h4", { style: "margin: 8px 0 4px;" }, "Request body"),
      el("pre", { class: "code code--sm code--json", html: syntaxHighlight(h.request) || "—" }),
      el("h4", { style: "margin: 12px 0 4px;" }, "Response body"),
      el("pre", { class: "code code--sm code--json", html: syntaxHighlight(h.response) }),
    ]),
  ]);
  content.appendChild(card);
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderHelp() {
  content.innerHTML = "";
  content.appendChild(el("div", {}, [
    el("div", { class: "section__title" }, [
      el("h2", {}, "Ayuda"),
      el("p", {}, "Cómo funciona el cliente y qué esperar de cada error"),
    ]),
    el("div", { class: "grid" }, [
      el("div", { class: "card" }, [
        el("h3", {}, "¿De dónde salen los endpoints?"),
        el("p", { style: "color: var(--text-muted);" },
          "Están definidos en js/endpoints.js a partir de los controladores de los tres servicios. Cada tarjeta reproduce exactamente un endpoint de Kong."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Hay documentación OpenAPI?"),
        el("p", { style: "color: var(--text-muted);" },
          "Sí. Cada servicio expone su Swagger UI por Kong. Abre la sección <strong>Documentación API</strong> en la barra lateral. " +
          "Los UIs viven en /usuarios/swagger-ui, /zonas/swagger-ui y /vehiculos/swagger-ui."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Dónde se guarda mi token?"),
        el("p", { style: "color: var(--text-muted);" },
          "En localStorage del navegador (claves gw_access_token y gw_refresh_token). El cliente lo añade automáticamente a Authorization: Bearer."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Qué pasa cuando el access token expira?"),
        el("p", { style: "color: var(--text-muted);" },
          "Si falta menos de 1 minuto o el backend responde 401, el cliente llama a /auth/refresh y reintenta la petición original una vez."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Por qué veo 429?"),
        el("p", { style: "color: var(--text-muted);" },
          "Kong aplica rate limiting: login 10/min, registro 5/hora, refresh 30/min y rutas autenticadas 100/min por consumidor. Espera un minuto y vuelve."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Por qué veo 401 desde Kong?"),
        el("p", { style: "color: var(--text-muted);" },
          "El plugin JWT de Kong valida firma, emisor y expiración antes de llegar al backend. Si el token no es del issuer correcto o está expirado, lo bloquea."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Por qué veo 403 desde el backend?"),
        el("p", { style: "color: var(--text-muted);" },
          "El token pasó Kong pero el backend decidió que tu rol no permite esa operación. Revisa los permisos en la tabla de rutas."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Cómo pruebo como ADMIN y como CLIENTE?"),
        el("p", { style: "color: var(--text-muted);" },
          "Inicia sesión con admin (ADMIN) y prueba. Luego regístrate o haz login con un CLIENTE para ver los 403."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Puedo cambiar la URL de Kong?"),
        el("p", { style: "color: var(--text-muted);" },
          "Sí. Arriba a la derecha está el campo URL base. Se guarda en localStorage."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿El cliente envía el ownerId en vehículos?"),
        el("p", { style: "color: var(--text-muted);" },
          "No. El backend toma ownerId del claim sub del JWT. Aunque lo envíes en el body, el servicio lo ignora."),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, "¿Cómo levantar el cliente?"),
        el("p", { style: "color: var(--text-muted);" }, "node web/serve.js y abre http://localhost:9000. O usa cualquier servidor estático. Recuerda añadir el origen a CORS_ORIGINS del .env y recrear Kong."),
      ]),
    ]),
  ]));
}

// ---------- Session UI ----------
function renderSessionBox() {
  const box = $("#sessionBox");
  if (!store.isAuthenticated) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const claims = store.claims;
  $("#sessionUser").textContent = claims?.username || "—";
  $("#sessionRoles").textContent = claims?.roles ? `[${claims.roles.join(", ")}]` : "—";
  $("#sessionExpires").textContent = `expira en ${formatExpiresIn(claims)}`;
  const dot = $("#sessionDot");
  dot.classList.remove("is-expiring", "is-expired");
  if (isExpired(claims, 0)) dot.classList.add("is-expired");
  else if (store.willExpireSoon) dot.classList.add("is-expiring");
}

function handleSessionChange() {
  renderSessionBox();
  syncStoreBackedFields();
}

function tickSession() {
  if (store.isAuthenticated) renderSessionBox();
}

// ---------- Navigation ----------
function setActiveSection(key) {
  currentSection = key;
  $$(".sidebar__link").forEach((b) => b.classList.toggle("is-active", b.dataset.section === key));
  renderSection(key);
}

// ---------- Init ----------
function initTheme() {
  const saved = localStorage.getItem("gw_theme") || "dark";
  document.documentElement.dataset.theme = saved;
}

function init() {
  initTheme();
  const baseUrlInput = $("#baseUrl");
  baseUrlInput.value = store.baseUrl;
  baseUrlInput.addEventListener("change", () => {
    store.baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
    baseUrlInput.value = store.baseUrl;
    toast("URL base actualizada", store.baseUrl, "info", 2000);
  });

  $("#themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = cur;
    localStorage.setItem("gw_theme", cur);
  });

  $("#logoutBtn").addEventListener("click", async () => {
    if (store.refreshToken) {
      try { await authLogout(store.refreshToken); } catch { /* ignore */ }
    } else {
      clearSession();
    }
    toast("Sesión cerrada", "", "info");
  });

  $$(".sidebar__link").forEach((btn) => {
    btn.addEventListener("click", () => setActiveSection(btn.dataset.section));
  });

  onSessionChange(handleSessionChange);
  renderSessionBox();
  setInterval(tickSession, 1000);

  setActiveSection("intro");
}

document.addEventListener("DOMContentLoaded", init);
