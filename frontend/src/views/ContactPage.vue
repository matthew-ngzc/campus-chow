<template>
    <div class="contact-page">
        <!-- Header Section -->
        <div class="header-section">
            <div class="header-accent"></div>
            <h1 class="page-title">Contact Us</h1>
            <p class="page-subtitle">Get in touch with our support team</p>
        </div>

        <div class="contact-container">
            <!-- Contact Form -->
            <div class="form-section">
                <div class="form-card">
                    <h2 class="form-title">Send us a Message</h2>
                    <form @submit.prevent="submitForm">
                        <div class="form-group">
                            <label class="form-label">Full Name *</label>
                            <input 
                                v-model="formData.name" 
                                type="text" 
                                class="form-input" 
                                placeholder="John Doe"
                                required 
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email Address *</label>
                            <input 
                                v-model="formData.email" 
                                type="email" 
                                class="form-input" 
                                placeholder="john.doe@smu.edu.sg"
                                required 
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Subject *</label>
                            <select v-model="formData.subject" class="form-input" required>
                                <option value="" disabled>Select a subject</option>
                                <option value="general">General Inquiry</option>
                                <option value="order">Order Issue</option>
                                <option value="delivery">Delivery Problem</option>
                                <option value="payment">Payment Issue</option>
                                <option value="partnership">Restaurant Partnership</option>
                                <option value="feedback">Feedback & Suggestions</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Order Number (if applicable)</label>
                            <input 
                                v-model="formData.orderNumber" 
                                type="text" 
                                class="form-input" 
                                placeholder="e.g., 312" 
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Message *</label>
                            <textarea 
                                v-model="formData.message" 
                                class="form-textarea" 
                                rows="6"
                                placeholder="Tell us how we can help you..."
                                required
                            ></textarea>
                        </div>

                        <button type="submit" class="submit-btn">
                            <svg class="send-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                            </svg>
                            Send Message
                        </button>
                    </form>
                </div>
            </div>

            <!-- Contact Information -->
            <div class="info-section">
                <!-- Quick Contact -->
                <div class="info-card">
                    <h3 class="info-title">Quick Contact</h3>
                    <div class="contact-methods">
                        <div class="contact-item">
                            <div class="contact-icon">
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                </svg>
                            </div>
                            <div class="contact-details">
                                <div class="contact-label">Email</div>
                                <a href="mailto:support@campuschow.com" class="contact-value">support@campuschow.com</a>
                            </div>
                        </div>

                        <div class="contact-item">
                            <div class="contact-icon">
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                </svg>
                            </div>
                            <div class="contact-details">
                                <div class="contact-label">Phone</div>
                                <div class="contact-value">+65 8123 4567</div>
                            </div>
                        </div>

                        <div class="contact-item">
                            <div class="contact-icon">
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div class="contact-details">
                                <div class="contact-label">Location</div>
                                <div class="contact-value">SMU Campus<br />Singapore</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Support Hours -->
                <div class="info-card">
                    <h3 class="info-title">Support Hours</h3>
                    <div class="hours-list">
                        <div class="hours-item">
                            <span class="day">Monday - Friday</span>
                            <span class="time">8:00 AM - 10:00 PM</span>
                        </div>
                        <div class="hours-item">
                            <span class="day">Saturday - Sunday</span>
                            <span class="time">10:00 AM - 9:00 PM</span>
                        </div>
                        <div class="hours-item">
                            <span class="day">Public Holidays</span>
                            <span class="time">Closed</span>
                        </div>
                    </div>
                </div>

                <!-- Response Time -->
                <div class="info-card response-card">
                    <div class="response-icon">⚡</div>
                    <h3 class="response-title">Quick Response</h3>
                    <p class="response-text">We typically respond within 24 hours on business days</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
    name: 'ContactPage',
    setup() {
        const formData = ref({
            name: '',
            email: '',
            subject: '',
            orderNumber: '',
            message: ''
        })

        // submission of contact form
        const submitForm = () => {
            alert(`✅ Thank you for contacting us, ${formData.value.name}!\n\nWe've received your message and will respond to ${formData.value.email} within 24 hours.`)
            
            // Reset form
            formData.value = {
                name: '',
                email: '',
                subject: '',
                orderNumber: '',
                message: ''
            }
        }

        return {
            formData,
            submitForm
        }
    }
})
</script>

<style scoped>
.contact-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 50px 40px;
    padding-top: 140px;
}

.header-section {
    text-align: center;
    margin-bottom: 60px;
}

.header-accent {
    width: 80px;
    height: 4px;
    background: var(--primary-color);
    margin: 0 auto 20px;
    border-radius: 2px;
}

.page-title {
    font-family: var(--font-heading);
    font-size: 3rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 12px;
}

.page-subtitle {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-color);
    opacity: 0.8;
}

.contact-container {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 40px;
    max-width: 1200px;
    margin: 0 auto;
}

/* Form Section */
.form-card {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 8px 24px rgba(34, 32, 30, 0.1);
}

.form-title {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 32px;
}

.form-group {
    margin-bottom: 24px;
}

.form-label {
    display: block;
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
}

.form-input,
.form-textarea {
    width: 100%;
    font-family: var(--font-body);
    font-size: 1rem;
    padding: 12px 16px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    background: var(--tertiary-color);
    color: var(--text-color);
    transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    background: var(--secondary-color);
}

.form-textarea {
    resize: vertical;
    min-height: 120px;
}

.submit-btn {
    width: 100%;
    background: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    padding: 14px 32px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.submit-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(252, 188, 5, 0.3);
}

.send-icon {
    width: 20px;
    height: 20px;
}

/* Info Section */
.info-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.info-card {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 4px 16px rgba(34, 32, 30, 0.08);
}

.info-title {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 24px;
}

/* Contact Methods */
.contact-methods {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.contact-item {
    display: flex;
    gap: 16px;
    align-items: flex-start;
}

.contact-icon {
    width: 44px;
    height: 44px;
    background: var(--primary-color);
    border: 2px solid var(--text-color);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.contact-icon svg {
    width: 22px;
    height: 22px;
    color: var(--text-color);
}

.contact-details {
    flex: 1;
}

.contact-label {
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.6;
    margin-bottom: 4px;
}

.contact-value {
    font-family: var(--font-body);
    font-size: 1.05rem;
    color: var(--text-color);
    text-decoration: none;
    display: block;
}

.contact-value:hover {
    color: var(--primary-color);
}

/* Hours List */
.hours-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.hours-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--text-color);
    opacity: 0.2;
}

.hours-item:last-child {
    border-bottom: none;
}

.day {
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
}

.time {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--text-color);
}

/* Response Card */
.response-card {
    text-align: center;
    background: var(--primary-color);
}

.response-icon {
    font-size: 3rem;
    margin-bottom: 16px;
}

.response-title {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 12px;
}

.response-text {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--text-color);
    margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .contact-container {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .contact-page {
        padding: 30px 20px;
        padding-top: 120px;
    }

    .page-title {
        font-size: 2.2rem;
    }

    .form-card,
    .info-card {
        padding: 24px;
    }

    .form-title,
    .info-title {
        font-size: 1.4rem;
    }
}
</style>
