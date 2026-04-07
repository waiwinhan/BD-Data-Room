<template>
  <div class="min-h-screen" style="background:#F4F2EE; font-family:'DM Sans',sans-serif;">
    <!-- TOPBAR -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo-mark">BR</div>
        <span class="topbar-title">BRDB Berhad</span>
        <div class="topbar-divider"></div>
        <span class="topbar-sub">Deal Data Room</span>
      </div>
      <div class="topbar-right">
        <button class="btn-sm">Settings</button>
        <button class="btn-sm">Logout</button>
        <button class="btn-primary" @click="alert('Add new deal — coming in Phase 4')">+ New Deal</button>
      </div>
    </header>

    <!-- NDA STRIP -->
    <div class="nda-strip">
      <span>⚠</span>
      Confidential — under NDA. Access restricted to authorised BRDB personnel only.
    </div>

    <!-- PAGE CONTENT -->
    <slot />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #F4F2EE;
  --surface:   #FFFFFF;
  --surface2:  #F9F7F4;
  --border:    rgba(0,0,0,0.08);
  --border2:   rgba(0,0,0,0.14);
  --text:      #1A1916;
  --muted:     #7A7770;
  --faint:     #B0ADA8;
  --green:     #1D9E75;
  --green-bg:  #E1F5EE;
  --green-txt: #0F6E56;
  --blue:      #185FA5;
  --blue-bg:   #E6F1FB;
  --amber:     #854F0B;
  --amber-bg:  #FEF3E2;
  --red:       #A32D2D;
  --red-bg:    #FCEBEB;
  --purple:    #534AB7;
  --purple-bg: #EEEDFE;
  --radius:    10px;
  --radius-sm: 6px;
  --shadow:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05);
}

html { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }

.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 28px;
  height: 52px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
}
.topbar-left { display: flex; align-items: center; gap: 12px; }
.logo-mark {
  width: 30px; height: 30px;
  background: var(--text); border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: #fff; letter-spacing: 0.04em;
}
.topbar-title { font-size: 13px; font-weight: 600; color: var(--text); }
.topbar-divider { width: 1px; height: 16px; background: var(--border2); }
.topbar-sub { font-size: 12px; color: var(--muted); }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.btn-sm {
  height: 30px; padding: 0 12px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s;
}
.btn-sm:hover { background: var(--surface2); color: var(--text); }
.btn-primary {
  height: 30px; padding: 0 14px;
  border: none; border-radius: var(--radius-sm);
  background: var(--text); color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.82; }

.nda-strip {
  background: var(--amber-bg);
  border-bottom: 1px solid rgba(133,79,11,0.15);
  padding: 8px 28px;
  display: flex; align-items: center; gap: 8px;
  font-size: 11.5px; color: var(--amber); font-weight: 500;
}
</style>
