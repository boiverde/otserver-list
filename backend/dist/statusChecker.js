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
        let resolved = false;
        const processBuffer = (isTimeout) => {
            if (resolved)
                return;
            resolved = true;
            client.destroy();
            let isOnline = false;
            let players = 0;
            let max = 0;
            let errorStr = isTimeout ? 'Timeout' : undefined;
            try {
                const onlineMatch = dataBuffer.match(/online="(\d+)"/i);
                const maxMatch = dataBuffer.match(/max="(\d+)"/i);
                const fallbackPlayers = dataBuffer.match(/players="(\d+)"/i);
                const fallbackMax = dataBuffer.match(/maxplayers="(\d+)"/i);
                const parsedPlayers = onlineMatch ? parseInt(onlineMatch[1], 10) : (fallbackPlayers ? parseInt(fallbackPlayers[1], 10) : null);
                const parsedMax = maxMatch ? parseInt(maxMatch[1], 10) : (fallbackMax ? parseInt(fallbackMax[1], 10) : null);
                players = parsedPlayers || 0;
                max = parsedMax || 0;
                if (players > 0) {
                    isOnline = true;
                    errorStr = undefined;
                }
                else if (dataBuffer.includes('<?xml') || dataBuffer.includes('serverinfo') || dataBuffer.includes('tsqp') || dataBuffer.includes('tsq')) {
                    isOnline = true;
                    errorStr = undefined;
                }
                else if (dataBuffer.length > 0) {
                    errorStr = 'Invalid response format';
                }
            }
            catch (err) {
                errorStr = 'Parse error';
            }
            console.log({
                host: ipStr,
                playersOnline: players,
                receivedDataLength: dataBuffer.length,
                isOnline,
                timeout: isTimeout
            });
            resolve({
                isOnline,
                playersOnline: players,
                maxPlayers: max,
                error: errorStr
            });
        };
        const timeout = setTimeout(() => {
            processBuffer(true);
        }, timeoutMs);
        client.on('error', (err) => {
            clearTimeout(timeout);
            if (resolved)
                return;
            resolved = true;
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
            if (dataBuffer.includes('</tsq>') || dataBuffer.includes('</tsqp>') || dataBuffer.includes('</serverinfo>')) {
                clearTimeout(timeout);
                processBuffer(false);
            }
        });
        client.on('end', () => {
            clearTimeout(timeout);
            processBuffer(false);
        });
    });
}
