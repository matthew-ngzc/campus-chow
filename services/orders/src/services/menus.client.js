import axios from 'axios';

const BASE_URL = process.env.MENU_URL;
//const TOKEN = process.env.SERVICE_TOKEN;
const TIMEOUT_MS = Number(process.env.HTTP_TIMEOUT_MS || 5000);

const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    //...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  },
});

// --- simple retry helper (for 5xx or network errors) ---
// async function retry(fn, { retries = 2, baseDelay = 200 } = {}) {
//   for (let attempt = 0; attempt <= retries; attempt++) {
//     try {
//       return await fn();
//     } catch (err) {
//       const retryable =
//         err.code === 'ECONNABORTED' ||
//         (err.response && err.response.status >= 500);
//       if (!retryable || attempt === retries) throw err;
//       const delay = baseDelay * 2 ** attempt;
//       await new Promise(r => setTimeout(r, delay));
//     }
//   }
// }

/**
 * Fetch latest prices for a batch of item IDs under a merchant.
 * Returns a map keyed by itemId for easy lookup.
 *
 * @param {string} merchantId
 * @param {number[]} itemIds
 * @returns {Promise<Map<number,{ name: string, priceCents: number, available?: boolean }>>}
 */
export async function fetchMenuItemDetails(merchantId, itemIds) {
  if (!BASE_URL) throw new Error('MENU_URL is not set');
  if (!merchantId) throw Object.assign(new Error('merchantId is required'), { status: 400 });
  if (!Array.isArray(itemIds) || itemIds.length === 0) return new Map();

  // const doRequest = async () => {
  //   const { data } = await client.get(`/api/merchants/${merchantId}/menu/items`, { itemIds });
  //   const map = new Map();
  //   for (const it of data.items || []) {
  //     map.set(it.itemId, {
  //       name: it.name,
  //       priceCents: it.priceCents,
  //       available: it.available,
  //     });
  //   }
  //   return map;
  // };
  const body = { "itemIds": itemIds };
  console.log("body in menu.client:", body);
  try {
    const {data}  = await client.post(`/api/merchants/${merchantId}/menu/items`, body);
    console.log("data in menu.client:", data);
      const map = new Map();
    for (const it of data.items) {
      map.set(it.itemId, {
        name: it.name,
        priceCents: it.priceCents,
        available: it.available,
      });
    }
  return map;
  } catch (error) {
    console.error("[menu client] fetch failed", error.message);

    const e = new Error('Failed to fetch menu item details from menu microservice');
    e.status = error?.response?.status ?? 502;
    e.code = 'MENU_SERVICE_ERROR';
    e.details = {
      networkCode: error?.code,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data ?? null,
      message: error?.message,
    };
    throw e;
  }
  //return retry(doRequest);
}
