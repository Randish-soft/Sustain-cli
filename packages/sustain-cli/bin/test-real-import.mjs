#!/usr/bin/env node

console.log('Testing real imports...\n');

async function testImport() {
  try {
    // Test 1: Try to import the built version with correct path
    console.log('1. Testing built version...');
    const { ProjectAnalyzer } = await import('../../sustain-core/dist/index.js');
    console.log('✅ Built version import successful!');
    
    // Test the analyzer
    console.log('2. Testing ProjectAnalyzer...');
    const analyzer = new ProjectAnalyzer();
    const analysis = await analyzer.analyze();
    console.log('✅ Project analysis completed!');
    console.log(`📊 Score: ${analysis.overall.score}/100`);
    console.log(`📝 Summary: ${analysis.overall.summary}`);
    
    // Test other analyzers
    console.log('3. Testing other analyzers...');
    const { CarbonEnergyAnalyzer, AdvancedSustainabilityAnalyzer, ProjectFutureAnalyzer } = await import('../../sustain-core/dist/index.js');
    console.log('✅ All analyzers loaded successfully!');
    
    return true;
  } catch (error) {
    console.log('❌ Import failed:', error.message);
    
    // Show what's actually in the dist folder
    const { readdirSync } = await import('fs');
    try {
      const files = readdirSync('../../sustain-core/dist');
      console.log('📁 Files in dist folder:', files);
    } catch (e) {
      console.log('Cannot read dist folder:', e.message);
    }
    
    return false;
  }
}

testImport().then(success => {
  if (success) {
    console.log('\n🎉 All imports working! Ready to build full CLI.');
  } else {
    console.log('\n🔧 Need to fix imports before continuing.');
  }
});