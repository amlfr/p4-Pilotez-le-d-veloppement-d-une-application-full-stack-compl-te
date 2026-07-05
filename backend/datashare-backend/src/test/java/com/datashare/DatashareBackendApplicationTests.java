package com.datashare;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// "test" profile: boots on in-memory H2, never on the dev PostgreSQL.
@SpringBootTest
@ActiveProfiles("test")
class DatashareBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
