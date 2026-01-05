package com.example.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
@PropertySource("classpath:application.properties")
public class EmailApplication {

	@Autowired
	private Environment env;


	public static void main(String[] args) {
		SpringApplication.run(EmailApplication.class, args);
	}

}
