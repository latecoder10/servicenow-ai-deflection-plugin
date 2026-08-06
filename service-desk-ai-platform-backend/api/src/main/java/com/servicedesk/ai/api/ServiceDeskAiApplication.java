package com.servicedesk.ai.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.servicedesk.ai")
@EnableJpaRepositories(basePackages = "com.servicedesk.ai.domain.repository")
@EntityScan(basePackages = "com.servicedesk.ai.domain.entity")
@EnableScheduling
@EnableAsync
public class ServiceDeskAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceDeskAiApplication.class, args);
    }
}
