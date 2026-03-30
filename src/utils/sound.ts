type OscillatorKind = OscillatorType

interface ToneStep {
  frequency: number
  duration: number
  gain?: number
  type?: OscillatorKind
}

let audioContext: AudioContext | null = null

function getAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContextCtor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext
  }).webkitAudioContext

  if (!AudioContextCtor) return null

  if (!audioContext) {
    audioContext = new AudioContextCtor()
  }

  return audioContext
}

async function ensureAudioReady() {
  const context = getAudioContext()
  if (!context) return null

  if (context.state === 'suspended') {
    try {
      await context.resume()
    } catch {
      return null
    }
  }

  return context
}

async function playToneSequence(steps: ToneStep[]) {
  const context = await ensureAudioReady()
  if (!context) return

  const startAt = context.currentTime + 0.01
  let cursor = startAt

  for (const step of steps) {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    const peakGain = step.gain ?? 0.04
    const endAt = cursor + step.duration

    oscillator.type = step.type ?? 'sine'
    oscillator.frequency.setValueAtTime(step.frequency, cursor)

    gainNode.gain.setValueAtTime(0.0001, cursor)
    gainNode.gain.exponentialRampToValueAtTime(peakGain, cursor + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt)

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start(cursor)
    oscillator.stop(endAt + 0.02)

    cursor = endAt + 0.015
  }
}

export function playCraftSuccessSound() {
  void playToneSequence([
    { frequency: 523.25, duration: 0.09, gain: 0.03, type: 'triangle' },
    { frequency: 659.25, duration: 0.12, gain: 0.04, type: 'triangle' },
  ])
}

export function playNewDiscoverySound() {
  void playToneSequence([
    { frequency: 659.25, duration: 0.08, gain: 0.035, type: 'triangle' },
    { frequency: 783.99, duration: 0.1, gain: 0.04, type: 'triangle' },
    { frequency: 1046.5, duration: 0.18, gain: 0.05, type: 'sine' },
  ])
}
