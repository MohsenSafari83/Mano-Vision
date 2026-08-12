; sum_array_isz.asm
; جمع ۵ عدد ذخیره‌شده در حافظه با استفاده از حلقه، آدرس‌دهی غیرمستقیم (I) و ISZ

        ORG 0
        LDA N        ; AC <- N   (تعداد عناصر، به صورت منفی: -5)
        STA CTR      ; CTR <- -5
        CLA          ; AC <- 0   (مقدار اولیه‌ی جمع)
LOOP,   ADD IPTR     ; AC <- AC + M[ M[PTR] ]   <-- آدرس‌دهی غیرمستقیم از طریق PTR
        ISZ PTR      ; PTR <- PTR + 1  (اشاره‌گر را یک خانه جلو می‌برد)
        ISZ CTR      ; CTR <- CTR + 1 ; وقتی صفر شد دستور بعدی (BUN LOOP) رد می‌شود
        BUN LOOP     ; تا وقتی CTR صفر نشده حلقه ادامه دارد
        STA SUM      ; پایان حلقه: نتیجه را ذخیره کن
        HLT

N,      DEC -5
CTR,    DEC 0
PTR,    HEX 00D      ; اشاره‌گر اولیه = آدرس ۱۳ (اولین خانه‌ی آرایه)
SUM,    DEC 0
        DEC 10
        DEC 20
        DEC 30
        DEC 40
        DEC 50

        END
