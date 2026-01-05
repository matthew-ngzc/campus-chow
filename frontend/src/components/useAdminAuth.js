// src/components/useAdminAuth.js
import { ref } from "vue";
import http from "@/services/http";

const admin = ref(null);

export function useAdminAuth() {
  async function loadAdminMe() {
    const { data } = await http.get("/api/admin/me");
    admin.value = data;

    localStorage.setItem("user_name", data?.name ?? "admin");
    localStorage.setItem("user_role", "ADMIN");
    if (data?.profile_picture) {
      localStorage.setItem("user_profile_picture", data.profile_picture);
    } else {
      localStorage.removeItem("user_profile_picture");
    }
  }

  function logout() {
    admin.value = null;
    ["jwt_token","user_id","user_name","user_role","user_profile_picture"].forEach(localStorage.removeItem.bind(localStorage));
    sessionStorage.setItem("justLoggedOut", "true");
    window.location.href = "/login";
  }

  return { admin, loadAdminMe, logout };
}
