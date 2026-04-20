/**
 * Especificación Técnica DPI + Bioseñal
 * EventLogger: códigos 01-51, t0, timestamps relativos, export CSV, validador, persistencia RF8.
 */
(function(){
	"use strict";

	var EVENT_CODES = {
		1:  { label: "SYNC_T0",       phase: "Sincronía", label_es: "Sincronía_T0" },
		2:  { label: "HEARTBEAT",     phase: "Sincronía", label_es: "Heartbeat" },
		8:  { label: "INSTR_VIDEO_ON",  phase: "Instrucciones", label_es: "Video_Instrucciones_On" },
		9:  { label: "INSTR_VIDEO_OFF", phase: "Instrucciones", label_es: "Video_Instrucciones_Off" },
		10: { label: "INSTR_ON",      phase: "Instrucciones", label_es: "Instrucciones_Texto_On" },
		11: { label: "INSTR_OFF",     phase: "Instrucciones", label_es: "Instrucciones_Texto_Off" },
		12: { label: "PILOT_ON",      phase: "Piloto", label_es: "Piloto_On" },
		13: { label: "PILOT_OFF",     phase: "Piloto", label_es: "Piloto_Off" },
		14: { label: "REST_ON",      phase: "Descanso", label_es: "Descanso_On" },
		15: { label: "REST_OFF",     phase: "Descanso", label_es: "Descanso_Off" },
		20: { label: "SESSION_ON",   phase: "Sesión", label_es: "Inicio_Sesión" },
		21: { label: "SESSION_OFF",  phase: "Sesión", label_es: "Fin_Sesión" },
		30: { label: "BLOCK_ON",     phase: "Bloque", label_es: "Inicio_Bloque" },
		31: { label: "BLOCK_OFF",    phase: "Bloque", label_es: "Fin_Bloque" },
		40: { label: "DECISION_ON",  phase: "Decisión", label_es: "Inicio_Decisión" },
		41: { label: "CHOICE_HUMAN", phase: "Decisión", label_es: "Elección_Humano" },
		42: { label: "CHOICE_COMP",  phase: "Decisión", label_es: "Elección_Computadora" },
		50: { label: "OUTCOME_ON",   phase: "Feedback", label_es: "Inicio_Resultado" },
		51: { label: "OUTCOME_OFF",  phase: "Feedback", label_es: "Fin_Resultado" }
	};
	var CHOICE_ES = { "C": "Cooperar", "T": "Traicionar", "NULL": "Nulo" };
	var STRATEGY_ES = { "tft": "Copia", "all_d": "Siempre_Traiciona", "all_c": "Siempre_Coopera", "grudge": "Rencoroso", "prober": "Detective", "balanceador": "Balanceador" };

	var SESSION_CONFIG = {
		trialsPerSession: 240,
		trialsPerBlock: 60,
		blocksPerSession: 4,
		// RF2: 2 s decisión + 3 s feedback + 1 s ITI = 6 s por ensayo
		decisionPhaseMs: 2000,
		feedbackPhaseMs: 3000,
		itiMs: 1000,
		trialTotalMs: 6000,
		agentLatencyMinMs: 400,
		agentLatencyMaxMs: 2200,
		balanceTargetPercent: 25,
		balanceTolerancePercent: 5,
		restDurationMs: 30000
	};

	var STORAGE_KEY_EVENTLOG = "trustDPILog";
	var STORAGE_KEY_T0 = "trustDPIT0";

	var t0_ms = null;
	/** Ancla performance.now() al establecer t0 (mejor monotonía que Date solo). null si se restauró sesión vía setT0. */
	var t0_perf = null;
	var eventLog = [];
	var _heartbeatTimer = null;
	var HEARTBEAT_INTERVAL_MS = 30000;
	var STORAGE_KEY_EEG_OFFSET = "trustDPIEegOffsetMs";
	var sessionId = "AM";
	var blockNum = 0;
	var trialNum = 0;
	var cumulativeHuman = 0;
	var currentStrategy = "";
	var _decisionOnsetTime = null;

	function getTimestampMs() {
		if (t0_ms == null) return 0;
		if (t0_perf != null && typeof performance !== "undefined" && performance.now) {
			return Math.round(performance.now() - t0_perf);
		}
		return Math.round(Date.now() - t0_ms);
	}
	function establishT0() {
		t0_ms = Date.now();
		t0_perf = (typeof performance !== "undefined" && performance.now) ? performance.now() : null;
		return t0_ms;
	}
	function getT0() { return t0_ms; }
	function setT0(ms) {
		t0_ms = ms;
		t0_perf = null;
	}

	function getEegClockOffsetMs() {
		try {
			var v = localStorage.getItem(STORAGE_KEY_EEG_OFFSET);
			if (v == null || v === "") return 0;
			var n = parseInt(v, 10);
			return isNaN(n) ? 0 : n;
		} catch (e) { return 0; }
	}
	function setEegClockOffsetMs(ms) {
		try {
			if (ms == null || ms === "") localStorage.removeItem(STORAGE_KEY_EEG_OFFSET);
			else localStorage.setItem(STORAGE_KEY_EEG_OFFSET, String(parseInt(ms, 10)));
		} catch (e) {}
	}

	function _eegTimestampForRow() {
		var off = getEegClockOffsetMs();
		if (!off) return "";
		return getTimestampMs() + off;
	}

	function startHeartbeat() {
		stopHeartbeat();
		_heartbeatTimer = setInterval(function() {
			if (t0_ms == null) return;
			logEvent(2, { timestamp_eeg_ms: _eegTimestampForRow() || "" });
			try { saveEventLogToStorage(); } catch (e) {}
		}, HEARTBEAT_INTERVAL_MS);
	}
	function stopHeartbeat() {
		if (_heartbeatTimer) {
			clearInterval(_heartbeatTimer);
			_heartbeatTimer = null;
		}
	}

	function setDecisionOnsetTime(t) { _decisionOnsetTime = t; }
	function getDecisionOnsetTime() { return _decisionOnsetTime; }

	function setBlockNum(n) { blockNum = n; }
	function getBlockNum() { return blockNum; }

	function emitHardwareTrigger(entry) {
		if (typeof window === "undefined" || !window.dispatchEvent) return;
		var code = entry.event_code;
		if (typeof window.DPISpec_EMIT_TTL_HEARTBEAT === "undefined" && code === 2) return;
		try {
			window.dispatchEvent(new CustomEvent("dpi-ttl-trigger", {
				detail: {
					event_code: code,
					timestamp_ms: entry.timestamp_ms,
					event_label: entry.event_label,
					trial_num: entry.trial_num,
					block_num: entry.block_num
				}
			}));
		} catch (e) {}
	}

	function logEvent(eventCode, options) {
		options = options || {};
		var meta = EVENT_CODES[eventCode];
		var entry = {
			timestamp_ms:    getTimestampMs(),
			event_code:     eventCode,
			event_label:    meta ? meta.label : ("EVENT_" + eventCode),
			phase:          meta ? meta.phase : "",
			session_id:     options.session_id != null ? options.session_id : sessionId,
			block_num:      options.block_num != null ? options.block_num : blockNum,
			trial_num:      options.trial_num != null ? options.trial_num : trialNum,
			choice:         options.choice != null ? options.choice : "",
			outcome:         options.outcome != null ? options.outcome : "",
			rt_ms:          options.rt_ms != null ? options.rt_ms : "",
			agent_strategy: options.agent_strategy != null ? options.agent_strategy : (eventCode === 42 ? currentStrategy : ""),
			agent_latency_ms: options.agent_latency_ms != null ? options.agent_latency_ms : "",
			payoff_human:   options.payoff_human != null ? options.payoff_human : "",
			payoff_agent:   options.payoff_agent != null ? options.payoff_agent : "",
			cumulative_human: options.cumulative_human != null ? options.cumulative_human : cumulativeHuman,
			timestamp_eeg_ms: (function() {
				if (options.timestamp_eeg_ms != null && options.timestamp_eeg_ms !== "") return options.timestamp_eeg_ms;
				var needEeg = (eventCode === 2 || (eventCode >= 40 && eventCode <= 51));
				if (!needEeg) return "";
				return _eegTimestampForRow();
			})()
		};
		eventLog.push(entry);
		emitHardwareTrigger(entry);
		try {
			if (window.TrustSync && typeof TrustSync.onEventLogged === "function") TrustSync.onEventLogged(entry);
		} catch (syncErr) {}
		return entry;
	}

	function getSessionId() { return sessionId; }
	function setSessionId(s) { if (s != null && s !== "") sessionId = String(s); }

	function setCurrentStrategy(s) { currentStrategy = s || ""; }
	function setTrialNum(n) { trialNum = n; }
	function setCumulativeHuman(n) { cumulativeHuman = n; }
	function getEventLog() { return eventLog.slice(); }
	function clearEventLog() { eventLog = []; t0_ms = null; t0_perf = null; stopHeartbeat(); }

	function highResNow() {
		return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
	}

	function saveEventLogToStorage() {
		try {
			if (eventLog.length) localStorage.setItem(STORAGE_KEY_EVENTLOG, JSON.stringify(eventLog));
			if (t0_ms != null) localStorage.setItem(STORAGE_KEY_T0, String(t0_ms));
		} catch (e) { console.warn("DPISpec: error guardando log", e); }
	}
	function loadEventLogFromStorage() {
		try {
			var raw = localStorage.getItem(STORAGE_KEY_EVENTLOG);
			if (raw) eventLog = JSON.parse(raw);
			raw = localStorage.getItem(STORAGE_KEY_T0);
			if (raw) t0_ms = parseInt(raw, 10);
			// Si el log tiene eventos pero falta SYNC_T0 (código 01), insertarlo al inicio
			var hasSync = eventLog.some(function(r) { return r.event_code === 1; });
			if (!hasSync && eventLog.length > 0) {
				var syncEntry = {
					timestamp_ms: 0, event_code: 1, event_label: "SYNC_T0", phase: "Sincronía",
					session_id: sessionId, block_num: 0, trial_num: 0, choice: "", outcome: "",
					rt_ms: "", agent_strategy: "", agent_latency_ms: "", payoff_human: "",
					payoff_agent: "", cumulative_human: 0, timestamp_eeg_ms: ""
				};
				eventLog.unshift(syncEntry);
			}
		} catch (e) { console.warn("DPISpec: error cargando log", e); }
	}
	function clearEventLogStorage() {
		try {
			localStorage.removeItem(STORAGE_KEY_EVENTLOG);
			localStorage.removeItem(STORAGE_KEY_T0);
		} catch (e) {}
	}

	function escapeCSV(val) {
		if (val === null || val === undefined || val === "") return "";
		var s = String(val);
		if (/[,\n"]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
		return s;
	}
	// Encabezados entendibles en español (qué es cada columna)
	var CSV_HEADERS_ES = "Tiempo desde inicio (ms),Codigo evento,Que evento es,Fase,Id sesion,Bloque,Ensayo,Tu eleccion,Resultado,Tu tiempo de reaccion (ms),Estrategia del oponente,Latencia oponente (ms),Tus puntos esta ronda,Puntos oponente esta ronda,Tu total acumulado,Tiempo EEG (ms),Resumen";
	function resumenFila(row) {
		var meta = EVENT_CODES[row.event_code];
		var choiceEs = (row.choice && CHOICE_ES[row.choice]) ? CHOICE_ES[row.choice] : (row.choice || "");
		var strategyEs = (row.agent_strategy && STRATEGY_ES[row.agent_strategy]) ? STRATEGY_ES[row.agent_strategy] : (row.agent_strategy || "");
		var ronda = (row.trial_num !== undefined && row.trial_num !== null && row.trial_num !== "" ? (Number(row.trial_num) + 1) : null);
		var rondaTxt = ronda != null ? " (ronda " + ronda + ")" : "";
		switch (row.event_code) {
			case 1:  return "Inicio de la sesion (marca de tiempo t0)";
			case 2:  return "Heartbeat (sincronía de reloj de sesión)";
			case 8:  return "Inicio de video de instrucciones";
			case 9:  return "Fin de video de instrucciones";
			case 10: return "Inicio de instrucciones textuales";
			case 11: return "Fin de instrucciones textuales";
			case 12: return "Inicio de ensayos piloto";
			case 13: return "Fin de ensayos piloto";
			case 14: return "Inicio del descanso";
			case 15: return "Fin del descanso";
			case 20: return "Inicio de la sesion de juego";
			case 21: return "Fin de la sesion de juego";
			case 30: return "Inicio del bloque " + (row.block_num !== undefined && row.block_num !== null && row.block_num !== "" ? (row.block_num + 1) : "?");
			case 31: return "Fin del bloque " + (row.block_num !== undefined && row.block_num !== null && row.block_num !== "" ? (row.block_num + 1) : "?");
			case 40: return "Comienza la ronda" + rondaTxt + ": debes elegir Cooperar o Traicionar";
			case 41: return "Ronda" + rondaTxt + " – Tu eleccion: " + (choiceEs || row.choice || "-") + (row.rt_ms !== "" && row.rt_ms != null ? ". Tardaste " + row.rt_ms + " ms" : "");
			case 42: return "Ronda" + rondaTxt + " – Oponente eligio. Estrategia: " + (strategyEs || "-") + (row.agent_latency_ms ? ". Latencia " + row.agent_latency_ms + " ms" : "");
			case 50: return "Se muestra el resultado de la ronda" + rondaTxt;
			case 51:
				var ph = row.payoff_human;
				var pa = row.payoff_agent;
				var isTimeout = (ph === 0 || ph === "0" || ph === "" || ph == null) && (pa === 0 || pa === "0" || pa === "" || pa == null);
				var cum = (row.cumulative_human !== "" && row.cumulative_human != null ? row.cumulative_human : "?");
				if (isTimeout) return "Resultado ronda" + rondaTxt + ": timeout – sin elección. Tu total acumulado: " + cum;
				return "Resultado ronda" + rondaTxt + ": tu " + (ph !== "" && ph != null ? ph : "?") + " pts, oponente " + (pa !== "" && pa != null ? pa : "?") + " pts. Tu total acumulado: " + cum;
			default:  return meta ? (meta.label_es || meta.label) : "Evento " + row.event_code;
		}
	}
	function rowToCSV(row) {
		var meta = EVENT_CODES[row.event_code];
		var labelEs = (meta && meta.label_es) ? meta.label_es : (meta ? meta.label : "");
		var choiceEs = (row.choice && CHOICE_ES[row.choice]) ? CHOICE_ES[row.choice] : (row.choice || "");
		var strategyEs = (row.agent_strategy && STRATEGY_ES[row.agent_strategy]) ? STRATEGY_ES[row.agent_strategy] : (row.agent_strategy || "");
		var resumen = resumenFila(row);
		return [row.timestamp_ms, row.event_code, labelEs, row.phase, row.session_id, row.block_num, row.trial_num, choiceEs, row.outcome, row.rt_ms, strategyEs, row.agent_latency_ms, row.payoff_human, row.payoff_agent, row.cumulative_human, row.timestamp_eeg_ms, resumen].map(escapeCSV).join(",");
	}
	function exportCSV() {
		var lines = [CSV_HEADERS_ES];
		for (var i = 0; i < eventLog.length; i++) lines.push(rowToCSV(eventLog[i]));
		return lines.join("\n");
	}
	function downloadCSV(filename) {
		filename = filename || "dpi_session_" + (sessionId || "AM") + "_" + Date.now() + ".csv";
		try { if (eventLog.length) saveEventLogToStorage(); } catch (e) { console.warn("DPISpec: error guardando log antes de exportar", e); }
		var csv = exportCSV();
		var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
		var a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = filename;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	function validateRows(rows) {
		var errors = [];
		var lastTs = -1;
		var trialCodes = [];
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			var ts = Number(row.timestamp_ms);
			var ec = Number(row.event_code);
			if (isNaN(ts)) {
				errors.push("Fila " + (i + 1) + ": timestamp_ms inválido");
				continue;
			}
			if (ts < lastTs) errors.push("Fila " + (i + 1) + ": timestamp_ms no monótono (" + ts + " < " + lastTs + ")");
			lastTs = ts;
			if (isNaN(ec) || ec < 1 || ec > 51) errors.push("Fila " + (i + 1) + ": event_code fuera de rango (01-51): " + row.event_code);
			if (ec >= 40 && ec <= 51) trialCodes.push(ec);
		}
		var hasSync = rows.some(function(r) { return Number(r.event_code) === 1; });
		if (!hasSync) errors.push("Falta evento SYNC_T0 (código 01)");
		var trials = [];
		var current = [];
		for (var j = 0; j < trialCodes.length; j++) {
			var c = trialCodes[j];
			if (c === 40) current = [40];
			else if (c === 41 || c === 42 || c === 50 || c === 51) current.push(c);
			if (current.indexOf(51) >= 0) { trials.push(current); current = []; }
		}
		for (var t = 0; t < trials.length; t++) {
			var tr = trials[t];
			if (tr.indexOf(41) < 0) errors.push("Ensayo " + (t + 1) + ": falta CHOICE_HUMAN (41)");
			if (tr.indexOf(42) < 0) errors.push("Ensayo " + (t + 1) + ": falta CHOICE_COMP (42)");
			if (tr.indexOf(50) < 0) errors.push("Ensayo " + (t + 1) + ": falta OUTCOME_ON (50)");
			if (tr.indexOf(51) < 0) errors.push("Ensayo " + (t + 1) + ": falta OUTCOME_OFF (51)");
		}
		return { valid: errors.length === 0, errors: errors };
	}

	function validateEventLog() {
		return validateRows(eventLog);
	}

	function parseCSVLineFields(line) {
		var result = [];
		var cur = "";
		var inQ = false;
		for (var i = 0; i < line.length; i++) {
			var c = line[i];
			if (inQ) {
				if (c === '"') {
					if (line[i + 1] === '"') { cur += '"'; i++; }
					else inQ = false;
				} else cur += c;
			} else {
				if (c === '"') inQ = true;
				else if (c === ",") { result.push(cur); cur = ""; }
				else cur += c;
			}
		}
		result.push(cur);
		return result;
	}

	/** Valida texto CSV exportado (mismas reglas que validateEventLog). */
	function validateCSVText(text) {
		var empty = { valid: false, errors: ["Texto vacío"], rowCount: 0 };
		if (text == null || text === "") return empty;
		var t = String(text).replace(/^\uFEFF/, "");
		var lines = t.split(/\r?\n/).filter(function(l) { return l.replace(/\s/g, "") !== ""; });
		if (lines.length < 2) return { valid: false, errors: ["CSV sin filas de datos (solo encabezado o vacío)"], rowCount: 0 };
		var hdr = parseCSVLineFields(lines[0]);
		var codeIdx = hdr.indexOf("Codigo evento");
		var tsIdx = hdr.indexOf("Tiempo desde inicio (ms)");
		if (codeIdx < 0) codeIdx = 1;
		if (tsIdx < 0) tsIdx = 0;
		var rows = [];
		var parseErrors = [];
		for (var i = 1; i < lines.length; i++) {
			var fields = parseCSVLineFields(lines[i]);
			var need = Math.max(codeIdx, tsIdx) + 1;
			if (fields.length < need) {
				parseErrors.push("Fila datos " + (i + 1) + ": faltan columnas (esperadas al menos " + need + ")");
				continue;
			}
			var ec = parseInt(fields[codeIdx], 10);
			var ts = parseInt(fields[tsIdx], 10);
			if (isNaN(ec)) parseErrors.push("Fila datos " + (i + 1) + ": Codigo evento no numérico");
			if (isNaN(ts)) parseErrors.push("Fila datos " + (i + 1) + ": tiempo no numérico");
			rows.push({ timestamp_ms: isNaN(ts) ? -1 : ts, event_code: isNaN(ec) ? -1 : ec, trial_num: "", block_num: "" });
		}
		var v = validateRows(rows);
		var allErr = parseErrors.concat(v.errors);
		return { valid: allErr.length === 0, errors: allErr, rowCount: rows.length };
	}

	function getAgentLatencyMs() {
		var cfg = SESSION_CONFIG;
		var min = cfg.agentLatencyMinMs;
		var max = cfg.agentLatencyMaxMs;
		return min + Math.random() * (max - min);
	}

	var TOLERANCE_MS = 100;
	function checkPhaseDuration(phaseLabel, expectedMs, actualMs) {
		if (actualMs == null) return;
		var diff = Math.abs(actualMs - expectedMs);
		if (diff > TOLERANCE_MS && typeof console !== "undefined" && console.warn) {
			console.warn("DPI tolerancia: " + phaseLabel + " esperado ~" + expectedMs + " ms, fue " + actualMs + " ms (diff " + diff + " ms)");
		}
	}

	window.DPISpec = {
		EVENT_CODES: EVENT_CODES,
		SESSION_CONFIG: SESSION_CONFIG,
		getTimestampMs: getTimestampMs,
		establishT0: establishT0,
		getT0: getT0,
		setT0: setT0,
		logEvent: logEvent,
		setDecisionOnsetTime: setDecisionOnsetTime,
		getDecisionOnsetTime: getDecisionOnsetTime,
		setCurrentStrategy: setCurrentStrategy,
		setTrialNum: setTrialNum,
		setCumulativeHuman: setCumulativeHuman,
		setBlockNum: setBlockNum,
		getBlockNum: getBlockNum,
		getEventLog: getEventLog,
		clearEventLog: clearEventLog,
		saveEventLogToStorage: saveEventLogToStorage,
		loadEventLogFromStorage: loadEventLogFromStorage,
		clearEventLogStorage: clearEventLogStorage,
		exportCSV: exportCSV,
		downloadCSV: downloadCSV,
		validateEventLog: validateEventLog,
		validateRows: validateRows,
		validateCSVText: validateCSVText,
		getAgentLatencyMs: getAgentLatencyMs,
		checkPhaseDuration: checkPhaseDuration,
		TOLERANCE_MS: TOLERANCE_MS,
		highResNow: highResNow,
		startHeartbeat: startHeartbeat,
		stopHeartbeat: stopHeartbeat,
		HEARTBEAT_INTERVAL_MS: HEARTBEAT_INTERVAL_MS,
		getEegClockOffsetMs: getEegClockOffsetMs,
		setEegClockOffsetMs: setEegClockOffsetMs,
		getSessionId: getSessionId,
		setSessionId: setSessionId
	};
})();
