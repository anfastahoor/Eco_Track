export async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  let body;

  try {
    body = await response.json();
  } catch {
    throw new Error(`Server returned an invalid response (${response.status}).`);
  }

  if (!body || typeof body !== "object") {
    throw new Error(`Server returned an invalid response (${response.status}).`);
  }

  if (!response.ok || body.success === false) {
    throw new Error(body.error || `Request failed (${response.status}).`);
  }

  return body;
}