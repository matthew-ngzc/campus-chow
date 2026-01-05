import http from "@/services/http";

export async function getMerchantName(merchantId) {
  try {
    const { data } = await http.get(`/api/merchants/${merchantId}`);
    return data.name;
  } catch (err) {
    console.error("Failed to fetch merchant name:", err);
    return `Merchant #${merchantId}`;
  }
}