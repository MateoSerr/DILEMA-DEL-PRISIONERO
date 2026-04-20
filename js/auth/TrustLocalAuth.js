/**
 * Cuentas solo en este navegador (localStorage) cuando no hay Supabase.
 */
(function() {
	"use strict";

	var STORAGE_ACC = "trust_local_accounts_v1";
	var STORAGE_SESS = "trust_local_session_v1";

	function hex(buf) {
		return Array.from(new Uint8Array(buf)).map(function(b) {
			return ("0" + b.toString(16)).slice(-2);
		}).join("");
	}

	function hashPass(email, password) {
		var payload = email.trim().toLowerCase() + "|" + password;
		if (window.crypto && crypto.subtle) {
			return crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload)).then(hex);
		}
		return Promise.resolve(fallbackHash(payload));
	}

	function fallbackHash(s) {
		var h = 0;
		for (var i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
		return "fb_" + String(h) + "_" + s.length;
	}

	function loadAccounts() {
		try {
			var raw = localStorage.getItem(STORAGE_ACC);
			if (!raw) return {};
			var o = JSON.parse(raw);
			return o && typeof o === "object" ? o : {};
		} catch (e) {
			return {};
		}
	}

	function saveAccounts(acc) {
		try {
			localStorage.setItem(STORAGE_ACC, JSON.stringify(acc));
		} catch (e) {}
	}

	var cachedUser = null;

	function setCached(u) {
		cachedUser = u;
		try {
			if (u && u.id) {
				document.documentElement.setAttribute("data-trust-user-id", u.id);
			} else {
				document.documentElement.removeAttribute("data-trust-user-id");
			}
		} catch (e) {}
	}

	function restoreSession() {
		return new Promise(function(resolve) {
			try {
				var raw = localStorage.getItem(STORAGE_SESS);
				if (!raw) {
					setCached(null);
					resolve(null);
					return;
				}
				var s = JSON.parse(raw);
				if (!s || !s.email || !s.passHash) {
					setCached(null);
					resolve(null);
					return;
				}
				var acc = loadAccounts();
				var row = acc[s.email.trim().toLowerCase()];
				if (!row || row.passHash !== s.passHash) {
					localStorage.removeItem(STORAGE_SESS);
					setCached(null);
					resolve(null);
					return;
				}
				var user = {
					id: "local_" + s.passHash.substring(0, 24),
					email: s.email,
					isLocal: true,
					user_metadata: { display_name: row.displayName || "" }
				};
				setCached(user);
				resolve(user);
			} catch (e) {
				setCached(null);
				resolve(null);
			}
		});
	}

	function signUp(email, password, displayName) {
		email = email.trim().toLowerCase();
		if (!email || !password || password.length < 6) {
			return Promise.reject(new Error("Correo y contraseña (mín. 6 caracteres)."));
		}
		var acc = loadAccounts();
		if (acc[email]) {
			return Promise.reject(new Error("Ese correo ya está registrado en este navegador."));
		}
		return hashPass(email, password).then(function(passHash) {
			acc[email] = {
				passHash: passHash,
				displayName: (displayName || "").trim() || email.split("@")[0],
				created: Date.now()
			};
			saveAccounts(acc);
			localStorage.setItem(STORAGE_SESS, JSON.stringify({ email: email, passHash: passHash }));
			var user = {
				id: "local_" + passHash.substring(0, 24),
				email: email,
				isLocal: true,
				user_metadata: { display_name: acc[email].displayName }
			};
			setCached(user);
			return user;
		});
	}

	function signIn(email, password) {
		email = email.trim().toLowerCase();
		if (!email || !password) {
			return Promise.reject(new Error("Completa correo y contraseña."));
		}
		var acc = loadAccounts();
		var row = acc[email];
		if (!row) {
			return Promise.reject(new Error("No hay cuenta con ese correo en este navegador."));
		}
		return hashPass(email, password).then(function(passHash) {
			if (row.passHash !== passHash) {
				throw new Error("Contraseña incorrecta.");
			}
			localStorage.setItem(STORAGE_SESS, JSON.stringify({ email: email, passHash: passHash }));
			var user = {
				id: "local_" + passHash.substring(0, 24),
				email: email,
				isLocal: true,
				user_metadata: { display_name: row.displayName || "" }
			};
			setCached(user);
			return user;
		});
	}

	function signOut() {
		try {
			localStorage.removeItem(STORAGE_SESS);
		} catch (e) {}
		setCached(null);
		return Promise.resolve();
	}

	function getUser() {
		return cachedUser;
	}

	function init() {
		return restoreSession();
	}

	window.TrustLocalAuth = {
		init: init,
		getUser: getUser,
		signUp: signUp,
		signIn: signIn,
		signOut: signOut
	};
})();
