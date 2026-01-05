// com/smunch/admin/AdminAccount.java
package com.smunch.admin;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity @Table(name="admin_accounts",
  uniqueConstraints=@UniqueConstraint(columnNames="email"))
@Data
public class AdminAccount {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  Long id;

  @Column(nullable=false, length=255)
  String email;

  @Column(nullable=false, length=255)
  String passwordHash;

  @Column(nullable=false)
  private String role = "ADMIN";

  Instant createdAt = Instant.now();
  Instant updatedAt;

  @PrePersist
  public void prePersist() {
    if (role == null || role.isBlank()) role = "ADMIN";
    if (createdAt == null) createdAt = Instant.now();
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = Instant.now();
  }
}



