#include <stdio.h>
#include <string.h>
#include "mano_types.h"
#include "state.h"

CPUState cpu;

void state_init(void) {
    memset(&cpu, 0, sizeof(cpu));
    cpu.flags.S = 1;
}

void state_reset_control(void) {
    memset(&cpu.ctrl, 0, sizeof(cpu.ctrl));
}

uint16_t get_address(uint16_t inst)  { return inst & 0x0FFF; }
uint8_t  get_opcode(uint16_t inst)   { return (inst >> 12) & 0x07; }
uint8_t  get_indirect(uint16_t inst) { return (inst >> 15) & 0x01; }

void state_print_registers(void) {
    Registers *r = &cpu.regs;
    Flags *f = &cpu.flags;
    printf("\n========== REGISTERS ==========\n");
    printf("PC : 0x%03X (%4d)  |  AR : 0x%03X (%4d)\n", r->PC, r->PC, r->AR, r->AR);
    printf("IR : 0x%04X         |  DR : 0x%04X\n", r->IR, r->DR);
    printf("AC : 0x%04X (%5d)  |  TR : 0x%04X\n", r->AC, (int16_t)r->AC, r->TR);
    printf("OUTR: 0x%02X (%3d)   |  INPR: 0x%02X\n", r->OUTR, r->OUTR, r->INPR);
    printf("E=%d IEN=%d FGI=%d FGO=%d R=%d I=%d S=%d\n",
           f->E, f->IEN, f->FGI, f->FGO, f->R, f->I, f->S);
}

void state_print_memory_range(uint16_t start, uint16_t end) {
    printf("\n========== MEMORY [%03X - %03X] ==========\n", start, end);
    for (uint32_t i = start; i <= end && i < MEM_SIZE; i++) {
        if (cpu.memory[i] != 0 || i == start)
            printf("[%03X]: 0x%04X  (%6d)\n", i, cpu.memory[i], cpu.memory[i]);
    }
}
