// useAuth.js (or .ts)
import { ref } from "vue";
import http from "@/services/http";

const user = ref(null);

export function useAuth() {
  async function loadMe() {
    const role = (localStorage.getItem("user_role") || "USER").toUpperCase();
    
    try {
      // ✅ NEW: Handle ADMIN separately
      if (role === "ADMIN") {
        const token = localStorage.getItem("jwt_token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          user.value = { name: payload.email?.split("@")[0] || "admin", role };
        }
        return;
      }
      
      // ✅ NEW: Handle MERCHANT separately
      if (role === "MERCHANT") {
        const merchantName = localStorage.getItem("merchant_name") || "Merchant";
        user.value = { name: merchantName, role };
        return;
      }
      
      // USER: Call the API
      const { data } = await http.get("/api/users/me");
      user.value = data;

      // keep localStorage in sync for first paint + non-reactive reads
      localStorage.setItem("user_name", data?.name ?? "");
      localStorage.setItem("user_role", (data?.role ?? "USER").toUpperCase());
      localStorage.setItem("user_coins", String(data?.coins ?? 0));

      //cache avatar url
      if (data?.profile_picture) {
        localStorage.setItem("user_profile_picture", data.profile_picture);
      } else {
        localStorage.removeItem("user_profile_picture");
      }

      // notify listeners
      window.dispatchEvent(
        new CustomEvent("session-updated", {
          detail: {
            coins: Number(data?.coins ?? 0),
            profile_picture: data?.profile_picture || null,
          },
        })
      );
    } catch (e) {
      // if token is bad/expired, clean up
      if (e?.response?.status === 401) {
        clearSession();
      }
      user.value = null;
    }
  }

  function clearSession() {
    user.value = null;
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_coins");
    localStorage.removeItem("user_profile_picture");
    
    // ✅ CRITICAL FIX: Clear merchant auth data
    localStorage.removeItem("merchant_id");
    localStorage.removeItem("merchant_email");
    localStorage.removeItem("merchant_name");
  }

  function logout() {
    clearSession();
    sessionStorage.setItem("justLoggedOut", "true");
    window.location.href = "/login";
  }

  return { user, loadMe, logout };
}