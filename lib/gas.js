const GAS_API_URL = process.env.GAS_API_URL;
const API_SECRET = process.env.API_SECRET;

export async function callGasApi(payload) {
  if (!GAS_API_URL || !API_SECRET) {
    return {
      success: false,
      message: "Missing GAS_API_URL or API_SECRET in environment variables.",
    };
  }

  const response = await fetch(GAS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      ...payload,
      secret: API_SECRET,
    }),
    cache: "no-store",
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: "Invalid response from Google Apps Script.",
      raw: text,
    };
  }
}
