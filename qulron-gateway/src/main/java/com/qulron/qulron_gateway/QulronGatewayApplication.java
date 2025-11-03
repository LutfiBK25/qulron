package com.qulron.qulron_gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.server.mvc.config.RouteProperties;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class QulronGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(QulronGatewayApplication.class, args);
	}

}
