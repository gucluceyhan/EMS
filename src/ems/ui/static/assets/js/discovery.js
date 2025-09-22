// Discovery module: CIDR sweep, QoS, endian/offset auto-hint

class DiscoveryEngine {
  constructor() {
    this.maxReqPerSec = 50;
    this.timeout = 2000;
    this.results = [];
  }

  async scanCIDR(cidr, protocol = 'Modbus') {
    const ips = this.expandCIDR(cidr);
    const results = [];
    
    for (const ip of ips.slice(0, 20)) { // Limit for demo
      try {
        const device = await this.probeDevice(ip, protocol);
        if (device) results.push(device);
      } catch (e) {
        // Silent fail for sweep
      }
      await this.rateLimitDelay();
    }
    
    return results;
  }

  async probeDevice(ip, protocol) {
    // Mock probe with realistic delay
    await new Promise(r => setTimeout(r, Math.random() * 500 + 100));
    
    if (Math.random() > 0.7) { // 30% hit rate
      const deviceTypes = ['inverter', 'meter', 'bms', 'analyzer'];
      const type = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      
      return {
        ip,
        type,
        vendor: 'Generic',
        model: `${type.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
        protocol,
        slaveId: Math.floor(Math.random() * 10) + 1,
        sample: this.generateSample(type),
        latency: Math.floor(Math.random() * 100) + 20
      };
    }
    return null;
  }

  generateSample(type) {
    const samples = {
      inverter: { AC_P: Math.random() * 1000, DC_V: 600 + Math.random() * 200, Status: 'ON' },
      meter: { V1: 400 + Math.random() * 20, A1: 100 + Math.random() * 50, kWh: 12345 },
      bms: { SoC: 60 + Math.random() * 30, Pack_V: 700 + Math.random() * 100, Temp: 25 + Math.random() * 15 },
      analyzer: { THD_V: Math.random() * 5, PF: 0.9 + Math.random() * 0.1, Freq: 50 + Math.random() * 0.5 }
    };
    return samples[type] || {};
  }

  expandCIDR(cidr) {
    // Simple CIDR expansion (mock)
    const base = cidr.split('/')[0].split('.').slice(0, 3).join('.');
    return Array.from({length: 20}, (_, i) => `${base}.${i + 10}`);
  }

  async rateLimitDelay() {
    await new Promise(r => setTimeout(r, 1000 / this.maxReqPerSec));
  }

  autoHintEndian(registers, expectedType) {
    // Auto-detect endianness based on register patterns
    if (expectedType === 'float' && registers.length >= 2) {
      const bigEndian = this.parseFloat32(registers, 'big');
      const littleEndian = this.parseFloat32(registers, 'little');
      
      // Heuristic: reasonable float values
      const bigReasonable = bigEndian > -1e6 && bigEndian < 1e6;
      const littleReasonable = littleEndian > -1e6 && littleEndian < 1e6;
      
      if (bigReasonable && !littleReasonable) return 'big';
      if (littleReasonable && !bigReasonable) return 'little';
    }
    return 'big'; // Default
  }

  parseFloat32(registers, endian) {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    
    if (endian === 'big') {
      view.setUint16(0, registers[0]);
      view.setUint16(2, registers[1]);
    } else {
      view.setUint16(0, registers[1]);
      view.setUint16(2, registers[0]);
    }
    
    return view.getFloat32(0, endian === 'little');
  }
}

// Export for use in other modules
window.DiscoveryEngine = DiscoveryEngine;
