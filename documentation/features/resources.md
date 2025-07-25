# 📊 Resource Monitoring

The resource monitoring feature in Sustain CLI provides comprehensive insights into system and container resource usage, helping you identify optimization opportunities and track sustainability metrics.

## Overview

Resource monitoring is essential for:
- 🎯 Identifying resource-intensive processes
- 📈 Tracking usage trends over time
- 🌱 Calculating environmental impact
- 💡 Finding optimization opportunities

## Available Commands

### Basic Resource Monitoring

```bash
# Show all available resource monitoring options
sustain resources --help

# Monitor Docker containers
sustain resources --docker

# Monitor system resources
sustain resources --system

# Combined monitoring
sustain resources --docker --system
```

### Output Formats

```bash
# Table format (default)
sustain resources --docker

# JSON format for scripting
sustain resources --docker --format json

# CSV format for analysis
sustain resources --docker --format csv
```

## Docker Container Monitoring

### Prerequisites

- Docker must be installed and running
- User must have permissions to access Docker socket
- At least one container should be running

### Basic Usage

```bash
# List all containers with resource usage
sustain resources --docker

# Output example:
# 📊 Docker Resources:
# 
# Container: nginx-web
#   CPU: 0.5%
#   Memory: 45.2 MB / 512 MB (8.8%)
#   Status: running
# 
# Container: postgres-db
#   CPU: 2.1%
#   Memory: 256.7 MB / 1 GB (25.0%)
#   Status: running
```

### JSON Output

```bash
sustain resources --docker --format json
```

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "containers": [
    {
      "name": "nginx-web",
      "id": "a1b2c3d4e5f6",
      "cpu": "0.5%",
      "memory": {
        "used": "45.2 MB",
        "limit": "512 MB",
        "percentage": "8.8%"
      },
      "status": "running"
    }
  ]
}
```

## System Resource Monitoring

### Available Metrics

- **CPU Usage**: Overall and per-core utilization
- **Memory**: RAM usage, available, and swap
- **Disk**: Storage usage and I/O statistics
- **Network**: Bandwidth usage and connections

### Usage Examples

```bash
# Basic system monitoring
sustain resources --system

# Detailed view with all metrics
sustain resources --system --verbose

# Watch mode (updates every 2 seconds)
sustain resources --system --watch
```

## Advanced Features

### Filtering and Sorting

```bash
# Filter by container name
sustain resources --docker --filter "name=nginx*"

# Sort by CPU usage
sustain resources --docker --sort cpu

# Show only running containers
sustain resources --docker --status running
```

### Threshold Alerts

```bash
# Alert when CPU > 80%
sustain resources --docker --alert-cpu 80

# Alert when memory > 90%
sustain resources --docker --alert-memory 90
```

### Historical Data

```bash
# Show last hour of data
sustain resources --history 1h

# Export historical data
sustain resources --export history.csv
```

## Integration Examples

### Shell Scripting

```bash
#!/bin/bash
# Monitor and alert on high resource usage

while true; do
  output=$(sustain resources --docker --format json)
  
  # Parse JSON and check thresholds
  cpu=$(echo $output | jq '.containers[0].cpu' | tr -d '%')
  
  if (( $(echo "$cpu > 80" | bc -l) )); then
    echo "Alert: High CPU usage detected!"
    # Send notification
  fi
  
  sleep 60
done
```

### CI/CD Pipeline

```yaml
# .github/workflows/resource-check.yml
name: Resource Monitoring
on: [push]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Sustain CLI
        run: npm install -g @randish/sustain-cli
      
      - name: Check Resources
        run: |
          sustain resources --docker --format json > resources.json
          
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: resource-report
          path: resources.json
```

### Python Integration

```python
import subprocess
import json

def get_docker_resources():
    """Get Docker container resources using Sustain CLI"""
    result = subprocess.run(
        ['sustain', 'resources', '--docker', '--format', 'json'],
        capture_output=True,
        text=True
    )
    
    return json.loads(result.stdout)

# Usage
resources = get_docker_resources()
for container in resources['containers']:
    print(f"{container['name']}: CPU {container['cpu']}")
```

## Configuration

### Environment Variables

```bash
# Set Docker socket path
export DOCKER_SOCKET=/var/run/docker.sock

# Enable debug logging
export DEBUG=sustain:resources

# Set update interval for watch mode
export SUSTAIN_WATCH_INTERVAL=5000
```

### Configuration File

Create `~/.sustain/config.json`:

```json
{
  "resources": {
    "docker": {
      "socket": "/var/run/docker.sock",
      "timeout": 5000
    },
    "output": {
      "format": "table",
      "colors": true,
      "verbose": false
    },
    "alerts": {
      "cpu": 80,
      "memory": 90,
      "disk": 95
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Docker Permission Denied

```bash
# Error: Got permission denied while trying to connect to Docker daemon socket

# Solution 1: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Solution 2: Use sudo (not recommended)
sudo sustain resources --docker
```

#### No Containers Found

```bash
# Verify Docker is running
docker ps

# Check Docker socket
ls -la /var/run/docker.sock

# Test with a sample container
docker run -d --name test nginx
sustain resources --docker
```

#### High Resource Usage

If the monitoring itself causes high resource usage:

```bash
# Increase update interval
sustain resources --watch --interval 10000

# Disable detailed metrics
sustain resources --simple
```

## Best Practices

1. **Regular Monitoring**: Set up automated monitoring in your CI/CD pipeline
2. **Resource Limits**: Always set resource limits for containers
3. **Optimization**: Use monitoring data to optimize container configurations
4. **Alerting**: Configure alerts for abnormal resource usage
5. **Historical Analysis**: Keep historical data for trend analysis

## API Reference

For programmatic access, see the [Core API Documentation](../api/core-api.md#resource-monitoring).

## Next Steps

- Learn about [Carbon Footprint Calculation](./carbon.md)
- Set up [Automated Reports](./reports.md)
- Explore [CI/CD Integration](../guides/ci-cd-integration.md)