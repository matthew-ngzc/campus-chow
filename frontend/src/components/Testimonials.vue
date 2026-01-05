<script setup>
import { onMounted, ref } from "vue";
import { Carousel } from "bootstrap";

// this is to import images using '@/' if using dynamic imports for images in assets folder
// alternative way is to place images in public folder (outside of src folder) and reference them with absolute paths eg. /images/john.jpg
import firstReview from '../assets/images/matt.jpg';
import secondReview from '../assets/images/shiv.jpeg';
import thirdReview from '../assets/images/yanghwee.jpg';

const carouselElement = ref(null);
const testimonials = ref([
    {
        id: 1,
        text: "No excuses to be late for class now. Try it out!",
        author: "Li Hui",
        image: firstReview,
    },
    {
        id: 2,
        text: "Simple, elegant solution that solves all hunger problems in SMU. Love it.",
        author: "Daniel Lee",
        image: secondReview,
    },
    {
        id: 3,
        text: "I can now get access to the best foods in campus!",
        author: "Glenn",
        image: thirdReview,
    },
]);

onMounted(() => {
    new Carousel(carouselElement.value, {
        interval: 9000,
        touch: true,
    });
});
</script>

<template>
    <div class="testimonial-carousel container">
        <div id="testimonialCarousel" ref="carouselElement" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
                <div v-for="(testimonial, index) in testimonials" :key="testimonial.id" class="carousel-item" :class="{ active: index === 0 }">
                    <div class="testimonial-content text-center p-4">
                        <div class="testimonial-image mb-3">
                            <img :src="testimonial.image" :alt="testimonial.author" class="rounded-circle" />
                        </div>
                        <p class="quote"> "{{ testimonial.text }}" </p>
                        <div class="testimonial-author">
                            <h6 class="fw-bold">{{ testimonial.author }}</h6>
                        </div>
                    </div>
                </div>
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        </div>
    </div>    
</template>

<style scoped>
.testimonial-carousel {
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  height: auto;
}

.carousel-inner {
  height: 100%;
  position: relative;
}

.carousel-item {
  height: 100%;
  display: flex !important;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.testimonial-content {
  max-width: 600px;
  width: 100%; /* make width consistent */
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.testimonial-image img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border: 4px solid #4a4a4a;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.testimonial-image img:hover {
  transform: scale(1.05) rotate(3deg);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.quote {
  font-size: 1.25rem;
  font-weight: 300;
  line-height: 1.6;
  color: #000;
  font-style: italic;
  min-height: 80px;
  margin-top: 1rem;
}

.testimonial-author h4,
.testimonial-author h6 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #000;
  margin-top: 1rem;
}

/* Arrows */
.carousel-control-prev,
.carousel-control-next {
  width: 30px;
  height: 30px;
  background-color: rgba(0, 0, 0, 1);
  border-radius: 50%;
  opacity: 0.8;
  transition: all 0.3s ease;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.carousel-control-prev {
  left: 20px; /* consistent horizontal distance from edge */
}

.carousel-control-next {
  right: 20px;
}

.carousel-control-prev:hover,
.carousel-control-next:hover {
  background-color: rgba(0, 0, 0, 0.7);
  opacity: 1;
}

.carousel-control-prev-icon,
.carousel-control-next-icon {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .testimonial-content {
    padding: 1rem;
  }

  .quote {
    font-size: 1rem;
  }

  .testimonial-author h4,
  .testimonial-author h6 {
    font-size: 1rem;
  }

  .carousel-control-prev,
  .carousel-control-next {
    left: 10px;
    right: 10px;
  }
}

.carousel-item:not(.active) {
  display: none !important;
}

</style>