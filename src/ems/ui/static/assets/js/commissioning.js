// Commissioning module: template, pass/fail, PDF, admin override

class CommissioningEngine {
  constructor() {
    this.templates = {
      inverter: [
        { id: 'conn', name: 'Bağlantı testi', required: true },
        { id: 'sunspec', name: 'SunSpec model okuma', required: true },
        { id: 'acdc', name: 'AC/DC ölçüm doğrulama', required: true },
        { id: 'plimit', name: 'P-limit testi (dry-run)', required: false },
        { id: 'phase', name: 'Faz sırası kontrolü', required: true }
      ],
      bms: [
        { id: 'conn', name: 'Bağlantı testi', required: true },
        { id: 'soc', name: 'SoC/SoH okuma', required: true },
        { id: 'pack', name: 'Pack gerilim/akım', required: true },
        { id: 'charge', name: 'Charge/discharge testi (dry-run)', required: false },
        { id: 'alarm', name: 'Alarm simülasyonu', required: false }
      ],
      breakers: [
        { id: 'modbus', name: 'Modbus bağlantı', required: true },
        { id: 'status', name: 'Durum okuma (open/closed)', required: true },
        { id: 'measure', name: 'V/A/PF ölçümler', required: true },
        { id: 'coil', name: 'Coil yazma testi (dry-run)', required: true },
        { id: 'feedback', name: 'Feedback doğrulama', required: true }
      ],
      analyzers: [
        { id: 'conn', name: 'Bağlantı testi', required: true },
        { id: 'vip', name: 'V/I/P/Q okuma', required: true },
        { id: 'thd', name: 'THD hesaplama', required: false },
        { id: 'demand', name: 'Demand entegrasyon', required: false },
        { id: 'ptct', name: 'PT/CT oran kontrolü', required: true }
      ]
    };
  }

  getTemplate(deviceType) {
    const key = deviceType.toLowerCase();
    return this.templates[key] || this.templates.inverter;
  }

  async runTest(deviceId, testId, deviceType) {
    // Mock test execution with realistic delays
    const delay = Math.random() * 2000 + 500;
    await new Promise(r => setTimeout(r, delay));
    
    // 85% pass rate for required tests, 70% for optional
    const template = this.getTemplate(deviceType);
    const test = template.find(t => t.id === testId);
    const passRate = test?.required ? 0.85 : 0.70;
    
    const passed = Math.random() < passRate;
    const result = {
      testId,
      passed,
      message: passed ? 'Test geçti' : 'Test başarısız',
      timestamp: new Date().toISOString(),
      details: this.generateTestDetails(testId, passed)
    };
    
    return result;
  }

  generateTestDetails(testId, passed) {
    const details = {
      conn: passed ? 'Latency: 23ms, Timeout: OK' : 'Connection timeout',
      sunspec: passed ? 'Model 103 detected, 120 registers' : 'No SunSpec response',
      acdc: passed ? 'AC: 150kW, DC: 155kW, Eff: 96.8%' : 'AC/DC mismatch detected',
      plimit: passed ? 'P-limit 90% → 135kW measured' : 'P-limit command failed',
      phase: passed ? 'L1-L2-L3 sequence correct' : 'Phase rotation error',
      soc: passed ? 'SoC: 75%, SoH: 98%' : 'Invalid SoC reading',
      pack: passed ? 'Pack: 720V, 85A' : 'Pack voltage out of range',
      charge: passed ? 'Charge test: 50kW → SoC +2%' : 'Charge command rejected',
      modbus: passed ? 'Slave ID 1 responds' : 'Modbus timeout',
      status: passed ? 'Status: Closed, FB confirmed' : 'Feedback mismatch',
      measure: passed ? 'V1: 400V, A1: 120A, PF: 0.99' : 'Measurement error',
      coil: passed ? 'Open coil test: FB OK' : 'Coil write failed',
      feedback: passed ? 'All FB bits functional' : 'Trip FB stuck',
      vip: passed ? 'V: 400V, I: 120A, P: 48kW' : 'Reading timeout',
      thd: passed ? 'THD_V: 2.1%, THD_I: 3.4%' : 'THD calculation error',
      demand: passed ? 'Demand window: 15min OK' : 'Demand sync failed',
      ptct: passed ? 'PT: 400:1, CT: 1000:5' : 'Ratio mismatch'
    };
    
    return details[testId] || (passed ? 'OK' : 'Failed');
  }

  calculateOverallStatus(results) {
    const template = this.getTemplate(results[0]?.deviceType || 'inverter');
    const requiredTests = template.filter(t => t.required);
    const requiredPassed = results.filter(r => {
      const test = template.find(t => t.id === r.testId);
      return test?.required && r.passed;
    });
    
    const canActivate = requiredPassed.length === requiredTests.length;
    const totalPassed = results.filter(r => r.passed).length;
    
    return {
      canActivate,
      requiredPassed: requiredPassed.length,
      requiredTotal: requiredTests.length,
      totalPassed,
      totalTests: results.length,
      recommendation: canActivate ? 'Active' : 'Draft'
    };
  }

  generatePDF(deviceId, deviceType, results) {
    // Mock PDF generation
    const status = this.calculateOverallStatus(results);
    const timestamp = new Date().toLocaleString('tr-TR');
    
    const content = `
COMMISSIONING REPORT
Device: ${deviceId} (${deviceType})
Date: ${timestamp}
Status: ${status.recommendation}

Test Results (${status.totalPassed}/${status.totalTests} passed):
${results.map(r => `- ${r.testId}: ${r.passed ? 'PASS' : 'FAIL'} - ${r.details}`).join('\n')}

${status.canActivate ? 'Device ready for production use.' : 'Device requires attention before activation.'}
    `;
    
    // Create downloadable blob
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissioning-${deviceId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true, filename: a.download };
  }
}

// Export for global use
window.CommissioningEngine = CommissioningEngine;
