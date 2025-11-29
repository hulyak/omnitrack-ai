# Build Actions Quick Start Guide

## Getting Started

### 1. Register Actions

```typescript
import { registerBuildActions } from './copilot/actions';

// Register all build actions
registerBuildActions();
```

### 2. Use Actions

```typescript
import { actionRegistry } from './copilot/action-registry';

// Get action by name
const action = actionRegistry.getByName('add-supplier');

// Or get by intent
const action = actionRegistry.getByIntent('add a supplier in Shanghai');

// Execute action
const result = await action.execute(params, context);
```

## Quick Examples

### Add a Supplier

```typescript
const result = await addSupplierAction.execute({
  location: {
    latitude: 31.2304,
    longitude: 121.4737,
    address: '123 Main St',
    city: 'Shanghai',
    country: 'China'
  },
  capacity: 1000,
  name: 'Shanghai Supplier Co.' // optional
}, context);
```

### Connect Two Nodes

```typescript
const result = await connectNodesAction.execute({
  sourceNodeId: 'supplier-123',
  targetNodeId: 'manufacturer-456',
  bidirectional: true // optional, default: true
}, context);
```

### Update Node Status

```typescript
const result = await updateNodeAction.execute({
  nodeId: 'node-123',
  status: 'DEGRADED'
}, context);
```

### Optimize Layout

```typescript
const result = await optimizeLayoutAction.execute({
  algorithm: 'hierarchical' // optional: force-directed, hierarchical, circular
}, context);
```

## Action Categories

### Node Creation
- `add-supplier` - Add supplier node
- `add-manufacturer` - Add manufacturer node
- `add-warehouse` - Add warehouse node
- `add-distributor` - Add distributor node
- `add-retailer` - Add retailer node

### Node Management
- `remove-node` - Remove node and update connections
- `update-node` - Update node properties

### Connection Management
- `connect-nodes` - Create edge between nodes
- `disconnect-nodes` - Remove edge between nodes

### Layout
- `optimize-layout` - Auto-arrange nodes

## Common Patterns

### Validate Before Execute

```typescript
const validation = action.validate(params);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

const result = await action.execute(params, context);
```

### Handle Results

```typescript
const result = await action.execute(params, context);

if (result.success) {
  console.log('Success!', result.data);
  
  // Show suggestions to user
  if (result.suggestions) {
    console.log('Next steps:', result.suggestions);
  }
} else {
  console.error('Error:', result.error);
}
```

### Build Supply Chain Network

```typescript
// 1. Add supplier
const supplier = await addSupplierAction.execute({
  location: { /* ... */ },
  capacity: 1000
}, context);

// 2. Add manufacturer
const manufacturer = await addManufacturerAction.execute({
  location: { /* ... */ },
  capacity: 500
}, context);

// 3. Connect them
await connectNodesAction.execute({
  sourceNodeId: supplier.data.nodeId,
  targetNodeId: manufacturer.data.nodeId
}, context);

// 4. Optimize layout
await optimizeLayoutAction.execute({
  algorithm: 'hierarchical'
}, context);
```

## Testing

### Run Tests

```bash
cd infrastructure/lambda
npm test -- copilot/actions/
```

### Write Tests

```typescript
import { addSupplierAction } from './actions';

describe('My Test', () => {
  it('should create supplier', async () => {
    const result = await addSupplierAction.execute(params, context);
    expect(result.success).toBe(true);
  });
});
```

## Troubleshooting

### Action Not Found
```typescript
// Check if action is registered
if (!actionRegistry.hasAction('add-supplier')) {
  registerBuildActions();
}
```

### Validation Fails
```typescript
// Check validation errors
const validation = action.validate(params);
console.log('Errors:', validation.errors);
```

### Execution Fails
```typescript
// Check logs for details
// All actions log with correlation IDs
```

## Best Practices

1. **Always validate parameters** before execution
2. **Handle errors gracefully** with user-friendly messages
3. **Use suggestions** to guide users to next steps
4. **Log all operations** with user context
5. **Test thoroughly** with various inputs

## API Reference

See [README.md](./README.md) for complete API documentation.

## Support

For issues or questions:
1. Check [README.md](./README.md) for detailed documentation
2. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture
3. Check test files for usage examples
