package com.datashare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

// Authentication goes through JwtAuthenticationFilter, never a UserDetailsService.
// Without this exclusion Spring Security auto-configures an in-memory user and prints
// a "Using generated security password" line on every boot — a login that leads nowhere.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableScheduling
public class DatashareBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(DatashareBackendApplication.class, args);
	}

}
