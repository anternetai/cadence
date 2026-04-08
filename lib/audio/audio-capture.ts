/**
 * Audio Capture — Acquires mic audio for both Layer 1 analysis and Layer 2 streaming.
 *
 * For V1: captures local microphone. Works with any call source (Zoom, phone, dialer).
 * Future: Telnyx WebRTC integration captures both sides natively.
 */

export interface AudioCaptureHandle {
  localStream: MediaStream
  stop: () => void
}

/**
 * Request microphone access and return a handle with the live stream and a cleanup function.
 *
 * Constraints are tuned for audio analysis:
 * - echoCancellation: reduces acoustic feedback artifacts
 * - noiseSuppression: removes background hiss
 * - autoGainControl: DISABLED — we need raw amplitude data for volume metrics
 * - sampleRate: 48kHz (standard browser rate; resampler will downsample for Gemini)
 * - channelCount: mono — no need for stereo for analysis or streaming
 */
export async function startAudioCapture(): Promise<AudioCaptureHandle> {
  let stream: MediaStream

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false, // We want raw volume data
        sampleRate: 48000,
        channelCount: 1,
      },
    })
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === "NotAllowedError"
        ? "Microphone access was denied. Please allow microphone permissions and try again."
        : err instanceof DOMException && err.name === "NotFoundError"
        ? "No microphone found. Please connect a microphone and try again."
        : `Failed to access microphone: ${err instanceof Error ? err.message : String(err)}`
    throw new Error(message)
  }

  return {
    localStream: stream,
    stop: () => {
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}
