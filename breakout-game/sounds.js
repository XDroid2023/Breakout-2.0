// Create audio context for sound effects
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Function to create a simple sound
function createSound(frequency, type, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    return {
        play: () => {
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        }
    };
}

// Create different sound effects
const sounds = {
    miss: createSound(200, 'sine', 0.3),
    brick: createSound(400, 'sine', 0.1),
    paddle: createSound(300, 'sine', 0.1),
    levelComplete: createSound(600, 'square', 0.2),
    gameOver: (() => {
        const duration = 0.5;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        return {
            play: () => {
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + duration);
            }
        };
    })()
};
