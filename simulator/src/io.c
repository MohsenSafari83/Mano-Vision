#include <stdio.h>
#include "mano_types.h"
#include "io.h"

void io_console_input(void) {
    unsigned v;
    printf("Input required (0-255): ");
    if (scanf("%u", &v) != 1) v = 0;
    cpu.regs.INPR = (uint16_t)(v & 0xFF);
    cpu.regs.AC = (cpu.regs.AC & 0xFF00) | cpu.regs.INPR;
    cpu.flags.FGI = 0;
}

void io_console_output(void) {
    uint16_t o = cpu.regs.OUTR;
    printf("OUTPUT: %d (0x%02X) (char: %c)\n", o, o, (o >= 32 && o <= 126) ? (char)o : '?');
    cpu.flags.FGO = 0;
}
