#include <stdio.h>
#include <string.h>
#include "mano_types.h"
#include "state.h"
#include "bus.h"
#include "alu.h"
#include "memory.h"
#include "io.h"
#include "trace.h"
#include "control.h"

static void micro_step(const char *phase, const char *label) {
    bus_update();
    memory_operation();
    bus_register_transfers();
    trace_step(phase, label);
    state_reset_control();
}

void cpu_fetch_decode(void) {
    Registers *r = &cpu.regs;

    state_reset_control();
    cpu.ctrl.S_BUS = 1; cpu.ctrl.LD_AR = 1;
    micro_step("fetch", "AR <- PC");

    cpu.ctrl.S_BUS = 6; cpu.ctrl.LD_IR = 1; cpu.ctrl.READ = 1;
    micro_step("fetch", "IR <- M[AR]");

    cpu.ctrl.INCR_PC = 1;
    micro_step("fetch", "PC <- PC + 1");

    uint8_t opcode = get_opcode(r->IR);
    cpu.flags.I = get_indirect(r->IR);
    memset(cpu.ctrl.D, 0, sizeof(cpu.ctrl.D));
    if (opcode < 8) cpu.ctrl.D[opcode] = 1;
    r->AR = get_address(r->IR);
    trace_step("decode", "opcode decoded");
}

void cpu_execute_memory_reference(void) {
    Registers *r = &cpu.regs;
    ControlSignals *c = &cpu.ctrl;

    if (cpu.flags.I && !c->D[7]) {
        c->S_BUS = 6; c->LD_AR = 1; c->READ = 1;
        micro_step("execute", "AR <- M[AR] (indirect)");
    }

    if (c->D[0]) {
        c->S_BUS = 6; c->LD_DR = 1; c->READ = 1;
        micro_step("execute", "DR <- M[AR]");
        c->AND = 1; alu_operation();
        trace_step("execute", "AC <- AC AND DR");
        state_reset_control();
    } else if (c->D[1]) {
        c->S_BUS = 6; c->LD_DR = 1; c->READ = 1;
        micro_step("execute", "DR <- M[AR]");
        c->ADD = 1; alu_operation();
        trace_step("execute", "AC <- AC + DR, E <- carry");
        state_reset_control();
    } else if (c->D[2]) {
        c->S_BUS = 6; c->LD_DR = 1; c->READ = 1;
        micro_step("execute", "DR <- M[AR]");
        c->LDA = 1; alu_operation();
        trace_step("execute", "AC <- DR");
        state_reset_control();
    } else if (c->D[3]) {
        c->S_BUS = 3; c->WRITE = 1;
        cpu.bus_value = r->AC;
        micro_step("execute", "M[AR] <- AC");
    } else if (c->D[4]) {
        c->S_BUS = 0; c->LD_PC = 1;
        micro_step("execute", "PC <- AR");
    } else if (c->D[5]) {
        c->S_BUS = 1; c->LD_TR = 1;
        micro_step("execute", "TR <- PC");
        c->INCR_AR = 1;
        micro_step("execute", "AR <- AR + 1");
        c->S_BUS = 5; c->LD_PC = 1;
        micro_step("execute", "PC <- TR");
        c->S_BUS = 0; c->WRITE = 1;
        cpu.bus_value = r->TR;
        micro_step("execute", "M[old AR] <- TR (return addr)");
    } else if (c->D[6]) {
        c->S_BUS = 6; c->LD_DR = 1; c->READ = 1;
        micro_step("execute", "DR <- M[AR]");
        c->INCR_DR = 1;
        micro_step("execute", "DR <- DR + 1");
        c->S_BUS = 2; c->WRITE = 1;
        cpu.bus_value = r->DR;
        micro_step("execute", "M[AR] <- DR");
        if (r->DR == 0) {
            c->INCR_PC = 1;
            micro_step("execute", "PC <- PC + 1 (skip)");
        }
    }
}

void cpu_execute_register_reference(void) {
    Registers *r = &cpu.regs;
    uint16_t reg_bits = r->IR & 0x0FFF;

    if (reg_bits & 0x800) { cpu.ctrl.CLR_AC = 1; micro_step("execute", "CLA: AC <- 0"); }
    if (reg_bits & 0x400) { cpu.ctrl.CLR_E  = 1; micro_step("execute", "CLE: E <- 0"); }
    if (reg_bits & 0x200) { cpu.ctrl.CMA = 1; alu_operation(); trace_step("execute", "CMA: AC <- ~AC"); state_reset_control(); }
    if (reg_bits & 0x100) { cpu.ctrl.CME = 1; alu_operation(); trace_step("execute", "CME: E <- ~E"); state_reset_control(); }
    if (reg_bits & 0x080) { cpu.ctrl.CIR = 1; alu_operation(); trace_step("execute", "CIR: circular right"); state_reset_control(); }
    if (reg_bits & 0x040) { cpu.ctrl.CIL = 1; alu_operation(); trace_step("execute", "CIL: circular left"); state_reset_control(); }
    if (reg_bits & 0x020) { cpu.ctrl.INC = 1; alu_operation(); trace_step("execute", "INC: AC <- AC + 1"); state_reset_control(); }
    if (reg_bits & 0x010) { if ((r->AC & 0x8000) == 0) { cpu.ctrl.INCR_PC = 1; micro_step("execute", "SPA: skip"); } }
    if (reg_bits & 0x008) { if (r->AC & 0x8000)        { cpu.ctrl.INCR_PC = 1; micro_step("execute", "SNA: skip"); } }
    if (reg_bits & 0x004) { if (r->AC == 0)             { cpu.ctrl.INCR_PC = 1; micro_step("execute", "SZA: skip"); } }
    if (reg_bits & 0x002) { if (cpu.flags.E == 0)       { cpu.ctrl.INCR_PC = 1; micro_step("execute", "SZE: skip"); } }
    if (reg_bits & 0x001) { cpu.flags.S = 0; trace_step("execute", "HLT: S <- 0"); }
}

void cpu_execute_io(void) {
    uint16_t io_bits = cpu.regs.IR & 0x0FFF;

    if (io_bits & 0x800) { io_console_input();  trace_step("execute", "INP: AC(7-0) <- INPR"); }
    if (io_bits & 0x400) {
        cpu.ctrl.S_BUS = 3; cpu.ctrl.LD_OUTR = 1;
        micro_step("execute", "OUTR <- AC(7-0)");
        io_console_output();
        trace_step("execute", "OUT: OUTR -> device");
    }
    if (io_bits & 0x200) { if (cpu.flags.FGI) { cpu.ctrl.INCR_PC = 1; micro_step("execute", "SKI: skip"); } }
    if (io_bits & 0x100) { if (cpu.flags.FGO) { cpu.ctrl.INCR_PC = 1; micro_step("execute", "SKO: skip"); } }
    if (io_bits & 0x080) { cpu.flags.IEN = 1; trace_step("execute", "ION: IEN <- 1"); }
    if (io_bits & 0x040) { cpu.flags.IEN = 0; trace_step("execute", "IOF: IEN <- 0"); }
}

void cpu_execute(void) {
    if (cpu.ctrl.D[7] == 0)      cpu_execute_memory_reference();
    else if (cpu.flags.I == 0)   cpu_execute_register_reference();
    else                         cpu_execute_io();
}

void cpu_step(void) {
    if (!cpu.flags.S) { printf("Computer is stopped. (S=0)\n"); return; }
    cpu_fetch_decode();
    cpu_execute();
    cpu.cycle_count++;
}

void cpu_run(unsigned max_cycles) {
    unsigned cycle = 0;
    while (cpu.flags.S && cycle < max_cycles) {
        cpu_fetch_decode();
        cpu_execute();
        cycle++;
    }
    cpu.cycle_count += cycle;
}
