// src/services/authService.js
import http from "./http";

export async function login(email, password) {
  const { data } = await http.post("/api/user/auth/login", { email, password });
  // { jwt_token, user_id, name, coins, profile_picture }
  localStorage.setItem("jwt_token", data.jwt_token);
  localStorage.setItem("user_id", String(data.user_id));
  localStorage.setItem("user_name", data.name ?? "");
  return data;
}

export async function register(email, password, name) {
  const { data } = await http.post("/api/user/auth/register", { email, password, name });
  return data;
}

export async function me() {
  const { data } = await http.get("/api/users/me"); // protected (Kong JWT)
  return data;
}
