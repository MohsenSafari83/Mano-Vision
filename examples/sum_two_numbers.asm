; sum_two_numbers.asm
; C <- A + B   (ساده‌ترین برنامه‌ی ممکن براي شروع)

        ORG 0
        LDA A       ; AC <- M[A]
        ADD B       ; AC <- AC + M[B]
        STA C       ; M[C] <- AC
        HLT         ; توقف پردازنده (S <- 0)

A,      DEC 25
B,      DEC 17
C,      DEC 0

        END
