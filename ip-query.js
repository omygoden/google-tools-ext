/* ===== IP Query Functions ===== */

let currentIpData = null;

// Helper to fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Get IP information from multiple sources
async function getIpInfo() {
  const providers = [
    {
      name: 'IP.SB',
      url: 'https://api.ip.sb/geoip',
      parse: (d) => ({
        ip: d.ip,
        city: d.city,
        region: d.region,
        country: d.country,
        country_code: d.country_code,
        postal: d.postal_code,
        latitude: d.latitude,
        longitude: d.longitude,
        timezone: d.timezone,
        org: d.organization,
        asn: d.asn_organization
      })
    },
    {
      name: 'IPAPI',
      url: 'https://ipapi.co/json/',
      parse: (d) => d
    },
    {
      name: 'IPInfo',
      url: 'https://ipinfo.io/json',
      parse: (d) => {
        const [lat, lon] = (d.loc || '').split(',');
        return {
          ip: d.ip,
          city: d.city,
          region: d.region,
          country: d.country,
          country_code: d.country,
          postal: d.postal,
          latitude: lat,
          longitude: lon,
          timezone: d.timezone,
          org: d.org,
          asn: d.org
        };
      }
    }
  ];

  try {
    // Start Cloudflare trace in parallel
    const cloudflarePromise = fetchWithTimeout('https://www.cloudflare.com/cdn-cgi/trace', { timeout: 3000 })
      .then(r => r.ok ? r.text() : null)
      .catch(() => null);

    // Race providers for the first successful geo-data response
    const fastGeoPromise = new Promise((resolve, reject) => {
      let completed = 0;
      let resolved = false;

      providers.forEach(p => {
        fetchWithTimeout(p.url, { timeout: 4000 })
          .then(async r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            const parsed = p.parse(data);
            if (parsed && parsed.ip && !resolved) {
              resolved = true;
              resolve(parsed);
            }
          })
          .catch(err => {
            completed++;
            if (completed === providers.length && !resolved) {
              reject(new Error('所有查询源均失败'));
            }
          });
      });
    });

    // Strategy: Return as soon as we have geo data, but also try to get cloudflare IP if possible
    // We use a timeout for the overall operation to ensure responsiveness
    const mainData = await fastGeoPromise.catch(async () => {
      // Last resort fallback to ipify for just the IP
      const r = await fetchWithTimeout('https://api.ipify.org?format=json', { timeout: 3000 });
      if (r.ok) {
        const { ip } = await r.json();
        return { ip };
      }
      throw new Error('无法连接到任何IP服务商');
    });

    const cloudflareTrace = await cloudflarePromise;
    let cloudflareIp = null;
    if (cloudflareTrace) {
      const traceData = {};
      cloudflareTrace.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) traceData[key.trim()] = value.trim();
      });
      cloudflareIp = traceData.ip;
    }

    if (!mainData || !mainData.ip) throw new Error('解析IP数据失败');

    // Detect proxy/VPN
    const asnStr = (mainData.asn || mainData.org || '').toLowerCase();
    const isProxy = asnStr.includes('vpn') ||
      asnStr.includes('proxy') ||
      asnStr.includes('hosting') ||
      asnStr.includes('datacenter');

    // Add additional info
    mainData.cloudflare_ip = cloudflareIp;
    mainData.is_proxy = isProxy;
    mainData.proxy_type = isProxy ? detectProxyType(mainData) : null;
    mainData.ip_mismatch = cloudflareIp && cloudflareIp !== mainData.ip;

    currentIpData = mainData;
    return mainData;
  } catch (error) {
    console.error('Error fetching IP info:', error);
    throw error;
  }
}
// Detect proxy type based on organization info
function detectProxyType(data) {
  const org = (data.org || data.asn || '').toLowerCase();

  if (org.includes('vpn')) return 'VPN';
  if (org.includes('proxy')) return 'Proxy';
  if (org.includes('tor')) return 'Tor';
  if (org.includes('datacenter') || org.includes('hosting')) return 'Datacenter/Hosting';

  return 'Unknown Proxy';
}

// Display IP information in a beautiful card layout
function displayIpInfo(data) {
  const container = document.getElementById('ipInfoContainer');
  if (!container) return;

  // Determine status badge
  let statusBadge = '';
  if (data.is_proxy) {
    statusBadge = `<div style="display: inline-block; background: #ff9500; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 12px;">⚠️ ${data.proxy_type}</div>`;
  } else {
    statusBadge = `<div style="display: inline-block; background: #34c759; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 12px;">✓ 直连</div>`;
  }

  // IP display section
  let ipSection = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 48px; margin-bottom: 12px;">🌐</div>
      <div style="font-size: 32px; font-weight: 600; color: #007aff; margin-bottom: 8px; font-family: 'SF Mono', monospace;">
        ${data.ip}
        ${statusBadge}
      </div>
      <div style="font-size: 14px; color: #86868b;">您的公网IP地址</div>
    </div>
  `;

  // If there's a mismatch, show both IPs
  if (data.ip_mismatch && data.cloudflare_ip) {
    ipSection = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🌐</div>
        
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <div style="font-size: 13px; color: #856404; margin-bottom: 12px; font-weight: 600;">⚠️ 检测到多个IP地址</div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: #856404; margin-bottom: 4px;">代理/VPN IP</div>
            <div style="font-size: 28px; font-weight: 600; color: #ff9500; font-family: 'SF Mono', monospace;">
              ${data.ip}
            </div>
          </div>
          
          <div>
            <div style="font-size: 12px; color: #856404; margin-bottom: 4px;">真实IP (Cloudflare检测)</div>
            <div style="font-size: 28px; font-weight: 600; color: #007aff; font-family: 'SF Mono', monospace;">
              ${data.cloudflare_ip}
            </div>
          </div>
        </div>
        
        <div style="font-size: 13px; color: #86868b;">
          ${data.is_proxy ? '您正在使用代理或VPN服务' : '检测到IP地址不一致'}
        </div>
      </div>
    `;
  }

  // Create beautiful display
  container.innerHTML = ipSection + `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px;">
      ${createInfoCard('📍', '位置', `${data.city || '-'}, ${data.region || '-'}`)}
      ${createInfoCard('🌍', '国家/地区', `${data.country || '-'} (${data.country_code || '-'})`)}
      ${createInfoCard('🕐', '时区', data.timezone || '-')}
      ${createInfoCard('🏢', '运营商', data.org || data.asn || '-')}
      ${createInfoCard('📮', '邮编', data.postal || '-')}
      ${createInfoCard('🗺️', '坐标', data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : '-')}
    </div>
  `;

  // Show details table
  displayIpDetails(data);
}

// Create info card helper
function createInfoCard(icon, label, value) {
  return `
    <div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
      <div style="font-size: 11px; color: #86868b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
      <div style="font-size: 14px; color: #1d1d1f; font-weight: 500; word-break: break-word;">${value}</div>
    </div>
  `;
}

// Display detailed information in table
function displayIpDetails(data) {
  const detailsSection = document.getElementById('ipDetailsSection');
  const detailsBody = document.getElementById('ipDetailsBody');

  if (!detailsSection || !detailsBody) return;

  detailsSection.style.display = 'block';
  detailsBody.innerHTML = '';

  // Format Cloudflare IP display
  let cloudflareIpDisplay = data.cloudflare_ip || '(未获取到)';
  if (data.cloudflare_ip && data.cloudflare_ip === data.ip) {
    cloudflareIpDisplay = `${data.cloudflare_ip} (与主IP相同)`;
  }

  // Create rows for all available data
  const details = [
    { label: 'IP 地址 (地理位置API)', value: data.ip, alwaysShow: true },
    { label: 'IP 地址 (Cloudflare检测)', value: cloudflareIpDisplay, alwaysShow: true },
    { label: 'IP是否一致', value: data.ip_mismatch ? '❌ 不一致 (可能使用代理)' : '✅ 一致', alwaysShow: true },
    { label: '代理状态', value: data.is_proxy ? `是 (${data.proxy_type})` : '否 (直连)' },
    { label: '版本', value: data.version || 'IPv4' },
    { label: '城市', value: data.city },
    { label: '地区', value: data.region },
    { label: '国家', value: data.country },
    { label: '国家代码', value: data.country_code },
    { label: '邮政编码', value: data.postal },
    { label: '纬度', value: data.latitude },
    { label: '经度', value: data.longitude },
    { label: '时区', value: data.timezone },
    { label: 'UTC 偏移', value: data.utc_offset },
    { label: '组织', value: data.org },
    { label: 'ASN', value: data.asn },
    { label: '货币', value: data.currency },
    { label: '语言', value: data.languages },
    { label: '国家区号', value: data.country_calling_code },
  ];

  details.forEach(item => {
    if (item.value || item.alwaysShow) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 500; width: 200px;">${item.label}</td>
        <td style="font-family: 'SF Mono', monospace; color: #007aff;">${item.value || '-'}</td>
      `;
      detailsBody.appendChild(tr);
    }
  });
}

// Handle get IP button click
async function handleGetIp() {
  const container = document.getElementById('ipInfoContainer');
  if (!container) return;

  try {
    // Show loading state
    container.innerHTML = `
      <div style="text-align: center; color: #86868b; padding: 40px 0;">
        <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
        <div style="font-size: 14px;">正在获取IP信息...</div>
        <div style="font-size: 12px; color: #86868b; margin-top: 8px;">正在从多个来源验证...</div>
      </div>
    `;

    const data = await getIpInfo();
    displayIpInfo(data);
    setMsg('IP信息获取成功');
  } catch (error) {
    container.innerHTML = `
      <div style="text-align: center; color: #b3261e; padding: 40px 0;">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <div style="font-size: 14px;">${error.message}</div>
      </div>
    `;
    setMsg(error.message, true);
  }
}

// Copy IP information
async function handleCopyIp() {
  if (!currentIpData) {
    setMsg('请先获取IP信息', true);
    return;
  }

  let text = `IP地址: ${currentIpData.ip}\n`;

  if (currentIpData.cloudflare_ip && currentIpData.cloudflare_ip !== currentIpData.ip) {
    text += `真实IP (Cloudflare): ${currentIpData.cloudflare_ip}\n`;
  }

  text += `代理状态: ${currentIpData.is_proxy ? `是 (${currentIpData.proxy_type})` : '否 (直连)'}\n`;
  text += `位置: ${currentIpData.city || '-'}, ${currentIpData.region || '-'}, ${currentIpData.country || '-'}\n`;
  text += `时区: ${currentIpData.timezone || '-'}\n`;
  text += `运营商: ${currentIpData.org || currentIpData.asn || '-'}\n`;
  text += `坐标: ${currentIpData.latitude && currentIpData.longitude ? `${currentIpData.latitude}, ${currentIpData.longitude}` : '-'}`;

  await copyText(text);
  setMsg('IP信息已复制到剪贴板');
}

// Initialize IP query listeners
document.addEventListener('DOMContentLoaded', () => {
  const btnGetIp = document.getElementById('btnGetIp');
  const btnCopyIp = document.getElementById('btnCopyIp');
  const btnRefreshIp = document.getElementById('btnRefreshIp');

  const btnRealIp = document.getElementById('btnRealIp');

  if (btnGetIp) {
    btnGetIp.addEventListener('click', handleGetIp);
  }

  if (btnCopyIp) {
    btnCopyIp.addEventListener('click', handleCopyIp);
  }

  if (btnRefreshIp) {
    btnRefreshIp.addEventListener('click', handleGetIp);
  }

  if (btnRealIp) {
    btnRealIp.addEventListener('click', () => {
      window.open('https://ip.cn/', '_blank');
    });
  }
});
