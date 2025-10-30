## Sustain CLI - Core Focus

### What You Want to Measure:

1. **Carbon Usage** - CO2 emissions from code execution
2. **Energy Usage** - Electricity consumption (KWh/Wh)
3. **Memory Usage** - RAM utilization patterns
4. **Project Idea Sustainability** - Is the concept itself environmentally sound?

### Simple Architecture:

```
Code Analysis Pipeline:
Code → Analyzer → [Carbon, Energy, Memory Metrics] → Sustainability Score
```

### Key Metrics to Calculate:

**Carbon Usage:**

- Cloud region carbon intensity × energy usage
- Device manufacturing embodied carbon
- Network transfer carbon costs

**Energy Usage:**

- CPU processing time × processor efficiency
- Memory allocation patterns
- Storage I/O operations
- Network data transfer

**Memory Usage:**

- Peak memory consumption
- Memory leaks detection
- Inefficient data structures
- Cache effectiveness

**Project Idea Sustainability:**

- Does it solve environmental problems?
- Could it be more efficient?
- Alternative approaches comparison

### Output Format:

```
Project: [Name]
Sustainability Score: 85/100

Carbon Impact: 2.3 kg CO2/month
Energy Usage: 15 KWh/month
Memory Efficiency: Good

Recommendations:
- Switch to greener cloud region
- Optimize database queries
- Reduce image sizes
```

### Simple Implementation Approach:

1. **Analyze code patterns** that affect energy usage
2. **Estimate resource consumption** based on project type
3. **Calculate carbon** using regional grid data
4. **Score sustainability** of the overall concept

This keeps it focused on exactly what matters: **code → energy → carbon → sustainability**.