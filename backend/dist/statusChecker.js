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
        });
        client.on('end', () => {
            clearTimeout(timeout);
            try {
                // Parse basic XML
                const playersMatch = dataBuffer.match(/players="(\d+)"/i);
                const maxPlayersMatch = dataBuffer.match(/maxplayers="(\d+)"/i);
                if (playersMatch && maxPlayersMatch) {
                    resolve({
                        isOnline: true,
                        playersOnline: parseInt(playersMatch[1], 10),
                        maxPlayers: parseInt(maxPlayersMatch[1], 10),
                    });
                }
                else {
                    resolve({ isOnline: false, playersOnline: 0, maxPlayers: 0, error: 'Invalid response format' });
                }
            }
            catch (err) {
                resolve({ isOnline: false, playersOnline: 0, maxPlayers: 0, error: 'Parse error' });
            }
        });
    });
}
