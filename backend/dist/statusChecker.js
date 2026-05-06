import net from 'net';
function cleanIp(ip) {
    try {
        if (ip.startsWith('http://') || ip.startsWith('https://')) {
            const url = new URL(ip);
            return url.hostname;
        }
        return ip.replace(/\/$/, '').trim();
    }
    catch {
        return ip.trim();
    }
}
export async function checkServerStatus(ipStr, port, timeoutMs = 5000) {
    const ip = cleanIp(ipStr);
    return new Promise((resolve) => {
        const client = new net.Socket();
        let dataBuffer = '';
        const timeout = setTimeout(() => {
            client.destroy();
            resolve({ isOnline: false, playersOnline: 0, maxPlayers: 0, error: 'Timeout' });
        }, timeoutMs);
        client.on('error', (err) => {
            clearTimeout(timeout);
            client.destroy();
            resolve({ isOnline: false, playersOnline: 0, maxPlayers: 0, error: err.message });
        });
        client.connect(port, ip, () => {
            // Send info request: length(6) + \xff\xff + 'info'
            const request = Buffer.from([0x06, 0x00, 0xFF, 0xFF, 0x69, 0x6E, 0x66, 0x6F]);
            client.write(request);
        });
        client.on('data', (data) => {
            dataBuffer += data.toString();
            // Some servers do not close the connection after sending info
            if (dataBuffer.includes('</tsq>') || dataBuffer.includes('</tsqp>') || dataBuffer.includes('</serverinfo>')) {
                client.destroy();
                clearTimeout(timeout);
                try {
                    // Parse XML looking for <players online="X" ... max="Y" ... />
                    const onlineMatch = dataBuffer.match(/online="(\d+)"/i);
                    const maxMatch = dataBuffer.match(/max="(\d+)"/i);
                    // Fallback for older formats like players="X" maxplayers="Y"
                    const fallbackPlayers = dataBuffer.match(/players="(\d+)"/i);
                    const fallbackMax = dataBuffer.match(/maxplayers="(\d+)"/i);
                    const players = onlineMatch ? parseInt(onlineMatch[1], 10) : (fallbackPlayers ? parseInt(fallbackPlayers[1], 10) : null);
                    const max = maxMatch ? parseInt(maxMatch[1], 10) : (fallbackMax ? parseInt(fallbackMax[1], 10) : null);
                    if (players !== null && max !== null) {
                        resolve({
                            isOnline: true,
                            playersOnline: players,
                            maxPlayers: max,
                        });
                    }
                    else {
                        resolve({ isOnline: false, playersOnline: 0, maxPlayers: 0, error: 'Invalid response format' });
                    }
                }
                catch (err) {
                    resolve({ isOnline: false, playersOnline: 0, maxPlayers: 0, error: 'Parse error' });
                }
            }
        });
        client.on('end', () => {
            // Handled in data event
        });
    });
}
