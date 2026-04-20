/**
 * Cliente Supabase + sesión. Requiere js/config/trustBackend.js con URL y anon key.
 */
(function() {
	"use strict";

	var client = null;
	var cachedUser = null;
	var readyPromise = null;

	function urlKey() {
		try {
			var u = (window.TRUST_SUPABASE_URL || "").trim();
			var k = (window.TRUST_SUPABASE_ANON_KEY || "").trim();
			return u && k ? { url: u, key: k } : null;
		} catch (e) {
			return null;
		}
	}

	function getClient() {
		if (client) return client;
		var cfg = urlKey();
		var sb = window.supabase;
		var createClient = sb && (typeof sb.createClient === "function" ? sb.createClient : (sb.default && typeof sb.default.createClient === "function" ? sb.default.createClient : null));
		if (!cfg || !createClient) return null;
		client = createClient(cfg.url, cfg.key, {
			auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
		});
		return client;
	}

	function isConfigured() {
		return urlKey() !== null;
	}

	function getUser() {
		return cachedUser;
	}

	function setUserFromSession(sess) {
		cachedUser = (sess && sess.user) ? sess.user : null;
		try {
			if (cachedUser && cachedUser.id) {
				document.documentElement.setAttribute("data-trust-user-id", cachedUser.id);
			} else {
				document.documentElement.removeAttribute("data-trust-user-id");
			}
		} catch (e) {}
	}

	function init() {
		if (readyPromise) return readyPromise;
		readyPromise = new Promise(function(resolve) {
			var c = getClient();
			if (!c) {
				setUserFromSession(null);
				resolve(null);
				return;
			}
			c.auth.getSession().then(function(res) {
				setUserFromSession(res.data && res.data.session ? res.data.session : null);
				if (cachedUser) {
					ensureProfile().then(function() { resolve(cachedUser); });
				} else {
					resolve(null);
				}
			}).catch(function() {
				setUserFromSession(null);
				resolve(null);
			});
			c.auth.onAuthStateChange(function(_evt, session) {
				setUserFromSession(session);
			});
		});
		return readyPromise;
	}

	function ensureProfile(displayName) {
		var c = getClient();
		var u = getUser();
		if (!c || !u) return Promise.resolve();
		var name = displayName || (u.user_metadata && u.user_metadata.display_name) || (u.email && u.email.split("@")[0]) || "jugador";
		return c.from("profiles").upsert(
			{ id: u.id, display_name: name, is_admin: false },
			{ onConflict: "id" }
		);
	}

	function signUp(email, password, displayName) {
		var c = getClient();
		if (!c) return Promise.reject(new Error("Supabase no configurado"));
		return c.auth.signUp({
			email: email,
			password: password,
			options: { data: { display_name: displayName || "" } }
		}).then(function(res) {
			if (res.error) throw res.error;
			setUserFromSession(res.data && res.data.session ? res.data.session : null);
			if (getUser()) return ensureProfile(displayName).then(function() { return res; });
			return res;
		});
	}

	function signIn(email, password) {
		var c = getClient();
		if (!c) return Promise.reject(new Error("Supabase no configurado"));
		return c.auth.signInWithPassword({ email: email, password: password }).then(function(res) {
			if (res.error) throw res.error;
			setUserFromSession(res.data && res.data.session ? res.data.session : null);
			return ensureProfile().then(function() { return res; });
		});
	}

	function signOut() {
		var c = getClient();
		if (!c) return Promise.resolve();
		return c.auth.signOut().then(function() {
			setUserFromSession(null);
		});
	}

	function fetchProfile() {
		var c = getClient();
		var u = getUser();
		if (!c || !u) return Promise.resolve(null);
		return c.from("profiles").select("id, display_name, is_admin").eq("id", u.id).maybeSingle().then(function(r) {
			if (r.error) return null;
			return r.data;
		});
	}

	window.TrustAuth = {
		isConfigured: isConfigured,
		getClient: getClient,
		init: init,
		getUser: getUser,
		signUp: signUp,
		signIn: signIn,
		signOut: signOut,
		fetchProfile: fetchProfile,
		ensureProfile: ensureProfile
	};
})();
