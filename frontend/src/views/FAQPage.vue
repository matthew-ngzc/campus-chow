<template>
    <div class="faq-page">
        <!-- Header Section -->
        <div class="header-section">
            <div class="header-accent"></div>
            <h1 class="page-title">Frequently Asked Questions</h1>
            <p class="page-subtitle">Find answers to common questions about Campus Chow</p>
        </div>

        <!-- Search Box -->
        <div class="search-container">
            <div class="search-box">
                <svg class="search-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Search for answers..." 
                    class="search-input" 
                />
            </div>
        </div>

        <!-- FAQ Categories -->
        <div class="categories">
            <button 
                v-for="category in categories" 
                :key="category.id"
                @click="selectedCategory = category.id"
                class="category-btn"
                :class="{ active: selectedCategory === category.id }">
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
            </button>
        </div>

        <!-- FAQ List -->
        <div class="faq-container">
            <div v-if="filteredFaqs.length === 0" class="no-results">
                <p>No FAQs found. Try a different search or category.</p>
            </div>
            <div v-else class="faq-list">
                <div v-for="(faq, index) in filteredFaqs" :key="faq.id" class="faq-item">
                    <div class="faq-question" @click="toggleFaq(index)">
                        <div class="question-left">
                            <span class="question-icon">{{ faq.icon }}</span>
                            <h3 class="question-text">{{ faq.question }}</h3>
                        </div>
                        <svg 
                            class="chevron-icon" 
                            :class="{ rotated: openFaqs.includes(index) }"
                            fill="currentColor" 
                            viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <transition name="slide-fade">
                        <div v-show="openFaqs.includes(index)" class="faq-answer">
                            <p>{{ faq.answer }}</p>
                        </div>
                    </transition>
                </div>
            </div>
        </div>

        <!-- Still Have Questions -->
        <div class="help-section">
            <h2 class="help-title">Still have questions?</h2>
            <p class="help-text">Can't find what you're looking for? Our support team is here to help!</p>
            <router-link to="/contact">
                <button class="contact-btn">Contact Support</button>
            </router-link>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
    name: 'FAQPage',
    setup() {
        const searchQuery = ref('')
        const selectedCategory = ref('all')
        const openFaqs = ref([])

        const categories = [
            { id: 'all', name: 'All', icon: '📚' },
            { id: 'ordering', name: 'Ordering', icon: '🛒' },
            { id: 'delivery', name: 'Delivery', icon: '🚚' },
            { id: 'payment', name: 'Payment', icon: '💳' },
            { id: 'account', name: 'Account', icon: '👤' }
        ]

        const faqs = [
            {
                id: 1,
                category: 'ordering',
                icon: '🛒',
                question: 'How do I place an order?',
                answer: 'To place an order, simply browse available restaurants on the Order page, select your items, add them to your cart, and proceed to checkout. You can specify delivery instructions and preferred delivery time before confirming.'
            },
            {
                id: 2,
                category: 'ordering',
                icon: '⏰',
                question: 'What are the operating hours?',
                answer: 'Campus Chow operates during SMU campus hours, typically from 8:00 AM to 10:00 PM on weekdays and 10:00 AM to 9:00 PM on weekends. Individual restaurant hours may vary.'
            },
            {
                id: 3,
                category: 'ordering',
                icon: '💰',
                question: 'Is there a minimum order amount?',
                answer: 'Most restaurants have a minimum order amount of $5-$10. The specific minimum will be displayed when you select a restaurant.'
            },
            {
                id: 4,
                category: 'ordering',
                icon: '❌',
                question: 'Can I cancel my order?',
                answer: 'You can cancel your order within 2 minutes of placing it without any charges. After that, cancellation depends on whether the restaurant has started preparing your food.'
            },
            {
                id: 5,
                category: 'delivery',
                icon: '🚚',
                question: 'How long does delivery take?',
                answer: 'Typical delivery times range from 15-30 minutes, depending on the restaurant\'s preparation time and current order volume. You can track your order in real-time on the Active Orders page.'
            },
            {
                id: 6,
                category: 'delivery',
                icon: '📍',
                question: 'Where can I get my food delivered?',
                answer: 'We currently deliver to all SMU campus buildings and designated outdoor areas. When placing an order, you can select your building and specify your exact location (e.g., classroom number, library floor).'
            },
            {
                id: 7,
                category: 'delivery',
                icon: '🎒',
                question: 'Can I become a delivery partner?',
                answer: 'Yes! Students can sign up to become delivery partners and earn money between classes. Visit your Profile page to learn more about becoming a delivery partner.'
            },
            {
                id: 8,
                category: 'delivery',
                icon: '🔔',
                question: 'How will I know when my order arrives?',
                answer: 'You\'ll receive notifications via SMS and email at each stage of your order (confirmed, preparing, out for delivery, arrived). Make sure notifications are enabled in your account settings.'
            },
            {
                id: 9,
                category: 'payment',
                icon: '💳',
                question: 'What payment methods are accepted?',
                answer: 'We accept all major credit and debit cards, campus meal plans, and digital wallets like Apple Pay and Google Pay. You can save multiple payment methods in your account for faster checkout.'
            },
            {
                id: 10,
                category: 'payment',
                icon: '💵',
                question: 'Are there any delivery fees?',
                answer: 'Delivery fees are typically $1-$2 per order, depending on the distance and time of day. The exact fee will be shown before you confirm your order.'
            },
            {
                id: 11,
                category: 'payment',
                icon: '🎁',
                question: 'Do you offer student discounts?',
                answer: 'Yes! Many of our partner restaurants offer exclusive student discounts. Look for the "Student Deal" badge when browsing restaurants. We also run weekly promotions and loyalty rewards.'
            },
            {
                id: 12,
                category: 'payment',
                icon: '🔐',
                question: 'Is my payment information secure?',
                answer: 'Absolutely! We use industry-standard encryption to protect your payment information. We never store your full card details on our servers.'
            },
            {
                id: 13,
                category: 'account',
                icon: '👤',
                question: 'How do I create an account?',
                answer: 'Click the "Sign Up" button on our homepage and provide your student email, create a password, and verify your account. You\'ll need a valid campus email address to register.'
            },
            {
                id: 14,
                category: 'account',
                icon: '🔑',
                question: 'I forgot my password. What should I do?',
                answer: 'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a secure link to reset your password. Check your spam folder if you don\'t see the email.'
            },
            {
                id: 15,
                category: 'account',
                icon: '⭐',
                question: 'How does the rating system work?',
                answer: 'After each order is completed, you can rate your experience from 1-5 stars and leave a review. Ratings help other students discover great food and help restaurants improve their service.'
            },
            {
                id: 16,
                category: 'account',
                icon: '🏆',
                question: 'What are reward points?',
                answer: 'Reward points are earned with every order and by completing challenges. You can redeem points for discounts on future orders or exclusive perks. Check your Profile to see your current points balance.'
            }
        ]

        const filteredFaqs = computed(() => {
            let filtered = faqs

            // Filter by category
            if (selectedCategory.value !== 'all') {
                filtered = filtered.filter(faq => faq.category === selectedCategory.value)
            }

            // Filter by search query
            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase()
                filtered = filtered.filter(faq => 
                    faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query)
                )
            }

            return filtered
        })

        const toggleFaq = (index) => {
            const position = openFaqs.value.indexOf(index)
            if (position > -1) {
                openFaqs.value.splice(position, 1)
            } else {
                openFaqs.value.push(index)
            }
        }

        return {
            searchQuery,
            selectedCategory,
            categories,
            filteredFaqs,
            openFaqs,
            toggleFaq
        }
    }
})
</script>

<style scoped>
.faq-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 50px 40px;
    padding-top: 140px;
}

.header-section {
    text-align: center;
    margin-bottom: 50px;
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

/* Search Box */
.search-container {
    max-width: 600px;
    margin: 0 auto 40px;
}

.search-box {
    position: relative;
}

.search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: var(--text-color);
    opacity: 0.5;
}

.search-input {
    width: 100%;
    font-family: var(--font-body);
    font-size: 1rem;
    padding: 14px 18px 14px 50px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    background: var(--tertiary-color);
    color: var(--text-color);
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: var(--secondary-color);
}

/* Categories */
.categories {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 50px;
    flex-wrap: wrap;
}

.category-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    padding: 12px 24px;
    border: 2px solid var(--text-color);
    border-radius: 20px;
    background: var(--tertiary-color);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.3s ease;
}

.category-btn:hover {
    background: var(--primary-color);
    transform: translateY(-2px);
}

.category-btn.active {
    background: var(--primary-color);
    border-color: var(--text-color);
}

.category-icon {
    font-size: 1.2rem;
}

/* FAQ Container */
.faq-container {
    max-width: 900px;
    margin: 0 auto 60px;
}

.no-results {
    text-align: center;
    padding: 60px 20px;
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 16px;
}

.no-results p {
    font-family: var(--font-body);
    font-size: 1.1rem;
    color: var(--text-color);
    opacity: 0.7;
    margin: 0;
}

.faq-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.faq-item {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.faq-item:hover {
    box-shadow: 0 4px 16px rgba(34, 32, 30, 0.1);
}

.faq-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.faq-question:hover {
    background: var(--tertiary-color);
}

.question-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.question-icon {
    font-size: 1.8rem;
    flex-shrink: 0;
}

.question-text {
    font-family: var(--font-heading);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.chevron-icon {
    width: 24px;
    height: 24px;
    color: var(--text-color);
    transition: transform 0.3s ease;
    flex-shrink: 0;
}

.chevron-icon.rotated {
    transform: rotate(180deg);
}

.faq-answer {
    padding: 0 28px 24px 68px;
}

.faq-answer p {
    font-family: var(--font-body);
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--text-color);
    opacity: 0.85;
    margin: 0;
}

/* Transitions */
.slide-fade-enter-active {
    transition: all 0.3s ease;
}

.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from {
    transform: translateY(-10px);
    opacity: 0;
}

.slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}

/* Help Section */
.help-section {
    text-align: center;
    padding: 60px 40px;
    background: var(--primary-color);
    border: 2px solid var(--text-color);
    border-radius: 24px;
}

.help-title {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 12px;
}

.help-text {
    font-family: var(--font-body);
    font-size: 1.15rem;
    color: var(--text-color);
    margin-bottom: 28px;
}

.contact-btn {
    background: var(--text-color);
    color: var(--primary-color);
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    padding: 14px 40px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.contact-btn:hover {
    background: transparent;
    color: var(--text-color);
    transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
    .faq-page {
        padding: 30px 20px;
        padding-top: 120px;
    }

    .page-title {
        font-size: 2.2rem;
    }

    .categories {
        gap: 8px;
    }

    .category-btn {
        padding: 10px 16px;
        font-size: 0.9rem;
    }

    .faq-question {
        padding: 20px;
    }

    .question-icon {
        font-size: 1.5rem;
    }

    .question-text {
        font-size: 1.05rem;
    }

    .faq-answer {
        padding: 0 20px 20px 56px;
    }

    .help-section {
        padding: 40px 24px;
    }

    .help-title {
        font-size: 1.6rem;
    }
}
</style>
