# Architecture

ManoVision has two independent pieces that talk through one file format.

```
┌───────────────────┐        JSON trace        ┌────────────────────┐
│  simulator/  (C)   │ ───────────────────────► │  web/  (HTML/JS)   │
│  fetch → decode →  │   one object per micro-  │  replays the trace,│
│  execute, per the  │   operation: registers,  │  never recomputes  │
│  Mano micro-program│   flags, active signals  │  CPU state itself  │
└───────────────────┘                           └────────────────────┘
```

## simulator/

- `include/mano_types.h` — the `CPUState` struct: registers, flip-flops,
  control signals, memory. One global instance (`cpu`) shared by every module.
- `src/state.c` — owns `cpu`, plus `state_init`/`state_reset_control` and
  the plain-text register/memory dumps used by the interactive shell.
- `src/bus.c` — the common bus: `bus_update()` drives `cpu.bus_value` from
  whichever register `S_BUS` selects; `bus_register_transfers()` commits
  every asserted `LD_*` / `INCR_*` / `CLR_*` signal.
- `src/alu.c` — AND, ADD, complement, circular shift, increment.
- `src/memory.c` — the 4096×16 memory and its READ/WRITE port.
- `src/io.c` — console-backed INP/OUT device model.
- `src/control.c` — the control unit: `cpu_fetch_decode()` plus the three
  execute paths (memory-reference, register-reference, I/O), built from
  small `micro_step()` calls that mirror the T-state tables in Mano's book.
- `src/assembler.c` — two-pass assembler for the Mano mnemonics.
- `src/trace.c` — streams every micro-step to a JSON array on disk.
- `src/shell.c` / `src/main.c` — interactive REPL and CLI entry point.

## web/

- `index.html` — layout: datapath diagram, control-signal chips, memory
  window, timeline, output console, playback transport.
- `js/datapath.js` — builds the static SVG schematic once, then exposes
  `paintDatapath(step)` to toggle register/bus/ALU highlighting for
  whichever trace step is selected.
- `js/visualizer.js` — loads a trace JSON, drives the scrubber/play
  controls, and renders the console/memory/timeline panels from it.

## Why a trace file instead of compiling the C to WebAssembly

A JSON trace keeps the two halves genuinely independent: the browser
never re-implements fetch/decode/execute, so there is exactly one
source of truth for what the machine does. It also means the same
trace format could later be fed by a WASM build of the simulator
without changing a line of the web code — `trace_step()` is the only
place that would need to write into a JS-visible buffer instead of a file.
