type SpeechRole = "jic" | "statement" | "word";
type SoundName = "countdown" | "start" | "success" | "error" | "complete";

const voicePreference = {
  jic: ["ca", "es", "Google", "Microsoft", "Natural"],
  statement: ["ca", "es", "Microsoft", "Google"],
  word: ["ca", "es", "Google", "Microsoft"]
};

export function speakText(text: string, role: SpeechRole = "statement") {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ca-ES";
  utterance.voice = pickVoice(role);

  if (role === "jic") {
    utterance.rate = 0.94;
    utterance.pitch = 1.18;
  } else if (role === "word") {
    utterance.rate = 0.82;
    utterance.pitch = 1.02;
  } else {
    utterance.rate = 0.88;
    utterance.pitch = 1;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function warmVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.getVoices();
}

export function playUiSound(name: SoundName) {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration(name));

  soundFrequencies(name).forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = name === "error" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.06);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.06);
    oscillator.stop(now + soundDuration(name));
  });

  window.setTimeout(() => void context.close(), (soundDuration(name) + 0.12) * 1000);
}

function pickVoice(role: SpeechRole) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const preferences = voicePreference[role];
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ca")) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es") && preferences.some((item) => voice.name.includes(item))) ||
    voices.find((voice) => preferences.some((item) => voice.name.includes(item))) ||
    voices[0] ||
    null
  );
}

function soundFrequencies(name: SoundName) {
  if (name === "countdown") return [440];
  if (name === "start") return [520, 680];
  if (name === "success") return [640, 820];
  if (name === "error") return [180, 140];
  return [520, 660, 880];
}

function soundDuration(name: SoundName) {
  if (name === "countdown") return 0.12;
  if (name === "error") return 0.24;
  if (name === "complete") return 0.42;
  return 0.28;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
