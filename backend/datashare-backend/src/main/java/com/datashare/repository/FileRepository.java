package com.datashare.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.datashare.entity.StoredFile;
import com.datashare.entity.User;

@Repository
public interface FileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByDownloadToken(UUID downloadToken);

    Page<StoredFile> findByOwner(User owner, Pageable pageable);
}
