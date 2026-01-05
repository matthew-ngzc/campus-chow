<template>
    <div class="play-page">
        <!-- Show game selection or active game -->
        <div v-if="!activeGame" class="game-selection">
            <!-- Mascot Section -->
            <div class="mascot-section">
                <div class="mascot-container">
                    <div class="mascot">🦕</div>
                </div>
            </div>

            <!-- Welcome Section -->
            <div class="welcome-section">
                <h1 class="welcome-title">
                    welcome to <span class="highlight">campus chow game zone!</span>
                </h1>
            </div>

            <!-- Games Container -->
            <div class="games-container">
                <h2 class="games-title">select a game to play!</h2>
                
                <div class="games-grid">
                    <!-- Spin The Wheel -->
                    <div class="game-card spin-wheel" @click="selectGame('spin-wheel')">
                        <div class="game-icon">
                            <div class="dino-icon">🦕</div>
                            <div class="wheel-icon">🎡</div>
                        </div>
                        <h3 class="game-name">Spin The Wheel</h3>
                    </div>

                    <!-- Poker Roulette -->
                    <div class="game-card poker" @click="selectGame('poker')">
                        <div class="game-icon">
                            <div class="dino-icon large">🦕</div>
                        </div>
                        <h3 class="game-name">Poker Roulette</h3>
                    </div>

                    <!-- Guess The Emojis -->
                    <div class="game-card emoji" @click="selectGame('emoji')">
                        <div class="game-icon">
                            <div class="dino-icon">🦕</div>
                            <div class="board-icon">📊</div>
                        </div>
                        <h3 class="game-name">Guess The Emojis</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Spin The Wheel Game -->
        <div v-else-if="activeGame === 'spin-wheel'" class="game-view">
            <div class="game-header">
                <button class="back-btn" @click="backToGames">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
                    </svg>
                    Back to Games
                </button>
                <h1 class="game-title">🦕 Spin The Wheel 🎡</h1>
            </div>

            <div class="spin-wheel-container">
                <!-- Wheel Container -->
                <div class="wheel-wrapper">
                    <div class="wheel-pointer">▼</div>
                    <svg 
                        class="wheel-svg" 
                        :class="{ spinning: isSpinning }"
                        :style="{ transform: `rotate(${rotation}deg)` }"
                        viewBox="0 0 500 500">
                        <g v-for="(merchant, index) in merchantsData" :key="index">
                            <!-- Segment Path -->
                            <path
                                :d="getSegmentPath(index)"
                                :fill="getSegmentColor(index)"
                                stroke="#22201E"
                                stroke-width="3"/>
                            <!-- Text -->
                            <text
                                :transform="getTextTransform(index)"
                                text-anchor="middle"
                                font-family="var(--font-body)"
                                font-size="16"
                                font-weight="700"
                                fill="#22201E">
                                {{ merchant.name }}
                            </text>
                        </g>
                    </svg>
                </div>

                <!-- Spin Button -->
                <button 
                    class="spin-btn" 
                    @click="spinWheel"
                    :disabled="isSpinning">
                    {{ isSpinning ? 'Spinning...' : 'Spin!' }}
                </button>

                <!-- Result -->
                <div v-if="winner" class="result">
                    <h2>🎉 You won!</h2>
                    <p class="winner-name">{{ winner }}</p>
                    <p class="winner-message">Yay! Time to order from {{ winner }}!</p>
                </div>
            </div>
        </div>

        <!-- Guess The Emoji Game -->
        <div v-else-if="activeGame === 'emoji'" class="game-view">
            <div class="game-header">
                <button class="back-btn" @click="backToGames">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
                    </svg>
                    Back to Games
                </button>
                <h1 class="game-title">🦕 Guess The Emojis 🎯</h1>
            </div>

            <div class="emoji-game-container">
                <h2 class="emoji-game-title">Guess the Merchant with the Following Emojis!</h2>
                
                <!-- Emojis -->
                <div class="emoji-display">
                    {{ currentMerchant?.emojis }}
                </div>

                <!-- Word Display -->
                <div class="word-display">
                    <div v-for="(char, index) in getDisplayName()" :key="index" class="letter-box">
                        <span v-if="char === ' '" class="space"></span>
                        <span v-else-if="char === '-'" class="dash">-</span>
                        <span v-else class="letter">{{ char }}</span>
                    </div>
                </div>

                <!-- Letter Buttons -->
                <div class="letter-buttons">
                    <button 
                        v-for="letter in allLetters" 
                        :key="letter"
                        @click="guessLetter(letter)"
                        :disabled="guessedLetters.includes(letter) || wrongLetters.includes(letter) || gameWon || gameLost"
                        :class="{ 
                            'correct': guessedLetters.includes(letter),
                            'wrong': wrongLetters.includes(letter)
                        }"
                        class="letter-btn">
                        {{ letter }}
                    </button>
                </div>

                <!-- Game Status -->
                <div v-if="gameWon" class="game-result win">
                    <h3>🎉 Correct!</h3>
                    <p>The answer was: <strong>{{ currentMerchant?.name }}</strong></p>
                    <button class="play-again-btn" @click="resetEmojiGame">Play Again</button>
                </div>

                <div v-if="gameLost" class="game-result lose">
                    <h3>😅 Game Over!</h3>
                    <p>The answer was: <strong>{{ currentMerchant?.name }}</strong></p>
                    <button class="play-again-btn" @click="resetEmojiGame">Try Again</button>
                </div>

                <div v-if="!gameWon && !gameLost" class="wrong-count">
                    Wrong guesses: {{ wrongLetters.length }} / 6
                </div>
            </div>
        </div>

        <!-- Other Games (Coming Soon) -->
        <div v-else class="game-view">
            <div class="game-header">
                <button class="back-btn" @click="backToGames">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
                    </svg>
                    Back to Games
                </button>
                <h1 class="game-title">🦕 Coming Soon! 🎮</h1>
            </div>
            <div class="coming-soon-container">
                <div class="mascot">🦕</div>
                <h2>This game is coming soon!</h2>
                <p>Stay tuned for more fun games.</p>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
    name: 'PlayPage',
    setup() {
        const activeGame = ref(null)
        const isSpinning = ref(false)
        const rotation = ref(0)
        const winner = ref(null)

        // Merchants with emoji hints, modifiable at any time
        const merchantsData = ref([
            { name: 'Western Food', emojis: '🍔🌭🥓' },
            { name: 'Drinks', emojis: '🥤☕🧋' },
            { name: 'McDonalds', emojis: '🍔🍟🤡' },
            { name: 'Toast Box', emojis: '🍞📦☕' },
            { name: 'Braek', emojis: '🥐☕✨' },
            { name: 'Koufu - SMU', emojis: '🍜🏫🎓' },
            { name: 'Supergreen', emojis: '🥗💚🌱' },
            { name: 'Luckin', emojis: '☕🦌💙' },
            { name: 'Chagee', emojis: '🧋🍵🌸' },
            { name: 'Wok Hey', emojis: '🍜🔥🥢' }
        ])

        // Emoji game state
        const currentMerchant = ref(null)
        const guessedLetters = ref([])
        const wrongLetters = ref([])
        const gameWon = ref(false)
        const gameLost = ref(false)
        const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

        const selectGame = (game) => {
            activeGame.value = game
            winner.value = null
            rotation.value = 0
            
            // Start emoji game if selected
            if (game === 'emoji') {
                startEmojiGame()
            }
        }

        const backToGames = () => {
            activeGame.value = null
            winner.value = null
            rotation.value = 0
            // Reset emoji game
            currentMerchant.value = null
            guessedLetters.value = []
            wrongLetters.value = []
            gameWon.value = false
            gameLost.value = false
        }

        const getSegmentColor = (index) => {
            const colors = ['#FCBC05', '#FCA505', '#FC8E05', '#FD7702']
            return colors[index % colors.length]
        }

        const getSegmentPath = (index) => {
            const totalSegments = merchantsData.value.length
            const angle = 360 / totalSegments
            const startAngle = (angle * index - 90) * (Math.PI / 180)
            const endAngle = (angle * (index + 1) - 90) * (Math.PI / 180)
            
            const x1 = 250 + 240 * Math.cos(startAngle)
            const y1 = 250 + 240 * Math.sin(startAngle)
            const x2 = 250 + 240 * Math.cos(endAngle)
            const y2 = 250 + 240 * Math.sin(endAngle)
            
            const largeArcFlag = angle > 180 ? 1 : 0
            
            return `M 250 250 L ${x1} ${y1} A 240 240 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
        }

        const getTextTransform = (index) => {
            const totalSegments = merchantsData.value.length
            const angle = 360 / totalSegments
            const textAngle = angle * index + angle / 2
            const radius = 160
            
            const x = 250 + radius * Math.cos((textAngle - 90) * (Math.PI / 180))
            const y = 250 + radius * Math.sin((textAngle - 90) * (Math.PI / 180))
            
            return `translate(${x}, ${y}) rotate(${textAngle})`
        }

        const spinWheel = () => {
            if (isSpinning.value) return

            isSpinning.value = true
            winner.value = null

            // Random spins between 5-8 full rotations + random angle
            const spins = 5 + Math.random() * 3
            const randomAngle = Math.random() * 360
            const totalRotation = rotation.value + (spins * 360) + randomAngle

            rotation.value = totalRotation

            // Calculate winner after spin
            setTimeout(() => {
                isSpinning.value = false
                const segmentAngle = 360 / merchantsData.value.length
                const normalizedRotation = totalRotation % 360
                const winnerIndex = Math.floor((360 - normalizedRotation + (segmentAngle / 2)) / segmentAngle) % merchantsData.value.length
                winner.value = merchantsData.value[winnerIndex].name
            }, 4000)
        }

        // Emoji Game Methods
        const startEmojiGame = () => {
            const randomIndex = Math.floor(Math.random() * merchantsData.value.length)
            currentMerchant.value = merchantsData.value[randomIndex]
            guessedLetters.value = []
            wrongLetters.value = []
            gameWon.value = false
            gameLost.value = false
        }

        const guessLetter = (letter) => {
            if (guessedLetters.value.includes(letter) || wrongLetters.value.includes(letter)) {
                return // Already guessed
            }

            const merchantName = currentMerchant.value.name.toUpperCase()
            if (merchantName.includes(letter)) {
                guessedLetters.value.push(letter)
                
                // Check if won
                const allLetters = merchantName.split('').filter(l => l !== ' ' && l !== '-')
                const allGuessed = allLetters.every(l => guessedLetters.value.includes(l))
                if (allGuessed) {
                    gameWon.value = true
                }
            } else {
                wrongLetters.value.push(letter)
                if (wrongLetters.value.length >= 6) {
                    gameLost.value = true
                }
            }
        }

        const getDisplayName = () => {
            if (!currentMerchant.value) return ''
            
            return currentMerchant.value.name.split('').map(char => {
                if (char === ' ') return ' '
                if (char === '-') return '-'
                return guessedLetters.value.includes(char.toUpperCase()) ? char : '_'
            }).join('')
        }

        const resetEmojiGame = () => {
            startEmojiGame()
        }

        return {
            activeGame,
            isSpinning,
            rotation,
            winner,
            merchantsData,
            selectGame,
            backToGames,
            getSegmentColor,
            getSegmentPath,
            getTextTransform,
            spinWheel,
            // Variables for emoji game
            currentMerchant,
            guessedLetters,
            wrongLetters,
            gameWon,
            gameLost,
            startEmojiGame,
            guessLetter,
            getDisplayName,
            resetEmojiGame,
            allLetters
        }
    }
})
</script>

<style scoped>
.play-page {
    min-height: 100vh;
    background: var(--tertiary-color);
    padding: 50px 40px;
    padding-top: 140px;
}

/* Game Selection View */
.game-selection .mascot-section {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}

.mascot-container {
    position: relative;
}

.mascot {
    font-size: 8rem;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}

.welcome-section {
    text-align: center;
    margin-bottom: 60px;
}

.welcome-title {
    font-family: var(--font-heading);
    font-size: 3rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
}

.highlight {
    color: var(--text-color);
}

.games-container {
    max-width: 1200px;
    margin: 0 auto;
    background: var(--secondary-color);
    border: 3px solid var(--text-color);
    border-radius: 32px;
    padding: 60px 40px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.games-title {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    text-align: center;
    margin-bottom: 50px;
}

.games-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    max-width: 900px;
    margin: 0 auto;
}

.game-card {
    background: var(--secondary-color);
    border: 3px solid var(--text-color);
    border-radius: 24px;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.game-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.game-card.spin-wheel:hover {
    background: #FCBC05;
}

.game-card.poker:hover {
    background: #A78BFA;
}

.game-card.emoji:hover {
    background: #FB923C;
}

.game-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;
}

.dino-icon {
    font-size: 3.5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.dino-icon.large {
    font-size: 5rem;
}

.wheel-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.board-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.game-name {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    text-align: center;
    margin: 0;
}

/* Game View */
.game-view {
    max-width: 1200px;
    margin: 0 auto;
}

.game-header {
    margin-bottom: 40px;
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--secondary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    padding: 12px 24px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
}

.back-btn:hover {
    background: var(--primary-color);
    transform: translateY(-2px);
}

.back-btn svg {
    width: 20px;
    height: 20px;
}

.game-title {
    font-family: var(--font-heading);
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-color);
    text-align: center;
    margin: 0;
}

/* Spin The Wheel */
.spin-wheel-container {
    background: var(--secondary-color);
    border: 3px solid var(--text-color);
    border-radius: 32px;
    padding: 60px 40px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
}

.wheel-wrapper {
    position: relative;
    width: 500px;
    height: 500px;
}

.wheel-pointer {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 3rem;
    color: #991b1b;
    z-index: 10;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.wheel-svg {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 8px solid var(--text-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
    background: white;
}

.wheel-svg.spinning {
    transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.spin-btn {
    background: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-heading);
    font-size: 1.8rem;
    font-weight: 700;
    padding: 20px 60px;
    border: 3px solid var(--text-color);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 16px rgba(252, 188, 5, 0.3);
}

.spin-btn:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 12px 24px rgba(252, 188, 5, 0.4);
}

.spin-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.result {
    text-align: center;
    background: var(--primary-color);
    border: 3px solid var(--text-color);
    border-radius: 20px;
    padding: 32px 40px;
    max-width: 500px;
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.result h2 {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 16px;
}

.winner-name {
    font-family: var(--font-heading);
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 12px;
}

.winner-message {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-color);
    margin: 0;
}

/* Emoji Game */
.emoji-game-container {
    background: var(--secondary-color);
    border: 3px solid var(--text-color);
    border-radius: 32px;
    padding: 60px 40px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
}

.emoji-game-title {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    text-align: center;
    margin: 0;
}

.emoji-display {
    font-size: 5rem;
    text-align: center;
    margin: 20px 0;
}

.word-display {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin: 20px 0;
}

.letter-box {
    width: 50px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--tertiary-color);
    border: 3px solid var(--text-color);
    border-radius: 12px;
}

.letter-box .letter {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    text-transform: uppercase;
}

.letter-box .dash {
    font-size: 2rem;
    color: var(--text-color);
}

.letter-box .space {
    width: 20px;
    background: transparent;
    border: none;
}

.letter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    max-width: 600px;
}

.letter-btn {
    width: 50px;
    height: 50px;
    font-family: var(--font-heading);
    font-size: 1.3rem;
    font-weight: 700;
    background: var(--primary-color);
    color: var(--text-color);
    border: 3px solid var(--text-color);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.letter-btn:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(252, 188, 5, 0.4);
}

.letter-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.letter-btn.correct {
    background: #10b981;
    border-color: #059669;
}

.letter-btn.wrong {
    background: #ef4444;
    border-color: #dc2626;
}

.game-result {
    text-align: center;
    padding: 40px;
    border-radius: 20px;
    border: 3px solid var(--text-color);
    animation: slideIn 0.5s ease-out;
}

.game-result.win {
    background: #10b981;
}

.game-result.lose {
    background: #ef4444;
}

.game-result h3 {
    font-family: var(--font-heading);
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin-bottom: 16px;
}

.game-result p {
    font-family: var(--font-body);
    font-size: 1.3rem;
    color: white;
    margin-bottom: 24px;
}

.play-again-btn {
    background: white;
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    padding: 14px 40px;
    border: 3px solid var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.play-again-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.wrong-count {
    font-family: var(--font-body);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color);
}

/* Coming Soon */
.coming-soon-container {
    background: var(--secondary-color);
    border: 3px solid var(--text-color);
    border-radius: 32px;
    padding: 80px 40px;
    text-align: center;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.coming-soon-container .mascot {
    font-size: 8rem;
    margin-bottom: 20px;
}

.coming-soon-container h2 {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 12px;
}

.coming-soon-container p {
    font-family: var(--font-body);
    font-size: 1.1rem;
    color: var(--text-color);
    opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .games-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .game-card:last-child {
        grid-column: 1 / -1;
        max-width: 400px;
        margin: 0 auto;
    }

    .wheel-wrapper {
        width: 400px;
        height: 400px;
    }

    .wheel-svg text {
        font-size: 14px;
    }
}

@media (max-width: 768px) {
    .play-page {
        padding: 30px 20px;
        padding-top: 120px;
    }

    .game-selection .mascot {
        font-size: 5rem;
    }

    .welcome-title {
        font-size: 2rem;
    }

    .games-container,
    .spin-wheel-container,
    .coming-soon-container,
    .emoji-game-container {
        padding: 40px 24px;
    }

    .games-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .game-card:last-child {
        grid-column: auto;
        max-width: 100%;
    }

    .game-card {
        padding: 32px 20px;
    }

    .dino-icon {
        font-size: 2.5rem;
    }

    .dino-icon.large {
        font-size: 3.5rem;
    }

    .wheel-icon,
    .board-icon {
        font-size: 2rem;
    }

    .game-name {
        font-size: 1.3rem;
    }

    .game-title {
        font-size: 1.8rem;
    }

    .wheel-wrapper {
        width: 300px;
        height: 300px;
    }

    .wheel-svg text {
        font-size: 12px;
    }

    .spin-btn {
        font-size: 1.5rem;
        padding: 16px 40px;
    }

    .result {
        padding: 24px 20px;
    }

    .winner-name {
        font-size: 2rem;
    }

    .emoji-display {
        font-size: 3.5rem;
    }

    .letter-box {
        width: 40px;
        height: 50px;
    }

    .letter-box .letter {
        font-size: 1.5rem;
    }

    .letter-btn {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
    }

    .emoji-game-title {
        font-size: 1.5rem;
    }
}
</style>
