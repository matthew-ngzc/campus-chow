package com.example.controller;

import com.example.dto.CreateMerchantRequest;
import com.example.dto.UpdateMerchantRequest;
import com.example.model.Merchant;
import com.example.repository.MerchantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
@DisplayName("MerchantController Integration Tests")
class MerchantControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MerchantRepository merchantRepository;

    private Merchant parentMerchant;
    private Merchant childMerchant;

    @BeforeEach
    void setUp() {
        merchantRepository.deleteAll();
        
        // Create parent merchant
        parentMerchant = Merchant.builder()
                .name("Parent Merchant")
                .email("parent@example.com")
                .location("Singapore")
                .contactNumber("12345678")
                .imageUrl("http://example.com/parent.jpg")
                .payoutFrequency("Monthly")
                .build();
        parentMerchant = merchantRepository.save(parentMerchant);

        // Create child merchant
        childMerchant = Merchant.builder()
                .name("Child Merchant")
                .email("child@example.com")
                .location("Singapore")
                .contactNumber("87654321")
                .imageUrl("http://example.com/child.jpg")
                .payoutFrequency("Weekly")
                .parentMerchant(parentMerchant)
                .build();
        childMerchant = merchantRepository.save(childMerchant);
    }

    @Test
    @DisplayName("Should return all merchants when no query params")
    void getAllMerchants_NoParams_ReturnsAll() throws Exception {
        mockMvc.perform(get("/api/merchants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Parent Merchant")))
                .andExpect(jsonPath("$[1].name", is("Child Merchant")));
    }

    @Test
    @DisplayName("Should return top-level merchants when parentId=null")
    void getAllMerchants_ParentIdNull_ReturnsTopLevel() throws Exception {
        mockMvc.perform(get("/api/merchants")
                        .param("parentId", "null"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Parent Merchant")))
                .andExpect(jsonPath("$[0].parentMerchantId").doesNotExist());
    }

    @Test
    @DisplayName("Should return children when parentId is specified")
    void getAllMerchants_WithParentId_ReturnsChildren() throws Exception {
        mockMvc.perform(get("/api/merchants")
                        .param("parentId", parentMerchant.getMerchantId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Child Merchant")))
                .andExpect(jsonPath("$[0].parentMerchantId", is(parentMerchant.getMerchantId().intValue())));
    }

    @Test
    @DisplayName("Should return empty list when parent has no children")
    void getAllMerchants_ParentWithNoChildren_ReturnsEmpty() throws Exception {
        mockMvc.perform(get("/api/merchants")
                        .param("parentId", childMerchant.getMerchantId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Should return 400 when parentId is invalid")
    void getAllMerchants_InvalidParentId_Returns400() throws Exception {
        mockMvc.perform(get("/api/merchants")
                        .param("parentId", "invalid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should get merchant by ID successfully")
    void getMerchant_ValidId_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/merchants/{id}", parentMerchant.getMerchantId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.merchantId", is(parentMerchant.getMerchantId().intValue())))
                .andExpect(jsonPath("$.name", is("Parent Merchant")))
                .andExpect(jsonPath("$.email", is("parent@example.com")))
                .andExpect(jsonPath("$.hasChildren", is(true)));
    }

    @Test
    @DisplayName("Should return 404 when merchant ID not found")
    void getMerchant_InvalidId_Returns404() throws Exception {
        mockMvc.perform(get("/api/merchants/{id}", 999L))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should check hasChildren correctly")
    void getMerchant_CheckHasChildren() throws Exception {
        // Parent should have children
        mockMvc.perform(get("/api/merchants/{id}", parentMerchant.getMerchantId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasChildren", is(true)));

        // Child should not have children
        mockMvc.perform(get("/api/merchants/{id}", childMerchant.getMerchantId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasChildren", is(false)));
    }

    @Test
    @DisplayName("Should create top-level merchant successfully")
    void createMerchant_TopLevel_ReturnsCreated() throws Exception {
        CreateMerchantRequest request = new CreateMerchantRequest();
        request.setName("New Merchant");
        request.setEmail("new@example.com");
        request.setLocation("Malaysia");
        request.setContactNumber("99999999");
        request.setImageUrl("http://example.com/new.jpg");
        request.setPayoutFrequency("Daily");

        mockMvc.perform(post("/api/merchants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.merchantId").exists())
                .andExpect(jsonPath("$.name", is("New Merchant")))
                .andExpect(jsonPath("$.email", is("new@example.com")))
                .andExpect(jsonPath("$.parentMerchantId").doesNotExist());
    }

    @Test
    @DisplayName("Should create child merchant successfully")
    void createMerchant_WithParent_ReturnsCreated() throws Exception {
        CreateMerchantRequest request = new CreateMerchantRequest();
        request.setName("Another Child");
        request.setEmail("anotherchild@example.com");
        request.setLocation("Malaysia");
        request.setContactNumber("11111111");
        request.setImageUrl("http://example.com/another.jpg");
        request.setPayoutFrequency("Weekly");
        request.setParentMerchantId(parentMerchant.getMerchantId());

        mockMvc.perform(post("/api/merchants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.merchantId").exists())
                .andExpect(jsonPath("$.name", is("Another Child")))
                .andExpect(jsonPath("$.parentMerchantId", is(parentMerchant.getMerchantId().intValue())));
    }

    @Test
    @DisplayName("Should return 409 when creating duplicate merchant")
    void createMerchant_Duplicate_Returns409() throws Exception {
        CreateMerchantRequest request = new CreateMerchantRequest();
        request.setName(parentMerchant.getName());
        request.setEmail(parentMerchant.getEmail());
        request.setLocation(parentMerchant.getLocation());
        request.setContactNumber(parentMerchant.getContactNumber());
        request.setImageUrl(parentMerchant.getImageUrl());
        request.setPayoutFrequency(parentMerchant.getPayoutFrequency());

        mockMvc.perform(post("/api/merchants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Should update merchant partially - name only")
    void patchMerchant_NameOnly_ReturnsOk() throws Exception {
        UpdateMerchantRequest request = UpdateMerchantRequest.builder()
                .name("Updated Name")
                .build();

        mockMvc.perform(patch("/api/merchants/{id}", parentMerchant.getMerchantId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.merchantId", is(parentMerchant.getMerchantId().intValue())))
                .andExpect(jsonPath("$.name", is("Updated Name")))
                .andExpect(jsonPath("$.email", is(parentMerchant.getEmail()))) // unchanged
                .andExpect(jsonPath("$.location", is(parentMerchant.getLocation()))); // unchanged
    }

    @Test
    @DisplayName("Should update merchant partially - multiple fields")
    void patchMerchant_MultipleFields_ReturnsOk() throws Exception {
        UpdateMerchantRequest request = UpdateMerchantRequest.builder()
                .name("Updated Name")
                .location("Updated Location")
                .contactNumber("00000000")
                .payoutFrequency("Yearly")
                .build();

        mockMvc.perform(patch("/api/merchants/{id}", parentMerchant.getMerchantId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")))
                .andExpect(jsonPath("$.location", is("Updated Location")))
                .andExpect(jsonPath("$.contactNumber", is("00000000")))
                .andExpect(jsonPath("$.payoutFrequency", is("Yearly")))
                .andExpect(jsonPath("$.email", is(parentMerchant.getEmail()))); // unchanged
    }

    @Test
    @DisplayName("Should update merchant email")
    void patchMerchant_Email_ReturnsOk() throws Exception {
        UpdateMerchantRequest request = UpdateMerchantRequest.builder()
                .email("newemail@example.com")
                .build();

        mockMvc.perform(patch("/api/merchants/{id}", parentMerchant.getMerchantId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("newemail@example.com")))
                .andExpect(jsonPath("$.name", is(parentMerchant.getName()))); // unchanged
    }

    @Test
    @DisplayName("Should change parent merchant relationship")
    void patchMerchant_ChangeParent_ReturnsOk() throws Exception {
        // Create another top-level merchant to be new parent
        Merchant newParent = Merchant.builder()
                .name("New Parent")
                .email("newparent@example.com")
                .location("Indonesia")
                .contactNumber("33333333")
                .imageUrl("http://example.com/newparent.jpg")
                .payoutFrequency("Monthly")
                .build();
        newParent = merchantRepository.save(newParent);

        UpdateMerchantRequest request = UpdateMerchantRequest.builder()
                .parentMerchantId(newParent.getMerchantId())
                .build();

        mockMvc.perform(patch("/api/merchants/{id}", childMerchant.getMerchantId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parentMerchantId", is(newParent.getMerchantId().intValue())));
    }

    @Test
    @DisplayName("Should return 404 when updating non-existent merchant")
    void patchMerchant_NotFound_Returns404() throws Exception {
        UpdateMerchantRequest request = UpdateMerchantRequest.builder()
                .name("Updated Name")
                .build();

        mockMvc.perform(patch("/api/merchants/{id}", 999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should verify database persistence after create")
    void createMerchant_VerifyPersistence() throws Exception {
        CreateMerchantRequest request = new CreateMerchantRequest();
        request.setName("Persistence Test");
        request.setEmail("persist@example.com");
        request.setLocation("Vietnam");
        request.setContactNumber("44444444");
        request.setImageUrl("http://example.com/persist.jpg");
        request.setPayoutFrequency("Monthly");

        // Create merchant
        String response = mockMvc.perform(post("/api/merchants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract ID from response
        Long merchantId = objectMapper.readTree(response).get("merchantId").asLong();

        // Verify it exists in database
        mockMvc.perform(get("/api/merchants/{id}", merchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Persistence Test")))
                .andExpect(jsonPath("$.email", is("persist@example.com")));
    }

    @Test
    @DisplayName("Should handle hierarchical relationship correctly")
    void testHierarchicalRelationship() throws Exception {
        // Get parent - should have children
        mockMvc.perform(get("/api/merchants/{id}", parentMerchant.getMerchantId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasChildren", is(true)));

        // Get children of parent
        mockMvc.perform(get("/api/merchants")
                        .param("parentId", parentMerchant.getMerchantId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].merchantId", is(childMerchant.getMerchantId().intValue())));

        // Child should have parent reference
        mockMvc.perform(get("/api/merchants/{id}", childMerchant.getMerchantId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parentMerchantId", is(parentMerchant.getMerchantId().intValue())))
                .andExpect(jsonPath("$.hasChildren", is(false)));
    }

    @Test
    @DisplayName("Should handle empty database gracefully")
    void getAllMerchants_EmptyDatabase_ReturnsEmptyList() throws Exception {
        merchantRepository.deleteAll();

        mockMvc.perform(get("/api/merchants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Should handle null fields in update request")
    void patchMerchant_AllFieldsNull_ReturnsOkWithNoChanges() throws Exception {
        UpdateMerchantRequest request = UpdateMerchantRequest.builder().build();

        String originalName = parentMerchant.getName();
        String originalEmail = parentMerchant.getEmail();

        mockMvc.perform(patch("/api/merchants/{id}", parentMerchant.getMerchantId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is(originalName)))
                .andExpect(jsonPath("$.email", is(originalEmail)));
    }
}