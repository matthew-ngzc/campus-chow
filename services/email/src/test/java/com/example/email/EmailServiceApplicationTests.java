package com.example.email;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = com.example.email.EmailApplication.class)
@Disabled("Disabled until external dependencies are properly configured")
class EmailServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
