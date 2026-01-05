package com.smunch.admin;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerMvcTest {

  @Autowired MockMvc mvc;

  @MockitoBean AdminAccountRepo repo;
  @MockitoBean PasswordEncoder encoder;

  @AfterEach
  void clearSec() {
    SecurityContextHolder.clearContext();
  }

  private void actAs(String email) {
    var auth = new UsernamePasswordAuthenticationToken(email, null, null);
    SecurityContextHolder.getContext().setAuthentication(auth);
  }

  @Test
  void me_returns_basic_profile() throws Exception {
    actAs("alice@smu.sg");

    mvc.perform(get("/api/admin/me"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.email").value("alice@smu.sg"))
      .andExpect(jsonPath("$.name").value("alice"))
      .andExpect(jsonPath("$.role").value("ADMIN"));
  }

  @Test
  void updateEmail_happy_path() throws Exception {
    actAs("alice@smu.sg");

    var acc = new AdminAccount();
    acc.setId(1L);
    acc.setEmail("alice@smu.sg");
    acc.setPasswordHash("$2a$hash");

    Mockito.when(repo.findByEmail("alice@smu.sg")).thenReturn(Optional.of(acc));
    Mockito.when(encoder.matches("oldpass", "$2a$hash")).thenReturn(true);
    Mockito.when(repo.existsByEmail("new@smu.sg")).thenReturn(false);
    Mockito.when(repo.save(any(AdminAccount.class))).thenAnswer(i -> i.getArgument(0));

    String body = "{\"currentPassword\":\"oldpass\",\"newEmail\":\"new@smu.sg\"}";

    mvc.perform(patch("/api/admin/account/email")
        .contentType(MediaType.APPLICATION_JSON)
        .content(body))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.email").value("new@smu.sg"))
      .andExpect(jsonPath("$.message", containsString("please sign in again")));
  }

  @Test
  void updateEmail_wrongPassword_401() throws Exception {
    actAs("alice@smu.sg");

    var acc = new AdminAccount();
    acc.setEmail("alice@smu.sg");
    acc.setPasswordHash("$2a$hash");

    Mockito.when(repo.findByEmail("alice@smu.sg")).thenReturn(Optional.of(acc));
    Mockito.when(encoder.matches("bad", "$2a$hash")).thenReturn(false);

    String body = "{\"currentPassword\":\"bad\",\"newEmail\":\"x@smu.sg\"}";

    mvc.perform(patch("/api/admin/account/email")
        .contentType(MediaType.APPLICATION_JSON)
        .content(body))
      .andExpect(status().isUnauthorized());
  }

  @Test
  void updatePassword_happy_path() throws Exception {
    actAs("alice@smu.sg");

    var acc = new AdminAccount();
    acc.setEmail("alice@smu.sg");
    acc.setPasswordHash("$2a$old");

    Mockito.when(repo.findByEmail("alice@smu.sg")).thenReturn(Optional.of(acc));
    Mockito.when(encoder.matches("oldpass", "$2a$old")).thenReturn(true);
    Mockito.when(encoder.matches("newpass123", "$2a$old")).thenReturn(false);
    Mockito.when(encoder.encode("newpass123")).thenReturn("$2a$new");

    String body = "{\"currentPassword\":\"oldpass\",\"newPassword\":\"newpass123\"}";

    mvc.perform(patch("/api/admin/account/password")
        .contentType(MediaType.APPLICATION_JSON)
        .content(body))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.message").value("password updated"));

    Mockito.verify(repo).save(any(AdminAccount.class));
  }

  @Test
  void updatePassword_sameAsOld_400() throws Exception {
    actAs("alice@smu.sg");

    var acc = new AdminAccount();
    acc.setEmail("alice@smu.sg");
    acc.setPasswordHash("$2a$old");

    Mockito.when(repo.findByEmail("alice@smu.sg")).thenReturn(Optional.of(acc));
    Mockito.when(encoder.matches("oldpass", "$2a$old")).thenReturn(true);
    Mockito.when(encoder.matches("oldpass", "$2a$old")).thenReturn(true); // same as old

    String body = "{\"currentPassword\":\"oldpass\",\"newPassword\":\"oldpass\"}";

    mvc.perform(patch("/api/admin/account/password")
        .contentType(MediaType.APPLICATION_JSON)
        .content(body))
      .andExpect(status().isBadRequest());
  }
}

