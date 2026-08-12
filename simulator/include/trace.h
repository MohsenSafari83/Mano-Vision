#ifndef TRACE_H
#define TRACE_H
int  trace_begin(const char *json_path);
void trace_step(const char *phase, const char *label);
void trace_end(void);
#endif
