"""Original score for the Wedge launch film, synthesized from scratch (no samples, no licenses).

Tempo 100 BPM, A minor. Sections follow the picture:
  0-12  intro: soft pad + clock tick under the red lamp
  12-22 approach: kick + 8th-note arpeggio (the train moving)
  22-30 held: everything drops to an A drone + heartbeat (the agent waits)
  30-40 lever: arpeggio returns and climbs, noise riser into 40
  40-48 signal clear: full lift (pad, bass, kick, arp, hats)
  48-55 machinery: lighter groove
  55-61 outro: resolve and fade
"""
import numpy as np
import soundfile as sf

SR = 44100
DUR = 61.0
BEAT = 60 / 100
N = int(SR * DUR)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# chords as MIDI notes (Am, F, C, G), 2 bars each = 8 beats
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
LIFT = [[48, 52, 55, 60], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]  # C G Am F


def chord_at(t, prog=PROG):
    return prog[int(t // (8 * BEAT)) % len(prog)]


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * (1 - max(pan, 0))
    R[i : i + len(sig)] += sig * gain * (1 + min(pan, 0))


def env(n, a, d_total):
    """attack a seconds, then linear-free exponential tail over the rest."""
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4))
    return e * np.exp(-x / max(d_total, 1e-4))


def pad_layer(t0, t1, prog, level, bright=0.25):
    seg = 8 * BEAT
    t = t0
    while t < t1:
        length = min(seg, t1 - t)
        n = int(length * SR)
        x = np.arange(n) / SR
        e = np.minimum(1, x / 0.8) * np.minimum(1, (length - x) / 0.6)
        notes = chord_at(t, prog)
        for k, m in enumerate(notes):
            f = hz(m)
            for det, pan in ((-0.0025, -0.6), (0.0025, 0.6)):
                ff = f * (1 + det)
                s = np.sin(2 * np.pi * ff * x) + bright * np.sin(4 * np.pi * ff * x) + 0.08 * np.sin(6 * np.pi * ff * x)
                add(s * e / len(notes), t, level * 0.5, pan)
        t += seg


def kick(at, level):
    n = int(0.35 * SR)
    x = np.arange(n) / SR
    f = 45 + 75 * np.exp(-x * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    add(np.sin(ph) * np.exp(-x * 9), at, level)


def pluck(at, midi, level, pan=0.0, decay=0.22):
    n = int(0.6 * SR)
    x = np.arange(n) / SR
    f = hz(midi)
    s = (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(4 * np.pi * f * x)) * env(n, 0.004, decay)
    add(s, at, level, pan)


def hat(at, level, pan=0.3):
    n = int(0.06 * SR)
    noise = rng.standard_normal(n + 1)
    s = np.diff(noise) * np.exp(-np.arange(n) / SR * 70)
    add(s, at, level, pan)


def bass(at, midi, level, length=BEAT * 0.9):
    n = int(length * SR)
    x = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(midi - 12) * x) * np.minimum(1, x / 0.01) * np.exp(-x * 2.2)
    add(s, at, level)


def tick(at, level):
    n = int(0.03 * SR)
    x = np.arange(n) / SR
    add(np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 220), at, level, 0.2)


# ── intro 0-12 ──
pad_layer(0.0, 12.0, PROG, 0.18, bright=0.12)
for b in np.arange(0.0, 12.0, BEAT):
    tick(b, 0.05)

# ── approach 12-22 ──
pad_layer(12.0, 22.0, PROG, 0.2)
for b in np.arange(12.0, 22.0, BEAT):
    kick(b, 0.32)
for i, b in enumerate(np.arange(12.0, 22.0, BEAT / 2)):
    notes = chord_at(b)
    pluck(b, notes[i % len(notes)] + 12, 0.12, pan=(-0.4 if i % 2 else 0.4))

# ── held 22-30: drone + heartbeat ──
n = int(8.0 * SR)
x = np.arange(n) / SR
drone_env = np.minimum(1, x / 0.6) * np.minimum(1, (8.0 - x) / 0.4)
drone = (np.sin(2 * np.pi * hz(45) * x) + 0.5 * np.sin(2 * np.pi * hz(57) * x) + 0.2 * np.sin(2 * np.pi * hz(64) * x + 0.3 * np.sin(2 * np.pi * 0.25 * x)))
add(drone * drone_env, 22.0, 0.16)
for b in np.arange(22.4, 30.0, BEAT * 2):
    kick(b, 0.22)
    kick(b + 0.22, 0.14)

# ── lever 30-40: climb + riser ──
pad_layer(30.0, 40.0, PROG, 0.18)
for i, b in enumerate(np.arange(30.0, 40.0, BEAT / 2)):
    notes = chord_at(b)
    climb = 12 + (12 if b > 35 else 0)
    pluck(b, notes[i % len(notes)] + climb, 0.10 + 0.04 * (b - 30) / 10, pan=(-0.5 if i % 2 else 0.5))
for b in np.arange(34.0, 40.0, BEAT):
    kick(b, 0.26)
n = int(3.0 * SR)
x = np.arange(n) / SR
riser = np.diff(rng.standard_normal(n + 1)) * (x / 3.0) ** 2
add(riser, 37.0, 0.07)

# ── signal clear 40-48: full lift ──
pad_layer(40.0, 48.0, LIFT, 0.24, bright=0.3)
for b in np.arange(40.0, 48.0, BEAT):
    kick(b, 0.4)
    bass(b, chord_at(b - 40.0, LIFT)[0], 0.28)
for b in np.arange(40.0 + BEAT / 2, 48.0, BEAT):
    hat(b, 0.05)
for i, b in enumerate(np.arange(40.0, 48.0, BEAT / 2)):
    notes = chord_at(b - 40.0, LIFT)
    pluck(b, notes[i % len(notes)] + 12, 0.11, pan=(-0.45 if i % 2 else 0.45))
add(np.diff(rng.standard_normal(int(1.2 * SR) + 1)) * np.exp(-np.arange(int(1.2 * SR)) / SR * 3), 40.0, 0.05)  # cymbal-ish wash

# ── machinery 48-55 ──
pad_layer(48.0, 55.0, LIFT, 0.2)
for b in np.arange(48.0, 55.0, BEAT):
    kick(b, 0.28)
    bass(b, chord_at(b - 40.0, LIFT)[0], 0.2)
for b in np.arange(48.0 + BEAT / 2, 55.0, BEAT):
    hat(b, 0.035)

# ── outro 55-61: resolve on Am then C, fade ──
n = int(6.0 * SR)
x = np.arange(n) / SR
fade = np.minimum(1, x / 0.5) * np.clip((6.0 - x) / 4.0, 0, 1)
for m in (45, 57, 60, 64, 69):
    for det, pan in ((-0.002, -0.5), (0.002, 0.5)):
        f = hz(m) * (1 + det)
        add((np.sin(2 * np.pi * f * x) + 0.2 * np.sin(4 * np.pi * f * x)) * fade / 5, 55.0, 0.5, pan)
kick(55.0, 0.35)
pluck(55.0, 81, 0.12, decay=1.2)
pluck(55.6, 76, 0.10, decay=1.2)
pluck(56.2, 72, 0.10, decay=1.4)

mix = np.stack([L, R], axis=1)
# gentle soft-clip + normalize to -1 dBFS
mix = np.tanh(mix * 1.2)
mix /= np.max(np.abs(mix)) / 10 ** (-1 / 20)
# master fade in/out
fi = np.minimum(1, t_all / 0.3)[:, None]
fo = np.minimum(1, (DUR - t_all) / 1.5)[:, None]
mix *= fi * fo
sf.write("audio/music.wav", mix.astype(np.float32), SR)
print("wrote audio/music.wav", mix.shape[0] / SR, "s")
