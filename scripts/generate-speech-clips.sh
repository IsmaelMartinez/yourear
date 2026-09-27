#!/usr/bin/env bash
# Regenerate public/speech/<word>.mp3 for the speech-in-noise test (ADR 008).
#
# Each word in WORD_LISTS (src/audio/speech-noise.ts, the single source of
# truth) is rendered with espeak-ng, trimmed of leading and trailing silence,
# normalised to TARGET_RMS_DBFS RMS, and encoded as mono MP3.
#
# Requires espeak-ng and ffmpeg (with libmp3lame): brew install espeak-ng ffmpeg
set -euo pipefail

VOICE="en-us"
RATE_WPM=140
TARGET_RMS_DBFS=-20
SAMPLE_RATE=22050
BITRATE="48k"
SILENCE_THRESHOLD="-50dB"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/src/audio/speech-noise.ts"
OUT_DIR="$ROOT/public/speech"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

words=$(awk '/^export const WORD_LISTS/,/^};/' "$SOURCE" | grep -o "'[a-z]*'" | tr -d "'")
if [ -z "$words" ]; then
  echo "No words found in WORD_LISTS in $SOURCE" >&2
  exit 1
fi

# RMS and peak of a file in dBFS, from ffmpeg's astats summary
measure() {
  ffmpeg -hide_banner -nostats -i "$1" -af astats=measure_perchannel=none -f null - 2>&1 \
    | awk -v key="$2" -F': ' '$0 ~ key" level dB" { print $2 }' | tail -1
}

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

trim="silenceremove=start_periods=1:start_threshold=$SILENCE_THRESHOLD,areverse,silenceremove=start_periods=1:start_threshold=$SILENCE_THRESHOLD,areverse"

for word in $words; do
  raw="$TMP_DIR/$word.raw.wav"
  trimmed="$TMP_DIR/$word.wav"
  espeak-ng -v "$VOICE" -s "$RATE_WPM" -w "$raw" "$word"
  ffmpeg -hide_banner -loglevel error -i "$raw" -af "$trim" -ac 1 -ar "$SAMPLE_RATE" "$trimmed"

  rms=$(measure "$trimmed" RMS)
  gain=$(awk -v t="$TARGET_RMS_DBFS" -v r="$rms" 'BEGIN { printf "%.2f", t - r }')
  ffmpeg -hide_banner -loglevel error -i "$trimmed" -af "volume=${gain}dB" \
    -ac 1 -ar "$SAMPLE_RATE" -c:a libmp3lame -b:a "$BITRATE" "$OUT_DIR/$word.mp3"

  printf '%-8s rms %6s -> %6s dBFS, peak %6s dBFS\n' "$word" "$rms" \
    "$(measure "$OUT_DIR/$word.mp3" RMS)" "$(measure "$OUT_DIR/$word.mp3" Peak)"
done

du -ch "$OUT_DIR"/*.mp3 | tail -1
