# OmniTrack AI - Documentation

Welcome to the OmniTrack AI documentation. This comprehensive guide covers everything you need to know about deploying, operating, and using the OmniTrack AI supply chain resilience platform.

## Documentation Structure

### 📚 For Users

- **[User Guide](user-guide/USER_GUIDE.md)** - Complete guide for end users
  - Getting started
  - Dashboard overview
  - Scenario simulation
  - Alert management
  - Marketplace usage
  - Sustainability tracking
  - Voice interface
  - AR visualization
  - Best practices and FAQ

### 🏗️ For Developers

- **[Architecture Documentation](architecture/ARCHITECTURE.md)** - System architecture and design
  - System overview
  - Architecture layers
  - Component diagrams
  - Data flow diagrams
  - Deployment architecture
  - Security architecture
  - Technology stack

- **[API Documentation](api/openapi.yaml)** - OpenAPI/Swagger specification
  - REST API endpoints
  - Request/response schemas
  - Authentication
  - Error handling
  - WebSocket API

### 🚀 For Operations

- **[Deployment Runbook](operations/DEPLOYMENT_RUNBOOK.md)** - Step-by-step deployment procedures
  - Prerequisites
  - Environment setup
  - Deployment procedures (staging and production)
  - Rollback procedures
  - Post-deployment verification
  - Maintenance windows

- **[Troubleshooting Guide](operations/TROUBLESHOOTING.md)** - Common issues and solutions
  - Common issues
  - Infrastructure issues
  - Application issues
  - Performance issues
  - Integration issues
  - Security issues
  - Diagnostic tools
  - Log analysis

## Quick Links

### Getting Started
- [Installation Guide](../SETUP.md)
- [Quick Deploy Guide](../QUICK_DEPLOY.md)
- [User Guide - Getting Started](user-guide/USER_GUIDE.md#getting-started)

### Development
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Project Status](../PROJECT_STATUS.md)
- [Infrastructure README](../infrastructure/README.md)
- [Frontend README](../frontend/README.md)

### Operations
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Security Documentation](../infrastructure/SECURITY.md)
- [Monitoring Documentation](../infrastructure/MONITORING.md)

## Documentation by Role

### I'm a Supply Chain Manager
Start here:
1. [User Guide - Getting Started](user-guide/USER_GUIDE.md#getting-started)
2. [Dashboard Overview](user-guide/USER_GUIDE.md#dashboard-overview)
3. [Scenario Simulation](user-guide/USER_GUIDE.md#scenario-simulation)
4. [Alert Management](user-guide/USER_GUIDE.md#alert-management)

### I'm a Developer
Start here:
1. [Architecture Documentation](architecture/ARCHITECTURE.md)
2. [API Documentation](api/openapi.yaml)
3. [Setup Guide](../SETUP.md)
4. [Contributing Guidelines](../CONTRIBUTING.md)

### I'm a DevOps Engineer
Start here:
1. [Deployment Runbook](operations/DEPLOYMENT_RUNBOOK.md)
2. [Architecture - Deployment](architecture/ARCHITECTURE.md#deployment-architecture)
3. [Troubleshooting Guide](operations/TROUBLESHOOTING.md)
4. [Monitoring Documentation](../infrastructure/MONITORING.md)

### I'm a Security Officer
Start here:
1. [Security Documentation](../infrastructure/SECURITY.md)
2. [Architecture - Security](architecture/ARCHITECTURE.md#security-architecture)
3. [Deployment Runbook - Security](operations/DEPLOYMENT_RUNBOOK.md#step-6-configure-external-integrations)

## Key Features Documentation

### Real-Time Alerts
- [User Guide - Alert Management](user-guide/USER_GUIDE.md#alert-management)
- [Architecture - Alert Flow](architecture/ARCHITECTURE.md#real-time-alert-flow)
- [Troubleshooting - Alerts](operations/TROUBLESHOOTING.md#issue-alerts-not-being-delivered)

### Scenario Simulation
- [User Guide - Scenario Simulation](user-guide/USER_GUIDE.md#scenario-simulation)
- [Architecture - Multi-Agent Orchestration](architecture/ARCHITECTURE.md#multi-agent-orchestration-flow)
- [API - Scenario Endpoints](api/openapi.yaml)

### Digital Twin
- [User Guide - Dashboard](user-guide/USER_GUIDE.md#dashboard-overview)
- [Architecture - Data Flow](architecture/ARCHITECTURE.md#data-flow-diagrams)
- [Troubleshooting - Digital Twin](operations/TROUBLESHOOTING.md#issue-digital-twin-not-updating)

### Marketplace
- [User Guide - Marketplace](user-guide/USER_GUIDE.md#marketplace)
- [Architecture - Marketplace Search](architecture/ARCHITECTURE.md#marketplace-search-flow)
- [API - Marketplace Endpoints](api/openapi.yaml)

### Sustainability Tracking
- [User Guide - Sustainability](user-guide/USER_GUIDE.md#sustainability-tracking)
- [Architecture - Components](architecture/ARCHITECTURE.md#components-and-interfaces)
- [API - Sustainability Endpoints](api/openapi.yaml)

### Voice Interface
- [User Guide - Voice Interface](user-guide/USER_GUIDE.md#voice-interface)
- [Architecture - Presentation Layer](architecture/ARCHITECTURE.md#1-presentation-layer)
- [API - Voice Endpoints](api/openapi.yaml)

### AR Visualization
- [User Guide - AR Visualization](user-guide/USER_GUIDE.md#ar-visualization)
- [Architecture - Technology Stack](architecture/ARCHITECTURE.md#technology-stack-summary)

## API Reference

The OmniTrack AI platform provides a comprehensive REST API and WebSocket API for programmatic access.

### REST API
- **Base URL**: `https://api.omnitrack.ai/v1`
- **Authentication**: Bearer token (JWT)
- **Format**: JSON
- **Documentation**: [OpenAPI Specification](api/openapi.yaml)

### WebSocket API
- **URL**: `wss://api.omnitrack.ai/ws`
- **Authentication**: JWT token in connection request
- **Use Cases**: Real-time alerts, digital twin updates, simulation progress

### API Quick Start

```bash
# Authenticate
curl -X POST https://api.omnitrack.ai/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get digital twin state
curl https://api.omnitrack.ai/v1/digital-twin/state \
  -H "Authorization: Bearer YOUR_TOKEN"

# Run scenario simulation
curl -X POST https://api.omnitrack.ai/v1/scenarios/simulate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "supplier_failure",
    "location": "Shanghai",
    "severity": "high"
  }'
```

## Deployment Environments

### Development
- **Purpose**: Local development and testing
- **URL**: http://localhost:3000
- **API**: http://localhost:3000/v1
- **Documentation**: [Setup Guide](../SETUP.md)

### Staging
- **Purpose**: Pre-production testing
- **URL**: https://staging.omnitrack.ai
- **API**: https://staging-api.omnitrack.ai/v1
- **Documentation**: [Deployment Runbook - Staging](operations/DEPLOYMENT_RUNBOOK.md#step-2-deploy-infrastructure-staging)

### Production
- **Purpose**: Live production environment
- **URL**: https://app.omnitrack.ai
- **API**: https://api.omnitrack.ai/v1
- **Documentation**: [Deployment Runbook - Production](operations/DEPLOYMENT_RUNBOOK.md#step-7-production-deployment)

## Support and Resources

### Getting Help

- **Documentation**: You're reading it!
- **Email Support**: support@omnitrack.ai
- **Community Forum**: https://community.omnitrack.ai
- **GitHub Issues**: https://github.com/your-org/omnitrack-ai/issues

### Response Times

- **Critical Issues**: 4 hours
- **High Priority**: 24 hours
- **Normal Priority**: 48 hours
- **Low Priority**: 5 business days

### Reporting Issues

1. Check [Troubleshooting Guide](operations/TROUBLESHOOTING.md) first
2. Search existing GitHub issues
3. If not found, create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots/logs if applicable

### Feature Requests

Submit feature requests through:
- GitHub Issues (label: enhancement)
- Community Forum
- Email: feedback@omnitrack.ai

## Contributing

We welcome contributions! Please see:
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md) (if exists)
- [Development Setup](../SETUP.md)

## Version History

### v1.0.0 (Current)
- Initial release
- Core features: Digital twin, scenarios, alerts, marketplace
- Multi-agent orchestration
- Voice and AR interfaces
- Sustainability tracking

### Roadmap
- Multi-region deployment
- Advanced ML models
- Additional integrations
- Mobile applications
- Enhanced analytics

## License

Copyright © 2024 OmniTrack AI. All rights reserved.

See [LICENSE](../LICENSE) file for details.

## Acknowledgments

Built with:
- AWS Cloud Services
- Next.js and React
- TypeScript
- And many other open-source technologies

Special thanks to all contributors and the open-source community.

---

**Documentation Version**: 1.0.0  
**Last Updated**: January 2024  
**Platform Version**: 1.0.0

For questions or feedback about this documentation, contact: docs@omnitrack.ai
