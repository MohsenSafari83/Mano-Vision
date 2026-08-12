#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "mano_types.h"
#include "assembler.h"

#define OP_AND 0x0000
#define OP_ADD 0x1000
#define OP_LDA 0x2000
#define OP_STA 0x3000
#define OP_BUN 0x4000
#define OP_BSA 0x5000
#define OP_ISZ 0x6000
#define OP_CLA 0x7800
#define OP_CLE 0x7400
#define OP_CMA 0x7200
#define OP_CME 0x7100
#define OP_CIR 0x7080
#define OP_CIL 0x7040
#define OP_INC 0x7020
#define OP_SPA 0x7010
#define OP_SNA 0x7008
#define OP_SZA 0x7004
#define OP_SZE 0x7002
#define OP_HLT 0x7001
#define OP_INP 0xF800
#define OP_OUT 0xF400
#define OP_SKI 0xF200
#define OP_SKO 0xF100
#define OP_ION 0xF080
#define OP_IOF 0xF040

typedef struct { char label[32]; uint16_t address; } AsmSymbol;
static AsmSymbol symtab[512];
static int sym_count = 0;

static int find_symbol(const char *name) {
    for (int i = 0; i < sym_count; i++)
        if (strcmp(symtab[i].label, name) == 0) return i;
    return -1;
}

static void add_symbol(const char *name, uint16_t addr) {
    if (sym_count >= 512) return;
    strncpy(symtab[sym_count].label, name, 31);
    symtab[sym_count].label[31] = '\0';
    symtab[sym_count].address = addr;
    sym_count++;
}

static uint16_t parse_number(const char *str) {
    if (strncmp(str, "0x", 2) == 0 || strncmp(str, "0X", 2) == 0)
        return (uint16_t)strtol(str, NULL, 16);
    if (str[0] == 'H' || str[0] == 'h')
        return (uint16_t)strtol(str + 1, NULL, 16);
    return (uint16_t)atoi(str);
}

static void strip_comment(char *line) {
    char *semi = strchr(line, ';');
    if (semi) *semi = '\0';
}

int assemble_and_load(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (!fp) { fprintf(stderr, "Error: cannot open %s\n", filename); return -1; }

    char line[256];
    uint16_t loc = 0;
    sym_count = 0;
    int have_entry = 0;
    uint16_t entry_point = 0;

    while (fgets(line, sizeof(line), fp)) {
        strip_comment(line);
        char *p = line;
        while (*p && isspace((unsigned char)*p)) p++;
        if (*p == '\0') continue;

        char token1[32] = "", token2[32] = "", token3[32] = "";
        sscanf(p, "%31s %31s %31s", token1, token2, token3);

        if (strcmp(token1, "ORG") == 0) {
            loc = parse_number(token2);
            if (!have_entry) { entry_point = loc; have_entry = 1; }
            continue;
        }
        if (strcmp(token1, "END") == 0) break;

        int len = (int)strlen(token1);
        if (len > 0 && token1[len - 1] == ',') {
            token1[len - 1] = '\0';
            if (find_symbol(token1) == -1) add_symbol(token1, loc);
        }
        loc++;
    }

    rewind(fp);
    loc = 0;
    int unresolved = 0;

    while (fgets(line, sizeof(line), fp)) {
        strip_comment(line);
        char *p = line;
        while (*p && isspace((unsigned char)*p)) p++;
        if (*p == '\0') continue;

        char token1[32] = "", token2[32] = "", token3[32] = "";
        int n = sscanf(p, "%31s %31s %31s", token1, token2, token3);

        if (strcmp(token1, "ORG") == 0) { loc = parse_number(token2); continue; }
        if (strcmp(token1, "END") == 0) break;

        char *instr = token1;
        char *operand = token2;

        int len = (int)strlen(token1);
        if (len > 0 && token1[len - 1] == ',') {
            token1[len - 1] = '\0';
            instr = token2;
            operand = token3;
        } else if (n < 2) {
            operand = "";
        }

        char *op = instr;
        char *arg = operand;
        int is_indirect = 0;
        if (arg[0] == 'I' && arg[1] != '\0') { is_indirect = 1; arg++; }

        uint16_t code;
        if      (!strcmp(op, "AND")) code = OP_AND;
        else if (!strcmp(op, "ADD")) code = OP_ADD;
        else if (!strcmp(op, "LDA")) code = OP_LDA;
        else if (!strcmp(op, "STA")) code = OP_STA;
        else if (!strcmp(op, "BUN")) code = OP_BUN;
        else if (!strcmp(op, "BSA")) code = OP_BSA;
        else if (!strcmp(op, "ISZ")) code = OP_ISZ;
        else if (!strcmp(op, "CLA")) code = OP_CLA;
        else if (!strcmp(op, "CLE")) code = OP_CLE;
        else if (!strcmp(op, "CMA")) code = OP_CMA;
        else if (!strcmp(op, "CME")) code = OP_CME;
        else if (!strcmp(op, "CIR")) code = OP_CIR;
        else if (!strcmp(op, "CIL")) code = OP_CIL;
        else if (!strcmp(op, "INC")) code = OP_INC;
        else if (!strcmp(op, "SPA")) code = OP_SPA;
        else if (!strcmp(op, "SNA")) code = OP_SNA;
        else if (!strcmp(op, "SZA")) code = OP_SZA;
        else if (!strcmp(op, "SZE")) code = OP_SZE;
        else if (!strcmp(op, "HLT")) code = OP_HLT;
        else if (!strcmp(op, "INP")) code = OP_INP;
        else if (!strcmp(op, "OUT")) code = OP_OUT;
        else if (!strcmp(op, "SKI")) code = OP_SKI;
        else if (!strcmp(op, "SKO")) code = OP_SKO;
        else if (!strcmp(op, "ION")) code = OP_ION;
        else if (!strcmp(op, "IOF")) code = OP_IOF;
        else if (!strcmp(op, "DEC")) { cpu.memory[loc++] = parse_number(arg) & 0xFFFF; continue; }
        else if (!strcmp(op, "HEX")) { cpu.memory[loc++] = parse_number(arg) & 0xFFFF; continue; }
        else { fprintf(stderr, "Unknown instruction '%s' at loc 0x%03X\n", op, loc); loc++; continue; }

        if (code < 0x7000) {
            uint16_t addr = 0;
            if (arg[0] != '\0') {
                int idx = find_symbol(arg);
                if (idx != -1) addr = symtab[idx].address;
                else { addr = parse_number(arg) & 0x0FFF; if (!isdigit((unsigned char)arg[0])) unresolved++; }
            }
            code |= addr;
            if (is_indirect) code |= 0x8000;
        }

        cpu.memory[loc] = code;
        loc++;
    }

    fclose(fp);
    if (unresolved)
        fprintf(stderr, "Warning: %d operand(s) could not be resolved to a symbol.\n", unresolved);

    if (have_entry) cpu.regs.PC = entry_point & 0x0FFF;

    printf("Assembly complete: %d symbol(s), program size %d word(s), entry at 0x%03X.\n",
           sym_count, loc, cpu.regs.PC);
    return 0;
}
