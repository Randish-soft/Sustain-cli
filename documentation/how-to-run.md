# How to Run Sustain-CLI

## Prerequisites
- Node.js (v18+)
- pnpm
- Docker (optional, for container analysis)

## Setup

```bash
# Clone the repository
git clone https://github.com/Randish-soft/Sustain-cli.git
cd Sustain-cli

# Install dependencies
pnpm install

# Build the core package
cd packages/sustain-core
pnpm build
cd ../..
```

## Usage

```bash
# Show available commands
node packages/sustain-cli/bin/sustain.mjs

# Analyze Docker Compose files
node packages/sustain-cli/bin/sustain.mjs resources --compose

# Analyze Docker containers
node packages/sustain-cli/bin/sustain.mjs resources --docker

# Analyze system resources
node packages/sustain-cli/bin/sustain.mjs resources --system

# Other commands
node packages/sustain-cli/bin/sustain.mjs carbon
node packages/sustain-cli/bin/sustain.mjs energy
node packages/sustain-cli/bin/sustain.mjs report
```

## Example Output
The tool provides:
- Sustainability score (0-100)
- Resource estimates (CPU, Memory, Disk)
- Service-by-service breakdown
- Actionable recommendations (e.g., use Alpine images)