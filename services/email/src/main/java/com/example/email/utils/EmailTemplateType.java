package com.example.email.utils;

public enum EmailTemplateType {
    ORDER_CONFIRMED("order_confirmed"),
    PAYMENT_SUCCESS("payment_success"),
    WELCOME_USER("welcome_user"),
    PASSWORD_RESET("password_reset");

    private final String templateName;

    EmailTemplateType(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateName() {
        return templateName;
    }
}
