#include "mano_types.h"
#include "memory.h"

void memory_operation(void) {
    if (cpu.ctrl.READ)  cpu.bus_value = cpu.memory[cpu.regs.AR];
    if (cpu.ctrl.WRITE) cpu.memory[cpu.regs.AR] = cpu.bus_value;
}
