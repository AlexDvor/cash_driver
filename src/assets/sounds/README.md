# Payment confirmation sound

Owner-selected `03-glass-drops.wav` (option 3, 2026-10-19): original project-generated glass-like two-note chime; no third-party recording, network download or runtime synthesis.

Native bundles contain identical `payment_confirmation.wav` files:

- `android/app/src/main/res/raw/payment_confirmation.wav`
- `ios/CashDriver/payment_confirmation.wav`

Mono PCM16 LE, 44100 Hz, 29988 frames (680 ms), 60020 bytes. SHA-256: `c77b013eca6f32ffc599b3467eeae69361b7cd1fe9bf42a0bf4c0b7f8257d3dd`.

The waveform combines C6 (1046.502 Hz) at 0 ms for 390 ms and E6 (1318.510 Hz) at 140 ms for 450 ms, with relative gains 0.85/0.9 and a 90 ms trailing silence. Each note uses attack `1-exp(-t/0.006)`, decay `exp(-t/0.12)`, and a smoothstep release over its final 65 ms. Glass partials use frequency multipliers 2.756 and 4.07, relative gains 0.20/0.07 and exponential decays with 80/50 ms time constants. The combined waveform is normalized to peak 0.25 before PCM16 encoding.

Playback gain remains 0.6 on both platforms; device volume still applies. Native playback is foreground-only, one shot, with no audio-focus request on Android and Ambient mixing on iOS. No notification channel, microphone or audio permission is added.

References: [Android SoundPool](https://developer.android.com/reference/android/media/SoundPool.Builder), [Android audio attributes](https://developer.android.com/reference/android/media/AudioAttributes), [Apple Ambient category](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient).
