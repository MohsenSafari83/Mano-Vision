#ifndef CONTROL_H
#define CONTROL_H
void cpu_fetch_decode(void);
void cpu_execute(void);
void cpu_execute_memory_reference(void);
void cpu_execute_register_reference(void);
void cpu_execute_io(void);
void cpu_step(void);
void cpu_run(unsigned max_cycles);
#endif
