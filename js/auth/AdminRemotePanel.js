/**
 * Panel en modo administrador: acceso a Supabase y tabla de participantes / eventos.
 * Lista de nombres clickeable; al elegir uno se cargan sus eventos y resumen.
 */
(function() {
	"use strict";

	function esc(s) {
		if (s == null || s === undefined) return "";
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}

	function escapeCSV(val) {
		if (val == null || val === "") return "";
		var s = String(val);
		if (/[,\n"]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
		return s;
	}

	function mount(container) {
		if (!container || !window.TrustAuth || !TrustAuth.isConfigured || !TrustAuth.isConfigured()) return;
		if (!window.AppRole || !AppRole.isAdmin()) return;

		var wrap = document.createElement("div");
		wrap.className = "admin-remote-wrap";
		wrap.style.cssText = "margin-top:10px;padding-top:10px;border-top:2px solid #2E7D32;";
		wrap.innerHTML =
			'<div style="font-weight:bold;font-size:11px;color:#1b5e20;margin-bottom:4px;">Datos en la nube — participantes</div>' +
			'<p style="font-size:9px;color:#555;margin:0 0 8px;line-height:1.35;">Lista de quienes enviaron eventos DPI. <strong>Pulsa un nombre</strong> para ver números y el registro de eventos de esa persona.</p>' +
			'<div id="admin-cloud-login" style="display:none">' +
			'<label style="display:block;font-size:10px;margin-bottom:4px;">Correo admin<input type="email" id="ar-email" style="width:100%;box-sizing:border-box;font-size:10px;padding:4px;" /></label>' +
			'<label style="display:block;font-size:10px;margin-bottom:4px;">Contraseña<input type="password" id="ar-pass" style="width:100%;box-sizing:border-box;font-size:10px;padding:4px;" /></label>' +
			'<button type="button" id="ar-btn-login" style="width:100%;margin-top:6px;padding:6px;background:#2E7D32;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">Entrar y cargar datos</button>' +
			'<p id="ar-msg" style="font-size:10px;color:#c62828;margin:6px 0 0;"></p>' +
			"</div>" +
			'<div id="admin-cloud-body" style="display:none">' +
			'<p id="admin-cloud-summary" style="font-size:10px;color:#333;margin:0 0 8px;"></p>' +
			'<div id="admin-cloud-layout" style="display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;width:100%;">' +
			'<div id="admin-cloud-names" style="flex:0 1 220px;min-width:180px;max-height:min(440px,52vh);overflow:auto;border:1px solid #ccc;border-radius:6px;background:#fff;padding:6px;"></div>' +
			'<div id="admin-cloud-detail" style="flex:1 1 300px;min-height:200px;min-width:0;max-height:min(480px,58vh);overflow:auto;border:2px solid #2E7D32;border-radius:6px;background:#f1f8f4;padding:10px;font-size:10px;color:#222;">' +
			'<p style="margin:0;color:#555;font-size:10px;line-height:1.4;">Haz clic en un participante de la lista para cargar sus datos.</p>' +
			"</div>" +
			"</div>" +
			'<button type="button" id="ar-btn-refresh" style="width:100%;margin-top:8px;padding:5px;font-size:10px;cursor:pointer;">Actualizar lista</button>' +
			'<button type="button" id="ar-btn-out" style="width:100%;margin-top:4px;padding:5px;font-size:10px;cursor:pointer;">Salir de la cuenta nube</button>' +
			"</div>";

		container.appendChild(wrap);

		var loginEl = wrap.querySelector("#admin-cloud-login");
		var bodyEl = wrap.querySelector("#admin-cloud-body");
		var msgEl = wrap.querySelector("#ar-msg");
		var namesEl = wrap.querySelector("#admin-cloud-names");
		var detailEl = wrap.querySelector("#admin-cloud-detail");
		var summaryEl = wrap.querySelector("#admin-cloud-summary");

		var selectedUid = null;
		var lastNameMap = {};

		function showLogin() {
			loginEl.style.display = "block";
			bodyEl.style.display = "none";
		}

		function showBody() {
			loginEl.style.display = "none";
			bodyEl.style.display = "block";
		}

		function parsePayload(pl) {
			if (pl == null) return {};
			if (typeof pl === "string") {
				try {
					return JSON.parse(pl);
				} catch (e) {
					return {};
				}
			}
			return pl;
		}

		function aggregateFromPayloads(rows) {
			var map = {};
			for (var i = 0; i < rows.length; i++) {
				var uid = rows[i].user_id;
				if (!uid) continue;
				var pl = parsePayload(rows[i].event_payload);
				var sid = rows[i].dpi_session_id || "";
				if (!map[uid]) {
					map[uid] = {
						nEvents: 0,
						sessions: {},
						nChoices: 0,
						bestTs: -1,
						lastPayload: null
					};
				}
				var u = map[uid];
				u.nEvents++;
				if (sid) u.sessions[sid] = true;
				var ec = pl && pl.event_code;
				var ecn = typeof ec === "string" ? parseInt(ec, 10) : ec;
				if (ecn === 41) u.nChoices++;
				var ts = pl && pl.timestamp_ms;
				var tsn = typeof ts === "number" ? ts : (typeof ts === "string" ? parseFloat(ts) : NaN);
				if (!isNaN(tsn) && tsn >= u.bestTs) {
					u.bestTs = tsn;
					u.lastPayload = pl;
				}
			}
			return map;
		}

		/** Une un mapa de aggregateFromPayloads en dest (mismo user_id). */
		function mergeAggregates(dest, src) {
			for (var uid in src) {
				if (!Object.prototype.hasOwnProperty.call(src, uid)) continue;
				var b = src[uid];
				if (!dest[uid]) {
					dest[uid] = {
						nEvents: b.nEvents,
						sessions: Object.assign({}, b.sessions),
						nChoices: b.nChoices,
						bestTs: b.bestTs,
						lastPayload: b.lastPayload
					};
					continue;
				}
				var a = dest[uid];
				a.nEvents += b.nEvents;
				a.nChoices += b.nChoices;
				for (var k in b.sessions) {
					if (Object.prototype.hasOwnProperty.call(b.sessions, k)) a.sessions[k] = true;
				}
				if (b.bestTs > a.bestTs) {
					a.bestTs = b.bestTs;
					a.lastPayload = b.lastPayload;
				}
			}
		}

		/**
		 * Carga todas las filas dpi_events por páginas (antes solo 10 000 sin orden:
		 * participantes con datos “más abajo” en la tabla no aparecían en la lista).
		 */
		function fetchAllDpiEventsForAdmin(c) {
			var PAGE = 2500;
			var MAX_ROWS = 200000;
			var agg = {};
			var totalRows = 0;
			function loadFrom(from) {
				return c
					.from("dpi_events")
					.select("user_id, dpi_session_id, event_payload")
					.order("id", { ascending: true })
					.range(from, from + PAGE - 1)
					.then(function(er) {
						if (er.error) return Promise.reject(er.error);
						var rows = er.data || [];
						totalRows += rows.length;
						mergeAggregates(agg, aggregateFromPayloads(rows));
						if (rows.length < PAGE || totalRows >= MAX_ROWS) {
							return { agg: agg, totalRows: totalRows, capped: totalRows >= MAX_ROWS && rows.length === PAGE };
						}
						return loadFrom(from + PAGE);
					});
			}
			return loadFrom(0);
		}

		function lastCumulativeFromAgg(u) {
			if (!u || !u.lastPayload) return null;
			var ch = u.lastPayload.cumulative_human;
			if (ch === "" || ch == null) return null;
			var n = Number(ch);
			return isNaN(n) ? null : n;
		}

		function sortEventsByTime(rows) {
			var copy = rows.slice();
			copy.sort(function(a, b) {
				var pa = parsePayload(a.event_payload);
				var pb = parsePayload(b.event_payload);
				var ta = Number(pa.timestamp_ms) || 0;
				var tb = Number(pb.timestamp_ms) || 0;
				return ta - tb;
			});
			return copy;
		}

		function countEventCodes(rows) {
			var counts = {};
			for (var i = 0; i < rows.length; i++) {
				var pl = parsePayload(rows[i].event_payload);
				var ec = pl && pl.event_code;
				var key = ec != null ? String(ec) : "?";
				counts[key] = (counts[key] || 0) + 1;
			}
			return counts;
		}

		function buildCsvForUser(rows, displayName) {
			var header = "timestamp_ms,event_code,event_label,phase,session_id,block_num,trial_num,choice,outcome,rt_ms,payoff_human,payoff_agent,cumulative_human,dpi_session_id";
			var lines = [header];
			var sorted = sortEventsByTime(rows);
			for (var i = 0; i < sorted.length; i++) {
				var pl = parsePayload(sorted[i].event_payload);
				var sid = sorted[i].dpi_session_id || "";
				lines.push([
					pl.timestamp_ms, pl.event_code, pl.event_label, pl.phase, pl.session_id,
					pl.block_num, pl.trial_num, pl.choice, pl.outcome, pl.rt_ms,
					pl.payoff_human, pl.payoff_agent, pl.cumulative_human, sid
				].map(escapeCSV).join(","));
			}
			return lines.join("\n");
		}

		function renderDetail(uid, nameLabel, rows) {
			var agg = aggregateFromPayloads(rows.map(function(r) {
				return { user_id: uid, dpi_session_id: r.dpi_session_id, event_payload: r.event_payload };
			}));
			var u = agg[uid];
			var nSess = 0;
			if (u) {
				for (var k in u.sessions) if (Object.prototype.hasOwnProperty.call(u.sessions, k)) nSess++;
			}
			var pts = u ? lastCumulativeFromAgg(u) : null;
			var ptsStr = pts != null ? String(pts) : "—";
			var codeCounts = countEventCodes(rows);
			var codesHtml = Object.keys(codeCounts).sort(function(a, b) { return Number(a) - Number(b); }).map(function(c) {
				return "<span style=\"display:inline-block;margin:2px 6px 2px 0;padding:2px 5px;background:#fff;border:1px solid #c8e6c9;border-radius:4px;font-size:9px;\">cód." + esc(c) + ": " + codeCounts[c] + "</span>";
			}).join("");

			var sorted = sortEventsByTime(rows);
			var show = sorted.slice(Math.max(0, sorted.length - 80));
			var tableRows = show.map(function(r) {
				var pl = parsePayload(r.event_payload);
				return "<tr>" +
					"<td style=\"border:1px solid #ddd;padding:2px 4px;\">" + esc(pl.timestamp_ms) + "</td>" +
					"<td style=\"border:1px solid #ddd;padding:2px 4px;text-align:center;\">" + esc(pl.event_code) + "</td>" +
					"<td style=\"border:1px solid #ddd;padding:2px 4px;font-size:8px;\">" + esc((pl.event_label || "").substring(0, 40)) + "</td>" +
					"<td style=\"border:1px solid #ddd;padding:2px 4px;text-align:center;\">" + esc(pl.trial_num) + "</td>" +
					"<td style=\"border:1px solid #ddd;padding:2px 4px;text-align:center;\">" + esc(pl.choice) + "</td>" +
					"<td style=\"border:1px solid #ddd;padding:2px 4px;text-align:center;\">" + esc(pl.rt_ms) + "</td>" +
					"<td style=\"border:1px solid #ddd;padding:2px 4px;text-align:center;\">" + esc(pl.cumulative_human) + "</td>" +
					"</tr>";
			}).join("");

			var csv = buildCsvForUser(rows, nameLabel);
			var fname = "dpi_participante_" + (nameLabel || "usuario").replace(/[^\w\-]/g, "_").substring(0, 40) + "_" + uid.substring(0, 8) + ".csv";

			detailEl.innerHTML =
				'<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #c8e6c9;">' +
				'<div style="font-size:13px;font-weight:bold;color:#1b5e20;">' + esc(nameLabel || "Participante") + "</div>" +
				'<div style="font-size:8px;color:#666;word-break:break-all;margin-top:4px;user-select:all;">' + esc(uid) + "</div>" +
				'<div style="margin-top:8px;line-height:1.5;font-size:10px;">' +
				"<strong>Sesiones distintas:</strong> " + nSess + " · " +
				"<strong>Eventos:</strong> " + rows.length + " · " +
				"<strong>Decisiones (cód.41):</strong> " + (u ? u.nChoices : 0) + " · " +
				"<strong>Puntos (último acum.):</strong> " + esc(ptsStr) +
				"</div>" +
				'<div style="margin-top:6px;font-size:9px;"><strong>Por código de evento:</strong></div>' +
				'<div style="margin-top:4px;">' + (codesHtml || "<span style=\"color:#888\">—</span>") + "</div>" +
				"</div>" +
				'<button type="button" class="ar-btn-dl-csv" style="margin-bottom:8px;padding:6px 10px;font-size:10px;cursor:pointer;background:#2E7D32;color:#fff;border:none;border-radius:4px;">Descargar CSV de este participante</button>' +
				'<div style="font-size:9px;font-weight:bold;margin-bottom:4px;">Últimos ' + show.length + " eventos (orden cronológico)</div>" +
				'<div style="overflow:auto;max-height:220px;border:1px solid #ccc;border-radius:4px;background:#fff;">' +
				'<table style="width:100%;border-collapse:collapse;font-size:8px;">' +
				"<thead><tr style=\"background:#e8f5e9;\">" +
				"<th style=\"border:1px solid #bbb;padding:3px;\">t ms</th>" +
				"<th style=\"border:1px solid #bbb;padding:3px;\">cód</th>" +
				"<th style=\"border:1px solid #bbb;padding:3px;\">evento</th>" +
				"<th style=\"border:1px solid #bbb;padding:3px;\">ensayo</th>" +
				"<th style=\"border:1px solid #bbb;padding:3px;\">elec.</th>" +
				"<th style=\"border:1px solid #bbb;padding:3px;\">RT</th>" +
				"<th style=\"border:1px solid #bbb;padding:3px;\">cum.</th>" +
				"</tr></thead><tbody>" + (tableRows || "<tr><td colspan=\"7\" style=\"padding:8px;color:#888;\">Sin filas</td></tr>") + "</tbody></table>" +
				"</div>";

			var dl = detailEl.querySelector(".ar-btn-dl-csv");
			if (dl) {
				dl.onclick = function() {
					try {
						var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
						var a = document.createElement("a");
						a.href = URL.createObjectURL(blob);
						a.download = fname;
						a.click();
						URL.revokeObjectURL(a.href);
					} catch (e) {
						alert("No se pudo descargar el CSV.");
					}
				};
			}
		}

		function setSelectedButton(uid) {
			var btns = namesEl.querySelectorAll("[data-participant-id]");
			for (var i = 0; i < btns.length; i++) {
				var b = btns[i];
				var on = b.getAttribute("data-participant-id") === uid;
				b.style.border = on ? "2px solid #2E7D32" : "1px solid #ddd";
				b.style.background = on ? "#e8f5e9" : "#fafafa";
				b.style.fontWeight = on ? "700" : "400";
			}
		}

		function loadParticipantDetail(uid) {
			selectedUid = uid;
			setSelectedButton(uid);
			var nameLabel = lastNameMap[uid] || "—";
			detailEl.innerHTML = "<p style=\"margin:0;color:#555;\">Cargando datos…</p>";

			var c = TrustAuth.getClient();
			if (!c) {
				detailEl.innerHTML = "<p style=\"color:#c62828;\">Sin cliente Supabase.</p>";
				return;
			}

			c.from("dpi_events").select("user_id, dpi_session_id, event_payload").eq("user_id", uid).limit(20000).then(function(er) {
				if (er.error) {
					detailEl.innerHTML = "<p style=\"color:#c62828;\">Error: " + esc(er.error.message) + "</p>";
					return;
				}
				var rows = er.data || [];
				if (rows.length === 0) {
					detailEl.innerHTML = "<p style=\"color:#888;\">No hay eventos guardados para este usuario.</p>";
					return;
				}
				renderDetail(uid, nameLabel, rows);
			});
		}

		function chunk(arr, size) {
			var out = [];
			for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
			return out;
		}

		function buildNameList(nameMap, agg, uids) {
			nameMap = nameMap || {};
			lastNameMap = nameMap;
			uids.sort(function(a, b) {
				var na = (nameMap[a] || a).toLowerCase();
				var nb = (nameMap[b] || b).toLowerCase();
				if (na !== nb) return na < nb ? -1 : 1;
				return a < b ? -1 : 1;
			});

			var html = "";
			for (var j = 0; j < uids.length; j++) {
				var id = uids[j];
				var u = agg[id];
				var label = nameMap[id] || "Sin nombre";
				var pts = lastCumulativeFromAgg(u);
				var ptsLine = pts != null ? pts + " pts · " : "";
				html +=
					'<button type="button" data-participant-id="' + esc(id) + '" style="display:block;width:100%;text-align:left;padding:8px 8px;margin-bottom:6px;border:1px solid #ddd;border-radius:6px;background:#fafafa;cursor:pointer;font-size:11px;color:#222;">' +
					'<span style="font-weight:600;display:block;">' + esc(label) + "</span>" +
					'<span style="display:block;font-size:8px;color:#666;margin-top:3px;">' + esc(ptsLine) + u.nEvents + " eventos · " + u.nChoices + " decisiones</span>" +
					"</button>";
			}
			namesEl.innerHTML = html || "<p style=\"font-size:9px;color:#888;margin:0;\">Nadie con datos todavía.</p>";

			namesEl.onclick = function(ev) {
				var t = ev.target;
				while (t && t !== namesEl) {
					if (t.getAttribute && t.getAttribute("data-participant-id")) {
						loadParticipantDetail(t.getAttribute("data-participant-id"));
						return;
					}
					t = t.parentNode;
				}
			};

			detailEl.innerHTML = "<p style=\"margin:0;color:#555;font-size:10px;line-height:1.4;\">Elige un nombre para ver su ficha y la tabla de eventos.</p>";
			selectedUid = null;
		}

		function refreshTable() {
			var c = TrustAuth.getClient();
			if (!c) return;
			TrustAuth.fetchProfile().then(function(prof) {
				if (!prof || !prof.is_admin) {
					msgEl.textContent = "Esta cuenta no tiene is_admin=true en la tabla profiles (márcala en Supabase).";
					showLogin();
					return;
				}
				return fetchAllDpiEventsForAdmin(c).then(
					function(result) {
						var agg = result.agg;
						var totalRows = result.totalRows;
						var capped = result.capped;
						var uids = Object.keys(agg);
						var capNote = capped ? " · Límite de lectura alcanzado (200k filas); revisa en Supabase si faltan datos." : "";
						summaryEl.textContent =
							"Participantes distintos: " +
							uids.length +
							" · Filas cargadas: " +
							totalRows +
							" (paginado; el detalle por persona sigue cargando hasta 20k filas suyas)." +
							capNote;

						if (uids.length === 0) {
							buildNameList({}, agg, []);
							return;
						}

						var allNames = {};
						var parts = chunk(uids, 80);
						var chain = Promise.resolve();
						for (var p = 0; p < parts.length; p++) {
							(function(ids) {
								chain = chain.then(function() {
									return c.from("profiles").select("id, display_name").in("id", ids).then(function(pr) {
										if (pr.error || !pr.data) return;
										for (var x = 0; x < pr.data.length; x++) {
											var row = pr.data[x];
											if (row.id) allNames[row.id] = row.display_name || row.id;
										}
									});
								});
							})(parts[p]);
						}
						chain.then(function() {
							buildNameList(allNames, agg, uids);
						});
					},
					function(err) {
						summaryEl.textContent = "Error: " + (err && err.message ? err.message : String(err));
					}
				);
			});
		}

		function checkSession() {
			TrustAuth.init().then(function() {
				if (TrustAuth.getUser()) {
					showBody();
					refreshTable();
				} else {
					showLogin();
				}
			});
		}

		wrap.querySelector("#ar-btn-login").onclick = function() {
			msgEl.textContent = "";
			var em = wrap.querySelector("#ar-email").value.trim();
			var pw = wrap.querySelector("#ar-pass").value;
			if (!em || !pw) {
				msgEl.textContent = "Completa correo y contraseña.";
				return;
			}
			TrustAuth.signIn(em, pw).then(function() {
				showBody();
				refreshTable();
			}).catch(function(e) {
				msgEl.textContent = (e && e.message) ? e.message : "Error al entrar.";
			});
		};

		wrap.querySelector("#ar-btn-refresh").onclick = function() { refreshTable(); };
		wrap.querySelector("#ar-btn-out").onclick = function() {
			TrustAuth.signOut().then(function() {
				showLogin();
			});
		};

		checkSession();
	}

	window.AdminRemotePanel = { mount: mount };
})();
