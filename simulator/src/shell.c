#include <stdio.h>
#include <string.h>
#include "mano_types.h"
#include "state.h"
#include "control.h"
#include "assembler.h"
#include "trace.h"
#include "shell.h"

static void print_help(void) {
    printf("Commands:\n");
    printf("  load <file.asm>        - assemble and load a program\n");
    printf("  run                    - run until HLT (or 10000 cycles)\n");
    printf("  step                   - execute one instruction\n");
    printf("  trace <file.asm> <out.json> - assemble, run, and record a JSON trace\n");
    printf("  regs                   - show registers\n");
    printf("  mem <start> <end>      - show memory range (hex)\n");
    printf("  set <addr> <val>       - set a memory location (hex)\n");
    printf("  reset                  - reset the machine\n");
    printf("  help                   - show this help\n");
    printf("  quit                   - exit\n");
}

void interactive_shell(void) {
    char cmd[256];
    printf("\n========================================\n");
    printf("   Mano Basic Computer Simulator (C)\n");
    printf("   ManoVision simulator core\n");
    printf("========================================\n");
    print_help();
    printf("\n");

    while (1) {
        printf("mano> ");
        if (!fgets(cmd, sizeof(cmd), stdin)) break;
        cmd[strcspn(cmd, "\n")] = '\0';

        if (strncmp(cmd, "load ", 5) == 0) {
            assemble_and_load(cmd + 5);
        } else if (strcmp(cmd, "run") == 0) {
            cpu_run(10000);
            state_print_registers();
        } else if (strcmp(cmd, "step") == 0) {
            cpu_step();
            state_print_registers();
        } else if (strncmp(cmd, "trace ", 6) == 0) {
            char asm_file[128] = "", out_file[128] = "";
            sscanf(cmd + 6, "%127s %127s", asm_file, out_file);
            if (!asm_file[0] || !out_file[0]) {
                printf("usage: trace <file.asm> <out.json>\n");
            } else {
                state_init();
                assemble_and_load(asm_file);
                trace_begin(out_file);
                cpu_run(10000);
                trace_end();
                printf("Trace written to %s (%u instructions).\n", out_file, cpu.cycle_count);
            }
        } else if (strcmp(cmd, "regs") == 0) {
            state_print_registers();
        } else if (strncmp(cmd, "mem ", 4) == 0) {
            unsigned start = 0, end = 0x1F;
            sscanf(cmd + 4, "%x %x", &start, &end);
            state_print_memory_range((uint16_t)start, (uint16_t)end);
        } else if (strncmp(cmd, "set ", 4) == 0) {
            unsigned addr = 0, val = 0;
            sscanf(cmd + 4, "%x %x", &addr, &val);
            if (addr < MEM_SIZE) {
                cpu.memory[addr] = (uint16_t)val;
                printf("Memory[%03X] = 0x%04X\n", addr, val);
            }
        } else if (strcmp(cmd, "reset") == 0) {
            state_init();
            printf("Computer reset.\n");
        } else if (strcmp(cmd, "help") == 0) {
            print_help();
        } else if (strcmp(cmd, "quit") == 0 || strcmp(cmd, "exit") == 0) {
            break;
        } else if (strlen(cmd) > 0) {
            printf("Unknown command. Type 'help' for the list.\n");
        }
    }
}
