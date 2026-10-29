const form = document.getElementById('deletion-request-form');
const status = document.getElementById('deletion-status');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('deletion-email').value.trim();
  const phone = document.getElementById('deletion-phone').value.trim();
  const note = document.getElementById('deletion-note').value.trim();
  if (!email && !phone) {
    status.dataset.state = 'error';
    status.textContent = 'Enter the email address or phone number used for the account.';
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.dataset.state = '';
  status.textContent = 'Submitting your request…';

  // Resolve the API base: use the data attribute if it looks like a real URL,
  // otherwise fall back to the same origin (works when API and site share a host).
  const apiBase = (form.dataset.apiBase || '').replace(/\/+$/, '');
  const endpoint = form.dataset.apiEndpoint || '/v1/account-deletion-requests';
  const url = apiBase.startsWith('http')
    ? `${apiBase}${endpoint}`
    : endpoint;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: email || undefined,
        phone: phone || undefined,
        note: note || undefined,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        payload?.error?.message ||
          'The request could not be submitted. Email support@nourish.app instead.',
      );
    }
    status.dataset.state = 'success';
    status.textContent = `Request received. Reference: ${payload.requestId}`;
    form.reset();
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent =
      error instanceof Error
        ? error.message
        : 'The request could not be submitted. Email support@nourish.app instead.';
  } finally {
    button.disabled = false;
  }
});
