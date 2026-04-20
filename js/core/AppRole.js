/**
 * Rol tras iniciar sesión (trust_login_ok). Sin sesión, role = null hasta login.
 * URL (?role= / ?pickrole=) combina con sesión cuando aplica.
 */
(function() {
	"use strict";

	var STORAGE_KEY = "trust_app_role";
	var LOGIN_OK_KEY = "trust_login_ok";

	function parseFromUrl() {
		try {
			var u = new URL(window.location.href);
			var r = (u.searchParams.get("role") || "").toLowerCase();
			if (r === "admin" || r === "investigador") return "admin";
			if (r === "player" || r === "jugador" || r === "participant") return "player";
			var a = u.searchParams.get("admin");
			if (a === "1" || (a && String(a).toLowerCase() === "true")) return "admin";
		} catch (e) {}
		return null;
	}

	function parseFromStorage() {
		try {
			var s = sessionStorage.getItem(STORAGE_KEY);
			if (s === "admin" || s === "player") return s;
		} catch (e) {}
		return null;
	}

	function loginOk() {
		try {
			return sessionStorage.getItem(LOGIN_OK_KEY) === "1";
		} catch (e) {
			return false;
		}
	}

	function wantsPickerFromUrl() {
		try {
			return new URL(window.location.href).searchParams.get("pickrole") === "1";
		} catch (e) {
			return false;
		}
	}

	var ok = loginOk();
	var fromUrl = parseFromUrl();
	var fromStorage = parseFromStorage();

	/**
	 * Sin iniciar sesión: role null (el juego no arranca hasta TrustStartupGate).
	 * Con sesión: URL > storage > player.
	 */
	var role = null;
	if (ok) {
		if (fromUrl != null) {
			role = fromUrl;
			try {
				sessionStorage.setItem(STORAGE_KEY, fromUrl);
			} catch (e) {}
		} else if (fromStorage != null) {
			role = fromStorage;
		} else {
			role = "player";
		}
	}

	window.AppRole = {
		LOGIN_OK_KEY: LOGIN_OK_KEY,
		STORAGE_KEY: STORAGE_KEY,
		get: function() { return role; },
		isAdmin: function() { return role === "admin"; },
		isPlayer: function() { return role === "player"; },
		isLoggedIn: function() { return ok; },
		needsRolePicker: function() { return wantsPickerFromUrl(); },
		label: function() {
			if (role === "admin") return "Equipo";
			if (role === "player") return "Participante";
			return "—";
		},
		applyRoleAndReload: function(r) {
			if (!loginOk()) return;
			if (r !== "admin" && r !== "player") return;
			try {
				sessionStorage.setItem(STORAGE_KEY, r);
			} catch (e) {}
			try {
				var u = new URL(window.location.href);
				u.searchParams.delete("pickrole");
				u.searchParams.set("role", r);
				window.location.replace(u.toString());
			} catch (e2) {
				window.location.reload();
			}
		},
		clearRoleAndReload: function() {
			try {
				sessionStorage.removeItem(STORAGE_KEY);
				sessionStorage.removeItem(LOGIN_OK_KEY);
			} catch (e) {}
			try {
				if (window.TrustLocalAuth && TrustLocalAuth.signOut) TrustLocalAuth.signOut();
			} catch (e) {}
			try {
				if (window.TrustAuth && TrustAuth.signOut) TrustAuth.signOut();
			} catch (e2) {}
			try {
				var u = new URL(window.location.href);
				u.searchParams.delete("role");
				u.searchParams.delete("admin");
				u.searchParams.set("pickrole", "1");
				window.location.replace(u.toString());
			} catch (e3) {
				window.location.href = window.location.pathname + "?pickrole=1";
			}
		},
		switchToPlayer: function() {
			this.applyRoleAndReload("player");
		},
		switchToAdmin: function() {
			this.applyRoleAndReload("admin");
		}
	};

	try {
		document.documentElement.setAttribute("data-app-role", role != null ? role : "pending");
	} catch (e) {}
})();
