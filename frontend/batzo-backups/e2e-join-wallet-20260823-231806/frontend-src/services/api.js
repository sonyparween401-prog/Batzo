const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_CRICKET_API_URL ||
  "";

export async function apiGet(path) {
  if (!API) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(
    API.replace(/\/$/, "") + "/" + String(path).replace(/^\//, "")
  );

  if (!response.ok) {
    throw new Error("API error " + response.status);
  }

  return response.json();
}
