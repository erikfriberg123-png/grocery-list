import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Web Audio API context — lazily created, reused across calls.
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  const Ctor = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!_ctx) _ctx = new Ctor() as AudioContext;
  return _ctx;
}

async function getCtxReady(): Promise<AudioContext | null> {
  const c = getCtx();
  if (!c) return null;
  if (c.state === 'suspended') await c.resume();
  return c;
}

function tone(
  c: AudioContext,
  freq: number,
  durationSec: number,
  startSec: number,
  volume = 0.22,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startSec);
  gain.gain.linearRampToValueAtTime(volume, startSec + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, startSec + durationSec);
  osc.start(startSec);
  osc.stop(startSec + durationSec);
}

/** Two-note upward pop — played when an item is added. */
export async function soundAdd() {
  const c = await getCtxReady();
  if (c) {
    const t = c.currentTime;
    tone(c, 523, 0.07, t);         // C5
    tone(c, 784, 0.09, t + 0.055); // G5
  } else {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Rising two-note chime — played when an item is checked off. */
export async function soundCheck() {
  const c = await getCtxReady();
  if (c) {
    const t = c.currentTime;
    tone(c, 784, 0.10, t);          // G5
    tone(c, 1047, 0.15, t + 0.075); // C6
  } else {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/** Soft single tick — played when a drag-and-drop reorder completes. */
export async function soundReorder() {
  const c = await getCtxReady();
  if (c) {
    tone(c, 392, 0.06, c.currentTime, 0.15); // G4, quieter
  } else {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}
