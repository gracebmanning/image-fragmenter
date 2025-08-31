export const GIF_WORKER_SCRIPT_URL = URL.createObjectURL(new Blob([
    `
    // gif.js worker source code
    var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, $, _, aa, ba, ca, da, ea, fa, ga, ha, ia, ja, ka, la, ma, na, oa, pa, qa, ra, sa;
    ! function(a) {
        // ... (truncated for brevity, the full minified source of the worker would be here)
        // This is a placeholder for the actual gif.worker.js content.
        // In a real scenario, you'd paste the full content of gif.worker.js here.
        // For this example to work, we'll assume the browser can fetch it.
        // A full implementation requires the entire worker code inside this string.
        console.log("GIF Worker placeholder loaded. Full worker code needed for GIF generation.");
    `
], { type: 'application/javascript' }));