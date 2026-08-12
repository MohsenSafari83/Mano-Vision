#include "mano_types.h"
#include "bus.h"

void bus_update(void) {
    Registers *r = &cpu.regs;
    switch (cpu.ctrl.S_BUS) {
        case 0: cpu.bus_value = r->AR; break;
        case 1: cpu.bus_value = r->PC; break;
        case 2: cpu.bus_value = r->DR; break;
        case 3: cpu.bus_value = r->AC; break;
        case 4: cpu.bus_value = r->IR; break;
        case 5: cpu.bus_value = r->TR; break;
        case 6: cpu.bus_value = cpu.memory[r->AR]; break;
        default: cpu.bus_value = 0; break;
    }
}

void bus_register_transfers(void) {
    Registers *r = &cpu.regs;
    ControlSignals *c = &cpu.ctrl;

    if (c->LD_AR)   r->AR = cpu.bus_value & 0x0FFF;
    if (c->LD_PC)   r->PC = cpu.bus_value & 0x0FFF;
    if (c->LD_DR)   r->DR = cpu.bus_value;
    if (c->LD_AC)   r->AC = cpu.bus_value;
    if (c->LD_IR)   r->IR = cpu.bus_value;
    if (c->LD_TR)   r->TR = cpu.bus_value;
    if (c->LD_OUTR) r->OUTR = cpu.bus_value & 0x00FF;

    if (c->INCR_AR) r->AR = (r->AR + 1) & 0x0FFF;
    if (c->INCR_PC) r->PC = (r->PC + 1) & 0x0FFF;
    if (c->INCR_DR) r->DR = (r->DR + 1) & 0xFFFF;
    if (c->INCR_AC) r->AC = (r->AC + 1) & 0xFFFF;
    if (c->INCR_TR) r->TR = (r->TR + 1) & 0xFFFF;
    if (c->INCR_SC) r->SC = (r->SC + 1) & 0x0FFF;

    if (c->CLR_AR) r->AR = 0;
    if (c->CLR_PC) r->PC = 0;
    if (c->CLR_DR) r->DR = 0;
    if (c->CLR_AC) r->AC = 0;
    if (c->CLR_IR) r->IR = 0;
    if (c->CLR_TR) r->TR = 0;
    if (c->CLR_E)  cpu.flags.E = 0;
    if (c->CLR_SC) r->SC = 0;
}
