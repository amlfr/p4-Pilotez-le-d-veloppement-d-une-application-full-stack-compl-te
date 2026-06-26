package com.datashare.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.datashare.entity.StoredFile;
import com.datashare.entity.User;

@Repository
public interface FileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByDownloadToken(UUID downloadToken);

    Page<StoredFile> findByOwner(User owner, Pageable pageable);

    /** History filtered by a single tag label (case-insensitive exact match, US08). */
    @Query(value = "select f from StoredFile f join f.tags t"
            + " where f.owner = :owner and lower(t) = lower(:tag)",
            countQuery = "select count(f) from StoredFile f join f.tags t"
            + " where f.owner = :owner and lower(t) = lower(:tag)")
    Page<StoredFile> findByOwnerAndTag(
            @Param("owner") User owner, @Param("tag") String tag, Pageable pageable);
}
