; Computes and outputs the first 8 Fibonacci numbers.
; COUNT is preloaded with -8 and ISZ counts up to 0, the standard
; Mano idiom for "repeat N times" (see loop.asm for the simpler case).
ORG 100

LDA ZERO
STA A
LDA ONE
STA B

LOOP, LDA A
OUT
LDA A
ADD B
STA TEMP
LDA B
STA A
LDA TEMP
STA B
ISZ COUNT
BUN LOOP
HLT

ZERO,  DEC 0
ONE,   DEC 1
A,     DEC 0
B,     DEC 0
TEMP,  DEC 0
COUNT, DEC -8

END
