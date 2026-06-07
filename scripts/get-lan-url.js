#!/usr/bin/env node

/**
 * Script to automatically detect local IP and display LAN access URLs
 * Usage: node scripts/get-lan-url.js
 */

const os = require('os');
const { execSync } = require('child_process');

// Get all network interfaces
const networkInterfaces = os.networkInterfaces();

// Find the primary LAN IP address
function getLocalIP() {
  const ips = [];
  
  // Iterate through all network interfaces
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    
    for (const address of addresses) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (address.family === 'IPv4' && !address.internal) {
        // Skip link-local addresses (169.254.x.x)
        if (!address.address.startsWith('169.254.')) {
          ips.push({
            ip: address.address,
            interface: interfaceName,
            mac: address.mac
          });
        }
      }
    }
  }
  
  // Prefer IPs in common LAN ranges
  const preferredRanges = [
    /^192\.168\./,  // Private network
    /^10\./,        // Private network
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private network
  ];
  
  // Sort: preferred ranges first, then others
  ips.sort((a, b) => {
    const aPreferred = preferredRanges.some(range => range.test(a.ip));
    const bPreferred = preferredRanges.some(range => range.test(b.ip));
    
    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    return 0;
  });
  
  return ips.length > 0 ? ips[0] : null;
}

// Display results
function displayLANInfo() {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 SGE LAN Access Information'.padEnd(60));
  console.log('='.repeat(60) + '\n');
  
  const primaryIP = getLocalIP();
  
  if (!primaryIP) {
    console.log('❌ Không tìm thấy địa chỉ IP mạng LAN!');
    console.log('   Vui lòng kiểm tra kết nối mạng của bạn.\n');
    return;
  }
  
  console.log('📍 Địa chỉ IP chính:');
  console.log(`   ${primaryIP.ip} (${primaryIP.interface})\n`);
  
  // Get all IPs for reference
  const allIPs = [];
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.')) {
        allIPs.push({ ip: address.address, interface: interfaceName });
      }
    }
  }
  
  if (allIPs.length > 1) {
    console.log('📋 Tất cả địa chỉ IP:');
    allIPs.forEach(({ ip, interface: iface }) => {
      const isPrimary = ip === primaryIP.ip;
      console.log(`   ${isPrimary ? '→' : ' '} ${ip.padEnd(15)} (${iface})${isPrimary ? ' [Primary]' : ''}`);
    });
    console.log('');
  }
  
  const frontendPort = process.env.VITE_PORT || 5173;
  const backendPort = process.env.PORT || 3000;
  
  console.log('🔗 Links truy cập từ mạng LAN:');
  console.log(`   Frontend:  http://${primaryIP.ip}:${frontendPort}`);
  console.log(`   Backend:   http://${primaryIP.ip}:${backendPort}\n`);
  
  console.log('📱 Hướng dẫn:');
  console.log('   1. Đảm bảo Frontend và Backend đang chạy');
  console.log('   2. Trên thiết bị khác trong cùng mạng LAN, mở trình duyệt');
  console.log(`   3. Truy cập: http://${primaryIP.ip}:${frontendPort}`);
  console.log('   4. Đảm bảo Windows Firewall cho phép kết nối\n');
  
  console.log('🔧 Kiểm tra Firewall:');
  console.log('   Chạy: .\\setup-firewall.ps1 (với quyền Administrator)\n');
  
  // Try to open browser (optional)
  if (process.argv.includes('--open')) {
    try {
      const platform = process.platform;
      const url = `http://${primaryIP.ip}:${frontendPort}`;
      
      let command;
      if (platform === 'win32') {
        command = `start ${url}`;
      } else if (platform === 'darwin') {
        command = `open ${url}`;
      } else {
        command = `xdg-open ${url}`;
      }
      
      execSync(command, { stdio: 'ignore' });
      console.log(`✅ Đã mở trình duyệt: ${url}\n`);
    } catch (error) {
      // Ignore errors
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run the script
displayLANInfo();















