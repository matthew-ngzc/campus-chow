package com.smunch.admin;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = HealthController.class)
@AutoConfigureMockMvc(addFilters = false)
class HealthControllerMvcTest {

  @Autowired MockMvc mvc;

  @Test
  void health_ok() throws Exception {
    mvc.perform(get("/api/admin/health"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status", is("ok")))
      .andExpect(jsonPath("$.service", is("admin")));
  }
}

