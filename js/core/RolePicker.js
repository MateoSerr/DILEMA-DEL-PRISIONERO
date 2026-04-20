/**
 * Solo con ?pickrole=1 o tras «Elegir perfil» en la barra inferior.
 */
(function() {
	"use strict";

	function mount() {
		if (!window.AppRole || typeof AppRole.needsRolePicker !== "function" || !AppRole.needsRolePicker()) return;
		if (typeof AppRole.isLoggedIn === "function" && !AppRole.isLoggedIn()) return;

		var overlay = document.createElement("div");
		overlay.id = "role-picker-overlay";
		overlay.setAttribute("role", "dialog");
		overlay.setAttribute("aria-modal", "true");
		overlay.setAttribute("aria-labelledby", "role-picker-title");
		overlay.innerHTML =
			'<div class="role-picker-card">' +
			'<h2 id="role-picker-title" class="role-picker-title">Perfil de uso</h2>' +
			'<p class="role-picker-hint"><strong>Participar en el estudio:</strong> solo la tarea y la cuenta de participante (si aplica).</p>' +
			'<p class="role-picker-hint" style="margin-top:8px;"><strong>Equipo / investigación:</strong> estadísticas, exportación CSV, panel operador y datos en nube.</p>' +
			'<div class="role-picker-buttons">' +
			'<button type="button" class="role-picker-btn role-picker-btn--player" id="role-pick-player">Participar (estudio)</button>' +
			'<button type="button" class="role-picker-btn role-picker-btn--admin" id="role-pick-admin">Modo equipo (datos)</button>' +
			"</div>" +
			'<p class="role-picker-foot">Si solo vas a jugar la tarea, elige «Participar». El modo equipo es para quien gestiona la sesión.</p>' +
			"</div>";

		document.body.appendChild(overlay);

		document.getElementById("role-pick-player").onclick = function() {
			if (window.AppRole && AppRole.applyRoleAndReload) AppRole.applyRoleAndReload("player");
		};
		document.getElementById("role-pick-admin").onclick = function() {
			if (window.AppRole && AppRole.applyRoleAndReload) AppRole.applyRoleAndReload("admin");
		};
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", mount);
	} else {
		mount();
	}
})();
