#ifndef MANO_TYPES_H
#define MANO_TYPES_H
#include <stdint.h>

#define MEM_SIZE   4096
#define WORD_SIZE  16
#define ADDR_BITS  12

typedef struct {
    uint16_t AC, AR, PC, IR, DR, TR, SC;
    uint16_t INPR, OUTR;
} Registers;

typedef struct {
    uint8_t E, IEN, FGI, FGO, R, I, S;
} Flags;

typedef struct {
    uint8_t D[8];
    uint8_t LD_AR, LD_PC, LD_DR, LD_AC, LD_IR, LD_TR, LD_OUTR;
    uint8_t INCR_AR, INCR_PC, INCR_DR, INCR_AC, INCR_TR, INCR_SC;
    uint8_t CLR_AR, CLR_PC, CLR_DR, CLR_AC, CLR_IR, CLR_TR, CLR_E, CLR_SC;
    uint8_t S_BUS;
    uint8_t READ, WRITE;
    uint8_t AND, ADD, LDA, STA, BUN, BSA, ISZ;
    uint8_t CMA, CME, CIL, CIR, INC, SPA, SNA, SZA, SZE, HLT;
    uint8_t INP, OUT, SKI, SKO, ION, IOF;
} ControlSignals;

typedef struct {
    Registers regs;
    Flags flags;
    ControlSignals ctrl;
    uint16_t bus_value;
    uint16_t memory[MEM_SIZE];
    unsigned cycle_count;
} CPUState;

extern CPUState cpu;

#endif
