#!/usr/bin/env node

// Simple test without complex imports
console.log(`
🌱 Sustain CLI - Environmental Impact Analysis Tool

Available Commands:
  analyze         - Analyze code quality and security
  carbon          - Analyze carbon footprint  
  sustainability  - Full sustainability assessment
  future          - Future-proofing analysis
  full            - Comprehensive report

Example: node bin/sustain.mjs analyze
`);

// Test if we can import the core package
try {
  const { ProjectAnalyzer } = await import('../sustain-core/dist/index.js');
  console.log('✅ Core package loaded successfully!');
  
  // Test the analyzer
  const analyzer = new ProjectAnalyzer();
  const analysis = await analyzer.analyze();
  console.log('✅ Project analysis completed!');
  console.log(`📊 Score: ${analysis.overall.score}/100`);
  console.log(`📝 Summary: ${analysis.overall.summary}`);
  
} catch (error) {
  console.log('❌ Core package failed to load:', error.message);
  console.log('Trying direct import...');
  
  try {
    // Try direct import from source
    const { ProjectAnalyzer } = await import('../sustain-core/src/analyzers/project_analyzer.js');
    console.log('✅ Direct import worked!');
  } catch (error2) {
    console.log('❌ Direct import also failed:', error2.message);
  }
}