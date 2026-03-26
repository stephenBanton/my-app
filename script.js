const API_CANDIDATES = [
    'http://localhost:6000',
    'http://127.0.0.1:6000',
    'http://localhost:5000'
];

let activeApiBase = null;

function toggleMenu() {
    const menu = document.getElementById('dropdown');
    if (!menu) return;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function setSession(token, user) {
    localStorage.setItem('authToken', token || '');
    localStorage.setItem('user', JSON.stringify(user || {}));
}

function clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
}

function getToken() {
    return localStorage.getItem('authToken');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
        return null;
    }
}

function logout() {
    clearSession();
    window.location.href = '/';
}

function protectRoute(roleRequired) {
    const user = getUser();
    if (!user || user.role !== roleRequired) {
        window.location.href = '/';
        return false;
    }
    return true;
}

function getRoleHome(role) {
    if (role === 'client') return '/client-dashboard';
    if (role === 'analyst' || role === 'gis') return '/workbench';
    if (role === 'admin') return '/admin-dashboard';
    return '/';
}

async function loginRequest(base, payload) {
    const routes = ['/auth/login', '/login'];

    for (const route of routes) {
        try {
            const res = await fetch(`${base}${route}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) return { ok: true, data };
            if ([400, 401, 403].includes(res.status)) return { ok: false, data };
        } catch (error) {
            continue;
        }
    }

    return { ok: false, data: { message: 'Cannot reach auth server' } };
}

async function login(type) {
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const message = document.getElementById('loginMessage');

    if (!email || !password) {
        if (message) message.textContent = 'Email and password are required.';
        return;
    }

    let authResult = null;
    for (const base of API_CANDIDATES) {
        const result = await loginRequest(base, { email, password });
        if (result.ok || result.data?.message !== 'Cannot reach auth server') {
            activeApiBase = base;
            authResult = result;
            break;
        }
    }

    if (!authResult || !authResult.ok) {
        if (message) message.textContent = authResult?.data?.msg || authResult?.data?.message || 'Login failed.';
        return;
    }

    const user = authResult.data.user || authResult.data;
    const token = authResult.data.token || '';

    if (type === 'client' && user.role !== 'client') {
        alert('Use staff login');
        return;
    }

    if (type === 'staff' && user.role === 'client') {
        alert('Use client login');
        return;
    }

    setSession(token, user);
    window.location.href = getRoleHome(user.role);
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };
    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    const candidates = activeApiBase ? [activeApiBase, ...API_CANDIDATES.filter((x) => x !== activeApiBase)] : API_CANDIDATES;

    for (const base of candidates) {
        try {
            const res = await fetch(`${base}${path}`, { ...options, headers });
            activeApiBase = base;
            return res;
        } catch (error) {
            continue;
        }
    }

    throw new Error('API unreachable');
}

function normalizeStatus(status) {
    const s = String(status || 'received').toLowerCase();
    if (s === 'pending') return 'GIS Validation';
    if (s === 'assigned' || s === 'processing') return 'Analyst Processing';
    if (s === 'processed') return 'Report Generated';
    if (s === 'submitted' || s === 'completed') return 'Admin Review';
    if (s === 'sent') return 'Sent to Client';
    if (s === 'received') return 'Received';
    return s;
}

function getWorkflowIndex(status) {
    const s = String(status || 'received').toLowerCase();
    if (s === 'received') return 0;
    if (s === 'pending') return 1;
    if (s === 'assigned' || s === 'processing') return 2;
    if (s === 'processed') return 3;
    if (s === 'submitted' || s === 'completed') return 4;
    if (s === 'sent') return 5;
    return 0;
}

function workflowHtml(status) {
    const labels = [
        'Received',
        'GIS Validation',
        'Analyst Processing',
        'Report Generated',
        'Admin Review',
        'Sent'
    ];
    const active = getWorkflowIndex(status);
    return `<div class="workflow-track">${labels
        .map((label, i) => `<span class="wf-step ${i <= active ? 'active' : ''}">${label}</span>`)
        .join('')}</div>`;
}

function summarizeStages(orders) {
    const summary = {
        received: 0,
        gis: 0,
        analyst: 0,
        report: 0,
        review: 0,
        sent: 0
    };

    (Array.isArray(orders) ? orders : []).forEach((order) => {
        const idx = getWorkflowIndex(order?.status);
        if (idx === 0) summary.received += 1;
        if (idx === 1) summary.gis += 1;
        if (idx === 2) summary.analyst += 1;
        if (idx === 3) summary.report += 1;
        if (idx === 4) summary.review += 1;
        if (idx === 5) summary.sent += 1;
    });

    return summary;
}

function renderAdminCounters(orders) {
    const s = summarizeStages(orders);
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    setText('countReceived', s.received);
    setText('countGis', s.gis);
    setText('countAnalyst', s.analyst);
    setText('countReport', s.report);
    setText('countReview', s.review);
    setText('countSent', s.sent);
}

function getOrderCode(order, index) {
    const id = order.id || order.order_id || index + 1;
    return `GEO-${String(id).padStart(3, '0')}`;
}

async function loadClientDashboard() {
    if (!protectRoute('client')) return;

    const user = getUser();
    const body = document.getElementById('clientOrdersBody');
    const emailEl = document.getElementById('clientEmail');
    if (emailEl && user?.email) emailEl.textContent = user.email;
    if (!body) return;

    try {
        let res = await apiFetch(`/my-orders?email=${encodeURIComponent(user?.email || '')}`);
        if (!res.ok) {
            res = await apiFetch('/orders');
        }

        const orders = await res.json();
        const rows = (Array.isArray(orders) ? orders : []).filter((o) => !user?.email || o.email === user.email || o.recipient_email_1 === user.email);

        if (rows.length === 0) {
            body.innerHTML = '<tr><td colspan="4">No orders yet.</td></tr>';
            return;
        }

        body.innerHTML = rows.map((order, i) => {
            const status = normalizeStatus(order.status);
            const downloadable = ['processed', 'submitted', 'completed', 'sent'].includes(String(order.status || '').toLowerCase());
            return `<tr>
                <td>${getOrderCode(order, i)}</td>
                <td>${status}</td>
                <td>${workflowHtml(order.status)}</td>
                <td>${downloadable ? `<a class="btn-link" href="${activeApiBase}/download/${order.id}" target="_blank" rel="noreferrer">Download</a>` : '<button disabled>View</button>'}</td>
            </tr>`;
        }).join('');
    } catch (error) {
        body.innerHTML = '<tr><td colspan="3">Could not load orders.</td></tr>';
    }
}

async function loadWorkbench() {
    const user = getUser();
    if (!user || !['analyst', 'gis'].includes(user.role)) {
        window.location.href = '/';
        return;
    }

    const list = document.getElementById('pendingOrders');
    if (!list) return;

    try {
        const res = await apiFetch('/orders');
        const orders = await res.json();
        const pending = (Array.isArray(orders) ? orders : []).filter((o) => ['pending', 'assigned', 'processing', 'received'].includes(String(o.status || '').toLowerCase()));

        if (pending.length === 0) {
            list.innerHTML = '<li>No pending orders.</li>';
            return;
        }

        list.innerHTML = pending.map((order, i) => `
            <li>
                ${getOrderCode(order, i)}
                <button onclick="window.location.href='/analyst-review/${order.id}'">Open</button>
            </li>
        `).join('');
    } catch (error) {
        list.innerHTML = '<li>Failed to load pending orders.</li>';
    }
}

async function loadAdminDashboard() {
    if (!protectRoute('admin')) return;

    const tbody = document.getElementById('adminOrdersBody');
    if (!tbody) return;

    try {
        const [ordersRes, analystsRes] = await Promise.all([
            apiFetch('/admin/orders'),
            apiFetch('/admin/users/analysts')
        ]);
        const orders = await ordersRes.json();
        const analysts = await analystsRes.json();
        renderAdminCounters(orders);

        tbody.innerHTML = (Array.isArray(orders) ? orders : []).map((order, i) => {
            const options = ['<option value="">Assign Analyst</option>']
                .concat((Array.isArray(analysts) ? analysts : []).map((a) => `<option value="${a.id}">${a.name}</option>`))
                .join('');
            return `<tr>
                <td>${getOrderCode(order, i)}</td>
                <td>${normalizeStatus(order.status)}</td>
                <td>${workflowHtml(order.status)}</td>
                <td>
                    <select onchange="assignOrder(${order.id}, this.value)">
                        ${options}
                    </select>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4">Failed to load orders.</td></tr>';
    }
}

async function assignOrder(orderId, analystId) {
    if (!analystId) return;
    try {
        await apiFetch(`/admin/orders/${orderId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analyst_id: Number(analystId) })
        });
        await loadAdminDashboard();
    } catch (error) {
        alert('Failed to assign analyst');
    }
}

async function submitReportRequest() {
    if (!protectRoute('client')) return;

    const projectName = document.getElementById('projectName')?.value?.trim();
    const address = document.getElementById('address')?.value?.trim();
    const lat = parseFloat(document.getElementById('latitude')?.value);
    const lng = parseFloat(document.getElementById('longitude')?.value);
    const msg = document.getElementById('requestStatus');
    const user = getUser();

    if (!projectName || !address || Number.isNaN(lat) || Number.isNaN(lng)) {
        msg.textContent = 'Fill all fields with valid coordinates.';
        return;
    }

    try {
        const res = await apiFetch('/client-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_name: projectName,
                client_company: user?.company || user?.name || 'Client',
                recipient_email_1: user?.email,
                address,
                latitude: lat,
                longitude: lng,
                notes: 'Submitted via client dashboard'
            })
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            msg.textContent = json.error || 'Failed to submit report request.';
            return;
        }

        msg.textContent = 'Request submitted successfully.';
    } catch (error) {
        msg.textContent = 'Server unavailable.';
    }
}

function initPage() {
    const page = (window.location.pathname || '/').replace(/^\//, '') || 'index';

    document.addEventListener('click', (e) => {
        const menu = document.getElementById('dropdown');
        const trigger = document.getElementById('loginToggle');
        if (!menu || !trigger) return;
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    if (page === 'client-login') {
        document.getElementById('clientLoginBtn')?.addEventListener('click', () => login('client'));
    }

    if (page === 'staff-login') {
        document.getElementById('staffLoginBtn')?.addEventListener('click', () => login('staff'));
    }

    if (page === 'client-dashboard') {
        loadClientDashboard();
    }

    if (page === 'workbench') {
        loadWorkbench();
    }

    if (page === 'admin-dashboard') {
        loadAdminDashboard();
    }

    if (page === 'request-report') {
        if (protectRoute('client')) {
            document.getElementById('requestSubmitBtn')?.addEventListener('click', submitReportRequest);
        }
    }

    document.querySelectorAll('[data-action="logout"]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
}

window.toggleMenu = toggleMenu;
window.assignOrder = assignOrder;
document.addEventListener('DOMContentLoaded', initPage);

