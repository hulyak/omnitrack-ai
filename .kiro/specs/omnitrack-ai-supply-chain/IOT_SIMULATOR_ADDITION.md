# IoT Data Simulator Module - Specification Addition

## Overview

The IoT Data Simulator Module has been successfully integrated into the OmniTrack AI specification documents. This module enables demonstration and testing of the platform without requiring physical IoT infrastructure by generating realistic synthetic sensor data streams.

## Changes Made

### 1. Requirements Document (requirements.md)

**Added to Glossary:**
- **IoT Data Simulator**: Component that generates synthetic sensor data streams for demonstration and testing purposes

**Added Requirement 13:**
- **User Story**: As a demo user or system tester, I want to simulate realistic IoT sensor data streams
- **5 Acceptance Criteria** (EARS-compliant):
  1. Simulator activation with configurable intervals
  2. Anomaly injection for fault simulation
  3. Data injection into Info Agent pipeline
  4. Real-time parameter updates
  5. Real-time visualization of generated data

### 2. Design Document (design.md)

**Added Service Section:**
- **IoT Data Simulator Service** (Section 10)
  - Endpoints: `/simulator/control`, `/simulator/status`
  - Implementation details (Lambda/ECS)
  - Configuration schema with TypeScript interfaces
  - Generated event schema
  - Data flow architecture
  - UI control specifications

**Added API Endpoints:**
```
POST   /simulator/start
POST   /simulator/stop
GET    /simulator/status
PUT    /simulator/config
GET    /simulator/events
```

**Added WebSocket Messages:**
- `simulator_event`: Real-time simulated sensor data
- `simulator_status`: Simulator state changes

**Added 5 Correctness Properties:**
- **Property 46**: Simulator data generation timing
- **Property 47**: Anomaly injection correctness
- **Property 48**: Simulator data pipeline integration
- **Property 49**: Simulator parameter reactivity
- **Property 50**: Simulator visualization completeness

### 3. Tasks Document (tasks.md)

**Added Task 30: Implement IoT Data Simulator backend**
- Lambda function creation
- Sensor data generation with randomization
- Anomaly injection logic
- Data publishing to Info Agent
- Control API endpoints
- WebSocket support
- State management in DynamoDB

**Added 4 Property-Based Test Sub-tasks:**
- 30.1: Test data generation timing (Property 46)
- 30.2: Test anomaly injection (Property 47)
- 30.3: Test pipeline integration (Property 48)
- 30.4: Test parameter reactivity (Property 49)

**Added Task 31: Build IoT Simulator Control Panel UI**
- Control panel component
- Configuration sliders
- Sensor type selection
- Real-time event visualization
- Event history log
- WebSocket integration

**Added 1 Property-Based Test Sub-task:**
- 31.1: Test visualization completeness (Property 50)

**Updated Task Numbers:**
- Task 32 → Checkpoint
- Task 33 → Deploy to staging (was 31)
- Task 34 → Create documentation (was 32)
- Task 35 → Final checkpoint (was 33)

## Technical Specifications

### Simulator Configuration

```typescript
interface SimulatorConfig {
  enabled: boolean;
  frequency: number; // seconds between events
  anomalyRate: number; // 0-1 probability
  sensorTypes: string[]; // ['temperature', 'humidity', 'location']
  sensorCount: number; // number of virtual sensors
  valueRanges: {
    [sensorType: string]: {
      min: number;
      max: number;
      anomalyMin: number;
      anomalyMax: number;
    };
  };
}
```

### Generated Event Schema

```typescript
interface SimulatedSensorEvent {
  sensorId: string;
  sensorType: string;
  timestamp: string;
  value: number;
  unit: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isAnomaly: boolean;
  metadata: {
    simulated: true;
    sessionId: string;
  };
}
```

## Data Flow

```
IoT Simulator (Lambda/ECS)
    ↓
API Gateway / WebSocket
    ↓
DynamoDB / Kinesis
    ↓
Info Agent
    ↓
Agentic AI Workflows
    ↓
Digital Twin Updates
    ↓
Alert Generation / Risk Assessment
```

## Supported Sensor Types

1. **Temperature** - Celsius/Fahrenheit readings
2. **Humidity** - Percentage readings
3. **Location** - GPS coordinates (lat/long)
4. **Pressure** - Pascal/PSI readings
5. **Vibration** - Acceleration readings
6. **Inventory Levels** - Unit counts

## UI Features

### Control Panel
- **Start/Stop Buttons**: Enable/disable simulator
- **Frequency Slider**: 1-60 seconds between events
- **Anomaly Rate Slider**: 0-50% probability
- **Sensor Count Selector**: 1-100 virtual sensors
- **Sensor Type Checkboxes**: Select which sensor types to simulate

### Visualization Dashboard
- **Real-time Event Stream**: Live display of generated events
- **Anomaly Markers**: Visual indicators for out-of-range values
- **Current Sensor Values**: Gauges/charts for each sensor
- **Event History Log**: Scrollable list with filtering
- **Statistics Panel**: Event count, anomaly count, uptime

## Property-Based Testing

All 5 correctness properties will be implemented using **fast-check** with minimum 100 iterations:

1. **Property 46**: Verify events generated at configured frequency
2. **Property 47**: Verify anomaly percentage matches configuration
3. **Property 48**: Verify simulated data processed identically to real data
4. **Property 49**: Verify parameter changes applied within 2 seconds
5. **Property 50**: Verify UI displays all required metrics

## Benefits

### For Demonstrations
- No physical IoT hardware required
- Controllable scenarios for presentations
- Realistic data patterns
- Anomaly injection for showcasing alert system

### For Testing
- Reproducible test scenarios
- Stress testing with high event rates
- Edge case simulation (anomalies, failures)
- Integration testing without external dependencies

### For Development
- Local development without AWS IoT Core
- Rapid iteration on agent workflows
- Data pipeline validation
- Performance benchmarking

## Implementation Priority

This module is positioned as **Task 30-31** in the implementation plan, to be completed after:
- Core infrastructure (Tasks 1-2)
- Authentication (Task 3)
- Data models (Task 4)
- Agent implementations (Tasks 5-17)
- Frontend components (Tasks 19-26)
- API endpoints (Task 27)
- Monitoring and security (Tasks 28-29)

And before:
- Final checkpoint (Task 32)
- Staging deployment (Task 33)
- Documentation (Task 34)
- Production readiness (Task 35)

## Next Steps

To implement this module:

1. **Review the specification** with stakeholders
2. **Implement Task 30** - Backend simulator service
3. **Implement Task 31** - Frontend control panel
4. **Run property-based tests** to verify correctness
5. **Integrate with existing Info Agent** pipeline
6. **Test end-to-end** with agent workflows
7. **Document usage** in user guide

## Files Modified

- `.kiro/specs/omnitrack-ai-supply-chain/requirements.md` - Added Requirement 13
- `.kiro/specs/omnitrack-ai-supply-chain/design.md` - Added service design and properties
- `.kiro/specs/omnitrack-ai-supply-chain/tasks.md` - Added Tasks 30-31 with sub-tasks

## Compliance

All additions follow the established patterns:
- ✅ EARS syntax for requirements
- ✅ INCOSE quality rules
- ✅ Property-based testing approach
- ✅ Numbered correctness properties
- ✅ Task-to-requirement traceability
- ✅ TypeScript type definitions
- ✅ API endpoint specifications
- ✅ WebSocket message definitions

---

**Status**: Specification complete, ready for implementation
**Date**: November 27, 2025
**Feature**: IoT Data Simulator Module
