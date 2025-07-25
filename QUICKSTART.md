# 🚀 Sustain CLI - Quick Start Guide

## Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm
- Docker (optional, for container monitoring)

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Randish-soft/Sustain-cli.git
cd Sustain-cli

# Install dependencies using pnpm
pnpm install

# Or using npm
npm install
```

### 2. Build the Core Package

```bash
# Navigate to sustain-core and build
cd packages/sustain-core
pnpm build

# Or
npm run build
```

### 3. Link the CLI Globally (Development)

```bash
# From the root directory
cd packages/sustain-cli
pnpm link --global

# Or
npm link
```

## Running the CLI

### Basic Usage

```bash
# Show help and available commands
sustain

# Or
sustain --help
```

### Monitor Resources

```bash
# Monitor Docker container resources
sustain resources --docker

# Output as JSON
sustain resources --docker --format json

# Watch resources in real-time (coming soon)
sustain resources --docker --watch
```

### Other Commands (Coming Soon)

```bash
# Calculate carbon footprint
sustain carbon --interactive

# Analyze energy consumption
sustain energy --period week

# Generate sustainability report
sustain report --format pdf --output report.pdf
```

## Development Mode

### Running Without Global Install

```bash
# From the sustain-cli directory
node bin/sustain.mjs

# Or use pnpm/npm scripts
pnpm start
```

### Testing Changes

```bash
# Run tests
pnpm test

# Run in verbose mode
node bin/sustain.mjs --verbose resources --docker
```

## Troubleshooting

### Command Not Found

If `sustain` command is not found:

```bash
# Check if it's linked
npm list -g @randish/sustain-cli

# Re-link if needed
cd packages/sustain-cli
npm link
```

### Docker Permission Issues

```bash
# Add your user to docker group (Linux/Mac)
sudo usermod -aG docker $USER

# Or run with sudo (not recommended)
sudo sustain resources --docker
```

### Build Errors

```bash
# Clean and rebuild
cd packages/sustain-core
rm -rf dist/
pnpm build
```

## Package Scripts

Add these to your `packages/sustain-cli/package.json`:

```json
{
  "scripts": {
    "start": "node bin/sustain.mjs",
    "dev": "node --watch bin/sustain.mjs",
    "link": "npm link",
    "unlink": "npm unlink -g @randish/sustain-cli"
  }
}
```

## Environment Variables

Create a `.env` file in the root:

```bash
# Enable debug mode
DEBUG=sustain:*

# Set custom Docker socket (optional)
DOCKER_SOCKET=/var/run/docker.sock

# API keys for future features
CARBON_API_KEY=your_api_key_here
```

## Next Steps

1. ✅ Run `sustain resources --docker` to test Docker monitoring
2. 📚 Check the `/docs` folder for detailed documentation
3. 🐛 Report issues on GitHub
4. 🌟 Star the repo if you find it useful!

## Quick Examples

```bash
# Get system resource overview
sustain resources --system

# Calculate carbon footprint for cloud computing
sustain carbon --type computing

# Generate weekly energy report
sustain energy --period week | sustain report --format markdown
```