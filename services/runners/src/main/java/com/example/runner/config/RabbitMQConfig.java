package com.example.runner.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;

@Configuration
public class RabbitMQConfig {

    public static final String ORDER_COMMAND_EXCHANGE = "smunch.events";
    public static final String ORDER_STATUS_UPDATE_QUEUE = "order.inbox";

    // Routing Key
    public static final String RUNNER_STATUS_UPDATE_KEY = "order.command.status_update";
    public static final String ORDER_STATUS_UPDATE_KEY = "order.status.#";


    @Bean
    public TopicExchange orderCommandExchange() {
        return new TopicExchange(ORDER_COMMAND_EXCHANGE);
    }

    @Bean
    public Queue orderStatusUpdateQueue() { 
        return new Queue(ORDER_STATUS_UPDATE_QUEUE, true); 
    }

    @Bean
    public Binding orderStatusUpdateBinding(Queue orderStatusUpdateQueue, TopicExchange orderCommandExchange) {
        return BindingBuilder.bind(orderStatusUpdateQueue)
                .to(orderCommandExchange)
                .with(ORDER_STATUS_UPDATE_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }
}
