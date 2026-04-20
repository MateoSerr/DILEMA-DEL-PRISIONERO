/**
 * Panel operador: sincronía EEG (offset manual) y latencia configurada del agente (RF7 / parámetros sesión).
 */
(function() {
	"use strict";

	var hud = null;

	function buildHud() {
		if (hud) return;
		hud = document.createElement("div");
		hud.id = "dpi-operator-hud";
		hud.style.cssText = [
			"position:fixed", "top:10px", "right:10px", "z-index:1002",
			"font:11px/1.35 Arial,sans-serif", "color:#222", "background:rgba(255,255,255,0.95)",
			"border:1px solid #999", "border-radius:6px", "padding:8px 10px", "max-width:260px",
			"box-shadow:0 2px 8px rgba(0,0,0,0.15)"
		].join(";");
		document.body.appendChild(hud);
	}

	function refresh() {
		buildHud();
		var cfg = (window.DPISpec && DPISpec.SESSION_CONFIG) ? DPISpec.SESSION_CONFIG : {};
		var off = (window.DPISpec && DPISpec.getEegClockOffsetMs) ? DPISpec.getEegClockOffsetMs() : 0;
		var eegLine = off
			? "EEG: offset " + off + " ms (manual)"
			: "EEG: sin offset — <span style='color:#c62828'>no vinculado</span>";
		hud.innerHTML =
			"<div style='font-weight:bold;margin-bottom:6px;color:#333'>Operador · DPI</div>" +
			"<div style='margin-bottom:4px'>" + eegLine + "</div>" +
			"<div>Latencia oponente: " + (cfg.agentLatencyMinMs || "?") + "–" + (cfg.agentLatencyMaxMs || "?") + " ms</div>" +
			"<div style='margin-top:6px;font-size:10px;color:#666'>Offset EEG: consola → <code>DPISpec.setEegClockOffsetMs(ms)</code></div>";
	}

	window.DPIOperatorHUD = {
		init: function() {
			if (document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", function() { buildHud(); refresh(); });
			} else {
				buildHud();
				refresh();
			}
			setInterval(refresh, 8000);
		},
		refresh: refresh
	};
})();
