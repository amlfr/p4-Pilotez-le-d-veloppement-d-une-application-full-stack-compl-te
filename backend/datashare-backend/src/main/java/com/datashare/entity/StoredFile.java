package com.datashare.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An uploaded file: the physical bytes live on disk (named by {@code storedName}),
 * this entity holds the metadata and the public download token.
 */
@Entity
@Table(name = "files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoredFile {

    @Id
    @UuidGenerator
    private UUID id;

    // Null is allowed for future anonymous uploads; this endpoint always sets it.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User owner;

    // The name the user uploaded, shown back to them and used for the download.
    @Column(nullable = false)
    private String originalName;

    // The on-disk filename (a UUID) — decoupled from originalName to avoid collisions
    // and path-traversal via crafted filenames.
    @Column(nullable = false, unique = true)
    private String storedName;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private String contentType;

    // BCrypt hash of the optional download password, or null when unprotected.
    @Column
    private String password;

    @Column(nullable = false, unique = true)
    private UUID downloadToken;

    @Column(nullable = false)
    private Instant uploadDate;

    @Column(nullable = false)
    private Instant expirationDate;
}
