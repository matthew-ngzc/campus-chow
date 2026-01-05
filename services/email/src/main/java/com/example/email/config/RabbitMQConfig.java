package com.example.email.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.support.converter.MessageConverter;

@Configuration
public class RabbitMQConfig {

    public static final String EMAIL_EXCHANGE = "smunch.events";

    public static final String PAYMENT_COMPLETE_QUEUE = "email.payment.complete.queue";
    public static final String PASSWORD_RESET_QUEUE = "email.account.password_reset.queue";
    public static final String WELCOME_QUEUE = "email.account.welcome.queue";
    public static final String PASSWORD_CHANGE_QUEUE = "email.account.password_change.queue";
    public static final String INTERNAL_TEST_QUEUE = "email.internal.test.queue";
    public static final String RUNNER_ASSIGNMENT_QUEUE = "runner.assignment.queue";
    public static final String CANCELLED_QUEUE = "runner.order.cancelled.queue";

    //Routing Keys
    public static final String ORDER_PAYMENT_REMINDER_KEY = "order.payment_reminder";
    public static final String PAYMENT_COMPLETE_KEY = "payment.complete";
    public static final String PASSWORD_RESET_KEY = "user.password_reset";
    public static final String WELCOME_KEY = "user.welcome";
    public static final String PASSWORD_CHANGE_KEY = "account.password_change";
    public static final String INTERNAL_TEST_KEY = "internal.test";
    public static final String RUNNER_ASSIGNMENT_KEY = "runner.assignment";

    @Bean
    public TopicExchange emailExchange() {
        return new TopicExchange(EMAIL_EXCHANGE);
    }

    @Bean public Queue paymentCompleteQueue() { return new Queue(PAYMENT_COMPLETE_QUEUE, true); }
    @Bean public Queue passwordResetQueue() { return new Queue(PASSWORD_RESET_QUEUE, true); }
    @Bean public Queue welcomeQueue() { return new Queue(WELCOME_QUEUE, true); }
    @Bean public Queue passwordChangeQueue() { return new Queue(PASSWORD_CHANGE_QUEUE, true); }
    @Bean public Queue internalTestQueue() { return new Queue(INTERNAL_TEST_QUEUE, true); }
    @Bean public Queue runnerAssignmentQueue() { return new Queue(RUNNER_ASSIGNMENT_QUEUE, true);}
    @Bean public Queue emailQueue() {return new Queue("email.command.send_payment_reminder", true);}
    @Bean public Queue runnerOrderReadyQueue() { return new Queue("runner.order.ready.queue", true);}
    @Bean public Queue orderStatusCancelledQueue() { return new Queue("order.status.cancelled.queue", true);}
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public Binding runnerOrderReadyBinding(Queue runnerOrderReadyQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(runnerOrderReadyQueue)
                .to(emailExchange)
                .with("runner.order.ready");
    }

    @Bean
    public Binding emailQueueBinding() {
        return BindingBuilder.bind(emailQueue()).to(emailExchange()).with("email.command.send_payment_reminder");
    }

    @Bean
    public Binding paymentCompleteBinding(Queue paymentCompleteQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(paymentCompleteQueue).to(emailExchange).with(PAYMENT_COMPLETE_KEY);
    }

    @Bean
    public Binding passwordResetBinding(Queue passwordResetQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(passwordResetQueue).to(emailExchange).with(PASSWORD_RESET_KEY);
    }

    @Bean
    public Binding welcomeBinding(Queue welcomeQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(welcomeQueue).to(emailExchange).with(WELCOME_KEY);
    }

    @Bean
    public Binding passwordChangeBinding(Queue passwordChangeQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(passwordChangeQueue).to(emailExchange).with(PASSWORD_CHANGE_KEY);
    }

    @Bean
    public Binding internalTestBinding(Queue internalTestQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(internalTestQueue).to(emailExchange).with(INTERNAL_TEST_KEY);
    }

    @Bean
    public Binding runnerAssignmentBinding(Queue runnerAssignmentQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(runnerAssignmentQueue).to(emailExchange).with(RUNNER_ASSIGNMENT_KEY);
    }

    @Bean
    public Binding orderStatusCancelledBinding(Queue orderStatusCancelledQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(orderStatusCancelledQueue)
            .to(emailExchange)
            .with("order.status.cancelled");
    }

}
