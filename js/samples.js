'use strict';
/* =========================================================================
   SAMPLE PROGRAMS
   ========================================================================= */
const SAMPLES = {
sum:
`; Add two numbers
ORG 100
LDA NUM1
ADD NUM2
STA RESULT
OUT
HLT
NUM1, DEC 25
NUM2, DEC 17
RESULT, DEC 0
END`,
count:
`; Countdown from 5 to 0
ORG 100
LDA FIVE
STA COUNT
LOOP, LDA COUNT
OUT
ISZ COUNT
BUN LOOP
HLT
FIVE, DEC -5
COUNT, DEC 0
END`,
mul:
`; Multiply two numbers via repeated addition (5 x 4)
ORG 100
LDA MCAND
STA X
LDA MPLIER
STA CNT
LDA ZERO
STA PROD
LOOP, LDA CNT
SZA
BUN CONT
BUN DONE
CONT, LDA PROD
ADD X
STA PROD
LDA CNT
ISZ CNT
BUN LOOP
DONE, LDA PROD
OUT
HLT
MCAND, DEC 5
MPLIER, DEC 4
ZERO, DEC 0
X, DEC 0
CNT, DEC 0
PROD, DEC 0
END`
};

