#include <stdio.h>
#include <string.h>
#include "mano_types.h"
#include "state.h"
#include "control.h"
#include "assembler.h"
#include "trace.h"
#include "shell.h"

int main(int argc, char *argv[]) {
    state_init();

    if (argc >= 4 && strcmp(argv[1], "--trace") == 0) {
        if (assemble_and_load(argv[2]) != 0) return 1;
        if (trace_begin(argv[3]) != 0) {
            fprintf(stderr, "Could not open %s for writing\n", argv[3]);
            return 1;
        }
        cpu_run(10000);
        trace_end();
        printf("Trace written to %s (%u instructions executed).\n", argv[3], cpu.cycle_count);
        state_print_registers();
        return 0;
    }

    if (argc > 1) {
        if (assemble_and_load(argv[1]) != 0) return 1;
        cpu_run(10000);
        state_print_registers();
        return 0;
    }

    interactive_shell();
    return 0;
}
