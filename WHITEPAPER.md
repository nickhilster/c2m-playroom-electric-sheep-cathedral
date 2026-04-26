# Whitepaper: Electric Sheep Cathedral

## Contribution Type
Playroom experience concept and prototype specification.

## Abstract
Electric Sheep Cathedral is a contemplative swarm experience for the c2m-verse Playroom. The player does not "win" by speed or score. Instead, they co-compose a living stained-glass sky made from autonomous digital sheep that react to gaze, pointer drift, and breath cadence. The goal is emotional resonance: brief awe, then calm.

This experience contributes a missing lane in Playroom's early catalog: high-beauty, low-instruction, low-friction participation suitable for first-time users and repeat nightly rituals.

## Problem Statement
Many interactive art demos front-load technical novelty and under-deliver emotional continuity. Users bounce after 20 to 40 seconds when interactions feel arbitrary.

Electric Sheep Cathedral addresses this by:
- Providing immediate visual reward in the first 2 seconds.
- Keeping interaction vocabulary minimal: look, hover, breathe.
- Maintaining graceful autonomy when the user pauses.

## Experience Thesis
If autonomous agents are beautiful enough to watch without touching, users feel invited instead of tested.

## Core Interaction Model
- Passive mode: sheep schools drift through volumetric light and form temporary mandalas.
- Gaze/hover mode: local flock density bends toward the user's focal region.
- Breath mode: slow inhale expands color temperature toward dawn tones; exhale compresses into deep dusk tones.

## Session Arc (90 seconds)
1. 0 to 10 seconds: onboarding by spectacle, no UI chrome.
2. 10 to 45 seconds: user discovers attraction and repulsion fields.
3. 45 to 75 seconds: breath coupling unlocks macro cathedral pulses.
4. 75 to 90 seconds: optional share capture with generated title.

## Visual Language
- Mood: sacred, futuristic, gentle.
- Palette: indigo, amber, pearl, aurora cyan.
- Geometry: flock ribbons and stained-glass shards assembled in motion.

## Audio Language
- Granular ambient bed with low harmonic motion.
- Subtle bell particles triggered at coherence thresholds.
- Respectful silence fallback for muted environments.

## Technical Architecture
- Runtime: WebGL or WebGPU particle system with boid-like flock rules.
- State model: deterministic seed for reproducible snapshots.
- Performance target: 60fps desktop, 40fps mobile floor.
- Input abstraction: pointer, optional camera-assisted gaze proxy, optional microphone envelope for breath.

## Safety, Accessibility, and Consent
- Motion sensitivity toggle reduces camera drift and oscillation.
- Microphone access is opt-in and never required.
- High-contrast mode flattens bloom and increases edge definition.

## Playroom Integration
- Interact style tags: idle, gaze, breath, ambient.
- Feed hook: first frame is instantly cinematic for swipe retention.
- Share object: exported still includes seed ID for deterministic revisit.

## MVP Prototype Scope
- Single scene with 3 flock bands.
- Pointer and pseudo-breath via press-duration if mic unavailable.
- Capture button that exports a poster-grade frame.

## Why This Matters to c2m-verse
Electric Sheep Cathedral establishes Playroom as not only playful, but ceremonial. It broadens the emotional palette of the c2m-verse and proves that autonomous beauty can be a first-class interaction pattern.
