#include "mano_types.h"
#include "alu.h"

void alu_operation(void) {
    Registers *r = &cpu.regs;
    Flags *f = &cpu.flags;
    ControlSignals *c = &cpu.ctrl;
    uint32_t result;

    if (c->AND) r->AC = r->AC & r->DR;

    if (c->ADD) {
        result = (uint32_t)r->AC + (uint32_t)r->DR;
        r->AC = result & 0xFFFF;
        f->E  = (result >> 16) & 0x01;
    }

    if (c->LDA) r->AC = r->DR;
    if (c->CMA) r->AC = (~r->AC) & 0xFFFF;
    if (c->CME) f->E = (~f->E) & 0x01;

    if (c->CIL) {
        uint16_t msb = (r->AC >> 15) & 0x01;
        r->AC = ((r->AC << 1) | f->E) & 0xFFFF;
        f->E  = msb;
    }
    if (c->CIR) {
        uint16_t lsb = r->AC & 0x01;
        r->AC = (r->AC >> 1) | (f->E << 15);
        f->E  = lsb;
    }
    if (c->INC) {
        result = (uint32_t)r->AC + 1;
        r->AC = result & 0xFFFF;
        f->E  = (result >> 16) & 0x01;
    }
}
