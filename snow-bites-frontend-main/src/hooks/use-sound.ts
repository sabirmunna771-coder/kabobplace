import { getAudioContextConstructor } from "@/lib/audio-context";

/**
 * Minimalist sound effects hook using Web Audio API
 * Creates lightweight, performant audio feedback
 */

export const useSound = () => {
  const playAddToCart = () => {
    try {
      const Ctx = getAudioContextConstructor();
      const audioContext = new Ctx();

      // Create oscillator for the beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency and waveform
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.15);

      // Create envelope (attack, decay)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      // Silently fail if audio context is not available (some browsers/users may have restrictions)
      console.debug('Audio context unavailable');
    }
  };

  return { playAddToCart };
};
