#include <stdio.h>
#include "mano_types.h"
#include "trace.h"

static FILE *trace_fp = NULL;
static int   trace_step_count = 0;

int trace_begin(const char *json_path) {
    trace_fp = fopen(json_path, "w");
    if (!trace_fp) return -1;
    trace_step_count = 0;
    fprintf(trace_fp, "[\n");
    return 0;
}

void trace_step(const char *phase, const char *label) {
    if (!trace_fp) return;
    Registers *r = &cpu.regs;
    Flags *f = &cpu.flags;
    ControlSignals *c = &cpu.ctrl;

    if (trace_step_count > 0) fprintf(trace_fp, ",\n");
    trace_step_count++;

    fprintf(trace_fp,
        "  {\n"
        "    \"step\": %d,\n"
        "    \"phase\": \"%s\",\n"
        "    \"label\": \"%s\",\n"
        "    \"bus_select\": %d,\n"
        "    \"bus_value\": %u,\n"
        "    \"registers\": { \"AC\": %u, \"AR\": %u, \"PC\": %u, \"IR\": %u, \"DR\": %u, \"TR\": %u, \"SC\": %u, \"INPR\": %u, \"OUTR\": %u },\n"
        "    \"flags\": { \"E\": %d, \"IEN\": %d, \"FGI\": %d, \"FGO\": %d, \"R\": %d, \"I\": %d, \"S\": %d },\n"
        "    \"active_signals\": [",
        trace_step_count, phase, label,
        c->S_BUS, cpu.bus_value,
        r->AC, r->AR, r->PC, r->IR, r->DR, r->TR, r->SC, r->INPR, r->OUTR,
        f->E, f->IEN, f->FGI, f->FGO, f->R, f->I, f->S);

    int first = 1;
#define EMIT(name) \
    if (c->name) { fprintf(trace_fp, "%s\"%s\"", first ? "" : ", ", #name); first = 0; }
    EMIT(LD_AR) EMIT(LD_PC) EMIT(LD_DR) EMIT(LD_AC) EMIT(LD_IR) EMIT(LD_TR) EMIT(LD_OUTR)
    EMIT(INCR_AR) EMIT(INCR_PC) EMIT(INCR_DR) EMIT(INCR_AC) EMIT(INCR_TR) EMIT(INCR_SC)
    EMIT(CLR_AR) EMIT(CLR_PC) EMIT(CLR_DR) EMIT(CLR_AC) EMIT(CLR_IR) EMIT(CLR_TR) EMIT(CLR_E) EMIT(CLR_SC)
    EMIT(READ) EMIT(WRITE)
    EMIT(AND) EMIT(ADD) EMIT(LDA) EMIT(STA) EMIT(BUN) EMIT(BSA) EMIT(ISZ)
    EMIT(CMA) EMIT(CME) EMIT(CIL) EMIT(CIR) EMIT(INC) EMIT(SPA) EMIT(SNA) EMIT(SZA) EMIT(SZE) EMIT(HLT)
    EMIT(INP) EMIT(OUT) EMIT(SKI) EMIT(SKO) EMIT(ION) EMIT(IOF)
#undef EMIT

    fprintf(trace_fp, "],\n    \"memory_touched\": %u\n  }", r->AR);
}

void trace_end(void) {
    if (!trace_fp) return;
    fprintf(trace_fp, "\n]\n");
    fclose(trace_fp);
    trace_fp = NULL;
}
