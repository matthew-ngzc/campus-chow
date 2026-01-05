package com.smunch.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminAccountRepo extends JpaRepository<AdminAccount, Long> {
  Optional<AdminAccount> findByEmail(String email);
  boolean existsByEmail(String email);
}
