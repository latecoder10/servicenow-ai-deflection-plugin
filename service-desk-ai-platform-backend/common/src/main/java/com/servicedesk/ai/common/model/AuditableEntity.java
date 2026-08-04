package com.servicedesk.ai.common.model;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
public abstract class AuditableEntity extends BaseEntity {

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "updated_by", length = 150)
    private String updatedBy;

    @Column(name = "soft_delete", nullable = false)
    private Boolean softDelete = false;

    @PrePersist
    public void onCreate() {
        super.ensureId();
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.createdBy == null) {
            this.createdBy = "system";
        }
        this.updatedBy = this.createdBy;
        if (this.softDelete == null) {
            this.softDelete = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
