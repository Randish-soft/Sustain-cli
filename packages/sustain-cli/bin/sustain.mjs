#!/usr/bin/env node

console.log('🌱 Sustain CLI - Starting...\n');

async function loadCore() {
  try {
    // Use the ESM version (.mjs) that we know works
    const path = '../../sustain-core/dist/index.mjs';
    console.log(`Trying import from: ${path}`);
    const core = await import(path);
    console.log('✅ Core package loaded successfully from ESM build!');
    return core;
  } catch (error) {
    console.log('❌ Could not load core package:', error.message);
    console.log('💡 Using demo mode instead...');
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const projectPath = args[1] || '.';

  const core = await loadCore();

  try {
    switch (command) {
      case 'analyze':
        await runAnalysis(core, projectPath);
        break;
      case 'carbon':
        await runCarbon(core, projectPath);
        break;
      case 'sustainability':
        await runSustainability(core, projectPath);
        break;
      case 'future':
        await runFuture(core, projectPath);
        break;
      case 'full':
        await runFull(core, projectPath);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function runAnalysis(core, projectPath) {
  if (core && core.ProjectAnalyzer) {
    console.log('🔍 Analyzing project structure and code quality...\n');
    
    const analyzer = new core.ProjectAnalyzer(projectPath);
    const analysis = await analyzer.analyze();
    
    console.log(`📊 Overall Score: ${analysis.overall.score}/100`);
    console.log(`📝 Summary: ${analysis.overall.summary}\n`);
    
    if (analysis.security.issues.length > 0) {
      console.log('🚨 Security Issues:', analysis.security.issues.length);
      analysis.security.issues.slice(0, 3).forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.message}`);
      });
    }
    
    if (analysis.codeQuality.complexFiles.length > 0) {
      console.log('⚡ Complex Files:', analysis.codeQuality.complexFiles.length);
      analysis.codeQuality.complexFiles.slice(0, 3).forEach(file => {
        console.log(`   - ${file.file} (complexity: ${file.complexity})`);
      });
    }
  } else {
    await runDemoAnalysis();
  }
}

async function runCarbon(core, projectPath) {
  if (core && core.CarbonEnergyAnalyzer) {
    console.log('🌫️  Running carbon footprint analysis...\n');
    
    const analyzer = new core.CarbonEnergyAnalyzer();
    const carbonMetrics = await analyzer.analyzeProjectCarbon(projectPath);
    
    console.log(`📊 Carbon Score: ${carbonMetrics.carbonScore}/100`);
    console.log(`🌍 Estimated CO2: ${carbonMetrics.estimatedCO2PerMonth.toFixed(2)} kg/month`);
    console.log(`🔋 Carbon Intensity: ${carbonMetrics.carbonIntensity} gCO2/KWh\n`);
    
    console.log('📈 Breakdown:');
    console.log(`  • Computation: ${carbonMetrics.breakdown.computation.toFixed(2)} kg`);
    console.log(`  • Storage: ${carbonMetrics.breakdown.storage.toFixed(2)} kg`);
    console.log(`  • Network: ${carbonMetrics.breakdown.network.toFixed(2)} kg`);
    console.log(`  • Embodied: ${carbonMetrics.breakdown.embodied.toFixed(2)} kg`);
  } else {
    showCarbonDemo();
  }
}

async function runSustainability(core, projectPath) {
  if (core && core.AdvancedSustainabilityAnalyzer) {
    console.log('🌱 Running comprehensive sustainability analysis...\n');
    
    const analyzer = new core.AdvancedSustainabilityAnalyzer();
    const metrics = await analyzer.analyzeProject(projectPath);
    
    console.log(`🌍 Sustainability Score: ${metrics.overall.overall}/100 (${metrics.overall.category})`);
    console.log(`📊 Carbon Impact: ${metrics.carbon.estimatedCO2PerMonth.toFixed(2)} kg CO2/month`);
    console.log(`⚡ Energy Usage: ${metrics.energy.totalEnergyKWh.toFixed(2)} KWh/month`);
    console.log(`💾 Memory Efficiency: ${metrics.memory.efficiency.allocationEfficiency}/100\n`);
    
    console.log('💡 Recommendations:');
    metrics.overall.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  } else {
    showSustainabilityDemo();
  }
}

async function runFuture(core, projectPath) {
  if (core && core.ProjectFutureAnalyzer) {
    console.log('🔮 Running future-proofing analysis...\n');
    
    const analyzer = new core.ProjectFutureAnalyzer();
    const [idea, future] = await Promise.all([
      analyzer.analyzeProjectIdea(projectPath),
      analyzer.analyzeFutureProofing(projectPath)
    ]);
    
    console.log(`💡 Idea Quality: ${idea.problemSolutionFit}/100`);
    console.log(`🌿 Environmental Impact: ${idea.environmentalImpact}/100`);
    console.log(`🚀 Scalability: ${idea.scalabilityPotential}/100`);
    console.log(`🛡️  Future Proofing: ${future.technology.stackLongevity}/100\n`);
    
    console.log('🎯 SDG Alignment:');
    idea.sdgAlignment.forEach(sdg => {
      console.log(`  • SDG ${sdg.goals.join(',')}: ${sdg.contribution}/100 ${sdg.verified ? '✅' : '⚠️'}`);
    });
  } else {
    showFutureDemo();
  }
}

async function runFull(core, projectPath) {
  if (core && core.SustainabilityEngine) {
    console.log('🌍 Running comprehensive sustainability analysis...\n');
    
    const engine = new core.SustainabilityEngine(projectPath);
    const report = await engine.generateComprehensiveReport();
    
    console.log(`🏆 Overall Sustainability: ${report.overallSustainability.score}/100 (${report.overallSustainability.category})`);
    console.log(`📊 Code Quality: ${report.codeAnalysis.overall.score}/100`);
    console.log(`🌱 Carbon Score: ${report.sustainabilityMetrics.carbon.carbonScore}/100`);
    console.log(`⚡ Energy Efficiency: ${report.sustainabilityMetrics.energy.energyEfficiency}/100\n`);
    
    if (report.criticalIssues.length > 0) {
      console.log('🚨 Critical Issues:');
      report.criticalIssues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }
    
    if (report.immediateActions.length > 0) {
      console.log('\n💡 Immediate Actions:');
      report.immediateActions.forEach(action => {
        console.log(`  • ${action}`);
      });
    }
  } else {
    showFullDemo();
  }
}

// Demo functions (keep these as fallback)
async function runDemoAnalysis() {
  console.log('🔍 Running demo project analysis...\n');
  console.log('📊 Overall Score: 85/100');
  console.log('📝 Summary: Good project health with some areas for improvement.\n');
  console.log('🚨 Security Issues: 2');
  console.log('   - hardcoded-api-key: Potential hardcoded api key found');
  console.log('   - vulnerable-dependencies: 2 high severity vulnerabilities\n');
  console.log('⚡ Complex Files: 3');
  console.log('   - src/analyzers/project_analyzer.ts (complexity: 15)');
  console.log('   - src/sustainability-engine.ts (complexity: 12)');
  console.log('   - src/collectors/compose_analyzer.ts (complexity: 8)\n');
  console.log('💡 Recommendations:');
  console.log('  • Use environment variables for sensitive data');
  console.log('  • Run "npm audit fix" to update vulnerable dependencies');
  console.log('  • Refactor complex functions into smaller, focused functions');
}

function showCarbonDemo() {
  console.log(`
🌫️  Carbon Analysis Demo:
📊 Carbon Score: 75/100
🌍 Estimated CO2: 25.5 kg/month
🔋 Carbon Intensity: 475 gCO2/KWh
📈 Breakdown:
  • Computation: 15.2 kg
  • Storage: 5.1 kg  
  • Network: 3.8 kg
  • Embodied: 1.4 kg
💡 Recommendations:
  • Optimize computational algorithms
  • Implement better caching strategies
  `);
}

function showSustainabilityDemo() {
  console.log(`
🌱 Sustainability Analysis Demo:
🌍 Sustainability Score: 78/100 (B)
📊 Carbon Impact: 25.5 kg CO2/month
⚡ Energy Usage: 45.2 KWh/month
💾 Memory Efficiency: 78/100
💡 Recommendations:
  • Optimize carbon footprint
  • Improve energy efficiency
  • Optimize memory usage
  `);
}

function showFutureDemo() {
  console.log(`
🔮 Future Analysis Demo:
💡 Idea Quality: 75/100
🌿 Environmental Impact: 65/100
🚀 Scalability: 80/100
🛡️  Future Proofing: 85/100
🎯 SDG Alignment:
  • SDG 9,12: 70/100 ⚠️
💡 Recommendations:
  • Refine project value proposition
  • Consider modernizing technology stack
  `);
}

function showFullDemo() {
  console.log(`
🌍 Comprehensive Sustainability Demo:
🏆 Overall Sustainability: 82/100 (B)
📊 Code Quality: 85/100
🌱 Carbon Score: 75/100
⚡ Energy Efficiency: 82/100
🚨 Critical Issues:
  • Security score is low (50/100). Address security vulnerabilities immediately.
💡 Immediate Actions:
  • Some Docker containers are using high CPU. Consider optimizing or scaling.
  `);
}

function showHelp() {
  console.log(`
Sustain CLI - Environmental Impact Analysis Tool

Usage:
  sustain analyze [path]     Analyze code quality and security
  sustain carbon [path]      Analyze carbon footprint
  sustain sustainability [path] Full sustainability assessment
  sustain future [path]      Future-proofing and idea analysis
  sustain full [path]        Comprehensive sustainability report
  sustain help              Show this help message

Examples:
  sustain analyze ./my-project
  sustain carbon
  sustain sustainability ./my-app
  sustain full
  `);
}

main().catch(console.error);