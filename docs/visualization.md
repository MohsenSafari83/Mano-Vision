# Visualization notes

`mano_sim --trace program.asm out.json` runs the program to completion
(or 10000 cycles) and writes one JSON object per micro-operation:

```json
{
  "step": 42,
  "phase": "execute",
  "label": "AC <- AC + DR, E <- carry",
  "bus_select": 6,
  "bus_value": 17,
  "registers": { "AC": 42, "AR": 101, "PC": 102, "IR": 4198, "DR": 17,
                 "TR": 0, "SC": 0, "INPR": 0, "OUTR": 0 },
  "flags": { "E": 0, "IEN": 0, "FGI": 0, "FGO": 0, "R": 0, "I": 0, "S": 1 },
  "active_signals": ["ADD"],
  "memory_touched": 101
}
```

`phase` is one of `fetch`, `decode`, `execute`. `active_signals` lists
only the control lines asserted on that exact micro-step (so the
timeline in the browser can show, e.g., `LD_DR, READ` lighting up
together and nothing else).

The web page never parses or interprets Mano opcodes — it only reads
these fields and updates SVG elements and DOM text. If you want to
visualize a new program, regenerate its trace and add it to the
`<select id="program-select">` list in `index.html` (or extend
`visualizer.js` to accept a file upload).
