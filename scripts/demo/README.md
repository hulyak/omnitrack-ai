# Local Agent Demo

Run the 4 agents locally without AWS deployment - perfect for hackathon demos!

## Quick Start

```bash
cd scripts/demo
npm install
npm run demo
```

## What It Does

1. **Info Agent** - Detects anomalies in supply chain data
2. **Scenario Agent** - Runs Monte Carlo simulations
3. **Strategy Agent** - Generates mitigation strategies
4. **Impact Agent** - Calculates sustainability & cost impact

## Output

The script will show real-time output of each agent working:
- Anomaly detection results
- Scenario simulations with probabilities
- Strategy recommendations
- Impact analysis with carbon footprint

## For Hackathon Video

Record your terminal running this script to show agents actually working with real logic!

```bash
# Record terminal output
script -q demo-output.txt npm run demo
```

Then show this in your video alongside the landing page demo.
