package com.example.service;

import com.example.exception.DuplicateException;
import com.example.exception.NotFoundException;
import com.example.model.Merchant;
import com.example.repository.MerchantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MerchantService Unit Tests")
class MerchantServiceTest {

    @Mock
    private MerchantRepository merchantRepository;

    @InjectMocks
    private MerchantService merchantService;

    private Merchant testMerchant;
    private Merchant parentMerchant;
    private Merchant childMerchant;

    @BeforeEach
    void setUp() {
        // Setup parent merchant
        parentMerchant = Merchant.builder()
                .merchantId(1L)
                .name("Parent Merchant")
                .email("parent@example.com")
                .location("Singapore")
                .contactNumber("12345678")
                .imageUrl("http://example.com/image.jpg")
                .payoutFrequency("Monthly")
                .build();

        // Setup child merchant
        childMerchant = Merchant.builder()
                .merchantId(2L)
                .name("Child Merchant")
                .email("child@example.com")
                .location("Singapore")
                .contactNumber("87654321")
                .imageUrl("http://example.com/child.jpg")
                .payoutFrequency("Weekly")
                .parentMerchant(parentMerchant)
                .build();

        // Setup test merchant
        testMerchant = Merchant.builder()
                .merchantId(3L)
                .name("Test Merchant")
                .email("test@example.com")
                .location("Malaysia")
                .contactNumber("99999999")
                .imageUrl("http://example.com/test.jpg")
                .payoutFrequency("Daily")
                .build();
    }

    @Test
    @DisplayName("Should return all merchants")
    void getAllMerchants_Success() {
        // Given
        List<Merchant> merchants = Arrays.asList(parentMerchant, childMerchant, testMerchant);
        when(merchantRepository.findAll()).thenReturn(merchants);

        // When
        List<Merchant> result = merchantService.getAllMerchants();

        // Then
        assertNotNull(result);
        assertEquals(3, result.size());
        verify(merchantRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return top-level merchants only")
    void getTopLevelMerchants_Success() {
        // Given
        List<Merchant> topLevelMerchants = Arrays.asList(parentMerchant, testMerchant);
        when(merchantRepository.findTopLevelMerchants()).thenReturn(topLevelMerchants);

        // When
        List<Merchant> result = merchantService.getTopLevelMerchants();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(m -> m.getParentMerchant() == null));
        verify(merchantRepository, times(1)).findTopLevelMerchants();
    }

    @Test
    @DisplayName("Should return children by parent ID")
    void getMerchantsByParentId_WithParentId_ReturnsChildren() {
        // Given
        Long parentId = 1L;
        List<Merchant> children = Arrays.asList(childMerchant);
        when(merchantRepository.findChildrenByParentId(parentId)).thenReturn(children);

        // When
        List<Merchant> result = merchantService.getMerchantsByParentId(parentId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(childMerchant.getMerchantId(), result.get(0).getMerchantId());
        verify(merchantRepository, times(1)).findChildrenByParentId(parentId);
    }

    @Test
    @DisplayName("Should return top-level merchants when parent ID is null")
    void getMerchantsByParentId_WithNullParentId_ReturnsTopLevel() {
        // Given
        List<Merchant> topLevelMerchants = Arrays.asList(parentMerchant, testMerchant);
        when(merchantRepository.findTopLevelMerchants()).thenReturn(topLevelMerchants);

        // When
        List<Merchant> result = merchantService.getMerchantsByParentId(null);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(merchantRepository, times(1)).findTopLevelMerchants();
        verify(merchantRepository, never()).findChildrenByParentId(any());
    }

    @Test
    @DisplayName("Should return merchant by ID")
    void getMerchantById_Success() {
        // Given
        Long merchantId = 1L;
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(parentMerchant));

        // When
        Merchant result = merchantService.getMerchantById(merchantId);

        // Then
        assertNotNull(result);
        assertEquals(merchantId, result.getMerchantId());
        assertEquals("Parent Merchant", result.getName());
        verify(merchantRepository, times(1)).findById(merchantId);
    }

    @Test
    @DisplayName("Should throw NotFoundException when merchant ID not found")
    void getMerchantById_NotFound_ThrowsException() {
        // Given
        Long merchantId = 999L;
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.empty());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class, 
            () -> merchantService.getMerchantById(merchantId));
        
        assertTrue(exception.getMessage().contains("Merchant"));
        assertTrue(exception.getMessage().contains("999"));
        verify(merchantRepository, times(1)).findById(merchantId);
    }

    @Test
    @DisplayName("Should return merchant by email")
    void getMerchantByEmail_Success() {
        // Given
        String email = "parent@example.com";
        when(merchantRepository.findByEmail(email)).thenReturn(Optional.of(parentMerchant));

        // When
        Merchant result = merchantService.getMerchantByEmail(email);

        // Then
        assertNotNull(result);
        assertEquals(email, result.getEmail());
        verify(merchantRepository, times(1)).findByEmail(email);
    }

    @Test
    @DisplayName("Should throw NotFoundException when email not found")
    void getMerchantByEmail_NotFound_ThrowsException() {
        // Given
        String email = "notfound@example.com";
        when(merchantRepository.findByEmail(email)).thenReturn(Optional.empty());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class, 
            () -> merchantService.getMerchantByEmail(email));
        
        assertTrue(exception.getMessage().contains("email"));
        verify(merchantRepository, times(1)).findByEmail(email);
    }

    @Test
    @DisplayName("Should create merchant successfully")
    void createMerchant_Success() {
        // Given
        Merchant newMerchant = Merchant.builder()
                .name("New Merchant")
                .email("new@example.com")
                .location("Thailand")
                .contactNumber("11111111")
                .imageUrl("http://example.com/new.jpg")
                .payoutFrequency("Monthly")
                .build();

        when(merchantRepository.existsByNameAndLocationAndContactNumberAndImageUrlAndPayoutFrequencyAndEmail(
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(false);
        
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(invocation -> {
            Merchant saved = invocation.getArgument(0);
            saved.setMerchantId(10L);
            return saved;
        });

        // When
        Merchant result = merchantService.createMerchant(newMerchant);

        // Then
        assertNotNull(result);
        assertNotNull(result.getMerchantId());
        assertEquals("New Merchant", result.getName());
        verify(merchantRepository, times(1)).save(any(Merchant.class));
    }

    @Test
    @DisplayName("Should throw DuplicateException when creating duplicate merchant")
    void createMerchant_Duplicate_ThrowsException() {
        // Given
        when(merchantRepository.existsByNameAndLocationAndContactNumberAndImageUrlAndPayoutFrequencyAndEmail(
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);
        
        when(merchantRepository.findByEmail(testMerchant.getEmail()))
                .thenReturn(Optional.of(testMerchant));

        // When & Then
        DuplicateException exception = assertThrows(DuplicateException.class, 
            () -> merchantService.createMerchant(testMerchant));
        
        assertTrue(exception.getMessage().contains("Merchant"));
        verify(merchantRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update merchant partially - name only")
    void updateMerchantPartial_NameOnly_Success() {
        // Given
        Long merchantId = 1L;
        Merchant updates = new Merchant();
        updates.setName("Updated Name");

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(parentMerchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Merchant result = merchantService.updateMerchantPartial(merchantId, updates);

        // Then
        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals("parent@example.com", result.getEmail()); // unchanged
        verify(merchantRepository, times(1)).findById(merchantId);
        verify(merchantRepository, times(1)).save(any(Merchant.class));
    }

    @Test
    @DisplayName("Should update merchant partially - multiple fields")
    void updateMerchantPartial_MultipleFields_Success() {
        // Given
        Long merchantId = 1L;
        Merchant updates = new Merchant();
        updates.setName("Updated Name");
        updates.setLocation("Updated Location");
        updates.setContactNumber("00000000");

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(parentMerchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Merchant result = merchantService.updateMerchantPartial(merchantId, updates);

        // Then
        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals("Updated Location", result.getLocation());
        assertEquals("00000000", result.getContactNumber());
        assertEquals("parent@example.com", result.getEmail()); // unchanged
        verify(merchantRepository, times(1)).save(any(Merchant.class));
    }

    @Test
    @DisplayName("Should throw NotFoundException when updating non-existent merchant")
    void updateMerchantPartial_NotFound_ThrowsException() {
        // Given
        Long merchantId = 999L;
        Merchant updates = new Merchant();
        updates.setName("Updated Name");

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.empty());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class, 
            () -> merchantService.updateMerchantPartial(merchantId, updates));
        
        assertTrue(exception.getMessage().contains("999"));
        verify(merchantRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should return true when merchant has children")
    void merchantHasChildren_True() {
        // Given
        Long merchantId = 1L;
        when(merchantRepository.hasChildren(merchantId)).thenReturn(true);

        // When
        boolean result = merchantService.merchantHasChildren(merchantId);

        // Then
        assertTrue(result);
        verify(merchantRepository, times(1)).hasChildren(merchantId);
    }

    @Test
    @DisplayName("Should return false when merchant has no children")
    void merchantHasChildren_False() {
        // Given
        Long merchantId = 3L;
        when(merchantRepository.hasChildren(merchantId)).thenReturn(false);

        // When
        boolean result = merchantService.merchantHasChildren(merchantId);

        // Then
        assertFalse(result);
        verify(merchantRepository, times(1)).hasChildren(merchantId);
    }

    @Test
    @DisplayName("Should handle null values in partial update gracefully")
    void updateMerchantPartial_NullValues_DoesNotUpdate() {
        // Given
        Long merchantId = 1L;
        Merchant updates = new Merchant(); // all fields null

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(parentMerchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Merchant result = merchantService.updateMerchantPartial(merchantId, updates);

        // Then
        assertNotNull(result);
        assertEquals("Parent Merchant", result.getName()); // unchanged
        assertEquals("parent@example.com", result.getEmail()); // unchanged
        verify(merchantRepository, times(1)).save(any(Merchant.class));
    }
}