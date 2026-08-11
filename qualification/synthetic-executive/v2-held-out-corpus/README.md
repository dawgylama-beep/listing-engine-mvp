# Katherine's Eye V2 held-out corpus

This directory contains the sealed, not-executed fourteen-case Synthetic Executive V2 held-out corpus for Version 1.12.30.

Each `cases/KE-V2-Cxx` directory separates provider-visible material from case-scoped memory, presealed fake-worker input and dossier, hidden evaluator keys, action and transition constraints, scoring evidence, dispatch evidence and the case manifest. The future provider-visible assembler reads only `visible/episode.json` and its `visible/artifacts/` inventory.

Run `npm run verify:v2-held-out-corpus` to reconstruct every case, proof, hash, aggregate and release seal without credentials, network access, authority creation or case execution.

The corpus is `V2_HELD_OUT_CORPUS_SEALED_NOT_EXECUTED`. Katherine remains `NOT_QUALIFIED`. The proposed fourteen-case aggregate budget is not execution authority.
