package com.smunch.admin;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerMvcTest {

  @Autowired MockMvc mvc;

  @MockitoBean AuthService auth;

  @Test
  void register_201() throws Exception {
    String body = "{\"email\":\"a@smu.sg\",\"password\":\"secret123\"}";

    mvc.perform(post("/api/admin/auth/register")
        .contentType(MediaType.APPLICATION_JSON)
        .content(body))
      .andExpect(status().isCreated());
  }

  @Test
  void login_returns_token() throws Exception {
    Mockito.when(auth.login(anyString(), anyString())).thenReturn("jwt-token");

    String body = "{\"email\":\"a@smu.sg\",\"password\":\"secret123\"}";

    mvc.perform(post("/api/admin/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(body))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.accessToken").value("jwt-token"));
  }
}

