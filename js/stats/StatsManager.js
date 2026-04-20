var StatsManager = {
    
    // Datos que se van a guardar
    data: {
        sessionStart: null,
        totalGames: 0,
        totalRounds: 0,
        gamesWon: 0,
        gamesLost: 0,
        cooperationChoices: 0,
        cheatChoices: 0,
        opponentsFaced: {},
        totalScore: 0,
        averageScore: 0,
        lastUpdate: null,
        // Puntuaciones detalladas del juego
        rewardPoints: 0,    // Ambos cooperan: +2 cada uno
        temptationPoints: 0, // Yo traiciono, él coopera: +3 para mí
        suckerPoints: 0,    // Yo coopero, él traiciona: -1 para mí
        punishmentPoints: 0, // Ambos traicionan: 0 cada uno
        // Tiempos de decisión
        decisionTimes: [], // Array con los tiempos de cada decisión en milisegundos
        totalDecisionTime: 0, // Tiempo total acumulado
        averageDecisionTime: 0, // Tiempo promedio de decisión
        minDecisionTime: null, // Tiempo mínimo de decisión
        maxDecisionTime: null, // Tiempo máximo de decisión
        // Decisiones detalladas con oponente y tipo
        decisionDetails: [], // Array con objetos {time, opponent, choice}
        // Tiempos por oponente
        timesByOpponent: {}, // {opponentName: {times: [], total: 0, average: 0, count: 0}}
        // Tiempos por tipo de decisión
        timesByChoice: { // {cooperate: {times: [], total: 0, average: 0, count: 0}, cheat: {...}}
            cooperate: {times: [], total: 0, average: 0, count: 0},
            cheat: {times: [], total: 0, average: 0, count: 0}
        }
    },
    
    // Variable para almacenar el tiempo de inicio de decisión
    // NUEVA IDEA: Mantener múltiples puntos de referencia para calcular tiempos
    decisionStartTime: null,
    lastRoundEndTime: null, // Timestamp del último round/end
    lastClickTimestamp: null, // Timestamp del último clic (capturado en Button.js)
    // Variable para almacenar el oponente actual
    currentOpponent: null,
    
    // Inicializar estadísticas
    init: function() {
        try {
            this.data.sessionStart = this.getLocalDateTime();
            this.data.lastUpdate = this.getLocalDateTime();
            this.loadStats(); // Cargar estadísticas guardadas si existen
            // Jugador: sin panel en index; admin o página dedicada admin.html: siempre crear UI.
            var adminDedicated = window.__TRUST_ADMIN_PAGE__ === true;
            if (!window.AppRole || AppRole.isAdmin() || adminDedicated) {
                this.createUI();
            }
            this.startListening();
            
            // CRÍTICO: Actualizar el display después de cargar las estadísticas
            // Esto asegura que la tabla muestre los datos correctos al refrescar
            if (this.content) this.updateDisplay();
            
            // Asegurar que el temporizador NO esté iniciado al comenzar
            this.decisionStartTime = null;
        } catch (error) {
            console.log('Error inicializando estadísticas:', error);
            // Si hay error, no hacer nada para no romper el juego
        }
    },
    
    // Obtener fecha y hora local formateada
    getLocalDateTime: function() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        const timezone = now.toLocaleTimeString('es-MX', {timeZoneName: 'short'}).split(' ')[1];
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} ${timezone}`;
    },
    
    // Inicializar automáticamente cuando se carga la página
    autoInit: function() {
        // Esperar a que la página esté completamente cargada
        if (document.readyState === 'complete') {
            this.init();
        } else {
            window.addEventListener('load', () => {
                // Esperar menos tiempo para que aparezcan más rápido
                setTimeout(() => {
                    this.init();
                }, 500);
            });
        }
    },
    
    _escHtml: function(s) {
        if (s == null || s === undefined) return "";
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    },

    /** Vista tipo hoja: eventos DPI en filas (mismos datos que el CSV). */
    refreshDpiEventTable: function() {
        if (!this.dpiTableScroll || !window.DPISpec || typeof DPISpec.getEventLog !== "function") return;
        var rows = DPISpec.getEventLog();
        var esc = this._escHtml.bind(this);
        if (!rows.length) {
            this.dpiTableScroll.innerHTML = '<div style="font-size:9px;color:#888;padding:6px;">Sin eventos en el log todavía.</div>';
            return;
        }
        var h = '<table style="width:100%;border-collapse:collapse;font-size:8px;line-height:1.2;">';
        h += "<thead><tr style=\"background:#e3e3e3;\">";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;text-align:left;\">t (ms)</th>";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;\">cód</th>";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;text-align:left;\">evento</th>";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;\">bloq</th>";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;\">ens</th>";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;\">elec</th>";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;\">RT</th>";
        h += "<th style=\"border:1px solid #bbb;padding:2px 3px;\">PH/PA</th>";
        h += "</tr></thead><tbody>";
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var ph = r.payoff_human;
            var pa = r.payoff_agent;
            var pts = (ph !== "" && ph != null) || (pa !== "" && pa != null) ? esc(ph) + "/" + esc(pa) : "";
            h += "<tr>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;\">" + esc(r.timestamp_ms) + "</td>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;text-align:center;\">" + esc(r.event_code) + "</td>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;\">" + esc(r.event_label) + "</td>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;text-align:center;\">" + esc(r.block_num) + "</td>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;text-align:center;\">" + esc(r.trial_num) + "</td>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;text-align:center;\">" + esc(r.choice) + "</td>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;text-align:center;\">" + esc(r.rt_ms) + "</td>";
            h += "<td style=\"border:1px solid #eee;padding:1px 3px;text-align:center;\">" + pts + "</td>";
            h += "</tr>";
        }
        h += "</tbody></table>";
        this.dpiTableScroll.innerHTML = h;
    },

    // Crear la interfaz de estadísticas
    createUI: function() {
        if (this._statsUiCreated) return;
        this._statsUiCreated = true;

        // Crear botón de mostrar/ocultar PRIMERO
        this.toggleBtn = document.createElement("button");
        this.toggleBtn.innerHTML = "📊 Estadísticas";
        this.toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #4089DD;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 11px;
            z-index: 1001;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            opacity: 0.8;
        `;
        
        // Crear contenedor principal
        this.container = document.createElement("div");
        this.container.id = "stats-container";
        this.container.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50px;
            width: min(420px, 92vw);
            max-height: 80vh;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #333;
            border-radius: 8px;
            padding: 8px;
            font-family: Arial, sans-serif;
            font-size: 10px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: none;
        `;
        
        // Crear header
        this.header = document.createElement("div");
        this.header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <strong style="color: #333;">📊 Estadísticas</strong>
                    <div style="font-size:9px;color:#2E7D32;font-weight:bold;margin-top:2px;">Modo administrador</div>
                </div>
                <button id="toggle-stats" style="background: #666; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 10px;">−</button>
            </div>
        `;
        
        // Crear contenido de estadísticas
        this.content = document.createElement("div");
        this.content.id = "stats-content";

        this.dpiSection = document.createElement("div");
        this.dpiSection.style.cssText = "margin-top:8px;border-top:1px solid #ccc;padding-top:6px;";
        var dpiTitle = document.createElement("div");
        dpiTitle.style.cssText = "font-weight:bold;font-size:10px;color:#333;margin-bottom:4px;";
        dpiTitle.textContent = "Registro DPI (vista tabla, estilo hoja)";
        this.dpiTableScroll = document.createElement("div");
        this.dpiTableScroll.style.cssText = "max-height:220px;overflow:auto;border:1px solid #ddd;border-radius:4px;background:#fafafa;";
        this.dpiSection.appendChild(dpiTitle);
        this.dpiSection.appendChild(this.dpiTableScroll);
        
        // Crear botón de descarga
        this.downloadBtn = document.createElement("button");
        this.downloadBtn.innerHTML = "💾 Descargar Datos";
        this.downloadBtn.style.cssText = `
            width: 100%;
            background: #4089DD;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            font-size: 11px;
            margin-top: 8px;
        `;
        
        // Crear botón Descargar CSV (especificación DPI)
        this.csvBtn = document.createElement("button");
        this.csvBtn.innerHTML = "📄 Descargar CSV (DPI)";
        this.csvBtn.style.cssText = `
            width: 100%;
            background: #2E7D32;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            font-size: 11px;
            margin-top: 4px;
        `;
        this.csvBtn.onclick = () => {
            if (window.DPISpec && typeof DPISpec.downloadCSV === 'function') {
                DPISpec.downloadCSV();
            } else {
                alert('El módulo DPI no está cargado.');
            }
        };
        
        this.validateCsvBtn = document.createElement("button");
        this.validateCsvBtn.innerHTML = "✓ Validar log en memoria (DPI)";
        this.validateCsvBtn.style.cssText = `
            width: 100%;
            background: #5C6BC0;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            font-size: 11px;
            margin-top: 4px;
        `;
        this.validateCsvBtn.onclick = () => {
            if (window.DPISpec && typeof DPISpec.validateEventLog === 'function') {
                var r = DPISpec.validateEventLog();
                if (r.valid) alert('Log en memoria válido: secuencia y eventos correctos.');
                else alert('Errores (log en memoria):\n' + (r.errors && r.errors.length ? r.errors.join('\n') : 'desconocido'));
            } else {
                alert('El módulo DPI no está cargado.');
            }
        };

        this.validateCsvFileInput = document.createElement("input");
        this.validateCsvFileInput.type = "file";
        this.validateCsvFileInput.accept = ".csv,text/csv";
        this.validateCsvFileInput.style.display = "none";
        this.validateCsvFileInput.onchange = (ev) => {
            var f = ev.target && ev.target.files && ev.target.files[0];
            ev.target.value = "";
            if (!f) return;
            var reader = new FileReader();
            reader.onload = () => {
                if (!window.DPISpec || typeof DPISpec.validateCSVText !== 'function') {
                    alert('El módulo DPI no está cargado.');
                    return;
                }
                var r = DPISpec.validateCSVText(reader.result);
                var msg = (r.valid ? 'Archivo CSV válido (' + (r.rowCount || 0) + ' filas).' : 'Errores en archivo CSV:\n' + (r.errors && r.errors.length ? r.errors.join('\n') : 'desconocido'));
                alert(msg);
            };
            reader.onerror = () => alert('No se pudo leer el archivo.');
            reader.readAsText(f, "UTF-8");
        };

        this.validateCsvFileBtn = document.createElement("button");
        this.validateCsvFileBtn.innerHTML = "📂 Validar CSV desde archivo";
        this.validateCsvFileBtn.style.cssText = `
            width: 100%;
            background: #3949AB;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            font-size: 11px;
            margin-top: 4px;
        `;
        this.validateCsvFileBtn.onclick = () => {
            if (window.DPISpec && typeof DPISpec.validateCSVText === 'function') {
                this.validateCsvFileInput.click();
            } else {
                alert('El módulo DPI no está cargado.');
            }
        };
        
        // Crear botón de limpiar
        this.clearBtn = document.createElement("button");
        this.clearBtn.innerHTML = "🗑️ Limpiar Datos";
        this.clearBtn.style.cssText = `
            width: 100%;
            background: #FF5E5E;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            font-size: 11px;
            margin-top: 4px;
        `;
        
        // Crear botón de nueva partida
        // NOTA: El botón "Guardar Partida" fue eliminado porque el guardado ahora es automático
        this.newGameBtn = document.createElement("button");
        this.newGameBtn.innerHTML = "🆕 Nueva Partida";
        this.newGameBtn.style.cssText = `
            width: 100%;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            font-size: 11px;
            margin-top: 4px;
        `;
        this.newGameBtn.onclick = () => {
            // Primera confirmación: nueva partida
            if (confirm('¿Estás seguro de que quieres empezar una nueva partida?\n\nEsto eliminará tu partida guardada actual.')) {
                // Segunda confirmación: limpiar estadísticas
                const clearStats = confirm('¿También quieres limpiar todas las estadísticas?\n\n• Sí = Empezar completamente de cero (sin estadísticas previas)\n• No = Mantener estadísticas acumuladas (historial completo)');
                
                // Limpiar estadísticas si el usuario lo desea
                if (clearStats) {
                    this.data = {
                        sessionStart: this.getLocalDateTime(),
                        totalGames: 0,
                        totalRounds: 0,
                        gamesWon: 0,
                        gamesLost: 0,
                        cooperationChoices: 0,
                        cheatChoices: 0,
                        opponentsFaced: {},
                        totalScore: 0,
                        averageScore: 0,
                        lastUpdate: this.getLocalDateTime(),
                        rewardPoints: 0,
                        temptationPoints: 0,
                        suckerPoints: 0,
                        punishmentPoints: 0,
                        decisionTimes: [],
                        totalDecisionTime: 0,
                        averageDecisionTime: 0,
                        minDecisionTime: null,
                        maxDecisionTime: null,
                        decisionDetails: [],
                        timesByOpponent: {},
                        timesByChoice: {
                            cooperate: {times: [], total: 0, average: 0, count: 0},
                            cheat: {times: [], total: 0, average: 0, count: 0}
                        }
                    };
                    
                    this.decisionStartTime = null;
                    this.currentOpponent = null;
                    localStorage.removeItem('trustGameStats');
                    this.updateDisplay();
                    console.log('✅ Estadísticas limpiadas para nueva partida');
                }
                
                // Iniciar nueva partida
                if (typeof GameSaveManager !== 'undefined' && GameSaveManager.startNewGame) {
                    GameSaveManager.startNewGame();
                } else {
                    // Fallback: eliminar guardado y recargar
                    if (typeof GameSaveManager !== 'undefined') {
                        GameSaveManager.deleteSave();
                    }
                    window.location.reload();
                }
            }
        };
        
        
        // Ensamblar todo
        this.container.appendChild(this.header);
        this.container.appendChild(this.content);
        this.container.appendChild(this.dpiSection);
        this.container.appendChild(this.downloadBtn);
        this.container.appendChild(this.csvBtn);
        this.container.appendChild(this.validateCsvBtn);
        this.container.appendChild(this.validateCsvFileBtn);
        document.body.appendChild(this.validateCsvFileInput);
        this.container.appendChild(this.newGameBtn);
        this.container.appendChild(this.clearBtn);

        if (window.AdminRemotePanel && typeof AdminRemotePanel.mount === "function") {
            AdminRemotePanel.mount(this.container);
        }
        
        document.body.appendChild(this.container);
        document.body.appendChild(this.toggleBtn);
        
        // Event listeners
        this.toggleBtn.onclick = () => this.toggleStats();
        this.downloadBtn.onclick = () => this.downloadStats();
        this.clearBtn.onclick = () => this.clearStats();
        document.getElementById('toggle-stats').onclick = () => this.toggleStats();
        
        // Forzar actualización del display
        this.updateDisplay();
        this.refreshDpiEventTable();
        
        // Actualizar cada segundo para mostrar el tiempo en tiempo real
        setInterval(() => {
            if (this.content && this.container.style.display !== 'none') {
                this.updateDisplay();
                this.refreshDpiEventTable();
            }
        }, 1000);
    },
    
    // Mostrar/ocultar estadísticas
    toggleStats: function() {
        if (this.container.style.display === 'none') {
            this.container.style.display = 'block';
            this.toggleBtn.innerHTML = '📊 Ocultar';
        } else {
            this.container.style.display = 'none';
            this.toggleBtn.innerHTML = '📊 Estadísticas';
        }
    },
    
    // Formatear tiempo en segundos para export: "X segundos" o "X.XX segundos"
    _formatSegundosTexto: function(seg) {
        if (seg === null || seg === undefined || isNaN(seg)) return '0 segundos';
        const n = typeof seg === 'number' ? seg : parseFloat(seg);
        const txt = (n % 1 === 0) ? String(Math.round(n)) : n.toFixed(2);
        return txt + ' segundos';
    },

    // Obtener tiempos por ronda para exportar en JSON: Oponente 1, Oponente 2, ... con ronda 1, ronda 2, ... en segundos
    getRoundTimesForExport: function() {
        const out = {};
        try {
            const raw = localStorage.getItem('trustGameSave');
            const save = raw ? JSON.parse(raw) : null;
            const byOpp = (save && Array.isArray(save.roundTimesByOpponent)) ? save.roundTimesByOpponent : [];
            const current = (save && Array.isArray(save.roundTimes)) ? save.roundTimes : [];
            const tieneByOpp = byOpp.some(function(arr) { return arr && arr.length > 0; });

            if (tieneByOpp) {
                byOpp.forEach(function(times, idx) {
                    const opKey = 'Oponente ' + (idx + 1);
                    out[opKey] = {};
                    (times || []).forEach(function(t, i) {
                        const seg = typeof t === 'number' ? t : parseFloat(t);
                        out[opKey]['ronda ' + (i + 1)] = this._formatSegundosTexto(isNaN(seg) ? t : seg);
                    }.bind(this));
                }.bind(this));
                if (current.length > 0) {
                    const n = byOpp.length + 1;
                    out['Oponente ' + n + ' (en curso)'] = {};
                    current.forEach(function(t, i) {
                        const seg = typeof t === 'number' ? t : parseFloat(t);
                        out['Oponente ' + n + ' (en curso)']['ronda ' + (i + 1)] = this._formatSegundosTexto(isNaN(seg) ? t : seg);
                    }.bind(this));
                }
                return out;
            }

            // Si no hay roundTimesByOpponent, derivar Oponente 1, 2, 3... del historial de decisiones (bloques consecutivos por oponente)
            const details = (this.data && this.data.decisionDetails) ? this.data.decisionDetails : [];
            if (details.length === 0) return out;

            var bloque = [];
            var bloques = [];
            for (var i = 0; i < details.length; i++) {
                var d = details[i];
                var opp = (d && d.opponent) ? d.opponent : '';
                var seg = (d && typeof d.time === 'number') ? d.time / 1000 : 0;
                if (bloque.length > 0 && bloque[bloque.length - 1].opponent !== opp) {
                    bloques.push(bloque);
                    bloque = [];
                }
                bloque.push({ opponent: opp, seg: seg });
            }
            if (bloque.length > 0) bloques.push(bloque);

            bloques.forEach(function(bloque, idx) {
                const opKey = 'Oponente ' + (idx + 1);
                out[opKey] = {};
                bloque.forEach(function(r, i) {
                    out[opKey]['ronda ' + (i + 1)] = this._formatSegundosTexto(r.seg);
                }.bind(this));
            }.bind(this));
            return out;
        } catch (e) { return {}; }
    },

    // Obtener HTML de tiempos por ronda (apilado por oponente)
    getRoundTimesHTML: function() {
        try {
            const raw = localStorage.getItem('trustGameSave');
            const save = raw ? JSON.parse(raw) : null;
            const byOpp = (save && Array.isArray(save.roundTimesByOpponent)) ? save.roundTimesByOpponent : [];
            const current = (save && Array.isArray(save.roundTimes)) ? save.roundTimes : [];
            let html = '<div style="margin-top: 6px; font-size: 9px;"><strong>TIEMPOS POR RONDA:</strong></div>';
            let empty = true;
            for (let opp = 0; opp < byOpp.length; opp++) {
                const times = byOpp[opp];
                if (!times || times.length === 0) continue;
                empty = false;
                html += `<div style="margin-top: 4px; font-size: 9px;"><strong>Oponente ${opp + 1}:</strong></div>`;
                for (let i = 0; i < times.length; i++) {
                    const s = typeof times[i] === 'number' ? times[i].toFixed(3) : String(times[i]);
                    html += `<div style="font-size: 8px; margin-left: 8px;">ronda ${i + 1}: ${s} s</div>`;
                }
            }
            if (current.length > 0) {
                empty = false;
                const n = byOpp.length + 1;
                html += `<div style="margin-top: 4px; font-size: 9px;"><strong>Oponente ${n} (actual):</strong></div>`;
                for (let i = 0; i < current.length; i++) {
                    const s = typeof current[i] === 'number' ? current[i].toFixed(3) : String(current[i]);
                    html += `<div style="font-size: 8px; margin-left: 8px;">ronda ${i + 1}: ${s} s</div>`;
                }
            }
            if (empty) html += '<div style="font-size: 8px; color: #888;">Juega rondas (pulsa Iniciar) para ver aquí.</div>';
            return html;
        } catch (e) { return '<div style="margin-top: 6px; font-size: 9px;"><strong>TIEMPOS POR RONDA:</strong></div><div style="font-size: 8px; color: #888;">—</div>'; }
    },
    
    // Actualizar la pantalla de estadísticas
    updateDisplay: function() {
        if (!this.content) return;
        
        const stats = this.data;
        const sessionTime = this.getSessionTime();
        const roundTimesHTML = this.getRoundTimesHTML();
        
        this.content.innerHTML = `
            <div style="line-height: 1.3; font-size: 10px;">
                <div><strong>Tiempo:</strong> ${sessionTime}</div>
                <div><strong>Juegos:</strong> ${stats.totalGames}</div>
                <div><strong>Rondas:</strong> ${stats.totalRounds}</div>
                ${roundTimesHTML ? roundTimesHTML : ''}
                <div><strong>Cooperar:</strong> ${stats.cooperationChoices} | <strong>Traicionar:</strong> ${stats.cheatChoices}</div>
                <div style="margin-top: 4px;"><strong>PUNTOS:</strong></div>
                <div><strong>Total:</strong> ${stats.totalScore || 0}</div>
                <div><strong>Promedio:</strong> ${(stats.averageScore || 0).toFixed(1)}</div>
                <div style="margin-top: 4px; font-size: 9px;"><strong>TIEMPO DECISIÓN:</strong></div>
                ${stats.decisionTimes && stats.decisionTimes.length > 0 ? `
                    <div style="font-size: 9px;"><strong>Promedio:</strong> ${this.formatTime(stats.averageDecisionTime || 0)}</div>
                    <div style="font-size: 9px;"><strong>Mín:</strong> ${(stats.minDecisionTime !== null && stats.minDecisionTime !== undefined) ? this.formatTime(stats.minDecisionTime) : 'N/D'}</div>
                    <div style="font-size: 9px;"><strong>Máx:</strong> ${(stats.maxDecisionTime !== null && stats.maxDecisionTime !== undefined) ? this.formatTime(stats.maxDecisionTime) : 'N/D'}</div>
                    <div style="font-size: 8px; color: #666;">Decisiones: ${stats.decisionTimes.length}</div>
                ` : `
                    <div style="font-size: 9px; color: #999;">Aún no has tomado decisiones</div>
                    <div style="font-size: 8px; color: #999;">El tiempo se iniciará cuando se activen los botones</div>
                `}
                
                <div style="margin-top: 4px; font-size: 9px;"><strong>POR TIPO:</strong></div>
                <div style="font-size: 8px; color: #4CAF50;"><strong>Cooperar:</strong> ${this.getChoiceStats('cooperate')}</div>
                <div style="font-size: 8px; color: #F44336;"><strong>Traicionar:</strong> ${this.getChoiceStats('cheat')}</div>
                
                <div style="margin-top: 4px; font-size: 9px;"><strong>POR OPONENTE:</strong></div>
                ${this.getOpponentStatsHTML()}
                
                <div style="margin-top: 4px; font-size: 9px;"><strong>DETALLE:</strong></div>
                <div style="font-size: 9px;"><span style="color: #4CAF50;">Recompensa (+2):</span> ${stats.rewardPoints || 0}</div>
                <div style="font-size: 9px;"><span style="color: #FF9800;">Tentación (+3):</span> ${stats.temptationPoints || 0}</div>
                <div style="font-size: 9px;"><span style="color: #F44336;">Engañado (-1):</span> ${stats.suckerPoints || 0}</div>
                <div style="font-size: 9px;"><span style="color: #9E9E9E;">Castigo (0):</span> ${stats.punishmentPoints || 0}</div>
                <div style="margin-top: 4px; font-weight: bold; font-size: 9px;">Oponentes:</div>
                ${this.getOpponentsHTML()}
            </div>
        `;
        if (typeof this.refreshDpiEventTable === "function") this.refreshDpiEventTable();
    },
    
    // Obtener HTML de oponentes (nombres en español)
    getOpponentsHTML: function() {
        let html = '';
        for (let opponent in this.data.opponentsFaced) {
            const nombreEsp = this.getOpponentNameSpanish(opponent);
            html += `<div style="margin-left: 10px;">• ${nombreEsp}: ${this.data.opponentsFaced[opponent]} veces</div>`;
        }
        return html;
    },
    
    // Obtener tiempo de sesión
    getSessionTime: function() {
        if (!this.data.sessionStart) return '0:00';
        
        // Crear fecha de inicio desde el formato local
        let start;
        if (this.data.sessionStart.includes('T')) {
            // Formato UTC antiguo
            start = new Date(this.data.sessionStart);
        } else {
            // Formato local nuevo - extraer solo la fecha y hora
            const dateTimeStr = this.data.sessionStart.split(' ')[0] + 'T' + this.data.sessionStart.split(' ')[1];
            start = new Date(dateTimeStr);
        }
        
        const now = new Date();
        const diff = now - start;
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    
    // Empezar a escuchar eventos del juego
    startListening: function() {
        if (this._listeningStarted) return;
        this._listeningStarted = true;
        console.log('🔊 StatsManager.startListening() llamado - Configurando listeners...');
        // Escuchar cuando empieza una ronda (se desactivan los botones)
        // AQUÍ es donde debemos iniciar el temporizador para la SIGUIENTE decisión
        subscribe("iterated/round/start", () => {
            // Cuando empieza una ronda, significa que el usuario acaba de hacer clic
            // El temporizador para esta decisión ya debería estar iniciado
            // NO hacer nada aquí, solo esperar a que termine la ronda
            console.log('🎮 Ronda iniciada. El temporizador debería estar iniciado para esta decisión.');
        });
        
        // Escuchar cuando se juega una ronda (solo esto cuenta las rondas)
        subscribe("iterated/round/end", (payoffA, payoffB) => {
            this.recordRound([payoffA, payoffB]);
            // NUEVA IDEA: Guardar el timestamp del round/end como referencia
            // Esto nos permite calcular tiempos incluso si el temporizador no se inició correctamente
            this.lastRoundEndTime = Date.now();
            console.log('📊 Round/end timestamp guardado:', this.lastRoundEndTime);
            
            // Resetear el temporizador después de cada ronda
            // También resetear el timestamp de última decisión para permitir nuevas decisiones
            this.resetDecisionTimer();
            this.lastDecisionTimestamp = null;
            // IMPORTANTE: Resetear el flag para permitir que se reinicie el temporizador cuando se activen los botones
            this.buttonsActivationHandled = false;
            if (this.activationTimeout) {
                clearTimeout(this.activationTimeout);
                this.activationTimeout = null;
            }
        });
        
        // Escuchar cuando empieza una nueva ronda (activar botones)
        // AQUÍ es donde debemos iniciar el temporizador, porque los botones se acaban de activar
        // Esto mide el tiempo REAL de decisión: desde que se activan hasta que el usuario hace clic
        // IMPORTANTE: Ambos botones se activan a la vez, pero solo queremos iniciar el temporizador UNA VEZ
        var self = this;
        var handleButtonsActivation = function() {
            // Usar un lock para evitar que se ejecute múltiples veces simultáneamente
            // Esto previene condiciones de carrera cuando ambos botones se activan a la vez
            if (self.buttonsActivationHandled) {
                // Ya se está manejando esta activación, ignorar
                return;
            }
            
            // Bloquear inmediatamente para evitar ejecuciones simultáneas
            self.buttonsActivationHandled = true;
            
            // CRÍTICO: Iniciar el temporizador cuando se activan los botones
            // Esto mide el tiempo desde que se activan hasta que el usuario hace clic
            // IMPORTANTE: Reiniciar siempre, incluso si ya estaba iniciado
            self.startDecisionTimer();
            console.log('⏱️ Temporizador iniciado al activar botones (nueva ronda)');
            console.log('   decisionStartTime:', self.decisionStartTime);
            console.log('   Timestamp:', new Date(self.decisionStartTime).toLocaleTimeString() + '.' + (self.decisionStartTime % 1000));
            console.log('   currentOpponent:', self.currentOpponent);
            
            // Liberar el lock después de 200ms para permitir la siguiente activación
            if (self.activationTimeout) clearTimeout(self.activationTimeout);
            self.activationTimeout = setTimeout(function() {
                self.buttonsActivationHandled = false;
                console.log('🔓 Lock liberado para siguiente activación de botones');
            }, 200);
        };
        
        subscribe("buttonCheat/activate", handleButtonsActivation);
        subscribe("buttonCooperate/activate", handleButtonsActivation);
        
        // Escuchar cuando se elige un oponente
        console.log('✅ Suscribiéndose a iterated/newOpponent...');
        subscribe("iterated/newOpponent", (opponentId) => {
            console.log('🎯🎯🎯 StatsManager: EVENTO RECIBIDO - Nuevo oponente detectado:', opponentId, '(tipo:', typeof opponentId + ')');
            
            // CRÍTICO: Manejar el caso donde opponentId puede ser un array
            // El sistema pubsub pasa los elementos del array como argumentos separados
            // Pero si se pasa [id], el primer argumento es el id directamente
            if (Array.isArray(opponentId)) {
                console.warn('⚠️ opponentId es un array, tomando el primer elemento:', opponentId[0]);
                opponentId = opponentId[0];
            }
            
            // Verificar que opponentId sea válido
            if (!opponentId || opponentId === null || opponentId === undefined) {
                console.error('❌ ERROR: opponentId es inválido:', opponentId);
                return;
            }
            
            // CRÍTICO: Configurar el oponente INMEDIATAMENTE de forma síncrona
            const opponentName = this.getOpponentName(opponentId);
            this.currentOpponent = opponentName; // Configurar ANTES de llamar a recordOpponent
            console.log('   ✅ currentOpponent configurado INMEDIATAMENTE a:', this.currentOpponent);
            console.log('   opponentId recibido:', opponentId);
            console.log('   opponentName calculado:', opponentName);
            
            // Asegurar que el oponente se guarde también en opponentsFaced para recuperación futura
            this.recordOpponent(opponentId);
            console.log('   ✅ currentOpponent después de recordOpponent:', this.currentOpponent);
            console.log('   opponentsFaced:', Object.keys(this.data.opponentsFaced || {}));
        });
        
        // Escuchar cuando se coopera
        // CRÍTICO: Este evento se publica cuando el usuario hace clic
        // El temporizador DEBE estar iniciado ANTES de este evento
        subscribe("iterated/cooperate", () => {
            // Calcular el tiempo INMEDIATAMENTE antes de que se procese cualquier otra cosa
            // Esto asegura que el tiempo se calcule correctamente
            this.recordDecisionTime('cooperate');
            this.recordChoice('cooperate');
        });
        
        // Escuchar cuando se traiciona
        // CRÍTICO: Este evento se publica cuando el usuario hace clic
        // El temporizador DEBE estar iniciado ANTES de este evento
        subscribe("iterated/cheat", () => {
            // Calcular el tiempo INMEDIATAMENTE antes de que se procese cualquier otra cosa
            // Esto asegura que el tiempo se calcule correctamente
            this.recordDecisionTime('cheat');
            this.recordChoice('cheat');
        });
    },
    
    // Variable para evitar duplicados
    lastRecordedRound: 0,
    
    // Variable para evitar registrar la misma decisión dos veces
    lastDecisionTimestamp: null,
    
    // Variables para manejar la activación de botones
    buttonsActivationHandled: false,
    activationTimeout: null,
    
    // Registrar una ronda jugada (usa los payoffs reales del juego: PD.PAYOFFS R, T, S, P)
    recordRound: function(payoffs) {
        const currentTime = Date.now();
        if (currentTime - this.lastRecordedRound < 100) {
            return;
        }
        this.lastRecordedRound = currentTime;

        var R = 3, T = 5, S = 0, P = 1;
        if (typeof PD !== 'undefined' && PD.PAYOFFS) {
            R = PD.PAYOFFS.R;
            T = PD.PAYOFFS.T;
            S = PD.PAYOFFS.S;
            P = PD.PAYOFFS.P;
        }

        this.data.totalRounds++;
        const myScore = payoffs[0];
        const theirScore = payoffs[1];

        // Recompensa: ambos cooperaron (R,R)
        if (myScore === R && theirScore === R) {
            this.data.rewardPoints += R;
        } else if (myScore === T && theirScore === S) {
            // Tentación: yo traicioné, él cooperó (T,S)
            this.data.temptationPoints += T;
        } else if (myScore === S && theirScore === T) {
            // Engañado: yo cooperé, él traicionó (S,T)
            this.data.suckerPoints += 1;
        } else if (myScore === P && theirScore === P) {
            // Castigo: ambos traicionaron (P,P)
            this.data.punishmentPoints += 1;
        }

        this.data.totalScore += myScore;
        this.data.averageScore = this.data.totalScore / this.data.totalRounds;
        this.data.lastUpdate = this.getLocalDateTime();

        this.updateDisplay();
        this.saveStats();
    },
    
    // Registrar oponente enfrentado
    recordOpponent: function(opponentId) {
        const opponentName = this.getOpponentName(opponentId);
        this.currentOpponent = opponentName; // Guardar oponente actual para el seguimiento de tiempo
        if (!this.data.opponentsFaced[opponentName]) {
            this.data.opponentsFaced[opponentName] = 0;
            this.data.totalGames++; // Solo contar cuando es un oponente nuevo
        }
        this.data.opponentsFaced[opponentName]++;
        
        // Inicializar estadísticas de tiempo para este oponente si no existen
        if (!this.data.timesByOpponent[opponentName]) {
            this.data.timesByOpponent[opponentName] = {
                times: [],
                total: 0,
                average: 0,
                count: 0
            };
        }
        
        this.updateDisplay();
        this.saveStats();
    },
    
    // Registrar elección del jugador
    // Variable para evitar conteo doble
    lastChoiceTimestamp: null,
    
    recordChoice: function(choice) {
        // Prevenir duplicados: si ya se registró una elección hace menos de 100ms, ignorar
        const now = Date.now();
        if (this.lastChoiceTimestamp && (now - this.lastChoiceTimestamp) < 100) {
            console.warn('⚠️ recordChoice duplicado detectado, ignorando:', choice);
            return;
        }
        this.lastChoiceTimestamp = now;
        
        if (choice === 'cooperate') {
            this.data.cooperationChoices++;
            console.log('📊 recordChoice: cooperate → total:', this.data.cooperationChoices);
        } else if (choice === 'cheat') {
            this.data.cheatChoices++;
            console.log('📊 recordChoice: cheat → total:', this.data.cheatChoices);
        }
        
        this.updateDisplay();
        this.saveStats();
    },
    
    // Iniciar el temporizador de decisión
    // Se llama cuando se activan los botones para medir el tiempo hasta que el usuario hace clic
    startDecisionTimer: function() {
        // SIEMPRE iniciar/reiniciar el temporizador cuando se activan los botones
        // Esto permite medir el tiempo desde que se activan hasta que el usuario hace clic
        const now = Date.now();
        this.decisionStartTime = now;
        console.log('✅ Temporizador iniciado correctamente');
        console.log('   Timestamp:', new Date(now).toLocaleTimeString() + '.' + (now % 1000));
        console.log('   currentOpponent:', this.currentOpponent);
    },
    
    // Registrar el tiempo de decisión
    recordDecisionTime: function(choice) {
        // Prevenir duplicados: si este evento se disparó hace menos de 50ms, ignorar
        // Aumentado a 50ms para evitar falsos positivos pero aún capturar decisiones rápidas
        const now = Date.now();
        if (this.lastDecisionTimestamp && (now - this.lastDecisionTimestamp) < 50) {
            console.warn('⚠️ Decisión duplicada detectada, ignorando:', choice);
            console.warn('   Última decisión hace:', now - this.lastDecisionTimestamp, 'ms');
            return;
        }
        this.lastDecisionTimestamp = now;
        
        // NUEVA IDEA: Calcular el tiempo usando MÚLTIPLES fuentes de referencia
        // Esto hace el sistema más robusto y confiable
        let decisionTime;
        
        // Prioridad 1: Usar el timestamp del clic capturado en Button.js (más preciso)
        if (this.lastClickTimestamp && this.decisionStartTime !== null) {
            decisionTime = this.lastClickTimestamp - this.decisionStartTime;
            console.log('⏱️ Usando timestamp del clic para cálculo:', decisionTime, 'ms');
        }
        // Prioridad 2: Usar el tiempo actual menos el inicio (si el clic no fue capturado)
        else if (this.decisionStartTime !== null) {
            decisionTime = now - this.decisionStartTime;
            console.log('⏱️ Usando tiempo actual menos inicio:', decisionTime, 'ms');
        }
        // Prioridad 3: Usar el tiempo desde el último round/end como fallback
        else if (this.lastRoundEndTime) {
            decisionTime = now - this.lastRoundEndTime;
            console.log('⏱️ Usando tiempo desde último round/end (fallback):', decisionTime, 'ms');
        }
        // Prioridad 4: Si nada está disponible, usar tiempo mínimo
        else {
            console.warn('⚠️ No hay referencias de tiempo disponibles. Usando 0ms.');
            decisionTime = 0;
        }
        
        // Validar y corregir el tiempo calculado
        if (decisionTime < 0) {
            console.warn('⚠️ Tiempo negativo detectado. Corrigiendo a 0ms.');
            decisionTime = 0;
        }
        
        // Log detallado del cálculo
        console.log('⏱️ Cálculo final de tiempo de decisión:');
        console.log('   decisionStartTime:', this.decisionStartTime);
        console.log('   lastClickTimestamp:', this.lastClickTimestamp);
        console.log('   lastRoundEndTime:', this.lastRoundEndTime);
        console.log('   now:', now);
        console.log('   decisionTime calculado:', decisionTime, 'ms');
        
        // Limpiar el timestamp del clic después de usarlo
        this.lastClickTimestamp = null;
        
        // Solo rechazar si el tiempo es negativo después de la corrección
        if (decisionTime < 0) {
            console.warn('⚠️ Tiempo de decisión negativo después de corrección. No se registrará.');
            return;
        }
        
        // Asegurar que el oponente esté configurado
        // NUEVA ESTRATEGIA: Usar múltiples fuentes y priorizar la más reciente
        let opponent = this.currentOpponent;
        
        // Si el oponente no está configurado, intentar recuperarlo de múltiples fuentes
        if (!opponent || opponent === 'Desconocido' || opponent === '' || opponent === null || opponent === undefined) {
            console.warn('⚠️ Oponente no configurado. Intentando recuperarlo...');
            console.warn('   currentOpponent actual:', this.currentOpponent);
            console.warn('   opponentsFaced:', Object.keys(this.data.opponentsFaced || {}));
            
            // Prioridad 1: Obtener el oponente más reciente de opponentsFaced
            const opponentsFaced = this.data.opponentsFaced || {};
            const opponentNames = Object.keys(opponentsFaced);
            if (opponentNames.length > 0) {
                // Usar el último oponente enfrentado (el más reciente)
                opponent = opponentNames[opponentNames.length - 1];
                this.currentOpponent = opponent; // Actualizar para futuras decisiones
                console.log('✅ Oponente recuperado de opponentsFaced:', opponent);
            } 
            // Prioridad 2: Buscar en los detalles de decisiones anteriores
            else if (this.data.decisionDetails && this.data.decisionDetails.length > 0) {
                // Buscar desde el último hacia atrás
                for (let i = this.data.decisionDetails.length - 1; i >= 0; i--) {
                    const detail = this.data.decisionDetails[i];
                    if (detail.opponent && detail.opponent !== 'Desconocido' && detail.opponent !== '') {
                        opponent = detail.opponent;
                        this.currentOpponent = opponent; // Actualizar para futuras decisiones
                        console.log('✅ Oponente recuperado del registro anterior:', opponent);
                        break;
                    }
                }
            }
            
            // Si aún no tenemos oponente, usar "Desconocido"
            if (!opponent || opponent === 'Desconocido' || opponent === '' || opponent === null) {
                opponent = 'Desconocido';
                console.warn('⚠️ No se pudo recuperar el oponente. Usando "Desconocido"');
            } else {
                // Asegurar que el oponente recuperado se guarde para futuras decisiones
                this.currentOpponent = opponent;
                console.log('✅ Oponente configurado para futuras decisiones:', opponent);
            }
        } else {
            console.log('✅ Oponente ya configurado:', opponent);
        }
        
        console.log(`✅ Tiempo de decisión registrado: ${decisionTime}ms para "${choice}" vs "${opponent}"`);
        console.log('   currentOpponent actual:', this.currentOpponent);
        
        // Guardar el tiempo básico
        this.data.decisionTimes.push(decisionTime);
        this.data.totalDecisionTime += decisionTime;
        
        // Guardar detalles de la decisión
        const decisionDetail = {
            time: decisionTime,
            opponent: opponent,
            choice: choice,
            timestamp: Date.now()
        };
        this.data.decisionDetails.push(decisionDetail);
        
        // Actualizar estadísticas generales
        this.data.averageDecisionTime = this.data.totalDecisionTime / this.data.decisionTimes.length;
        
        // Actualizar mínimo y máximo
        if (this.data.minDecisionTime === null || decisionTime < this.data.minDecisionTime) {
            this.data.minDecisionTime = decisionTime;
        }
        if (this.data.maxDecisionTime === null || decisionTime > this.data.maxDecisionTime) {
            this.data.maxDecisionTime = decisionTime;
        }
        
        // Actualizar estadísticas por oponente
        // Si el oponente no existe, crearlo
        if (!this.data.timesByOpponent[opponent]) {
            this.data.timesByOpponent[opponent] = {
                times: [],
                total: 0,
                average: 0,
                count: 0
            };
        }
        const oppStats = this.data.timesByOpponent[opponent];
        oppStats.times.push(decisionTime);
        oppStats.total += decisionTime;
        oppStats.count++;
        oppStats.average = oppStats.total / oppStats.count;
        
        // Actualizar estadísticas por tipo de decisión
        if (choice === 'cooperate' || choice === 'cheat') {
            const choiceStats = this.data.timesByChoice[choice];
            choiceStats.times.push(decisionTime);
            choiceStats.total += decisionTime;
            choiceStats.count++;
            choiceStats.average = choiceStats.total / choiceStats.count;
        }
        
        // IMPORTANTE: NO resetear el temporizador aquí
        // Se reseteará en iterated/round/end para evitar que se pierdan decisiones
        // Si lo reseteamos aquí, podríamos perder decisiones si hay múltiples eventos
        
        this.updateDisplay();
        this.saveStats();
    },
    
    // Resetear el estado de decisión (llamar cuando termine una ronda o se activen nuevos botones)
    resetDecisionTimer: function() {
        // Resetear el temporizador completamente para la próxima ronda
        // El temporizador NO se iniciará hasta que el jugador haga clic en su próxima decisión
        this.decisionStartTime = null;
    },
    
    
    // Formatear tiempo en milisegundos a formato legible
    formatTime: function(ms) {
        if (ms === null || ms === undefined || isNaN(ms)) {
            return 'N/D';
        }
        if (ms < 1000) {
            return ms.toFixed(0) + 'ms';
        } else if (ms < 60000) {
            return (ms / 1000).toFixed(2) + 's';
        } else {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(0);
            return minutes + 'm ' + seconds + 's';
        }
    },
    
    // Obtener estadísticas de un tipo de decisión
    getChoiceStats: function(choice) {
        const stats = this.data.timesByChoice[choice];
        if (!stats || stats.count === 0) {
            return 'N/D (juega nuevas rondas)';
        }
        return `${this.formatTime(stats.average)} (${stats.count} veces)`;
    },
    
    // Obtener HTML de estadísticas por oponente
    getOpponentStatsHTML: function() {
        let html = '';
        const opponents = this.data.timesByOpponent || {};
        const opponentNames = Object.keys(opponents).filter(name => {
            const stats = opponents[name];
            return stats && stats.count > 0;
        }).sort();
        
        if (opponentNames.length === 0) {
            return '<div style="font-size: 8px; color: #666;">N/D (juega nuevas rondas)</div>';
        }
        
        // Mostrar solo los 3 primeros oponentes para no saturar la UI
        const displayOpponents = opponentNames.slice(0, 3);
        
        for (let i = 0; i < displayOpponents.length; i++) {
            const oppName = displayOpponents[i];
            const oppStats = opponents[oppName];
            if (oppStats && oppStats.count > 0) {
                const nombreEsp = this.getOpponentNameSpanish(oppName);
                html += `<div style="font-size: 8px; margin-left: 8px;">• ${nombreEsp}: ${this.formatTime(oppStats.average)}</div>`;
            }
        }
        
        if (opponentNames.length > 3) {
            html += `<div style="font-size: 8px; color: #666; margin-left: 8px;">... y ${opponentNames.length - 3} más</div>`;
        }
        
        return html || '<div style="font-size: 8px; color: #666;">N/D (juega nuevas rondas)</div>';
    },
    
    // Obtener nombre del oponente (inglés, uso interno)
    getOpponentName: function(opponentId) {
        const names = {
            'tft': 'Copycat',
            'all_d': 'Always Cheat',
            'all_c': 'Always Cooperate',
            'grudge': 'Grudger',
            'prober': 'Detective',
            'tf2t': 'Copykitten',
            'pavlov': 'Simpleton',
            'random': 'Random'
        };
        return names[opponentId] || opponentId;
    },

    // Nombre del oponente en español (para exportación y pantalla)
    getOpponentNameSpanish: function(englishName) {
        const nombres = {
            'Copycat': 'Copión',
            'Always Cheat': 'Siempre Traiciona',
            'Always Cooperate': 'Siempre Coopera',
            'Grudger': 'Rencoroso',
            'Detective': 'Detective',
            'Copykitten': 'Gatito Copión',
            'Simpleton': 'Simple',
            'Random': 'Aleatorio',
            'Desconocido': 'Desconocido'
        };
        return nombres[englishName] || englishName;
    },
    
    // Guardar estadísticas en localStorage
    saveStats: function() {
        try {
            localStorage.setItem('trustGameStats', JSON.stringify(this.data));
        } catch (e) {
            console.log('No se pudieron guardar las estadísticas:', e);
        }
    },
    
    // Cargar estadísticas desde localStorage
    loadStats: function() {
        try {
            const saved = localStorage.getItem('trustGameStats');
            if (saved) {
                const savedData = JSON.parse(saved);
                // Mantener la sesión actual pero cargar otros datos
                const currentSessionStart = this.data.sessionStart;
                this.data = { ...savedData };
                this.data.sessionStart = currentSessionStart; // Mantener sesión actual
                this.data.lastUpdate = new Date().toISOString();
                
                // Asegurar que los campos de tiempo de decisión existan
                if (!this.data.decisionTimes) {
                    this.data.decisionTimes = [];
                }
                if (typeof this.data.totalDecisionTime !== 'number') {
                    this.data.totalDecisionTime = 0;
                }
                if (typeof this.data.averageDecisionTime !== 'number') {
                    this.data.averageDecisionTime = 0;
                }
                if (this.data.minDecisionTime === undefined || this.data.minDecisionTime === null) {
                    this.data.minDecisionTime = null;
                }
                if (this.data.maxDecisionTime === undefined || this.data.maxDecisionTime === null) {
                    this.data.maxDecisionTime = null;
                }
                // Inicializar campos nuevos
                if (!this.data.decisionDetails) {
                    this.data.decisionDetails = [];
                }
                if (!this.data.timesByOpponent) {
                    this.data.timesByOpponent = {};
                }
                if (!this.data.timesByChoice) {
                    this.data.timesByChoice = {
                        cooperate: {times: [], total: 0, average: 0, count: 0},
                        cheat: {times: [], total: 0, average: 0, count: 0}
                    };
                }
                
                // SINCRONIZAR contadores con el array real de detalles (fuente de verdad)
                if (this.data.decisionDetails && this.data.decisionDetails.length > 0) {
                    const realCoopCount = this.data.decisionDetails.filter(d => d.choice === 'cooperate').length;
                    const realCheatCount = this.data.decisionDetails.filter(d => d.choice === 'cheat').length;
                    
                    // Corregir si hay discrepancia
                    if (this.data.cooperationChoices !== realCoopCount || this.data.cheatChoices !== realCheatCount) {
                        console.log('🔧 Corrigiendo contadores desincronizados:');
                        console.log('   cooperationChoices:', this.data.cooperationChoices, '→', realCoopCount);
                        console.log('   cheatChoices:', this.data.cheatChoices, '→', realCheatCount);
                        this.data.cooperationChoices = realCoopCount;
                        this.data.cheatChoices = realCheatCount;
                    }
                }
                
                console.log('✅ Estadísticas cargadas desde localStorage');
                console.log('   Total de rondas:', this.data.totalRounds);
                console.log('   Total de decisiones:', this.data.decisionDetails ? this.data.decisionDetails.length : 0);
                console.log('   Cooperar:', this.data.cooperationChoices, '| Traicionar:', this.data.cheatChoices);
                console.log('   Oponentes enfrentados:', Object.keys(this.data.opponentsFaced || {}).length);
            } else {
                console.log('📊 No hay estadísticas guardadas, iniciando con datos vacíos');
            }
        } catch (e) {
            console.log('No se pudieron cargar las estadísticas:', e);
        }
    },
    
    // Descargar estadísticas como archivo JSON (estructura clara y legible)
    downloadStats: function() {
        const decisionTimes = this.data.decisionTimes || [];
        const msASeg = function(ms) { return Math.round((ms || 0) / 10) / 100; };
        const todosEnSegundos = decisionTimes.map(function(ms) { return msASeg(ms); });
        const roundTimesExport = this.getRoundTimesForExport();

        const dataToDownload = {
            titulo: 'The Evolution of Trust - Estadísticas de sesión',
            fechaDescarga: this.getLocalDateTime(),
            zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
            idioma: navigator.language,

            resumen: {
                tiempoTotalSesion: this.getSessionTime(),
                inicioSesion: this.data.sessionStart,
                ultimaActualizacion: this.data.lastUpdate,
                totalJuegos: this.data.totalGames,
                totalRondas: this.data.totalRounds,
                totalDecisiones: this.data.decisionDetails ? this.data.decisionDetails.length : (this.data.cooperationChoices + this.data.cheatChoices),
                puntosTotales: this.data.totalScore
            },

            tiemposPorRondaPorOponente: roundTimesExport,

            juegos: {
                total: this.data.totalGames,
                ganados: this.data.gamesWon,
                perdidos: this.data.gamesLost
            },
            rondas: {
                total: this.data.totalRounds
            },
            decisiones: {
                cooperar: this.data.decisionDetails ? this.data.decisionDetails.filter(d => d.choice === 'cooperate').length : this.data.cooperationChoices,
                traicionar: this.data.decisionDetails ? this.data.decisionDetails.filter(d => d.choice === 'cheat').length : this.data.cheatChoices,
                total: this.data.decisionDetails ? this.data.decisionDetails.length : (this.data.cooperationChoices + this.data.cheatChoices)
            },
            puntos: {
                total: this.data.totalScore,
                promedio: this.data.averageScore,
                recompensa: this.data.rewardPoints,
                tentacion: this.data.temptationPoints,
                engañado: this.data.suckerPoints,
                castigo: this.data.punishmentPoints
            },
            tiempoDeDecision: {
                descripcion: 'Tiempo que tardaste en cada decisión (en segundos)',
                promedioSegundos: decisionTimes.length ? msASeg(this.data.averageDecisionTime || 0) : 0,
                minimoSegundos: this.data.minDecisionTime != null ? msASeg(this.data.minDecisionTime) : null,
                maximoSegundos: this.data.maxDecisionTime != null ? msASeg(this.data.maxDecisionTime) : null,
                numeroDeDecisiones: decisionTimes.length,
                cadaTiempoEnSegundos: todosEnSegundos
            },
            tiempoDecisionMilisegundos: {
                promedioFormato: this.formatTime(this.data.averageDecisionTime || 0),
                promedioMilisegundos: this.data.averageDecisionTime || 0,
                minimoMilisegundos: this.data.minDecisionTime,
                maximoMilisegundos: this.data.maxDecisionTime,
                totalMilisegundos: this.data.totalDecisionTime || 0,
                todosLosTiemposMilisegundos: decisionTimes
            },
            porTipoDeDecision: {
                cooperar: {
                    promedioSegundos: this.data.timesByChoice && this.data.timesByChoice.cooperate ?
                        msASeg(this.data.timesByChoice.cooperate.average || 0) : 0,
                    veces: this.data.timesByChoice && this.data.timesByChoice.cooperate ?
                        this.data.timesByChoice.cooperate.count || 0 : 0
                },
                traicionar: {
                    promedioSegundos: this.data.timesByChoice && this.data.timesByChoice.cheat ?
                        msASeg(this.data.timesByChoice.cheat.average || 0) : 0,
                    veces: this.data.timesByChoice && this.data.timesByChoice.cheat ?
                        this.data.timesByChoice.cheat.count || 0 : 0
                }
            },
            porOponente: {},
            oponentesEnfrentados: {},
            historialDecisiones: (this.data.decisionDetails || []).map(detail => ({
                tiempoSegundos: msASeg(detail.time || 0),
                oponente: this.getOpponentNameSpanish(detail.opponent || ''),
                decision: detail.choice === 'cooperate' ? 'Cooperar' : 'Traicionar',
                fechaHora: new Date(detail.timestamp).toLocaleString('es-MX')
            }))
        };
        
        // Oponentes enfrentados (claves en español)
        if (this.data.opponentsFaced) {
            for (let opponent in this.data.opponentsFaced) {
                const nombreEsp = this.getOpponentNameSpanish(opponent);
                dataToDownload.oponentesEnfrentados[nombreEsp] = this.data.opponentsFaced[opponent];
            }
        }
        
        // Tiempos por oponente (nombres en español, promedio en segundos)
        if (this.data.timesByOpponent) {
            for (let opponent in this.data.timesByOpponent) {
                const oppData = this.data.timesByOpponent[opponent];
                const avgSec = (oppData.average || 0) / 1000;
                const nombreEsp = this.getOpponentNameSpanish(opponent);
                dataToDownload.porOponente[nombreEsp] = {
                    promedioSegundos: Math.round(avgSec * 100) / 100,
                    veces: oppData.count || 0,
                    totalMilisegundos: oppData.total || 0
                };
            }
        }
        
        const jsonString = JSON.stringify(dataToDownload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fecha = new Date().toISOString().split('T')[0];
        a.download = `estadisticas-trust-${fecha}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Limpiar todas las estadísticas
    clearStats: function() {
        if (confirm('¿Estás seguro de que quieres limpiar todas las estadísticas?')) {
            this.data = {
                sessionStart: this.getLocalDateTime(),
                totalGames: 0,
                totalRounds: 0,
                gamesWon: 0,
                gamesLost: 0,
                cooperationChoices: 0,
                cheatChoices: 0,
                opponentsFaced: {},
                totalScore: 0,
                averageScore: 0,
                lastUpdate: this.getLocalDateTime(),
                rewardPoints: 0,
                temptationPoints: 0,
                suckerPoints: 0,
                punishmentPoints: 0,
                decisionTimes: [],
                totalDecisionTime: 0,
                averageDecisionTime: 0,
                minDecisionTime: null,
                maxDecisionTime: null,
                decisionDetails: [],
                timesByOpponent: {},
                timesByChoice: {
                    cooperate: {times: [], total: 0, average: 0, count: 0},
                    cheat: {times: [], total: 0, average: 0, count: 0}
                }
            };
            
            this.decisionStartTime = null;
            this.currentOpponent = null;
            localStorage.removeItem('trustGameStats');
            this.updateDisplay();
        }
    }
};

// Inicializar automáticamente las estadísticas
StatsManager.autoInit();

// También intentar inicializar inmediatamente si el DOM ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => StatsManager.init(), 100);
    });
} else {
    setTimeout(() => StatsManager.init(), 100);
}
