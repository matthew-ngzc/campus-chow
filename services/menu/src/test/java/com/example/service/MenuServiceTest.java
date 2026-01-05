package com.example.service;

import com.example.exception.DuplicateException;
import com.example.exception.NotFoundException;
import com.example.model.Menu;
import com.example.repository.MenuRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MenuService Unit Tests")
class MenuServiceTest {

    @Mock
    private MenuRepository menuRepository;

    @InjectMocks
    private MenuService menuService;

    private Menu testMenuItem1;
    private Menu testMenuItem2;
    private Menu unavailableMenuItem;
    private Long testMerchantId;

    @BeforeEach
    void setUp() {
        testMerchantId = 1L;

        // Setup available menu item
        testMenuItem1 = Menu.builder()
                .menuItemId(1L)
                .merchantId(testMerchantId)
                .name("Burger")
                .description("Delicious beef burger")
                .priceCents(1500)
                .imageUrl("http://example.com/burger.jpg")
                .type("food")
                .availabilityStatus("available")
                .build();

        // Setup another available menu item
        testMenuItem2 = Menu.builder()
                .menuItemId(2L)
                .merchantId(testMerchantId)
                .name("Coke")
                .description("Cold coke")
                .priceCents(300)
                .imageUrl("http://example.com/coke.jpg")
                .type("drink")
                .availabilityStatus("available")
                .build();

        // Setup unavailable menu item
        unavailableMenuItem = Menu.builder()
                .menuItemId(3L)
                .merchantId(testMerchantId)
                .name("Pizza")
                .description("Cheese pizza")
                .priceCents(2000)
                .imageUrl("http://example.com/pizza.jpg")
                .type("food")
                .availabilityStatus("out_of_stock")
                .build();
    }

    @Test
    @DisplayName("Should return all available menu items when includeUnavailable is false")
    void getMenuItemsByMerchantId_OnlyAvailable_Success() {
        // Given
        List<Menu> availableItems = Arrays.asList(testMenuItem1, testMenuItem2);
        when(menuRepository.findByMerchantId(testMerchantId, false)).thenReturn(availableItems);

        // When
        List<Menu> result = menuService.getMenuItemsByMerchantId(testMerchantId, false);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(m -> "available".equals(m.getAvailabilityStatus())));
        verify(menuRepository, times(1)).findByMerchantId(testMerchantId, false);
    }

    @Test
    @DisplayName("Should return all menu items including unavailable when includeUnavailable is true")
    void getMenuItemsByMerchantId_IncludeUnavailable_Success() {
        // Given
        List<Menu> allItems = Arrays.asList(testMenuItem1, testMenuItem2, unavailableMenuItem);
        when(menuRepository.findByMerchantId(testMerchantId, true)).thenReturn(allItems);

        // When
        List<Menu> result = menuService.getMenuItemsByMerchantId(testMerchantId, true);

        // Then
        assertNotNull(result);
        assertEquals(3, result.size());
        verify(menuRepository, times(1)).findByMerchantId(testMerchantId, true);
    }

    @Test
    @DisplayName("Should throw NotFoundException when merchant has no menu items")
    void getMenuItemsByMerchantId_NoItems_ThrowsException() {
        // Given
        Long nonExistentMerchantId = 999L;
        when(menuRepository.findByMerchantId(nonExistentMerchantId, false)).thenReturn(Collections.emptyList());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class,
                () -> menuService.getMenuItemsByMerchantId(nonExistentMerchantId, false));

        assertTrue(exception.getMessage().contains("Menu Item"));
        assertTrue(exception.getMessage().contains("999"));
        verify(menuRepository, times(1)).findByMerchantId(nonExistentMerchantId, false);
    }

    @Test
    @DisplayName("Should create menu item successfully")
    void createMenuItem_Success() {
        // Given
        Menu newMenuItem = Menu.builder()
                .merchantId(testMerchantId)
                .name("New Item")
                .description("New description")
                .priceCents(1000)
                .imageUrl("http://example.com/new.jpg")
                .type("food")
                .availabilityStatus("available")
                .build();

        when(menuRepository.findByMerchantIdAndNameAndDescriptionAndPriceCentsAndImageUrlAndAvailabilityStatusAndType(
                anyLong(), anyString(), anyString(), anyInt(), anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        when(menuRepository.save(any(Menu.class))).thenAnswer(invocation -> {
            Menu saved = invocation.getArgument(0);
            saved.setMenuItemId(10L);
            return saved;
        });

        // When
        Menu result = menuService.createMenuItem(newMenuItem);

        // Then
        assertNotNull(result);
        assertNotNull(result.getMenuItemId());
        assertEquals("New Item", result.getName());
        verify(menuRepository, times(1)).save(any(Menu.class));
    }

    @Test
    @DisplayName("Should throw DuplicateException when creating duplicate menu item")
    void createMenuItem_Duplicate_ThrowsException() {
        // Given
        when(menuRepository.findByMerchantIdAndNameAndDescriptionAndPriceCentsAndImageUrlAndAvailabilityStatusAndType(
                anyLong(), anyString(), anyString(), anyInt(), anyString(), anyString(), anyString()))
                .thenReturn(Optional.of(testMenuItem1));

        // When & Then
        DuplicateException exception = assertThrows(DuplicateException.class,
                () -> menuService.createMenuItem(testMenuItem1));

        assertTrue(exception.getMessage().contains("Menu Item"));
        assertTrue(exception.getMessage().contains("Burger"));
        verify(menuRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should return menu item by ID")
    void getMenuItemById_Success() {
        // Given
        Long menuItemId = 1L;
        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(testMenuItem1));

        // When
        Menu result = menuService.getMenuItemById(menuItemId);

        // Then
        assertNotNull(result);
        assertEquals(menuItemId, result.getMenuItemId());
        assertEquals("Burger", result.getName());
        verify(menuRepository, times(1)).findById(menuItemId);
    }

    @Test
    @DisplayName("Should throw NotFoundException when menu item ID not found")
    void getMenuItemById_NotFound_ThrowsException() {
        // Given
        Long menuItemId = 999L;
        when(menuRepository.findById(menuItemId)).thenReturn(Optional.empty());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class,
                () -> menuService.getMenuItemById(menuItemId));

        assertTrue(exception.getMessage().contains("Menu Item"));
        assertTrue(exception.getMessage().contains("999"));
        verify(menuRepository, times(1)).findById(menuItemId);
    }

    @Test
    @DisplayName("Should update menu item successfully")
    void updateMenuItem_Success() {
        // Given
        Long menuItemId = 1L;
        Menu updates = new Menu();
        updates.setName("Updated Burger");
        updates.setPriceCents(1800);
        updates.setAvailabilityStatus("out_of_stock");

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(testMenuItem1));
        when(menuRepository.save(any(Menu.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Menu result = menuService.updateMenuItem(testMerchantId, menuItemId, updates);

        // Then
        assertNotNull(result);
        assertEquals("Updated Burger", result.getName());
        assertEquals(1800, result.getPriceCents());
        assertEquals("out_of_stock", result.getAvailabilityStatus());
        assertEquals("Delicious beef burger", result.getDescription()); // unchanged
        verify(menuRepository, times(1)).findById(menuItemId);
        verify(menuRepository, times(1)).save(any(Menu.class));
    }

    @Test
    @DisplayName("Should update only provided fields in partial update")
    void updateMenuItem_PartialUpdate_Success() {
        // Given
        Long menuItemId = 1L;
        Menu updates = new Menu();
        updates.setName("Updated Name Only");

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(testMenuItem1));
        when(menuRepository.save(any(Menu.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Menu result = menuService.updateMenuItem(testMerchantId, menuItemId, updates);

        // Then
        assertNotNull(result);
        assertEquals("Updated Name Only", result.getName());
        assertEquals(1500, result.getPriceCents()); // unchanged
        assertEquals("available", result.getAvailabilityStatus()); // unchanged
        verify(menuRepository, times(1)).save(any(Menu.class));
    }

    @Test
    @DisplayName("Should throw NotFoundException when updating non-existent menu item")
    void updateMenuItem_NotFound_ThrowsException() {
        // Given
        Long menuItemId = 999L;
        Menu updates = new Menu();
        updates.setName("Updated Name");

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.empty());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class,
                () -> menuService.updateMenuItem(testMerchantId, menuItemId, updates));

        assertTrue(exception.getMessage().contains("999"));
        verify(menuRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw ResponseStatusException when menu item doesn't belong to merchant")
    void updateMenuItem_WrongMerchant_ThrowsForbidden() {
        // Given
        Long menuItemId = 1L;
        Long wrongMerchantId = 999L;
        Menu updates = new Menu();
        updates.setName("Updated Name");

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(testMenuItem1));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> menuService.updateMenuItem(wrongMerchantId, menuItemId, updates));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertTrue(exception.getReason().contains("does not belong to"));
        verify(menuRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should get menu items by IDs successfully")
    void getMenuItemsByIds_Success() {
        // Given
        List<Long> itemIds = Arrays.asList(1L, 2L);
        List<Menu> menuItems = Arrays.asList(testMenuItem1, testMenuItem2);

        when(menuRepository.findByMerchantIdAndMenuItemIdIn(testMerchantId, itemIds))
                .thenReturn(menuItems);

        // When
        List<Map<String, Object>> result = menuService.getMenuItemsByIds(testMerchantId, itemIds);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        
        Map<String, Object> item1 = result.get(0);
        assertEquals(1L, item1.get("itemId"));
        assertEquals("Burger", item1.get("name"));
        assertEquals(1500, item1.get("priceCents"));
        assertEquals(true, item1.get("available"));

        Map<String, Object> item2 = result.get(1);
        assertEquals(2L, item2.get("itemId"));
        assertEquals("Coke", item2.get("name"));
        assertEquals(300, item2.get("priceCents"));
        assertEquals(true, item2.get("available"));

        verify(menuRepository, times(1)).findByMerchantIdAndMenuItemIdIn(testMerchantId, itemIds);
    }

    @Test
    @DisplayName("Should map availability status correctly in getMenuItemsByIds")
    void getMenuItemsByIds_AvailabilityMapping() {
        // Given
        List<Long> itemIds = Arrays.asList(1L, 3L);
        List<Menu> menuItems = Arrays.asList(testMenuItem1, unavailableMenuItem);

        when(menuRepository.findByMerchantIdAndMenuItemIdIn(testMerchantId, itemIds))
                .thenReturn(menuItems);

        // When
        List<Map<String, Object>> result = menuService.getMenuItemsByIds(testMerchantId, itemIds);

        // Then
        assertEquals(2, result.size());
        assertEquals(true, result.get(0).get("available")); // available
        assertEquals(false, result.get(1).get("available")); // out_of_stock
    }

    @Test
    @DisplayName("Should throw NotFoundException when some items are not found")
    void getMenuItemsByIds_SomeNotFound_ThrowsException() {
        // Given
        List<Long> itemIds = Arrays.asList(1L, 2L, 999L);
        List<Menu> menuItems = Arrays.asList(testMenuItem1, testMenuItem2); // only 2 items found

        when(menuRepository.findByMerchantIdAndMenuItemIdIn(testMerchantId, itemIds))
                .thenReturn(menuItems);

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class,
                () -> menuService.getMenuItemsByIds(testMerchantId, itemIds));

        assertTrue(exception.getMessage().contains("999"));
        assertTrue(exception.getMessage().contains("merchantId=1"));
        verify(menuRepository, times(1)).findByMerchantIdAndMenuItemIdIn(testMerchantId, itemIds);
    }

    @Test
    @DisplayName("Should throw NotFoundException when no items found")
    void getMenuItemsByIds_NoneFound_ThrowsException() {
        // Given
        List<Long> itemIds = Arrays.asList(999L, 998L);
        when(menuRepository.findByMerchantIdAndMenuItemIdIn(testMerchantId, itemIds))
                .thenReturn(Collections.emptyList());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class,
                () -> menuService.getMenuItemsByIds(testMerchantId, itemIds));

        assertTrue(exception.getMessage().contains("Menu Item(s)"));
        verify(menuRepository, times(1)).findByMerchantIdAndMenuItemIdIn(testMerchantId, itemIds);
    }

    @Test
    @DisplayName("Should handle null values in update gracefully")
    void updateMenuItem_NullValues_DoesNotUpdate() {
        // Given
        Long menuItemId = 1L;
        Menu updates = new Menu(); // all fields null

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(testMenuItem1));
        when(menuRepository.save(any(Menu.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Menu result = menuService.updateMenuItem(testMerchantId, menuItemId, updates);

        // Then
        assertNotNull(result);
        assertEquals("Burger", result.getName()); // unchanged
        assertEquals(1500, result.getPriceCents()); // unchanged
        assertEquals("available", result.getAvailabilityStatus()); // unchanged
        verify(menuRepository, times(1)).save(any(Menu.class));
    }

    @Test
    @DisplayName("Should update all fields when all are provided")
    void updateMenuItem_AllFields_Success() {
        // Given
        Long menuItemId = 1L;
        Menu updates = new Menu();
        updates.setName("Completely Updated");
        updates.setDescription("New description");
        updates.setPriceCents(2500);
        updates.setImageUrl("http://example.com/updated.jpg");
        updates.setType("drink");
        updates.setAvailabilityStatus("removed");

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(testMenuItem1));
        when(menuRepository.save(any(Menu.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Menu result = menuService.updateMenuItem(testMerchantId, menuItemId, updates);

        // Then
        assertNotNull(result);
        assertEquals("Completely Updated", result.getName());
        assertEquals("New description", result.getDescription());
        assertEquals(2500, result.getPriceCents());
        assertEquals("http://example.com/updated.jpg", result.getImageUrl());
        assertEquals("drink", result.getType());
        assertEquals("removed", result.getAvailabilityStatus());
        verify(menuRepository, times(1)).save(any(Menu.class));
    }
}