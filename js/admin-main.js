/**
 * Página dedicada admin.html: panel de datos sin cargar el juego completo.
 */
(function() {
	"use strict";

	function showStatsPanel() {
		if (!window.StatsManager || !StatsManager.container) return false;
		StatsManager.container.style.display = "block";
		if (StatsManager.toggleBtn) {
			StatsManager.toggleBtn.textContent = "\uD83D\uDCCA Ocultar panel";
			StatsManager.toggleBtn.style.display = "none";
		}
		var hdr = document.querySelector(".admin-dash-header");
		var below = hdr ? Math.ceil(hdr.getBoundingClientRect().bottom) + 14 : 200;
		StatsManager.container.style.top = below + "px";
		StatsManager.container.style.left = "12px";
		StatsManager.container.style.width = "min(560px, 96vw)";
		StatsManager.container.style.maxHeight = "calc(100vh - " + (below + 20) + "px)";
		StatsManager.container.style.zIndex = "1006";
		return true;
	}

	function boot() {
		if (!window.__TRUST_AUTH_READY__) {
			setTimeout(boot, 40);
			return;
		}
		if (!window.AppRole || !AppRole.isLoggedIn() || !AppRole.isAdmin()) {
			try {
				window.location.replace(new URL("index.html", window.location.href).href);
			} catch (e) {
				window.location.href = "index.html";
			}
			return;
		}
		var shell = document.getElementById("admin-shell");
		if (shell) shell.style.display = "block";
		try {
			document.body.classList.add("trust-admin-page");
		} catch (e0) {}

		if (window.DPIOperatorHUD && typeof DPIOperatorHUD.init === "function") {
			DPIOperatorHUD.init();
		}

		if (!showStatsPanel()) {
			var n = 0;
			var t = setInterval(function() {
				if (showStatsPanel() || ++n > 100) clearInterval(t);
			}, 40);
		}
		setTimeout(function() {
			if (window.StatsManager && !StatsManager.container) {
				try {
					StatsManager._statsUiCreated = false;
				} catch (e1) {}
				try {
					StatsManager.init();
				} catch (e2) {}
				showStatsPanel();
			} else {
				showStatsPanel();
			}
		}, 900);

		function openIndexNewTab() {
			try {
				var u = new URL("index.html", window.location.href);
				window.open(u.href, "_blank", "noopener,noreferrer");
			} catch (e2) {
				window.open("index.html", "_blank", "noopener,noreferrer");
			}
		}

		var b1 = document.getElementById("admin-open-player");
		if (b1) b1.onclick = openIndexNewTab;
		var b2 = document.getElementById("admin-open-full");
		if (b2) b2.onclick = openIndexNewTab;

		var blog = document.getElementById("admin-logout");
		if (blog) {
			blog.onclick = function() {
				try {
					sessionStorage.removeItem(AppRole.STORAGE_KEY || "trust_app_role");
					sessionStorage.removeItem(AppRole.LOGIN_OK_KEY || "trust_login_ok");
				} catch (e) {}
				try {
					if (window.TrustLocalAuth && TrustLocalAuth.signOut) TrustLocalAuth.signOut();
				} catch (e4) {}
				try {
					if (window.TrustAuth && TrustAuth.signOut) TrustAuth.signOut();
				} catch (e5) {}
				try {
					window.location.replace(new URL("index.html", window.location.href).href);
				} catch (e6) {
					window.location.href = "index.html";
				}
			};
		}
	}

	if (document.readyState === "complete") boot();
	else window.addEventListener("load", boot);
})();
