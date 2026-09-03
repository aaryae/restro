/**
 * POS feedback beeps.
 * Uses Vite-bundled mp3 URLs plus a Web Audio chirp fallback so a click
 * always produces sound even if the file fails to load.
 */

import beepUrl from "@/assets/audio/beep.mp3";
import deleteBeepUrl from "@/assets/audio/DeleteBeep.mp3";

const ADD_SRC = typeof beepUrl === "string" ? beepUrl : "/audio/beep.mp3";
const DELETE_SRC =
  typeof deleteBeepUrl === "string" ? deleteBeepUrl : "/audio/DeleteBeep.mp3";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Short synthesized chirp — works even when mp3 fetch is blocked. */
function playChirp(kind: "add" | "delete") {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(kind === "add" ? 920 : 420, now);
  if (kind === "add") {
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
  } else {
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "add" ? 0.09 : 0.11));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + (kind === "add" ? 0.1 : 0.12));
}

function playMp3(src: string) {
  try {
    const el = new Audio(src);
    el.volume = 1;
    el.muted = false;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch(() => {
        // ignore — chirp already fired
      });
    }
  } catch {
    // ignore
  }
}

function play(kind: "add" | "delete") {
  if (typeof window === "undefined") return;
  // Chirp first (same click stack, no network). Mp3 layers on top when available.
  try {
    playChirp(kind);
  } catch {
    // ignore
  }
  playMp3(kind === "add" ? ADD_SRC : DELETE_SRC);
}

/** Call from any user gesture to unlock AudioContext early. */
export function unlockPosBeeps() {
  getAudioContext();
}

/** Tap selling item / add / increase qty / create order. */
export function playPosAddBeep() {
  play("add");
}

/** Remove line / decrease to zero. */
export function playPosDeleteBeep() {
  play("delete");
}
