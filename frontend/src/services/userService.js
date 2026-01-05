import http from "@/services/http";

/**
 * Fetch user details by email
 * @param {string} email - user’s email address
 * @returns {Promise<string>} user’s full name or a fallback string
 */
export async function getUserNameByEmail(email) {
  if (!email) return "Unknown User";

  try {
    const { data } = await http.get(`/api/users/${encodeURIComponent(email)}`);
    return data?.name || "Unnamed User";
  } catch (err) {
    console.error(`Failed to fetch user name for email ${email}:`, err);
    return "Unknown User";
  }
}
