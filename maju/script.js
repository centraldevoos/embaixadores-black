const FREE_GROUP_CONFIG = {
  trackingParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'tintim_fbid', 'fbclid']
};

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
    });
  });
}

setupFreeGroupCtas();