# Live Demo Data Setup

## What Was Implemented

Your dashboard now uses **real-time data** instead of hardcoded mock data!

### Architecture

```
Frontend Dashboard
      ↓
   API Routes (/api/supply-chain/*)
      ↓
In-Memory Data Store (demo-data-store.ts)
      ↓
Server-Sent Events (SSE) Stream
      ↓
Real-Time Updates Every 3 Seconds
```

### Files Created

1. **`lib/demo-data-store.ts`** - In-memory data store that simulates IoT sensor data
2. **`app/api/supply-chain/nodes/route.ts`** - REST API to fetch current nodes
3. **`app/api/supply-chain/stream/route.ts`** - SSE endpoint for real-time updates
4. **Updated `components/dashboard/supply-chain-network.tsx`** - Now fetches real data

### How It Works

1. **Data Store**: Maintains supply chain nodes with realistic metrics
2. **Simulation**: Updates inventory, temperature, delays every 3 seconds
3. **Anomaly Detection**: Automatically flags critical conditions
4. **Real-Time Stream**: Pushes updates to dashboard via Server-Sent Events
5. **Auto-Reconnect**: Handles connection drops gracefully

### Features

- ✅ Real-time data updates (3-second intervals)
- ✅ Automatic anomaly detection
- ✅ Geographic locations for each node
- ✅ Temperature, inventory, and delay monitoring
- ✅ Status indicators (healthy/warning/critical)
- ✅ Connection status display
- ✅ Auto-reconnection on failure

### Testing

1. Start the dev server: `npm run dev`
2. Navigate to `/dashboard`
3. Watch the "Live Data" indicator turn green
4. Observe metrics updating every 3 seconds
5. Watch for anomalies (red status indicators)

### For Hackathon Demo

**What to Show Judges:**

1. **Live Data Flow**: Point out the green "Live Data" indicator
2. **Real-Time Updates**: Watch inventory levels change automatically
3. **Anomaly Detection**: Show critical status when thresholds are breached
4. **Geographic Distribution**: Mention nodes span Shanghai → Singapore → LA → NY → London
5. **Production-Ready**: Explain this simulates real IoT sensors

**Talking Points:**

- "This dashboard shows real-time data from our IoT simulator"
- "Data updates every 3 seconds, just like production IoT sensors"
- "The system automatically detects anomalies and flags critical nodes"
- "In production, this would connect to AWS IoT Core and DynamoDB"
- "We're using Server-Sent Events for efficient real-time updates"

### Next Steps (Optional Enhancements)

1. **Add WebSocket** for bi-directional communication
2. **Connect to AWS** when deployed (IoT Core + DynamoDB)
3. **Add Alert System** that triggers on anomalies
4. **Historical Charts** showing trends over time
5. **Agent Triggers** when anomalies are detected

### Production Migration

To connect to real AWS services:

```typescript
// In api/supply-chain/nodes/route.ts
const dynamodb = new DynamoDBClient({ region: 'us-east-1' });
const nodes = await dynamodb.scan({
  TableName: 'omnitrack-main',
  FilterExpression: 'begins_with(PK, :pk)',
  ExpressionAttributeValues: { ':pk': 'NODE#' }
});
```

## Summary

Your dashboard now demonstrates a **production-like data pipeline** with real-time updates, anomaly detection, and geographic distribution. This is much more impressive than static mock data and shows judges that you understand real-world IoT architectures!
