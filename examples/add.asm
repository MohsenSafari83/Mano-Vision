; Adds two numbers and outputs the result
ORG 100

LDA NUM1    ; Load first number into AC
ADD NUM2    ; Add second number
STA RESULT  ; Store result
OUT         ; Output result
HLT         ; Halt

NUM1, DEC 25
NUM2, DEC 17
RESULT, DEC 0

END
