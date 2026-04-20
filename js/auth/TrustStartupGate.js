/**
 * Primer pantallazo: inicio de sesión único.
 * - Usuario "admin" + contraseña "admin123" → modo equipo (ve datos de todos los participantes en nube si está Supabase).
 * - Cualquier otro registro/inicio → participante (TrustLocalAuth en este navegador; opcional Supabase).
 */
(function() {
	"use strict";

	var ADMIN_USER = "admin";
	var ADMIN_PASS = "admin123";

	function done() {
		try {
			window.__TRUST_AUTH_READY__ = true;
		} catch (e) {}
	}

	function tagDpiSession() {
		try {
			var u = null;
			if (window.TrustAuth && TrustAuth.getUser && TrustAuth.getUser()) u = TrustAuth.getUser();
			else if (window.TrustLocalAuth && TrustLocalAuth.getUser && TrustLocalAuth.getUser()) u = TrustLocalAuth.getUser();
			if (window.DPISpec && DPISpec.setSessionId && u && u.id) {
				DPISpec.setSessionId(String(u.id).replace(/-/g, "").substring(0, 16));
			}
		} catch (e) {}
	}

	function isAdminHtmlEntry() {
		try {
			if (window.__TRUST_ADMIN_PAGE__ === true) return true;
			var p = window.location.pathname || "";
			return p.indexOf("admin.html") >= 0;
		} catch (e) {
			return false;
		}
	}

	function setSessionAdmin() {
		try {
			sessionStorage.setItem("trust_app_role", "admin");
			sessionStorage.setItem("trust_login_ok", "1");
		} catch (e) {}
		try {
			if (isAdminHtmlEntry()) {
				window.location.reload();
				return;
			}
			window.location.replace(new URL("admin.html", window.location.href).href);
		} catch (e2) {
			window.location.href = "admin.html";
		}
	}

	function setSessionParticipant() {
		try {
			sessionStorage.setItem("trust_app_role", "player");
			sessionStorage.setItem("trust_login_ok", "1");
		} catch (e) {}
		try {
			if (window.__TRUST_ADMIN_PAGE__ === true) {
				window.location.replace(new URL("index.html", window.location.href).href);
				return;
			}
		} catch (e2) {}
		location.reload();
	}

	function mountLogin() {
		var o = document.createElement("div");
		o.id = "trust-startup-overlay";
		o.setAttribute("role", "dialog");
		o.setAttribute("aria-modal", "true");
		o.innerHTML =
			'<div class="trust-startup-card">' +
			'<h2 class="trust-startup-title">Acceso al estudio</h2>' +
			'<p class="trust-startup-lead">Inicia sesión. Según tus credenciales entrarás como <strong>participante</strong> o como <strong>equipo</strong> (datos de todos los participantes).</p>' +
			'<div class="trust-startup-tabs">' +
			'<button type="button" class="trust-startup-tab is-on" id="ts-tab-in">Entrar</button>' +
			'<button type="button" class="trust-startup-tab" id="ts-tab-up">Registrarse (participante)</button>' +
			"</div>" +
			'<div id="ts-form-in">' +
			'<label class="trust-startup-label">Usuario o correo<input type="text" id="ts-in-user" class="trust-startup-input" autocomplete="username" /></label>' +
			'<label class="trust-startup-label">Contraseña<input type="password" id="ts-in-pass" class="trust-startup-input" autocomplete="current-password" /></label>' +
			'<button type="button" class="trust-startup-submit" id="ts-btn-in">Entrar</button>' +
			"</div>" +
			'<div id="ts-form-up" style="display:none">' +
			'<label class="trust-startup-label">Nombre o apodo<input type="text" id="ts-up-name" class="trust-startup-input" maxlength="80" /></label>' +
			'<label class="trust-startup-label">Correo<input type="email" id="ts-up-email" class="trust-startup-input" autocomplete="email" /></label>' +
			'<label class="trust-startup-label">Contraseña (mín. 6)<input type="password" id="ts-up-pass" class="trust-startup-input" autocomplete="new-password" /></label>' +
			'<button type="button" class="trust-startup-submit" id="ts-btn-up">Crear cuenta de participante</button>' +
			"</div>" +
			'<p class="trust-startup-err" id="ts-err"></p>' +
			'<p class="trust-startup-hintfoot">Equipo del laboratorio: usuario <code>admin</code> y contraseña <code>admin123</code> (solo en entorno controlado).</p>' +
			"</div>";
		document.body.appendChild(o);

		document.getElementById("ts-tab-in").onclick = function() {
			document.getElementById("ts-form-in").style.display = "block";
			document.getElementById("ts-form-up").style.display = "none";
			document.getElementById("ts-tab-in").classList.add("is-on");
			document.getElementById("ts-tab-up").classList.remove("is-on");
		};
		document.getElementById("ts-tab-up").onclick = function() {
			document.getElementById("ts-form-in").style.display = "none";
			document.getElementById("ts-form-up").style.display = "block";
			document.getElementById("ts-tab-up").classList.add("is-on");
			document.getElementById("ts-tab-in").classList.remove("is-on");
		};

		function showErr(t) {
			var el = document.getElementById("ts-err");
			if (el) el.textContent = t || "";
		}

		document.getElementById("ts-btn-in").onclick = function() {
			showErr("");
			var user = document.getElementById("ts-in-user").value.trim();
			var pass = document.getElementById("ts-in-pass").value;
			if (!user || !pass) {
				showErr("Escribe usuario y contraseña.");
				return;
			}
			if (user.toLowerCase() === ADMIN_USER && pass === ADMIN_PASS) {
				setSessionAdmin();
				return;
			}
			var email = user.indexOf("@") >= 0 ? user : user + "@participante.estudio";
			TrustLocalAuth.signIn(email, pass).then(function() {
				setSessionParticipant();
			}).catch(function(e) {
				showErr((e && e.message) ? e.message : "No se pudo entrar. ¿Registrarte primero?");
			});
		};

		document.getElementById("ts-btn-up").onclick = function() {
			showErr("");
			var name = document.getElementById("ts-up-name").value.trim();
			var em = document.getElementById("ts-up-email").value.trim();
			var pw = document.getElementById("ts-up-pass").value;
			if (!em || !pw || pw.length < 6) {
				showErr("Correo y contraseña (mín. 6 caracteres).");
				return;
			}
			TrustLocalAuth.signUp(em, pw, name || em.split("@")[0]).then(function() {
				setSessionParticipant();
			}).catch(function(e) {
				showErr((e && e.message) ? e.message : "No se pudo registrar.");
			});
		};
	}

	function start() {
		try {
			if (sessionStorage.getItem("trust_login_ok") === "1") {
				tagDpiSession();
				done();
				return;
			}
			mountLogin();
		} catch (err) {
			if (typeof console !== "undefined" && console.warn) console.warn("TrustStartupGate:", err);
			done();
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start);
	} else {
		start();
	}
})();
