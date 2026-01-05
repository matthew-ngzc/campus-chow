package com.example.controller;

import com.example.model.Menu;
import com.example.repository.MenuRepository;
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

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
@DisplayName("MenuController Integration Tests")
class MenuControllerIntegrationTest {

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
    private MenuRepository menuRepository;

    private Long testMerchantId;
    private Long anotherMerchantId;
    private Menu burger;
    private Menu pizza;
    private Menu coke;
    private Menu unavailableItem;

    @BeforeEach
    void setUp() {
        menuRepository.deleteAll();
        
        testMerchantId = 1L;
        anotherMerchantId = 2L;

        // Create menu items for merchant 1
        burger = Menu.builder()
                .merchantId(testMerchantId)
                .name("Burger")
                .description("Delicious beef burger")
                .priceCents(1500)
                .imageUrl("http://example.com/burger.jpg")
                .type("food")
                .availabilityStatus("available")
                .build();
        burger = menuRepository.save(burger);

        pizza = Menu.builder()
                .merchantId(testMerchantId)
                .name("Pizza")
                .description("Cheese pizza")
                .priceCents(2000)
                .imageUrl("http://example.com/pizza.jpg")
                .type("food")
                .availabilityStatus("available")
                .build();
        pizza = menuRepository.save(pizza);

        coke = Menu.builder()
                .merchantId(testMerchantId)
                .name("Coke")
                .description("Cold drink")
                .priceCents(300)
                .imageUrl("http://example.com/coke.jpg")
                .type("drink")
                .availabilityStatus("available")
                .build();
        coke = menuRepository.save(coke);

        unavailableItem = Menu.builder()
                .merchantId(testMerchantId)
                .name("Ice Cream")
                .description("Vanilla ice cream")
                .priceCents(500)
                .imageUrl("http://example.com/icecream.jpg")
                .type("food")
                .availabilityStatus("out_of_stock")
                .build();
        unavailableItem = menuRepository.save(unavailableItem);

        // Create one item for another merchant
        Menu anotherMerchantItem = Menu.builder()
                .merchantId(anotherMerchantId)
                .name("Salad")
                .description("Fresh salad")
                .priceCents(800)
                .imageUrl("http://example.com/salad.jpg")
                .type("food")
                .availabilityStatus("available")
                .build();
        menuRepository.save(anotherMerchantItem);
    }

    @Test
    @DisplayName("Should return only available menu items by default")
    void getMenuByMerchantId_DefaultParams_ReturnsAvailable() throws Exception {
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Burger", "Pizza", "Coke")))
                .andExpect(jsonPath("$[*].availabilityStatus", everyItem(is("available"))));
    }

    @Test
    @DisplayName("Should return all menu items when includeUnavailable is true")
    void getMenuByMerchantId_IncludeUnavailable_ReturnsAll() throws Exception {
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId)
                        .param("includeUnavailable", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[*].name", 
                        containsInAnyOrder("Burger", "Pizza", "Coke", "Ice Cream")));
    }

    @Test
    @DisplayName("Should order menu items by type then name")
    void getMenuByMerchantId_OrderedByTypeAndName() throws Exception {
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type", is("drink")))
                .andExpect(jsonPath("$[0].name", is("Coke")))
                .andExpect(jsonPath("$[1].type", is("food")))
                .andExpect(jsonPath("$[1].name", is("Burger")))
                .andExpect(jsonPath("$[2].type", is("food")))
                .andExpect(jsonPath("$[2].name", is("Pizza")));
    }

    @Test
    @DisplayName("Should return 404 when merchant has no menu items")
    void getMenuByMerchantId_NoItems_Returns404() throws Exception {
        Long nonExistentMerchantId = 999L;
        
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", nonExistentMerchantId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should create menu item successfully")
    void createMenuItem_Success_ReturnsCreated() throws Exception {
        Menu newItem = Menu.builder()
                .name("Fries")
                .description("Crispy fries")
                .priceCents(400)
                .imageUrl("http://example.com/fries.jpg")
                .type("food")
                .availabilityStatus("available")
                .build();

        mockMvc.perform(post("/api/merchants/{merchantId}/menu", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newItem)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.menuItemId").exists())
                .andExpect(jsonPath("$.merchantId", is(testMerchantId.intValue())))
                .andExpect(jsonPath("$.name", is("Fries")))
                .andExpect(jsonPath("$.description", is("Crispy fries")))
                .andExpect(jsonPath("$.priceCents", is(400)))
                .andExpect(jsonPath("$.type", is("food")))
                .andExpect(jsonPath("$.availabilityStatus", is("available")));
    }

    @Test
    @DisplayName("Should set merchantId from path parameter when creating")
    void createMenuItem_MerchantIdFromPath() throws Exception {
        Menu newItem = Menu.builder()
                .merchantId(999L) // This should be ignored
                .name("Smoothie")
                .description("Fruit smoothie")
                .priceCents(600)
                .imageUrl("http://example.com/smoothie.jpg")
                .type("drink")
                .availabilityStatus("available")
                .build();

        mockMvc.perform(post("/api/merchants/{merchantId}/menu", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newItem)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.merchantId", is(testMerchantId.intValue())));
    }

    @Test
    @DisplayName("Should return 409 when creating duplicate menu item")
    void createMenuItem_Duplicate_ReturnsConflict() throws Exception {
        Menu duplicate = Menu.builder()
                .name(burger.getName())
                .description(burger.getDescription())
                .priceCents(burger.getPriceCents())
                .imageUrl(burger.getImageUrl())
                .type(burger.getType())
                .availabilityStatus(burger.getAvailabilityStatus())
                .build();

        mockMvc.perform(post("/api/merchants/{merchantId}/menu", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Should update menu item successfully")
    void updateMenuItem_Success_ReturnsOk() throws Exception {
        Menu updates = new Menu();
        updates.setName("Updated Burger");
        updates.setPriceCents(1800);
        updates.setAvailabilityStatus("out_of_stock");

        mockMvc.perform(put("/api/merchants/{merchantId}/menu/{menuItemId}", 
                        testMerchantId, burger.getMenuItemId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.menuItemId", is(burger.getMenuItemId().intValue())))
                .andExpect(jsonPath("$.name", is("Updated Burger")))
                .andExpect(jsonPath("$.priceCents", is(1800)))
                .andExpect(jsonPath("$.availabilityStatus", is("out_of_stock")))
                .andExpect(jsonPath("$.description", is("Delicious beef burger"))); // unchanged
    }

    @Test
    @DisplayName("Should update only provided fields in partial update")
    void updateMenuItem_PartialUpdate_Success() throws Exception {
        Menu updates = new Menu();
        updates.setName("New Burger Name");

        mockMvc.perform(put("/api/merchants/{merchantId}/menu/{menuItemId}", 
                        testMerchantId, burger.getMenuItemId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("New Burger Name")))
                .andExpect(jsonPath("$.priceCents", is(1500))) // unchanged
                .andExpect(jsonPath("$.availabilityStatus", is("available"))); // unchanged
    }

    @Test
    @DisplayName("Should update multiple fields")
    void updateMenuItem_MultipleFields_Success() throws Exception {
        Menu updates = new Menu();
        updates.setName("Super Burger");
        updates.setDescription("Extra delicious");
        updates.setPriceCents(2500);
        updates.setType("food");
        updates.setAvailabilityStatus("available");

        mockMvc.perform(put("/api/merchants/{merchantId}/menu/{menuItemId}", 
                        testMerchantId, burger.getMenuItemId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Super Burger")))
                .andExpect(jsonPath("$.description", is("Extra delicious")))
                .andExpect(jsonPath("$.priceCents", is(2500)));
    }

    @Test
    @DisplayName("Should return 404 when updating non-existent menu item")
    void updateMenuItem_NotFound_Returns404() throws Exception {
        Menu updates = new Menu();
        updates.setName("Updated Name");

        mockMvc.perform(put("/api/merchants/{merchantId}/menu/{menuItemId}", 
                        testMerchantId, 999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 403 when updating menu item of different merchant")
    void updateMenuItem_WrongMerchant_Returns403() throws Exception {
        Menu updates = new Menu();
        updates.setName("Updated Name");

        mockMvc.perform(put("/api/merchants/{merchantId}/menu/{menuItemId}", 
                        anotherMerchantId, burger.getMenuItemId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should get menu items by IDs successfully")
    void getMenuItemsByIds_Success_ReturnsOk() throws Exception {
        Map<String, List<Long>> request = new HashMap<>();
        request.put("itemIds", Arrays.asList(burger.getMenuItemId(), pizza.getMenuItemId()));

        mockMvc.perform(post("/api/merchants/{merchantId}/menu/items", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[*].itemId", 
                        containsInAnyOrder(burger.getMenuItemId().intValue(), 
                                         pizza.getMenuItemId().intValue())))
                .andExpect(jsonPath("$.items[*].name", 
                        containsInAnyOrder("Burger", "Pizza")))
                .andExpect(jsonPath("$.items[*].available", 
                        everyItem(is(true))));
    }

    @Test
    @DisplayName("Should map availability status correctly in getMenuItemsByIds")
    void getMenuItemsByIds_AvailabilityMapping() throws Exception {
        Map<String, List<Long>> request = new HashMap<>();
        request.put("itemIds", Arrays.asList(burger.getMenuItemId(), unavailableItem.getMenuItemId()));

        String response = mockMvc.perform(post("/api/merchants/{merchantId}/menu/items", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Parse response and verify availability
        Map<String, List<Map<String, Object>>> result = objectMapper.readValue(response, Map.class);
        List<Map<String, Object>> items = result.get("items");

        boolean foundAvailable = false;
        boolean foundUnavailable = false;

        for (Map<String, Object> item : items) {
            if (item.get("itemId").equals(burger.getMenuItemId().intValue())) {
                foundAvailable = (Boolean) item.get("available");
            }
            if (item.get("itemId").equals(unavailableItem.getMenuItemId().intValue())) {
                foundUnavailable = !(Boolean) item.get("available");
            }
        }

        assert foundAvailable : "Available item should have available=true";
        assert foundUnavailable : "Unavailable item should have available=false";
    }

    @Test
    @DisplayName("Should return 404 when some items not found in getMenuItemsByIds")
    void getMenuItemsByIds_SomeNotFound_Returns404() throws Exception {
        Map<String, List<Long>> request = new HashMap<>();
        request.put("itemIds", Arrays.asList(burger.getMenuItemId(), 999L));

        mockMvc.perform(post("/api/merchants/{merchantId}/menu/items", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 404 when requesting items from wrong merchant")
    void getMenuItemsByIds_WrongMerchant_Returns404() throws Exception {
        Map<String, List<Long>> request = new HashMap<>();
        request.put("itemIds", Arrays.asList(burger.getMenuItemId()));

        mockMvc.perform(post("/api/merchants/{merchantId}/menu/items", anotherMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return correct structure in getMenuItemsByIds response")
    void getMenuItemsByIds_CorrectStructure() throws Exception {
        Map<String, List<Long>> request = new HashMap<>();
        request.put("itemIds", Arrays.asList(burger.getMenuItemId()));

        mockMvc.perform(post("/api/merchants/{merchantId}/menu/items", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].itemId").exists())
                .andExpect(jsonPath("$.items[0].name").exists())
                .andExpect(jsonPath("$.items[0].priceCents").exists())
                .andExpect(jsonPath("$.items[0].available").exists())
                .andExpect(jsonPath("$.items[0].description").doesNotExist()) // should not include all fields
                .andExpect(jsonPath("$.items[0].imageUrl").doesNotExist());
    }

    @Test
    @DisplayName("Should verify database persistence after create")
    void createMenuItem_VerifyPersistence() throws Exception {
        Menu newItem = Menu.builder()
                .name("Pasta")
                .description("Italian pasta")
                .priceCents(1200)
                .imageUrl("http://example.com/pasta.jpg")
                .type("food")
                .availabilityStatus("available")
                .build();

        // Create menu item
        String response = mockMvc.perform(post("/api/merchants/{merchantId}/menu", testMerchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newItem)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract ID from response
        Long menuItemId = objectMapper.readTree(response).get("menuItemId").asLong();

        // Verify it appears in the menu list
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Pasta")))
                .andExpect(jsonPath("$[*].menuItemId", hasItem(menuItemId.intValue())));
    }

    @Test
    @DisplayName("Should verify database persistence after update")
    void updateMenuItem_VerifyPersistence() throws Exception {
        Menu updates = new Menu();
        updates.setName("Modified Pizza");
        updates.setPriceCents(2200);

        // Update menu item
        mockMvc.perform(put("/api/merchants/{merchantId}/menu/{menuItemId}", 
                        testMerchantId, pizza.getMenuItemId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk());

        // Verify changes persist
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Modified Pizza")))
                .andExpect(jsonPath("$[?(@.name == 'Modified Pizza')].priceCents", 
                        contains(2200)));
    }

    @Test
    @DisplayName("Should return 404 when merchant has no menu items")
    void getMenuByMerchantId_NoItemsForMerchant_Returns404() throws Exception {
        Long nonExistentMerchantId = 9999L;
        
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", nonExistentMerchantId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should handle null fields in update request")
    void updateMenuItem_NullFields_NoChanges() throws Exception {
        Menu updates = new Menu(); // all fields null

        String originalName = burger.getName();
        Integer originalPrice = burger.getPriceCents();

        mockMvc.perform(put("/api/merchants/{merchantId}/menu/{menuItemId}", 
                        testMerchantId, burger.getMenuItemId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is(originalName)))
                .andExpect(jsonPath("$.priceCents", is(originalPrice)));
    }

    @Test
    @DisplayName("Should isolate menu items between merchants")
    void getMenuByMerchantId_IsolationBetweenMerchants() throws Exception {
        // Merchant 1 should have 4 items (3 available + 1 unavailable)
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId)
                        .param("includeUnavailable", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)));

        // Merchant 2 should have 1 item
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", anotherMerchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Salad")));
    }

    @Test
    @DisplayName("Should handle different availability statuses")
    void testDifferentAvailabilityStatuses() throws Exception {
        // Create items with different statuses
        Menu removed = Menu.builder()
                .merchantId(testMerchantId)
                .name("Old Item")
                .description("No longer available")
                .priceCents(100)
                .imageUrl("http://example.com/old.jpg")
                .type("food")
                .availabilityStatus("removed")
                .build();
        menuRepository.save(removed);

        // Without includeUnavailable - should return 3 items (only available)
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].availabilityStatus", everyItem(is("available"))));

        // With includeUnavailable - should return all 5 items
        mockMvc.perform(get("/api/merchants/{merchantId}/menu", testMerchantId)
                        .param("includeUnavailable", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[*].availabilityStatus", 
                        hasItems("available", "out_of_stock", "removed")));
    }
}