<script setup>
import { readonly, computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const data = readonly(
  /** @type {{ steps: string[]; currentStep: number; activeColor: string; passiveColor: string }} */
  props.data
)

const cssStyle = computed(() => ({
  '--active-color': data.activeColor,
  '--passive-color': data.passiveColor
}))
</script>

<template>
  <div class="timeline-wrapper">
    <div class="steps-container" :style="cssStyle">
      <ul class="steps-list">
        <li
          v-for="(step, index) in data.steps"
          :key="index"
          class="step"
          :class="{
            'step-active': index === data.currentStep - 1,
            'step-done': index < data.currentStep - 1
          }"
        >
          <div class="step-content">
            <div class="step-bubble">
              <svg 
                v-if="index < data.currentStep - 1" 
                class="check-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="step-label">{{ step }}</div>
          </div>
          <div v-if="index < data.steps.length - 1" class="step-line"></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Wrapper */
.timeline-wrapper {
  width: 100%;
  padding: 20px 0;
  animation: fadeInUp 0.6s ease-out;
}

.steps-container {
  max-width: 900px;
  margin: 0 auto;
  background: var(--tertiary-color);
  border: 2px solid var(--text-color);
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 4px 12px rgba(34, 32, 30, 0.1);
}

/* Steps List */
.steps-list {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
  justify-content: space-between;
  align-items: flex-start;
}

/* Individual Step */
.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  position: relative;
}

/* Step Bubble */
.step-bubble {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--secondary-color);
  border: 3px solid var(--passive-color);
  color: var(--passive-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 800;
  transition: all 0.4s ease;
  position: relative;
}

/* Check Icon */
.check-icon {
  width: 28px;
  height: 28px;
  stroke-width: 3;
}

/* Step Label */
.step-label {
  margin-top: 12px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--passive-color);
  transition: all 0.4s ease;
  text-align: center;
  max-width: 120px;
  line-height: 1.3;
}

/* Connecting Line */
.step-line {
  position: absolute;
  top: 28px;
  left: calc(50% + 28px);
  width: calc(100% - 56px);
  height: 4px;
  background: var(--passive-color);
  z-index: 1;
  border-radius: 2px;
  transition: all 0.4s ease;
}

/* Active Step Styles */
.step-active .step-bubble {
  background: var(--active-color);
  border-color: var(--text-color);
  color: var(--text-color);
  box-shadow: 0 0 0 6px rgba(252, 188, 5, 0.2);
  transform: scale(1.1);
}

.step-active .step-label {
  color: var(--active-color);
  font-weight: 700;
}

/* Completed Step Styles */
.step-done .step-bubble {
  background: var(--active-color);
  border-color: var(--text-color);
  color: var(--text-color);
}

.step-done .step-label {
  color: var(--active-color);
  font-weight: 700;
}

.step-done .step-line {
  background: var(--active-color);
}

/* Fade in animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .steps-container {
    padding: 24px 16px;
  }

  .step-bubble {
    width: 48px;
    height: 48px;
    font-size: 1.1rem;
  }

  .check-icon {
    width: 24px;
    height: 24px;
  }

  .step-label {
    font-size: 0.8rem;
    max-width: 90px;
  }

  .step-line {
    top: 24px;
    left: calc(50% + 24px);
    width: calc(100% - 48px);
    height: 3px;
  }
}

@media (max-width: 480px) {
  .steps-container {
    padding: 20px 12px;
  }

  .steps-list {
    gap: 8px;
  }

  .step-bubble {
    width: 40px;
    height: 40px;
    font-size: 1rem;
    border-width: 2px;
  }

  .check-icon {
    width: 20px;
    height: 20px;
  }

  .step-label {
    font-size: 0.7rem;
    max-width: 70px;
    margin-top: 8px;
  }

  .step-line {
    top: 20px;
    left: calc(50% + 20px);
    width: calc(100% - 40px);
    height: 2px;
  }
}
</style>