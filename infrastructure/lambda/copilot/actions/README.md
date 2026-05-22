# Copilot Actions - Build Category

This directory contains the implementation of copilot actions for building and managing supply chain networks.

## Overview

Actions are executable operations that the AI Copilot can perform in response to user intents. Each action has:
- A unique name
- A category (build, configure, analyze, simulate, query)
- A description
- Example phrases that trigger it
- Parameter definitions with validation
- An execute function that performs the operation

## Node Management Actions

### add-supplier
Creates a new supplier node in the supply chain network.

**Parameters:**
- `location` (object, required): Location with latitude, longitude, address, city, country
- `capacity` (number, required): Production capacity (must be > 0)
- `name` (string, optional): Optional name for the supplier

**Example phrases:**
- "Add a supplier in Shanghai"
- "Create a new supplier node"
- "Add supplier at location X"

### add-manufacturer
Creates a new manufacturer node in the supply chain network.

**Parameters:**
- `location` (object, required): Location with latitude, longitude, address, city, country
- `capacity` (number, required): Production capacity (must be > 0)
- `name` (string, optional): Optional name for the manufacturer

**Example phrases:**
- "Add a manufacturer in Detroit"
- "Create a new manufacturing facility"
- "Add manufacturer at location X"

### add-warehouse
Creates a new warehouse node in the supply chain network.

**Parameters:**
- `location` (object, required): Location with latitude, longitude, address, city, country
- `capacity` (number, required): Storage capacity (must be > 0)
- `name` (string, optional): Optional name for the warehouse

**Example phrases:**
- "Add a warehouse in Memphis"
- "Create a new storage facility"
- "Add warehouse at location X"

### add-distributor
Creates a new distributor node in the supply chain network.

**Parameters:**
- `location` (object, required): Location with latitude, longitude, address, city, country
- `capacity` (number, required): Distribution capacity (must be > 0)
- `name` (string, optional): Optional name for the distributor

**Example phrases:**
- "Add a distributor in Chicago"
- "Create a new distribution center"
- "Add distributor at location X"

### add-retailer
Creates a new retailer node in the supply chain network.

**Parameters:**
- `location` (object, required): Location with latitude, longitude, address, city, country
- `capacity` (number, required): Sales capacity (must be > 0)
- `name` (string, optional): Optional name for the retailer

**Example phrases:**
- "Add a retailer in New York"
- "Create a new retail location"
- "Add retailer at location X"

### remove-node
Removes a node from the supply chain network and updates all connections.

**Parameters:**
- `nodeId` (string, required): ID of the node to remove

**Example phrases:**
- "Remove node with ID abc123"
- "Delete the supplier node"
- "Remove node X"

**Behavior:**
- Checks if node exists
- Updates all connected nodes to remove references
- Deletes the node
- Returns information about updated connections

## Connection Management Actions

### connect-nodes
Creates a connection (edge) between two supply chain nodes.

**Parameters:**
- `sourceNodeId` (string, required): ID of the source node
- `targetNodeId` (string, required): ID of the target node
- `bidirectional` (boolean, optional): Whether connection is bidirectional (default: true)

**Example phrases:**
- "Connect supplier A to manufacturer B"
- "Link node X to node Y"
- "Create connection between nodes"

**Validation:**
- Nodes must be different
- Both nodes must exist
- Connection must not already exist

### disconnect-nodes
Removes a connection (edge) between two supply chain nodes.

**Parameters:**
- `sourceNodeId` (string, required): ID of the source node
- `targetNodeId` (string, required): ID of the target node
- `bidirectional` (boolean, optional): Whether to remove in both directions (default: true)

**Example phrases:**
- "Disconnect supplier A from manufacturer B"
- "Remove link between node X and node Y"
- "Break connection between nodes"

### update-node
Updates properties of a supply chain node.

**Parameters:**
- `nodeId` (string, required): ID of the node to update
- `capacity` (number, optional): New capacity value (must be > 0)
- `status` (string, optional): New status (OPERATIONAL, DEGRADED, DISRUPTED, OFFLINE)
- `location` (object, optional): New location

**Example phrases:**
- "Update node capacity"
- "Change node status"
- "Modify node properties"

**Validation:**
- Node must exist
- At least one update must be provided
- Status must be valid enum value

### optimize-layout
Automatically arranges nodes for optimal visualization.

**Parameters:**
- `algorithm` (string, optional): Layout algorithm (force-directed, hierarchical, circular)
  - Default: force-directed

**Example phrases:**
- "Optimize network layout"
- "Auto-arrange nodes"
- "Organize supply chain visualization"

**Algorithms:**
- **force-directed**: Simulates physical forces between nodes
- **hierarchical**: Arranges nodes in layers by type (supplier → manufacturer → warehouse → distributor → retailer)
- **circular**: Arranges nodes in a circle

## Usage

### Registering Actions

```typescript
import { registerBuildActions } from './actions';

// Register all build actions
registerBuildActions();
```

### Using Actions

Actions are automatically available through the action registry:

```typescript
import { actionRegistry } from './action-registry';

// Get action by name
const action = actionRegistry.getByName('add-supplier');

// Get action by intent
const action = actionRegistry.getByIntent('add a supplier in Shanghai');

// Execute action
const result = await action.execute(params, context);
```

## Error Handling

All actions follow consistent error handling:

1. **Validation Errors**: Return `success: false` with descriptive error message
2. **Not Found Errors**: Return `success: false` when nodes don't exist
3. **Business Logic Errors**: Return `success: false` with explanation
4. **System Errors**: Caught and logged, return generic error message

## Testing

Each action should be tested for:
- Parameter validation
- Success cases
- Error cases
- Edge cases (e.g., connecting node to itself)

Example test:

```typescript
describe('addSupplierAction', () => {
  it('should create a supplier node with valid parameters', async () => {
    const params = {
      location: {
        latitude: 31.2304,
        longitude: 121.4737,
        address: '123 Main St',
        city: 'Shanghai',
        country: 'China'
      },
      capacity: 1000
    };
    
    const context = {
      userId: 'user123',
      nodes: [],
      edges: [],
      configuration: {},
      recentActions: [],
      activeSimulations: []
    };
    
    const result = await addSupplierAction.execute(params, context);
    
    expect(result.success).toBe(true);
    expect(result.data.type).toBe('SUPPLIER');
  });
});
```

## Future Enhancements

- Add batch operations (e.g., add multiple nodes at once)
- Add undo/redo support
- Add validation for logical connections (e.g., supplier → manufacturer)
- Add cost/distance calculations for connections
- Add support for custom node properties
- Add support for weighted connections

## Requirements Validation

These actions satisfy the following requirements from the AI Copilot spec:

- **Requirement 3.1**: WHEN a user requests to add a node THEN the system SHALL create a new supply chain node with specified parameters
- **Requirement 3.2**: WHEN a user requests to remove a node THEN the system SHALL delete the specified node and update connections
- **Requirement 3.3**: WHEN a user requests to connect nodes THEN the system SHALL create an edge between the specified nodes

## Related Files

- `action-registry.ts`: Core action registry implementation
- `parameter-validator.ts`: Parameter validation utilities
- `node-repository.ts`: Database operations for nodes
- `types.ts`: Type definitions for nodes and actions
