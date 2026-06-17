export function renderDashboard(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Morph Key Router</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #090b0a;
      --panel: #101512;
      --panel-strong: #161f1a;
      --line: #2c3c32;
      --text: #f1f7eb;
      --muted: #9aa895;
      --acid: #c7ff42;
      --mint: #54f3a6;
      --warn: #ffd166;
      --bad: #ff5d73;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(199, 255, 66, 0.18), transparent 32rem),
        linear-gradient(135deg, rgba(84, 243, 166, 0.08), transparent 40%),
        var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    main { width: min(1440px, calc(100% - 40px)); margin: 0 auto; padding: 32px 0; }
    header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-end; }
    h1 {
      margin: 0;
      font-size: clamp(24px, 2.4vw, 36px);
      font-weight: 650;
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: var(--text);
    }
    .tagline { color: var(--muted); max-width: 520px; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: minmax(420px, 0.42fr) minmax(0, 1fr); gap: 24px; margin-top: 28px; }
    .card {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(22,31,26,0.92), rgba(12,16,14,0.92));
      border-radius: 22px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
      padding: 24px;
    }
    h2 { margin: 0 0 18px; font-size: 15px; color: var(--acid); text-transform: uppercase; }
    label { display: block; margin: 14px 0 7px; color: var(--muted); font-size: 12px; }
    input {
      width: 100%; padding: 14px 15px; border-radius: 12px; border: 1px solid var(--line);
      background: #080b09; color: var(--text); font: inherit; outline: none;
    }
    input:focus { border-color: var(--acid); box-shadow: 0 0 0 3px rgba(199,255,66,0.12); }
    .select { position: relative; }
    .select-trigger {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 14px 15px; border-radius: 12px; border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(16,21,18,0.96), rgba(8,11,9,0.96));
      color: var(--text); font-weight: 700; text-align: left;
    }
    .select-trigger::after {
      content: ""; width: 10px; height: 10px; flex: 0 0 auto; border-right: 2px solid var(--muted); border-bottom: 2px solid var(--muted);
      transform: translateY(-2px) rotate(45deg); transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .select.open .select-trigger, .select-trigger:focus { border-color: var(--acid); box-shadow: 0 0 0 3px rgba(199,255,66,0.12); }
    .select.open .select-trigger::after { border-color: var(--acid); transform: translateY(2px) rotate(225deg); }
    .select-menu {
      position: absolute; z-index: 12; top: calc(100% + 8px); left: 0; right: 0; overflow: hidden;
      border: 1px solid var(--line); border-radius: 16px;
      background: linear-gradient(180deg, rgba(22,31,26,0.99), rgba(8,11,9,0.99));
      box-shadow: 0 20px 60px rgba(0,0,0,0.42), 0 0 0 1px rgba(199,255,66,0.05) inset;
      opacity: 0; pointer-events: none; transform: translateY(-6px) scale(0.98); transform-origin: top;
      transition: opacity 0.14s ease, transform 0.14s ease;
    }
    .select.open .select-menu { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
    .select-option {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 12px 14px; border: 0; border-radius: 0; background: transparent; color: var(--text);
      font-weight: 700; text-align: left;
    }
    .select-option:hover, .select-option:focus { background: rgba(199,255,66,0.09); color: var(--acid); outline: none; }
    .select-option[aria-selected="true"] { color: var(--acid); background: rgba(84,243,166,0.08); }
    .select-option[aria-selected="true"]::after { content: "active"; color: var(--mint); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    button {
      border: 0; border-radius: 6px; padding: 10px 14px; background: var(--acid);
      color: #101400; font-weight: 800; cursor: pointer; font: inherit;
    }
    button.secondary { background: #253226; color: var(--text); border: 1px solid var(--line); }
    button.danger { background: rgba(255,93,115,0.16); color: var(--bad); border: 1px solid rgba(255,93,115,0.5); }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
    .keys { display: grid; gap: 10px; }
    .key {
      padding: 14px;
      border: 1px solid var(--line); border-radius: 14px; background: rgba(8,11,9,0.55);
    }
    .key-top { display: flex; gap: 12px; align-items: center; justify-content: space-between; }
    .key-title { display: flex; gap: 10px; align-items: center; min-width: 0; }
    .key h3 { margin: 0; font-size: 15px; white-space: nowrap; }
    .key code { white-space: nowrap; }
    .pill { display: inline-flex; gap: 6px; align-items: center; padding: 5px 9px; border-radius: 999px; font-size: 12px; }
    .active { background: rgba(84,243,166,0.13); color: var(--mint); }
    .cooldown { background: rgba(255,209,102,0.13); color: var(--warn); }
    .invalid, .disabled { background: rgba(255,93,115,0.13); color: var(--bad); }
    .key-actions { display: flex; gap: 10px; align-items: center; justify-content: flex-end; flex-shrink: 0; }
    .switch { display: inline-flex; align-items: center; gap: 9px; color: var(--muted); font-size: 12px; cursor: pointer; user-select: none; }
    .switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
    .switch-track { position: relative; width: 38px; height: 22px; border-radius: 999px; border: 1px solid var(--line); background: #253226; transition: background 0.15s ease, border-color 0.15s ease; }
    .switch-track::after { content: ""; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 999px; background: var(--muted); transition: transform 0.15s ease, background 0.15s ease; }
    .switch input:checked + .switch-track { border-color: rgba(84,243,166,0.6); background: rgba(84,243,166,0.18); }
    .switch input:checked + .switch-track::after { transform: translateX(16px); background: var(--mint); }
    .metrics { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
    .metric { border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; background: var(--panel); }
    .metric span { display: block; color: var(--muted); font-size: 10px; }
    .metric strong { display: block; margin-top: 3px; font-size: 14px; }
    .empty { color: var(--muted); border: 1px dashed var(--line); border-radius: 18px; padding: 28px; text-align: center; }
    .notice { margin-top: 14px; color: var(--muted); font-size: 12px; line-height: 1.5; }
    .statusbar { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
    .toast {
      position: fixed; top: 18px; left: 50%; z-index: 20; min-width: min(480px, calc(100% - 32px));
      transform: translate(-50%, -120%); opacity: 0; pointer-events: none;
      border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px;
      background: rgba(16, 21, 18, 0.96); box-shadow: 0 18px 60px rgba(0,0,0,0.38);
      color: var(--text); transition: transform 0.18s ease, opacity 0.18s ease;
    }
    .toast.show { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
    .toast.success { border-color: rgba(84,243,166,0.5); }
    .toast.error { border-color: rgba(255,93,115,0.58); color: #ffd8de; }
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 30; display: grid; place-items: center;
      padding: 20px; background: rgba(3, 5, 4, 0.72); backdrop-filter: blur(12px);
      opacity: 0; pointer-events: none; transition: opacity 0.16s ease;
    }
    .modal-backdrop.open { opacity: 1; pointer-events: auto; }
    .modal {
      width: min(460px, 100%); overflow: hidden; border: 1px solid rgba(255,93,115,0.45);
      border-radius: 22px; background: linear-gradient(180deg, rgba(22,31,26,0.98), rgba(8,11,9,0.98));
      box-shadow: 0 32px 100px rgba(0,0,0,0.62), 0 0 0 1px rgba(199,255,66,0.06) inset;
      transform: translateY(12px) scale(0.98); transition: transform 0.16s ease;
    }
    .modal-backdrop.open .modal { transform: translateY(0) scale(1); }
    .modal-accent { height: 4px; background: linear-gradient(90deg, var(--bad), var(--warn), var(--acid)); }
    .modal-body { padding: 22px; }
    .modal-kicker { color: var(--bad); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .modal h2 { margin: 8px 0 10px; color: var(--text); font-size: 22px; letter-spacing: -0.02em; text-transform: none; }
    .modal p { margin: 0; color: var(--muted); line-height: 1.55; }
    .modal-key {
      display: inline-flex; max-width: 100%; margin-top: 14px; padding: 7px 10px; border: 1px solid var(--line);
      border-radius: 999px; background: rgba(8,11,9,0.72); color: var(--acid); font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 0 22px 22px; }
    .modal-actions button { min-width: 112px; }
    button.danger-strong { background: var(--bad); color: #1b0509; border: 1px solid rgba(255,93,115,0.88); }
    code { color: var(--acid); }

    @media (max-width: 1120px) {
      header { display: block; }
      .grid { grid-template-columns: 1fr; }
      .key-top { align-items: flex-start; flex-direction: column; }
      .key-title { flex-wrap: wrap; }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="deleteModal" class="modal-backdrop" role="presentation" aria-hidden="true">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle" aria-describedby="deleteModalDescription">
      <div class="modal-accent"></div>
      <div class="modal-body">
        <div class="modal-kicker">Destructive action</div>
        <h2 id="deleteModalTitle">Delete this API key?</h2>
        <p id="deleteModalDescription">This removes the key from the local router config. Backups may exist on disk, but the dashboard cannot undo this action.</p>
        <span id="deleteModalKey" class="modal-key"></span>
      </div>
      <div class="modal-actions">
        <button id="deleteCancel" class="secondary" type="button">Cancel</button>
        <button id="deleteConfirm" class="danger-strong" type="button">Delete key</button>
      </div>
    </section>
  </div>
  <main>
    <header>
      <div>
        <h1>Morph Router</h1>
        <p class="tagline">Local OpenCode proxy that rotates Morph API keys, observes usage, and cools down keys after rate limits.</p>
      </div>
      <div class="statusbar" id="summary"></div>
    </header>

    <section class="grid">
      <aside class="card">
        <h2>Add Key</h2>
        <label for="name">Name</label>
        <input id="name" placeholder="free-key-1" />
        <label for="key">API key</label>
        <input id="key" type="password" placeholder="sk-..." />
        <div class="actions">
          <button id="add">Add key</button>
          <button class="secondary" id="refresh">Refresh</button>
        </div>
        <p class="notice">Keys are stored locally in the router config file and never shown unmasked in this dashboard.</p>
        <p class="notice">Proxy URL: <code id="proxyUrl">-</code></p>

        <hr style="border:0;border-top:1px solid var(--line);margin:20px 0" />
        <h2>Routing</h2>
        <label for="strategyTrigger">Strategy</label>
        <input id="strategy" type="hidden" value="round-robin" />
        <div id="strategySelect" class="select">
          <button id="strategyTrigger" class="select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">round-robin</button>
          <div id="strategyMenu" class="select-menu" role="listbox" aria-labelledby="strategyTrigger">
            <button class="select-option" type="button" role="option" data-value="round-robin" aria-selected="true">round-robin</button>
            <button class="select-option" type="button" role="option" data-value="least-used" aria-selected="false">least-used</button>
            <button class="select-option" type="button" role="option" data-value="healthy-first" aria-selected="false">healthy-first</button>
          </div>
        </div>
        <p class="notice">Default: <code>round-robin</code>. Sends each request to the next active key.</p>
        <label for="cooldown">429 cooldown (ms)</label>
        <input id="cooldown" type="number" min="1000" step="1000" value="60000" placeholder="60000" />
        <p class="notice">Default: <code>60000</code>. If Morph returns rate limit <code>429</code>, that key rests for this many milliseconds.</p>
        <div class="actions"><button id="save">Save settings</button></div>
      </aside>

      <section class="card">
        <h2>Keys</h2>
        <div id="keys" class="keys"></div>
      </section>
    </section>
  </main>

  <script>
    const $ = (id) => document.getElementById(id);
    let state = null;
    let toastTimer = null;
    let pendingDeleteId = null;

    function showToast(message, type) {
      const toast = $('toast');
      toast.textContent = message;
      toast.className = 'toast show ' + type;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.className = 'toast ' + type;
      }, 3600);
    }

    function getErrorMessage(error) {
      if (!(error instanceof Error)) return 'Unexpected error';
      try {
        const parsed = JSON.parse(error.message);
        return parsed.error || error.message;
      } catch {
        return error.message;
      }
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    async function api(path, options) {
      const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    function metric(label, value) {
      return '<div class="metric"><span>' + label + '</span><strong>' + value + '</strong></div>';
    }

    function setStrategy(value) {
      $('strategy').value = value;
      $('strategyTrigger').textContent = value;
      document.querySelectorAll('.select-option').forEach((option) => {
        option.setAttribute('aria-selected', option.dataset.value === value ? 'true' : 'false');
      });
    }

    function closeStrategyMenu() {
      $('strategySelect').classList.remove('open');
      $('strategyTrigger').setAttribute('aria-expanded', 'false');
    }

    function toggleStrategyMenu() {
      const isOpen = $('strategySelect').classList.toggle('open');
      $('strategyTrigger').setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        const selected = document.querySelector('.select-option[aria-selected="true"]');
        if (selected instanceof HTMLButtonElement) selected.focus();
      }
    }

    function render() {
      setStrategy(state.config.strategy);
      $('cooldown').value = state.config.cooldownMs;
      $('proxyUrl').textContent = state.proxyUrl;
      $('summary').innerHTML = [
        '<span class="pill active">' + state.keys.filter((k) => k.status === 'active').length + ' active</span>',
        '<span class="pill cooldown">' + state.keys.filter((k) => k.status === 'cooldown').length + ' cooldown</span>',
        '<span class="pill invalid">' + state.keys.filter((k) => k.status === 'invalid').length + ' invalid</span>',
      ].join('');

      if (state.keys.length === 0) {
        $('keys').innerHTML = '<div class="empty">No keys yet. Add one to start routing requests.</div>';
        return;
      }

      $('keys').innerHTML = state.keys.map((key) =>
        '<article class="key">' +
          '<div class="key-top">' +
            '<div class="key-title">' +
              '<h3>' + escapeHtml(key.name) + '</h3>' +
              '<code>' + escapeHtml(key.maskedKey) + '</code>' +
              '<span class="pill ' + key.status + '">' + key.status + '</span>' +
            '</div>' +
            '<div class="key-actions">' +
              '<label class="switch" title="' + (key.enabled ? 'Disable key' : 'Enable key') + '">' +
                '<span>' + (key.enabled ? 'On' : 'Off') + '</span>' +
                '<input class="key-toggle" type="checkbox" data-key-id="' + escapeHtml(key.id) + '" ' + (key.enabled ? 'checked' : '') + ' />' +
                '<span class="switch-track"></span>' +
              '</label>' +
              '<button class="danger key-delete" data-key-id="' + escapeHtml(key.id) + '">Delete</button>' +
            '</div>' +
          '</div>' +
          '<div class="metrics">' +
            metric('requests', key.requestCount) +
            metric('success', key.successCount) +
            metric('errors', key.errorCount) +
            metric('tokens', key.totalTokens) +
            metric('input', key.inputTokens) +
            metric('output', key.outputTokens) +
            metric('cached', key.cachedTokens) +
            metric('last status', key.lastStatus || '-') +
          '</div>' +
        '</article>'
      ).join('');
    }

    async function load() {
      try {
        state = await api('/api/status');
        render();
      } catch (error) {
        showToast('Could not load router status: ' + getErrorMessage(error), 'error');
      }
    }

    async function addKey() {
      try {
        await api('/api/keys', {
          method: 'POST',
          body: JSON.stringify({ name: $('name').value, key: $('key').value }),
        });
        $('name').value = '';
        $('key').value = '';
        await load();
        showToast('API key saved.', 'success');
      } catch (error) {
        showToast('Could not save API key: ' + getErrorMessage(error), 'error');
      }
    }

    async function toggleKey(id, enabled) {
      try {
        await api('/api/keys/' + id, { method: 'PATCH', body: JSON.stringify({ enabled }) });
        await load();
        showToast(enabled ? 'API key enabled.' : 'API key disabled.', 'success');
      } catch (error) {
        showToast('Could not update API key: ' + getErrorMessage(error), 'error');
      }
    }

    function openDeleteModal(id) {
      const key = state?.keys.find((item) => item.id === id);
      pendingDeleteId = id;
      $('deleteModalKey').textContent = key ? key.name + ' - ' + key.maskedKey : 'Selected key';
      $('deleteModal').classList.add('open');
      $('deleteModal').setAttribute('aria-hidden', 'false');
      $('deleteConfirm').focus();
    }

    function closeDeleteModal() {
      pendingDeleteId = null;
      $('deleteModal').classList.remove('open');
      $('deleteModal').setAttribute('aria-hidden', 'true');
    }

    async function deleteKey() {
      if (!pendingDeleteId) return;
      const id = pendingDeleteId;
      closeDeleteModal();

      try {
        await api('/api/keys/' + id, { method: 'DELETE' });
        await load();
        showToast('API key deleted.', 'success');
      } catch (error) {
        showToast('Could not delete API key: ' + getErrorMessage(error), 'error');
      }
    }

    async function saveSettings() {
      try {
        await api('/api/config', {
          method: 'PATCH',
          body: JSON.stringify({
            strategy: $('strategy').value,
            cooldownMs: Number($('cooldown').value),
          }),
        });
        await load();
        showToast('Router settings saved.', 'success');
      } catch (error) {
        showToast('Could not save settings: ' + getErrorMessage(error), 'error');
      }
    }

    $('add').addEventListener('click', addKey);
    $('refresh').addEventListener('click', load);
    $('save').addEventListener('click', saveSettings);
    $('strategyTrigger').addEventListener('click', toggleStrategyMenu);
    $('strategyMenu').addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement) || !target.classList.contains('select-option')) return;
      setStrategy(target.dataset.value);
      closeStrategyMenu();
      $('strategyTrigger').focus();
    });
    document.addEventListener('click', (event) => {
      if (!$('strategySelect').contains(event.target)) closeStrategyMenu();
    });
    $('deleteCancel').addEventListener('click', closeDeleteModal);
    $('deleteConfirm').addEventListener('click', deleteKey);
    $('deleteModal').addEventListener('click', (event) => {
      if (event.target === $('deleteModal')) closeDeleteModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && $('deleteModal').classList.contains('open')) closeDeleteModal();
      if (event.key === 'Escape') closeStrategyMenu();
    });
    $('keys').addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || !target.classList.contains('key-toggle')) return;
      toggleKey(target.dataset.keyId, target.checked);
    });
    $('keys').addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement) || !target.classList.contains('key-delete')) return;
      openDeleteModal(target.dataset.keyId);
    });
    load();
    setInterval(load, 5000);
  </script>
</body>
</html>`
}
