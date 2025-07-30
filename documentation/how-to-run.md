# How to Run Sustain-CLI

## Prerequisites
- Node.js (v18+)
- pnpm

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

## Usage - Locally (from git clone)

```bash
# Show available commands
node packages/sustain-cli/bin/sustain.mjs

# Monitor system resources
node packages/sustain-cli/bin/sustain.mjs resources --compose
node packages/sustain-cli/bin/sustain.mjs resources --docker
node packages/sustain-cli/bin/sustain.mjs resources --system

# Analyze project scope
node packages/sustain-cli/bin/sustain.mjs scope
node packages/sustain-cli/bin/sustain.mjs scope --security
node packages/sustain-cli/bin/sustain.mjs scope --sanity
node packages/sustain-cli/bin/sustain.mjs scope --quality

# Other commands
node packages/sustain-cli/bin/sustain.mjs carbon
node packages/sustain-cli/bin/sustain.mjs energy
node packages/sustain-cli/bin/sustain.mjs report
```

## Usage - Package (from npm/pnpm)

```bash
# Install in your project
npm install --save-dev @randish/sustain-cli

# Resource analysis
npx @randish/sustain-cli resources --compose
npx @randish/sustain-cli resources --docker

# Project scope analysis
npx @randish/sustain-cli scope
npx @randish/sustain-cli scope --security
npx @randish/sustain-cli scope --sanity
npx @randish/sustain-cli scope --quality

# Other commands
npx @randish/sustain-cli carbon
npx @randish/sustain-cli energy
npx @randish/sustain-cli report
```

## Example Output

The tool provides:
- Sustainability score (0-100)
- Resource estimates (CPU, Memory, Disk)
- Service-by-service breakdown
- Security vulnerability detection
- Code quality metrics
- Actionable recommendations (e.g., use Alpine images, fix security issues)