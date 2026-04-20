/**
 * Envía cada fila del log DPI a Supabase (tabla dpi_events) cuando hay sesión de jugador.
 */
(function() {
	"use strict";

	var queue = [];
	var timer = null;
	var FLUSH_MS = 800;

	function flush() {
		timer = null;
		var c = window.TrustAuth && TrustAuth.getClient ? TrustAuth.getClient() : null;
		var u = window.TrustAuth && TrustAuth.getUser ? TrustAuth.getUser() : null;
		if (!c || !u || !queue.length) {
			queue = [];
			return;
		}
		var batch = queue.splice(0, queue.length);
		var sid = (window.DPISpec && DPISpec.getSessionId) ? DPISpec.getSessionId() : "";
		var rows = batch.map(function(entry) {
			return {
				user_id: u.id,
				dpi_session_id: sid || "",
				event_payload: entry
			};
		});
		c.from("dpi_events").insert(rows).then(function(r) {
			if (r.error && typeof console !== "undefined" && console.warn) {
				console.warn("TrustSync: insert", r.error.message || r.error);
			}
		});
	}

	function schedule() {
		if (timer) return;
		timer = setTimeout(flush, FLUSH_MS);
	}

	function onEventLogged(entry) {
		if (!window.TrustAuth || !TrustAuth.isConfigured || !TrustAuth.isConfigured()) return;
		if (!TrustAuth.getUser || !TrustAuth.getUser()) return;
		if (!entry) return;
		queue.push(entry);
		schedule();
	}

	function enabled() {
		return !!(TrustAuth && TrustAuth.isConfigured && TrustAuth.isConfigured() && TrustAuth.getUser && TrustAuth.getUser());
	}

	window.TrustSync = {
		onEventLogged: onEventLogged,
		enabled: enabled,
		flush: flush
	};
})();
