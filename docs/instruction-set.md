# Instruction Set (Mano Basic Computer)

16-bit words, 12-bit addresses, indirect addressing via bit 15.

## Memory-reference (opcode = bits 14-12, 0-6; bit 15 = indirect)

| Mnemonic | Opcode | Effect                          |
|----------|--------|----------------------------------|
| AND      | 0      | AC <- AC AND M[AR]              |
| ADD      | 1      | AC <- AC + M[AR], E <- carry    |
| LDA      | 2      | AC <- M[AR]                     |
| STA      | 3      | M[AR] <- AC                     |
| BUN      | 4      | PC <- AR                        |
| BSA      | 5      | M[AR] <- PC, PC <- AR + 1        |
| ISZ      | 6      | M[AR] <- M[AR] + 1; skip if 0    |

## Register-reference (opcode = 7, bit 15 = 0; IR[11:0] selects the op)

| Mnemonic | Bits  | Effect              |
|----------|-------|----------------------|
| CLA      | 0x800 | AC <- 0              |
| CLE      | 0x400 | E <- 0               |
| CMA      | 0x200 | AC <- ~AC            |
| CME      | 0x100 | E <- ~E              |
| CIR      | 0x080 | circular right shift |
| CIL      | 0x040 | circular left shift  |
| INC      | 0x020 | AC <- AC + 1         |
| SPA      | 0x010 | skip if AC(15) = 0   |
| SNA      | 0x008 | skip if AC(15) = 1   |
| SZA      | 0x004 | skip if AC = 0       |
| SZE      | 0x002 | skip if E = 0        |
| HLT      | 0x001 | S <- 0 (stop)        |

## I/O (opcode = 7, bit 15 = 1; IR[11:0] selects the op)

| Mnemonic | Bits  | Effect                  |
|----------|-------|--------------------------|
| INP      | 0x800 | AC(7-0) <- INPR          |
| OUT      | 0x400 | OUTR <- AC(7-0) -> device|
| SKI      | 0x200 | skip if FGI = 1          |
| SKO      | 0x100 | skip if FGO = 1          |
| ION      | 0x080 | IEN <- 1                 |
| IOF      | 0x040 | IEN <- 0                 |

## Assembler directives

- `ORG <addr>` — set the location counter (decimal, or `0x..`/`H..` for hex).
  The **first** `ORG` in the file also becomes the program's entry point:
  the assembler sets `PC` there automatically after loading.
- `END` — stop assembling.
- `DEC <n>` / `HEX <n>` — emit a literal data word.
- `LABEL, <instr> <operand>` — a leading `LABEL,` defines a symbol at the
  current address.
- A leading `I` on an operand (`BUN ILOOP`) marks indirect addressing.
- `;` starts a comment anywhere on the line.
