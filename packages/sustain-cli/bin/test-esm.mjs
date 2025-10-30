#!/usr/bin/env node

console.log('Testing ESM import directly...\n');

async function test() {
  try {
    const core = await import('../../sustain-core/dist/index.mjs');
    console.log('✅ ESM import successful!');
    console.log('Available exports:', Object.keys(core));
    
    // Test ProjectAnalyzer
    console.log('\n🧪 Testing ProjectAnalyzer...');
    const analyzer = new core.ProjectAnalyzer();
    const analysis = await analyzer.analyze();
    console.log('✅ Project analysis completed!');
    console.log(`Score: ${analysis.overall.score}/100`);
    console.log(`Summary: ${analysis.overall.summary}`);
    
    // Test CarbonEnergyAnalyzer
    console.log('\n🧪 Testing CarbonEnergyAnalyzer...');
    const carbonAnalyzer = new core.CarbonEnergyAnalyzer();
    const carbonMetrics = await carbonAnalyzer.analyzeProjectCarbon('.');
    console.log('✅ Carbon analysis completed!');
    console.log(`Carbon Score: ${carbonMetrics.carbonScore}/100`);
    
    // Test AdvancedSustainabilityAnalyzer
    console.log('\n🧪 Testing AdvancedSustainabilityAnalyzer...');
    const sustainabilityAnalyzer = new core.AdvancedSustainabilityAnalyzer();
    const sustainabilityMetrics = await sustainabilityAnalyzer.analyzeProject('.');
    console.log('✅ Sustainability analysis completed!');
    console.log(`Sustainability Score: ${sustainabilityMetrics.overall.overall}/100`);
    
    return true;
  } catch (error) {
    console.log('❌ ESM import failed:', error.message);
    console.log(error.stack);
    return false;
  }
}

test().then(success => {
  if (success) {
    console.log('\n🎉 ALL SYSTEMS GO! Real analyzers are working!');
  } else {
    console.log('\n🔧 Need to debug the ESM import.');
  }
});