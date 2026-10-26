# Monty Hall classroom simulator

Live site: https://oilvegetable.github.io/monty-hall-simulator/

The English classroom interface is a self-contained `index.html`. GitHub Pages
publishes the root of `main`; no build, dependencies, or external assets are needed.

## Views

- **Play:** choose a door, watch the host reveal doors, then stay or switch.
- **Simulation:** enter a whole-number trial count (1–1,000,000), run the current
  host, or compare all three hosts. Enter also starts a run. Export completed runs
  as CSV.
- **Door count:** inspect model probabilities for every valid door count through
  100, or animate the selected point with **Play**. **Simulate curve** runs the
  entered number of trials separately at every door count and overlays observed
  rates as circles. Its CSV contains one row per door count, including eligible
  counts and Wilson confidence intervals. Simulations run in a stoppable worker.

The two trial inputs share the same value. Each run starts a fresh sample.
Both charts show coordinates and observed/model winning rates on hover. You can
also focus a chart and use Left/Right, Home/End, or Escape to inspect or dismiss
the readout. Observed trial values snap to the recorded points on the curve;
door-count values snap to whole doors. Trial-axis labels always use whole numbers.

## Model assumptions

The host rule and random action rate are selected above / in **Advanced**.
**Leave two doors closed** means the host opens N − 2 doors at each N. Otherwise,
the current number of host openings R is fixed throughout the curve, whose first
valid point is N = R + 2. Switching selects one other remaining closed door.

Every displayed winning probability is conditional on **all host reveals being
goats**. Revealing the car aborts the game. Informed hosts never do this.
Uninformed and error-prone hosts can; the eligible count is shown separately.

With two doors left, an informed host gives stay = 1/N and switch = (N − 1)/N.
An uninformed host gives 50% for each strategy after safe reveals, with only 2/N
of trials eligible. Large door counts therefore need more trials for stable
observed rates under this host rule.

The seed reproduces results. A door-count run derives a separate seed for each
N (`seed|doors|N`); this exact derived seed is included in its CSV. At a given N,
stay and switch are evaluated on the same games. Door-count samples are separate
from samples in the Simulation view.

## Local checks

```sh
node test-engine.cjs
python3 -m http.server 8768 --bind 127.0.0.1
```

Open http://127.0.0.1:8768/ for preview. The tests extract the actual engine and
worker from `index.html`, check every door count under both opening policies,
exercise the worker protocol, and verify host probabilities and trial limits.
