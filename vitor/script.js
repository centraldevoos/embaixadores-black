const FREE_GROUP_CONFIG = {
  trackingParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'tintim_fbid', 'fbclid']
};

// Somente métricas da página Black Vitor. Não muda o destino, a mensagem ou o fluxo do ManyChat.
const BLACK_VITOR_EVENTS_URL = 'https://vip.centraldevoos.com/api/black-vitor/event';
function blackVitorSource() {
  const medium = new URLSearchParams(window.location.search).get('utm_medium');
  return medium === 'reels' || medium === 'facebook' ? medium : 'other';
}

function blackVitorNewId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  if (!crypto.getRandomValues) return null;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function blackVitorSession() {
  try {
    const key = 'cdv_black_vitor_session';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = blackVitorNewId();
      if (!id) return null;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    if (!window.__blackVitorSession) window.__blackVitorSession = blackVitorNewId();
    return window.__blackVitorSession || null;
  }
}

function trackBlackVitor(event) {
  const sessionId = blackVitorSession();
  if (!sessionId) return;
  const payload = JSON.stringify({ sessionId, source: blackVitorSource(), event });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(BLACK_VITOR_EVENTS_URL, payload)) return;
    fetch(BLACK_VITOR_EVENTS_URL, { method: 'POST', mode: 'no-cors', keepalive: true,
      headers: { 'Content-Type': 'text/plain' }, body: payload }).catch(() => {});
  } catch { /* Medição nunca impede a pessoa de entrar no grupo. */ }
}

function veioDeTrafegoPago() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.has('fbclid') ||
    params.get('utm_source') === 'facebook' ||
    params.get('utm_source') === 'instagram'
  );
}

function dispararLeadSeElegivel() {
  if (veioDeTrafegoPago() && typeof fbq !== 'undefined') {
    fbq('track', 'Lead');
  }
}

function buildTrackedUrl(baseUrl) {
  const urlParams = new URLSearchParams(window.location.search);
  const trackedParams = new URLSearchParams();
  FREE_GROUP_CONFIG.trackingParams.forEach((param) => {
    const value = urlParams.get(param);
    if (value) trackedParams.set(param, value);
  });
  const query = trackedParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

function setupFreeGroupCtas() {
  document.querySelectorAll('[data-free-group-cta]').forEach((button) => {
    const baseUrl = button.getAttribute('href');
    if (!baseUrl) return;

    const finalUrl = buildTrackedUrl(baseUrl);
    button.setAttribute('href', finalUrl);

    button.addEventListener('click', () => {
      dispararLeadSeElegivel();
      trackBlackVitor('group_click');
    });
  });
}

setupFreeGroupCtas();
trackBlackVitor('page_view');
