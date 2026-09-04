/**
 * IoT Sensor Telemetry Simulator Script
 * Run with: npx tsx scripts/simulator.ts [options]
 */

const TARGET_URL = process.env.SIMULATOR_TARGET_URL || 'http://localhost:3000/api/sensor/data';
const HEARTBEAT_URL = process.env.SIMULATOR_HEARTBEAT_URL || 'http://localhost:3000/api/sensor/heartbeat';

const args = process.argv.slice(2);
const scenario = args[0] || 'normal'; // 'normal', 'stuck_float', 'leak_early_morning', 'disconnect'

console.log(`\n======================================================`);
console.log(`🤖 IoT Waterflow Sensor Telemetry Simulator`);
console.log(`🎯 Target API: ${TARGET_URL}`);
console.log(`📋 Scenario: [ ${scenario.toUpperCase()} ]`);
console.log(`======================================================\n`);

async function sendTelemetry(flowRate: number, pulseIncrement: number, isFlowing: boolean) {
  try {
    const payload = {
      device_id: 'ESP32-001',
      timestamp: new Date().toISOString(),
      flow_rate: flowRate,
      pulse_count: Math.floor(Math.random() * 500) + pulseIncrement,
      is_flowing: isFlowing,
      wifi_rssi: -60 - Math.floor(Math.random() * 10),
    };

    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(
      `[${new Date().toLocaleTimeString()}] Telemetry Sent -> Flow: ${flowRate} L/min | Active: ${isFlowing} | Status: ${res.status} | Msg: ${data.message || 'OK'}`
    );
  } catch (err: any) {
    console.error(`❌ Failed to send telemetry: ${err.message}`);
  }
}

async function sendHeartbeat() {
  try {
    await fetch(HEARTBEAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: 'ESP32-001' }),
    });
  } catch (err: any) {
    // Ignore heartbeat errors in simulation
  }
}

async function runScenario() {
  let pulseTotal = 150000;

  if (scenario === 'normal') {
    console.log('▶️ Running Normal Filling Cycle simulation...');
    console.log('--> Sending 5 cycles of 18.5 L/min flow (Pump ON)');

    for (let i = 1; i <= 5; i++) {
      pulseTotal += 60;
      await sendTelemetry(18.5, pulseTotal, true);
      await sendHeartbeat();
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log('--> Pump turning OFF (Debit = 0 L/min)');
    await sendTelemetry(0, pulseTotal, false);
  } else if (scenario === 'stuck_float') {
    console.log('⚠️ Running STUCK FLOAT VALVE (AIR LUBER) simulation...');
    console.log('--> Simulating high volume overflow (> 550 Liters)...');

    for (let i = 1; i <= 10; i++) {
      pulseTotal += 1200;
      // High flow rate for quick simulation
      await sendTelemetry(28.0, pulseTotal, true);
      await new Promise((r) => setTimeout(r, 1500));
    }
  } else if (scenario === 'leak_early_morning') {
    console.log('🚨 Running EARLY MORNING LEAK simulation (02:00 AM)...');
    for (let cycle = 1; cycle <= 3; cycle++) {
      console.log(`--> Short Cycle #${cycle} starting...`);
      for (let step = 0; step < 3; step++) {
        pulseTotal += 100;
        await sendTelemetry(15.0, pulseTotal, true);
        await new Promise((r) => setTimeout(r, 1000));
      }
      console.log(`--> Short Cycle #${cycle} stopped.`);
      await sendTelemetry(0, pulseTotal, false);
      await new Promise((r) => setTimeout(r, 1500));
    }
  } else if (scenario === 'disconnect') {
    console.log('🛑 Simulating ESP32 Disconnect (No data sent)...');
    console.log('Wait 5 minutes for ALT-006 alert on dashboard.');
  } else {
    console.log('Unknown scenario. Available: normal, stuck_float, leak_early_morning, disconnect');
  }
}

runScenario().catch(console.error);
