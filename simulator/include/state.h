#ifndef STATE_H
#define STATE_H
#include "mano_types.h"
void state_init(void);
void state_reset_control(void);
void state_print_registers(void);
void state_print_memory_range(uint16_t start, uint16_t end);
uint16_t get_address(uint16_t inst);
uint8_t  get_opcode(uint16_t inst);
uint8_t  get_indirect(uint16_t inst);
#endif
