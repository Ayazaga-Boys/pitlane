package location

import (
	"fmt"
	"strconv"
)

// H3 index bit layout (Uber H3 spec):
//   Bits 63-60: unused (0)
//   Bits 59-56: mode (1 = hexagon cell)
//   Bits 55-52: resolution (0–15), mask = 0x00F0_0000_0000_0000
//   Bits 51-45: base cell (0–121)
//   Bits 44-0:  digits, 15 × 3 bits; digit n (1-indexed) at bits (45-n*3+2):(45-n*3)
//
// INVALID_DIGIT = 7 (0b111) marks unused digit slots.
// Standard H3 string: 15 lowercase hex characters.

const (
	h3ResOffset    = 52
	h3ResMask      = uint64(0x00F0000000000000)
	h3InvalidDigit = uint64(7)
	h3StringLen    = 15
)

// h3CellToParent returns the parent H3 cell at parentRes using pure bit
// manipulation — no CGo, no external H3 library.
// Returns the input unchanged if parentRes >= currentRes.
func h3CellToParent(h3Cell string, parentRes int) (string, error) {
	idx, err := strconv.ParseUint(h3Cell, 16, 64)
	if err != nil {
		return "", fmt.Errorf("invalid h3 cell %q: %w", h3Cell, err)
	}

	currentRes := int((idx >> h3ResOffset) & 0xF) //nolint:gosec // result is always 0-15, fits safely in int
	if parentRes >= currentRes || parentRes < 0 || parentRes > 15 {
		return h3Cell, nil
	}

	// Change resolution field
	idx = (idx &^ h3ResMask) | (uint64(parentRes) << h3ResOffset)

	// Set digits (parentRes+1)..currentRes to INVALID_DIGIT (7 = 0b111).
	// Digit n (1-indexed) occupies bits (45-n*3+2):(45-n*3), i.e. shift = 45-n*3.
	for r := parentRes + 1; r <= currentRes; r++ {
		shift := uint(45 - r*3)
		idx |= h3InvalidDigit << shift // OR with 7 sets all 3 bits
	}

	return fmt.Sprintf("%015x", idx), nil
}
