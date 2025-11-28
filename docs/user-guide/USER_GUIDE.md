# OmniTrack AI - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Scenario Simulation](#scenario-simulation)
4. [Alert Management](#alert-management)
5. [Marketplace](#marketplace)
6. [Sustainability Tracking](#sustainability-tracking)
7. [Voice Interface](#voice-interface)
8. [AR Visualization](#ar-visualization)
9. [Best Practices](#best-practices)
10. [FAQ](#faq)

## Getting Started

### System Requirements

**Web Application**:
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Stable internet connection (minimum 5 Mbps)
- Screen resolution: 1280x720 or higher

**Voice Interface**:
- Microphone access
- Supported browsers: Chrome, Edge

**AR Visualization**:
- WebXR-compatible device or browser
- Fallback to 2D visualization available

### Logging In

1. Navigate to https://app.omnitrack.ai
2. Click "Sign In" in the top right corner
3. Enter your email and password
4. Click "Log In"

**First-time users**: Click "Create Account" and follow the registration process.

### User Roles

OmniTrack AI supports four user roles with different permissions:

| Role | Permissions |
|------|-------------|
| **Viewer** | View dashboards, alerts, and scenarios (read-only) |
| **Analyst** | Viewer permissions + run simulations, provide feedback |
| **Manager** | Analyst permissions + acknowledge alerts, publish scenarios |
| **Admin** | Full access including user management and system configuration |

## Dashboard Overview

The dashboard is your central hub for monitoring supply chain health and responding to disruptions.

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  OmniTrack AI                    [User Menu] [Notifications]│
├─────────────────────────────────────────────────────────────┤
│  [Dashboard] [Scenarios] [Marketplace] [Sustainability]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │  Digital Twin   │  │  Active Alerts  │  │ Key Metrics│ │
│  │     Status      │  │                 │  │            │ │
│  │                 │  │  • Critical: 2  │  │ Cost: $45K │ │
│  │  [View Map]     │  │  • High: 5      │  │ Risk: 72%  │ │
│  │                 │  │  • Medium: 12   │  │ Carbon: 8T │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Recent Scenario Simulations              │ │
│  │                                                       │ │
│  │  [List of recent simulations with status]            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics Cards

**Cost Impact**: Total estimated cost impact from active disruptions
- Green: < $10K
- Yellow: $10K - $50K
- Red: > $50K

**Risk Score**: Overall supply chain risk assessment (0-100%)
- Green: < 30%
- Yellow: 30% - 70%
- Red: > 70%

**Carbon Footprint**: Current carbon emissions (tons CO2e)
- Displays trend arrow (↑ increasing, ↓ decreasing, → stable)

### Digital Twin Status

The digital twin provides a real-time view of your supply chain:

- **Operational** (Green): All systems functioning normally
- **Degraded** (Yellow): Some performance issues detected
- **Disrupted** (Orange): Significant disruptions active
- **Offline** (Red): Critical systems unavailable

**Actions**:
- Click "View Map" to see geographic visualization
- Click "Refresh" to manually update digital twin state
- Click "AR View" to launch augmented reality visualization

### Active Alerts Panel

Displays current alerts sorted by priority:

**Alert Severity Levels**:
- 🔴 **Critical**: Immediate action required
- 🟠 **High**: Action needed within 4 hours
- 🟡 **Medium**: Action needed within 24 hours
- 🟢 **Low**: Informational, no immediate action required

**Alert Actions**:
- Click alert to view details
- Click "Acknowledge" to mark as seen
- Click "Resolve" to close alert
- Click "Run Scenario" to simulate mitigation strategies

## Scenario Simulation

Scenario simulation allows you to model disruption events and evaluate mitigation strategies.

### Creating a New Scenario

1. Navigate to **Scenarios** tab
2. Click **"New Scenario"** button
3. Fill in scenario parameters:

#### Scenario Parameters

**Disruption Type** (Required):
- Natural Disaster (hurricane, earthquake, flood)
- Supplier Failure (bankruptcy, quality issues)
- Transportation Disruption (port closure, route blockage)
- Demand Spike (unexpected order surge)
- Quality Issue (product recall, contamination)

**Location** (Required):
- Select from dropdown or enter custom location
- Can specify multiple affected locations

**Severity** (Required):
- Low: Minor impact, easily manageable
- Medium: Moderate impact, requires attention
- High: Significant impact, urgent response needed
- Critical: Severe impact, emergency response required

**Duration** (Optional):
- Estimated duration in hours
- Default: System will estimate based on historical data

**Affected Nodes** (Optional):
- Select specific supply chain nodes
- Leave empty to let system determine impact

**Advanced Parameters** (Optional):
- Custom parameters specific to disruption type
- Sustainability considerations
- Budget constraints

4. Click **"Run Simulation"**

### Understanding Simulation Results

Simulation results are displayed in multiple sections:

#### Impact Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                      Impact Summary                         │
├─────────────────────────────────────────────────────────────┤
│  Cost Impact:        $127,500 (±$15,000)                   │
│  Delivery Delay:     3.5 days (±0.5 days)                  │
│  Inventory Impact:   -2,400 units                          │
│  Carbon Footprint:   +450 kg CO2e                          │
│  Confidence:         87%                                    │
└─────────────────────────────────────────────────────────────┘
```

**Reading Impact Metrics**:
- Primary value shows expected impact
- ± range shows uncertainty (confidence interval)
- Confidence percentage indicates prediction reliability

#### Decision Tree Visualization

The decision tree shows the reasoning behind predictions:

```
                    [Disruption Event]
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      [Route A]      [Route B]      [Route C]
      Blocked        Available      Available
            │              │              │
            ▼              ▼              ▼
      High Cost    Medium Cost     Low Cost
      High Delay   Medium Delay    Low Delay
```

**Interacting with Decision Tree**:
- Hover over nodes to see details
- Click nodes to expand/collapse branches
- Color coding indicates impact severity

#### Mitigation Strategies

The system recommends top 3 balanced strategies:

**Strategy Card Example**:
```
┌─────────────────────────────────────────────────────────────┐
│  Strategy 1: Reroute via Alternative Supplier               │
├─────────────────────────────────────────────────────────────┤
│  Cost:         $85,000 (33% reduction)                      │
│  Time:         2.1 days (40% improvement)                   │
│  Risk:         Medium                                       │
│  Carbon:       +200 kg CO2e                                 │
│                                                             │
│  Trade-offs:                                                │
│  ✓ Faster delivery                                         │
│  ✓ Lower cost                                              │
│  ✗ Slightly higher emissions                               │
│                                                             │
│  [Select Strategy]  [View Details]                         │
└─────────────────────────────────────────────────────────────┘
```

**Comparing Strategies**:
- Click "Compare All" to see side-by-side comparison
- Use filters to prioritize cost, time, or sustainability
- View trade-off charts for visual comparison

#### Natural Language Summary

AI-generated explanation in plain English:

> "Based on the simulation, a supplier failure at Node A would cause a 3.5-day delivery delay and cost approximately $127,500. The primary impact stems from the need to source materials from alternative suppliers at higher prices. The recommended strategy of rerouting via Supplier B reduces costs by 33% and improves delivery time by 40%, though it increases carbon emissions by 200 kg CO2e due to longer transportation distance."

### Scenario Variations

Generate alternative scenarios to explore different possibilities:

1. Click **"Generate Variations"** on simulation results
2. System creates 3-5 variations with different parameters
3. Compare variations side-by-side
4. Select most relevant variation for detailed analysis

### Providing Feedback

Help improve prediction accuracy by providing feedback:

1. After real disruption event occurs, navigate to scenario
2. Click **"Provide Feedback"**
3. Enter actual outcomes:
   - Actual cost impact
   - Actual delivery delay
   - Actual inventory impact
4. Rate prediction accuracy (1-5 stars)
5. Add optional comments
6. Click **"Submit Feedback"**

Feedback is used to retrain ML models and improve future predictions.

## Alert Management

### Viewing Alerts

**Alert List View**:
- Navigate to **Dashboard** or **Alerts** tab
- Alerts sorted by severity and timestamp
- Filter by severity, status, or date range

**Alert Details**:
Click any alert to view:
- Full description
- Affected nodes
- Recommended actions
- Related scenarios
- Historical context

### Acknowledging Alerts

1. Open alert details
2. Click **"Acknowledge"** button
3. Add optional note
4. Click **"Confirm"**

Acknowledged alerts notify team members and update status.

### Resolving Alerts

1. Open alert details
2. Take recommended actions
3. Click **"Resolve"** button
4. Select resolution reason:
   - Issue resolved
   - False positive
   - Duplicate alert
   - Other (specify)
5. Add resolution notes
6. Click **"Confirm"**

### Alert Subscriptions

Configure notification preferences:

1. Click user menu → **"Settings"**
2. Navigate to **"Notifications"** tab
3. Configure channels:
   - ✓ Email
   - ✓ Slack
   - ✓ Microsoft Teams
   - ✓ Mobile push
4. Set severity threshold (receive alerts at or above):
   - Critical only
   - High and above
   - Medium and above
   - All alerts
5. Configure quiet hours (optional)
6. Click **"Save Preferences"**

## Marketplace

The Scenario Marketplace allows you to share and discover disruption scenarios from the community.

### Browsing Scenarios

1. Navigate to **Marketplace** tab
2. Browse featured scenarios or use search

**Search and Filters**:
- **Text Search**: Search by keywords in title/description
- **Industry**: Filter by industry (manufacturing, retail, logistics, etc.)
- **Disruption Type**: Filter by disruption category
- **Geography**: Filter by region or country
- **Rating**: Filter by minimum star rating
- **Sort By**: Most popular, highest rated, most recent

### Viewing Scenario Details

Click any scenario to view:
- Full description
- Author information
- Usage statistics (how many times used)
- Community ratings and reviews
- Parameter details
- Sample results

### Using Marketplace Scenarios

**Option 1: Run As-Is**
1. Click **"Run Scenario"**
2. System executes with original parameters
3. View results

**Option 2: Customize (Fork)**
1. Click **"Customize"**
2. Modify parameters as needed
3. Click **"Run Simulation"**
4. Original author attribution preserved

### Publishing Scenarios

Share your scenarios with the community:

1. Run a scenario simulation
2. Click **"Publish to Marketplace"**
3. Fill in marketplace details:
   - Title (required)
   - Description (required)
   - Tags (recommended)
   - Industry category
   - Geography
4. Review and click **"Publish"**

**Publishing Guidelines**:
- Use clear, descriptive titles
- Provide detailed descriptions
- Add relevant tags for discoverability
- Ensure scenario is well-tested
- Follow community guidelines

### Rating and Reviewing

Help others by rating scenarios:

1. Open scenario details
2. Click **"Rate This Scenario"**
3. Select star rating (1-5)
4. Write optional review
5. Click **"Submit Rating"**

**Rating Guidelines**:
- ⭐ Poor: Inaccurate or not useful
- ⭐⭐ Fair: Some value but limited
- ⭐⭐⭐ Good: Useful and reasonably accurate
- ⭐⭐⭐⭐ Very Good: Highly useful and accurate
- ⭐⭐⭐⭐⭐ Excellent: Exceptional quality and accuracy

## Sustainability Tracking

Monitor and optimize environmental impact of supply chain decisions.

### Sustainability Dashboard

Navigate to **Sustainability** tab to view:

**Current Metrics**:
- Total carbon footprint (tons CO2e)
- Emissions by route
- Emissions by transportation mode
- Sustainability score (0-100)

**Trend Analysis**:
- Historical carbon footprint over time
- Comparison to baseline
- Progress toward sustainability goals

**Threshold Alerts**:
- Notifications when emissions exceed targets
- Recommended corrective actions

### Comparing Strategies

Evaluate environmental impact of different approaches:

1. Run scenario simulation
2. Navigate to **Sustainability** tab in results
3. View carbon footprint for each strategy
4. Click **"Compare Strategies"**
5. See side-by-side environmental comparison

**Comparison Metrics**:
- Carbon footprint (kg CO2e)
- Emissions by source (transportation, manufacturing, etc.)
- Sustainability score
- Trade-offs with cost and time

### Setting Sustainability Goals

1. Navigate to **Sustainability** → **"Goals"**
2. Click **"Set New Goal"**
3. Configure goal:
   - Target metric (carbon footprint, sustainability score)
   - Target value
   - Target date
   - Baseline for comparison
4. Click **"Save Goal"**

Track progress on dashboard with visual indicators.

### Environmental Reports

Generate sustainability reports:

1. Navigate to **Sustainability** → **"Reports"**
2. Select report type:
   - Monthly summary
   - Quarterly analysis
   - Annual report
   - Custom date range
3. Click **"Generate Report"**
4. Download as PDF or CSV

## Voice Interface

Interact with OmniTrack AI using natural language voice commands.

### Activating Voice Interface

**Method 1**: Click microphone icon in top navigation
**Method 2**: Say "Hey OmniTrack" (if wake word enabled)
**Method 3**: Navigate to **Voice** tab

### Supported Commands

**Status Queries**:
- "What's the current supply chain status?"
- "Show me active alerts"
- "What's my risk score?"
- "How many critical alerts do I have?"

**Scenario Operations**:
- "Run a supplier failure scenario in China"
- "Show me recent simulations"
- "What are the results of scenario 12345?"

**Alert Management**:
- "Acknowledge alert 789"
- "Show me critical alerts from today"
- "What's the highest priority alert?"

**Marketplace**:
- "Search marketplace for hurricane scenarios"
- "Show me top-rated scenarios"

**Sustainability**:
- "What's my current carbon footprint?"
- "Show sustainability trends for this month"

### Voice Response Modes

**Audio + Visual**: Default mode
- Spoken response
- Visual information displayed on screen

**Audio Only**: Hands-free mode
- Spoken response only
- Useful while multitasking

**Visual Only**: Quiet environments
- Text response displayed
- No audio output

Configure in Settings → Voice → Response Mode

### Handling Ambiguity

If voice command is unclear:
1. System asks clarifying question
2. Provide additional information
3. System executes refined command

**Example**:
- You: "Run a scenario"
- System: "What type of disruption would you like to simulate?"
- You: "Supplier failure"
- System: "Which location?"
- You: "Shanghai"
- System: "Running supplier failure scenario for Shanghai..."

## AR Visualization

Explore your supply chain in augmented reality for immersive spatial understanding.

### Launching AR View

**Requirements**:
- WebXR-compatible device or browser
- Camera permissions granted
- Adequate lighting

**Steps**:
1. Navigate to **Dashboard** or **Digital Twin**
2. Click **"AR View"** button
3. Grant camera permissions if prompted
4. Point device at flat surface
5. AR visualization appears

### AR Controls

**Navigation**:
- **Pinch**: Zoom in/out
- **Drag**: Rotate view
- **Two-finger drag**: Pan view
- **Tap node**: Select and view details

**Filters**:
- Show/hide node types
- Filter by status (operational, disrupted, etc.)
- Highlight specific routes
- Show/hide metrics overlay

### AR Features

**Node Visualization**:
- 3D markers for supply chain nodes
- Color-coded by status
- Size indicates capacity or importance
- Animated indicators for active disruptions

**Route Visualization**:
- Lines connecting nodes
- Color indicates route health
- Thickness indicates volume
- Animated flow direction

**Disruption Highlighting**:
- Red pulsing markers for disrupted nodes
- Orange routes for affected paths
- Impact radius visualization
- Severity indicators

**Information Overlay**:
- Tap node to see details card
- Real-time metrics
- Historical trends
- Quick actions (run scenario, view alerts)

### Fallback to 2D View

If AR not supported:
- System automatically falls back to 2D interactive map
- All features available in 2D mode
- Similar interaction patterns

## Best Practices

### Scenario Simulation

✅ **Do**:
- Run simulations regularly to stay prepared
- Use realistic parameters based on your supply chain
- Generate variations to explore different possibilities
- Provide feedback to improve accuracy
- Share useful scenarios with community

❌ **Don't**:
- Rely solely on simulations without human judgment
- Ignore uncertainty ranges in predictions
- Skip providing feedback after real events
- Use outdated scenarios without updating parameters

### Alert Management

✅ **Do**:
- Acknowledge alerts promptly
- Document resolution actions
- Configure appropriate notification thresholds
- Review alert patterns for trends
- Escalate critical alerts immediately

❌ **Don't**:
- Ignore low-severity alerts completely
- Acknowledge without investigating
- Set threshold too high (miss important alerts)
- Set threshold too low (alert fatigue)

### Marketplace Usage

✅ **Do**:
- Rate scenarios you use
- Provide constructive reviews
- Customize scenarios for your context
- Give credit to original authors
- Follow community guidelines

❌ **Don't**:
- Publish untested scenarios
- Copy scenarios without attribution
- Leave unhelpful reviews
- Spam with duplicate scenarios

### Sustainability

✅ **Do**:
- Set realistic sustainability goals
- Monitor trends regularly
- Consider environmental impact in decisions
- Balance cost, time, and sustainability
- Report progress to stakeholders

❌ **Don't**:
- Ignore sustainability metrics
- Optimize only for cost
- Set unrealistic goals
- Neglect to track progress

## FAQ

### General

**Q: How often is the digital twin updated?**
A: The digital twin updates within 5 seconds for IoT sensor data and within 30 seconds for ERP system data.

**Q: Can I use OmniTrack AI offline?**
A: No, OmniTrack AI requires an internet connection for real-time data and AI processing.

**Q: What browsers are supported?**
A: Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+ are fully supported.

### Scenarios

**Q: How accurate are scenario predictions?**
A: Accuracy varies by scenario type and data quality. Confidence scores indicate reliability. Historical accuracy metrics are available in the Learning section.

**Q: How long does a simulation take?**
A: Most simulations complete within 60 seconds. Complex scenarios may take up to 2 minutes.

**Q: Can I save scenarios for later?**
A: Yes, all scenarios are automatically saved and accessible from the Scenarios tab.

**Q: How many scenarios can I run?**
A: No limit on scenario count. Rate limits apply: 100 simulations per hour per user.

### Alerts

**Q: Why didn't I receive an alert notification?**
A: Check your notification settings and severity threshold. Verify email/Slack/Teams integration is configured correctly.

**Q: Can I customize alert thresholds?**
A: Yes, admins can configure custom thresholds in Settings → Alerts → Thresholds.

**Q: How long are alerts retained?**
A: Active and acknowledged alerts are retained for 90 days. Resolved alerts are archived after 30 days.

### Marketplace

**Q: Are marketplace scenarios free?**
A: Yes, all marketplace scenarios are free to use.

**Q: Can I make my published scenario private?**
A: Yes, click "Unpublish" on your scenario to remove it from the marketplace.

**Q: How do I report inappropriate content?**
A: Click "Report" on the scenario and select a reason. Our team reviews reports within 24 hours.

### Sustainability

**Q: How is carbon footprint calculated?**
A: We use industry-standard emission factors for transportation modes, manufacturing processes, and energy sources.

**Q: Can I customize emission factors?**
A: Yes, admins can configure custom emission factors in Settings → Sustainability → Emission Factors.

**Q: How do I export sustainability data?**
A: Navigate to Sustainability → Reports → Generate Report → Download CSV.

### Voice Interface

**Q: What languages are supported?**
A: Currently English only. Additional languages coming soon.

**Q: Why isn't voice recognition working?**
A: Check microphone permissions, ensure stable internet connection, and verify browser compatibility.

**Q: Can I disable voice wake word?**
A: Yes, in Settings → Voice → Wake Word → Disable.

### AR Visualization

**Q: My device doesn't support AR. What can I do?**
A: The system automatically falls back to 2D interactive map with all features available.

**Q: Why is AR performance slow?**
A: AR requires significant processing power. Close other apps, ensure good lighting, and use a newer device if possible.

**Q: Can I record AR sessions?**
A: Screen recording is supported through your device's native recording features.

## Support

### Getting Help

- **Documentation**: https://docs.omnitrack.ai
- **Email Support**: support@omnitrack.ai
- **Live Chat**: Available in-app (bottom right corner)
- **Community Forum**: https://community.omnitrack.ai

### Reporting Issues

1. Click user menu → **"Report Issue"**
2. Describe the problem
3. Attach screenshots if applicable
4. Click **"Submit"**

Response time: 24 hours for standard issues, 4 hours for critical issues.

### Feature Requests

Submit feature requests through:
- In-app feedback form
- Community forum
- Email: feedback@omnitrack.ai

---

**Document Version**: 1.0.0  
**Last Updated**: January 2024  
**For**: OmniTrack AI Platform v1.0
