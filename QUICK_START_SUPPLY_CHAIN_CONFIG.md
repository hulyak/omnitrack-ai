# Quick Start: Supply Chain Configuration

## What's New? 🎉

Your OmniTrack AI dashboard now has a **dynamic supply chain configuration system**! You can customize your supply chain parameters and watch the AI agents analyze real data based on your choices.

## How to Use

### Step 1: Open the Dashboard

```bash
cd frontend
npm run dev
```

Navigate to: http://localhost:3000/dashboard

### Step 2: Configure Your Supply Chain

Look for the **"Supply Chain Configuration"** panel on the right side of the dashboard.

Click **"Edit Configuration"** to expand the form.

### Step 3: Choose Your Parameters

**Region** - Where is your supply chain located?
- Asia-Pacific (Shanghai, Singapore, Tokyo, etc.)
- North America (LA, New York, Chicago, etc.)
- Europe (London, Hamburg, Paris, etc.)
- Latin America (São Paulo, Buenos Aires, etc.)
- Middle East (Dubai, Riyadh, Istanbul, etc.)

**Industry** - What do you manufacture?
- Electronics Manufacturing
- Automotive
- Pharmaceuticals
- Food & Beverage
- Fashion & Apparel
- Chemicals

**Currency** - What currency do you use?
- USD, EUR, GBP, CNY, JPY

**Shipping Methods** - How do you transport goods? (Select multiple)
- ☑️ Sea Freight (low carbon, slower)
- ☑️ Air Freight (high carbon, faster)
- ☑️ Rail (medium carbon, medium speed)
- ☑️ Truck (flexible, regional)
- ☑️ Express Delivery (fast, expensive)

**Supply Chain Nodes** - How complex is your network?
- Slide from 3 (Simple) to 12 (Complex)
- More nodes = more locations and complexity

**Risk Profile** - What's your risk exposure?
- 🟢 Low Risk: Stable suppliers, minimal disruptions
- 🟡 Medium Risk: Occasional delays, moderate volatility
- 🔴 High Risk: Frequent disruptions, high volatility

### Step 4: Apply Configuration

Click **"Apply Configuration"** button.

Watch as:
- ✅ Supply chain network regenerates with new nodes
- ✅ Locations update based on your region
- ✅ Node details reflect your industry
- ✅ Risk profile affects node health status

### Step 5: Run AI Agents

Now click on any agent button to see them analyze YOUR supply chain:

**🔍 Info Agent** - Scan for Anomalies
- Finds nodes with low inventory
- Reports critical and warning status
- Provides specific recommendations

**🎯 Scenario Agent** - Run Simulation
- Select a disruption scenario
- See impact based on YOUR configuration
- Costs shown in YOUR currency
- Recommendations based on YOUR shipping methods

**🛡️ Strategy Agent** - Generate Mitigation Plan
- Analyzes YOUR supply chain health
- Suggests strategies for YOUR specific issues
- Considers YOUR risk profile
- Provides cost estimates in YOUR currency

**🌱 Impact Agent** - Calculate ESG Impact
- Carbon footprint based on YOUR shipping methods
- Social metrics based on YOUR risk profile
- Governance scores based on YOUR network
- Specific recommendations for improvement

## Example Configurations to Try

### 1. High-Tech Electronics (Stable)
```
Region: Asia-Pacific
Industry: Electronics
Currency: USD
Shipping: Sea Freight + Air Freight + Rail
Nodes: 6
Risk: Low
```
**Expected Result**: Healthy supply chain, optimization recommendations

### 2. Automotive (Stressed)
```
Region: North America
Industry: Automotive
Currency: USD
Shipping: Truck + Express
Nodes: 8
Risk: High
```
**Expected Result**: Multiple critical nodes, urgent mitigation strategies

### 3. Pharma (Balanced)
```
Region: Europe
Industry: Pharmaceuticals
Currency: EUR
Shipping: Air Freight + Express
Nodes: 10
Risk: Medium
```
**Expected Result**: Mixed health, inventory optimization needed

## What Makes This Different?

### Before ❌
- Static supply chain data
- Agents returned generic responses
- No connection between configuration and results

### Now ✅
- **Dynamic supply chain generation** based on YOUR choices
- **Context-aware AI agents** that analyze YOUR data
- **Realistic scenarios** that reflect YOUR business
- **Relevant recommendations** for YOUR situation

## Tips for Best Results

1. **Start Simple**: Try 3-6 nodes first to understand the system
2. **Experiment with Risk**: See how risk profile affects node health
3. **Compare Shipping Methods**: Notice how rail/sea reduce carbon vs air freight
4. **Run Agents After Changes**: Always run agents after applying new configuration
5. **Try Different Regions**: See how locations change based on region selection

## Troubleshooting

**Q: Agents still showing old data?**
A: Make sure you clicked "Apply Configuration" and waited for the network to update.

**Q: All nodes showing as healthy?**
A: Try increasing the risk profile to "Medium" or "High" for more realistic scenarios.

**Q: Want more nodes?**
A: Slide the "Supply Chain Nodes" slider to the right (up to 12 nodes).

**Q: Currency not changing in agent results?**
A: The currency is applied when you run the agents. Try running them again after configuration change.

## What's Happening Behind the Scenes?

1. **You configure** → Form sends data to API
2. **API updates** → Data store regenerates nodes
3. **Nodes created** → Based on region, industry, risk
4. **Network updates** → Visual display shows new nodes
5. **Agents analyze** → Process real node data
6. **Results shown** → Context-aware insights

## Next Steps

- Try all different regions to see global supply chains
- Experiment with different industries
- Compare low vs high risk profiles
- See how shipping methods affect ESG scores
- Run multiple scenarios with different configurations

---

**Enjoy your dynamic, configurable supply chain! 🚀**

If you have questions or want to add more configuration options, let me know!
