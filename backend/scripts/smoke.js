const http = require('http');

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve({ status: res.statusCode, body: data }); });
        });
        req.on('error', reject);
        if (body) {
            req.setHeader('Content-Type', 'application/json');
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function waitForServer(retries = 8, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const r = await request({ hostname: '127.0.0.1', port: 5000, path: '/', method: 'GET' });
            if (r && r.status === 200) return true;
        } catch (e) {
            // ignore and retry
        }
        await new Promise((res) => setTimeout(res, delay));
    }
    throw new Error('Server not reachable after retries');
}

(async () => {
    try {
        console.log('Running smoke tests against http://127.0.0.1:5000');
        await waitForServer();

        const root = await request({ hostname: '127.0.0.1', port: 5000, path: '/', method: 'GET' });
        console.log('GET / ->', root.status, root.body);

        const ok = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/debug/analyze', method: 'POST' }, { code: "print('hi')", language: 'python' });
        try {
            const parsed = JSON.parse(ok.body);
            console.log('POST (valid python) ->', ok.status, JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('POST (valid python) ->', ok.status, ok.body);
        }

        const bad = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/debug/analyze', method: 'POST' }, { code: 'def foo()\n    pass', language: 'python' });
        try {
            const parsedBad = JSON.parse(bad.body);
            console.log('POST (syntax error python) ->', bad.status, JSON.stringify(parsedBad, null, 2));
        } catch (e) {
            console.log('POST (syntax error python) ->', bad.status, bad.body);
        }

        // Additional compiler-based quick checks (may report missing runtimes)
        const cTest = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/debug/analyze', method: 'POST' }, { code: '#include <stdio.h>\nint main() { return 0; }', language: 'c' });
        try {
            const parsedC = JSON.parse(cTest.body);
            console.log('POST (C test) ->', cTest.status, JSON.stringify(parsedC, null, 2));
        } catch (e) {
            console.log('POST (C test) ->', cTest.status, cTest.body);
        }

        const javaTest = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/debug/analyze', method: 'POST' }, { code: 'public class Hello { public static void main(String[] a) {} }', language: 'java' });
        try {
            const parsedJava = JSON.parse(javaTest.body);
            console.log('POST (Java test) ->', javaTest.status, JSON.stringify(parsedJava, null, 2));
        } catch (e) {
            console.log('POST (Java test) ->', javaTest.status, javaTest.body);
        }

        console.log('Smoke tests completed. Note: responses may indicate missing runtimes (python/gcc/javac) if they are not installed).');
        process.exit(0);
    } catch (err) {
        console.error('Smoke test failed:', err);
        process.exit(1);
    }
})();
