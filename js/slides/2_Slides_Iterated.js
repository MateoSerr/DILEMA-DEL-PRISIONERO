// ============================================
// SISTEMA DE GUARDADO/CARGA - VERSIÓN ROBUSTA
// ============================================

// LOG INICIAL - Verificar estado al cargar el archivo
(function() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 2_Slides_Iterated.js CARGADO - ' + new Date().toLocaleTimeString());
    var raw = localStorage.getItem('trustGameSave');
    console.log('📜 localStorage.trustGameSave:', raw);
    if (raw) {
        try {
            var d = JSON.parse(raw);
            console.log('📜 → roundIndex=' + d.roundIndex + ', roundNum=' + d.roundNum + ', score=' + d.totalScore + ', saved=' + d.saved);
        } catch(e) {
            console.error('📜 → Error parsing:', e);
        }
    } else {
        console.log('📜 → NO HAY DATOS GUARDADOS');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();

// Modo sesión DPI completa: 240 ensayos, 4 bloques de 60, balanceador, REST entre bloques.
// Por defecto activo: registra 40 (DECISION_ON), rt_ms, piloto, bloques, etc. Poner en false solo para pruebas rápidas sin CSV DPI.
var DPI_FULL_SESSION = true;
// Menos estímulos: sin sonidos, colores neutros, solo animaciones básicas (como en el video).
var DPI_LOW_STIMULUS = true;
// false = tras feedback+ITI se abre solo la decisión (40 + 2 s). true = hace falta pulsar "Siguiente" antes de cada ronda.
var DPI_USE_NEXT_BUTTON = false;

// 240 rondas de 6 s: 2 s decisión + 3 s retroalimentación + 1 s transición
var ROUNDS = [
    {id:"tft", num:240, name:"Copycat"}
];
var ROUND_DECISION_MS = 2000;   // 2 s para tomar decisión
var ROUND_FEEDBACK_MS = 3000;   // 3 s mostrando resultado
var ROUND_TRANSITION_MS = 1000; // 1 s cambio a siguiente ronda
var DPI_TRIALS_PER_BLOCK = 60;
var DPI_BLOCKS = 4;
var DPI_TOTAL_TRIALS = DPI_TRIALS_PER_BLOCK * DPI_BLOCKS;
/** Ensayos piloto (códigos 12/13) antes de SESSION_ON/BLOCK_ON. 0 = omitir piloto. */
var DPI_PILOT_COUNT = 3;

// Variables globales (para compatibilidad)
var ROUND_INDEX = 0;
var ROUND_NUM = 0;

// Exponer ROUNDS globalmente
window.ROUNDS = ROUNDS;

/**
 * RF1: video intro opcional (assets/dpi/intro_instrucciones.mp4). Si no existe, omite 08/09.
 */
function tryDpiIntroVideo(done) {
    if (typeof done !== "function") done = function() {};
    var url = "assets/dpi/intro_instrucciones.mp4";
    var wrap = document.createElement("div");
    wrap.id = "dpi-intro-video-wrap";
    wrap.setAttribute("aria-modal", "true");
    wrap.style.cssText = "position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;";
    var vid = document.createElement("video");
    vid.setAttribute("playsinline", "");
    vid.setAttribute("controls", "");
    vid.style.maxWidth = "92%";
    vid.style.maxHeight = "82vh";
    vid.src = url;
    var started = false;
    var skip = document.createElement("button");
    skip.type = "button";
    skip.textContent = "Omitir video";
    skip.style.cssText = "position:absolute;top:14px;right:14px;z-index:2001;padding:8px 14px;cursor:pointer;font-size:13px;";
    function cleanup() {
        try {
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        } catch (e) {}
    }
    function finish() {
        cleanup();
        done();
    }
    skip.onclick = function() {
        if (started && window.DPISpec) DPISpec.logEvent(9);
        finish();
    };
    vid.onerror = function() { finish(); };
    vid.onloadeddata = function() {
        started = true;
        if (window.DPISpec) DPISpec.logEvent(8);
        var p = vid.play();
        if (p && p.catch) p.catch(function() { finish(); });
    };
    vid.onended = function() {
        if (window.DPISpec) DPISpec.logEvent(9);
        finish();
    };
    wrap.appendChild(skip);
    wrap.appendChild(vid);
    document.body.appendChild(wrap);
}

// ============================================
// FUNCIÓN HELPER PARA LEER LOCALSTORAGE
// Retorna null si no hay datos válidos
// ============================================
function readGameSave() {
    var caller = '';
    try {
        caller = (new Error()).stack.split('\n')[2] || '';
    } catch(e) {}
    
    console.log('📖 readGameSave() llamada desde:', caller.trim().substring(0, 80));
    
    try {
        var raw = localStorage.getItem('trustGameSave');
        console.log('📖 raw data:', raw ? raw.substring(0, 100) + '...' : 'NULL');
        
        if (!raw) {
            console.log('📖 → Retornando NULL (no hay datos)');
            return null;
        }
        
        var data = JSON.parse(raw);
        
        // Verificar que tiene la estructura correcta
        if (!data || data.saved !== true) {
            console.log('📖 → Retornando NULL (saved !== true)');
            return null;
        }
        
        var result = {
            roundIndex: (typeof data.roundIndex === 'number') ? data.roundIndex : 0,
            roundNum: (typeof data.roundNum === 'number') ? data.roundNum : 0,
            totalScore: (typeof data.totalScore === 'number') ? data.totalScore : 0,
            scoreboardA: data.scoreboardA || 0,
            scoreboardB: data.scoreboardB || 0,
            currentOpponent: data.currentOpponent || ROUNDS[data.roundIndex || 0].id,
            dpiT0: (typeof data.dpiT0 === 'number') ? data.dpiT0 : null,
            dpiBlockIndex: (typeof data.dpiBlockIndex === 'number') ? data.dpiBlockIndex : 0,
            dpiTrialInBlock: (typeof data.dpiTrialInBlock === 'number') ? data.dpiTrialInBlock : 0,
            dpiGlobalTrial: (typeof data.dpiGlobalTrial === 'number') ? data.dpiGlobalTrial : 0,
            dpiInPilot: data.dpiInPilot === true,
            pilotTrialsCompleted: (typeof data.pilotTrialsCompleted === 'number') ? data.pilotTrialsCompleted : 0,
            roundTimes: Array.isArray(data.roundTimes) ? data.roundTimes : [],
            roundTimesByOpponent: Array.isArray(data.roundTimesByOpponent) ? data.roundTimesByOpponent : []
        };
        
        console.log('📖 → Retornando:', JSON.stringify(result));
        return result;
    } catch(e) {
        console.error('📖 ❌ Error:', e);
        return null;
    }
}

// ============================================
// SLIDE 1: INTRO DEL JUEGO ITERADO
// id: "iterated"
// ============================================
SLIDES.push({

    id: "iterated",
    
    onjump: function(self){
        console.log('');
        console.log('══════════════════════════════════════════════════');
        console.log('🎯 SLIDE 1 "iterated" - ONJUMP');
        console.log('══════════════════════════════════════════════════');
        
        // Leer estado guardado para logging
        var save = readGameSave();
        console.log('🎯 Save en onjump:', save ? JSON.stringify(save) : 'null');
        
        // Resetear variables del torneo
        Tournament.resetGlobalVariables();
        
        // Crear objeto Iterated (este lee localStorage internamente)
        self.add({id:"iterated", type:"Iterated", x:130, y:133});
        self.objects.iterated.dehighlightPayoff();
        
        // Labels
        self.add({
            id:"labelYou", type:"TextBox",
            x:211, y:201, width:50, height:50,
            align:"center", color:"#aaa", size:17,
            text_id:"label_you"
        });
        self.add({
            id:"labelThem", type:"TextBox",
            x:702, y:189, width:50, height:50,
            align:"center", color:"#aaa", size:17,
            text_id:"label_them"
        });
        
        console.log('🎯 ONJUMP completado - self.objects:', Object.keys(self.objects));
    },

    onstart: function(self){
        console.log('');
        console.log('══════════════════════════════════════════════════');
        console.log('🎯 SLIDE 1 "iterated" - ONSTART');
        console.log('══════════════════════════════════════════════════');
        
        var o = self.objects;
        
        // Leer estado guardado DIRECTAMENTE de localStorage
        var save = readGameSave();
        console.log('🎯 Save en onstart:', save ? JSON.stringify(save) : 'null');
        
        // Determinar si debemos saltar a SLIDE 2
        var hasProgress = save && (save.roundIndex > 0 || save.roundNum > 0 || save.totalScore > 0);
        console.log('🎯 hasProgress:', hasProgress);
        
        if (hasProgress) {
            console.log('🎯 ⏭️ HAY PROGRESO GUARDADO - Saltando a SLIDE 2 en 100ms...');
            setTimeout(function() {
                console.log('🎯 ⏭️ Ejecutando publish("slideshow/next") AHORA');
                publish("slideshow/next");
            }, 100);
            return; // IMPORTANTE: No crear los elementos de intro
        }

        console.log('🎯 No hay progreso - Mostrando intro para nueva partida');
        
        // Nueva partida - mostrar intro y asegurar que se vean los monos y la máquina
        o.iterated.introMachine();
        if (o.iterated.dom) {
            o.iterated.dom.style.opacity = 1;
            o.iterated.dom.style.visibility = "visible";
            o.iterated.dom.style.display = "";
            if (o.iterated.syncIdlePeepLayers) o.iterated.syncIdlePeepLayers();
        }

        self.add({
            id:"topWords", type:"TextBox", text_id:"iterated_intro_top",
            x:130, y:10, width:700, height:100, align:"center"
        });
        self.add({
            id:"btmWords", type:"TextBox", text_id:"iterated_intro_btm",
            x:130, y:410, width:700, height:100, align:"center"
        });

        self.add({
            id:"buttonCooperate", type:"Button", x:275, y:450, uppercase:true,
            text_id:"label_cooperate",
            onclick:function(){
                _.answer = "COOPERATE";
                publish("slideshow/next");
            }
        });
        self.add({
            id:"buttonCheat", type:"Button", x:495, y:453, uppercase:true,
            text_id:"label_cheat",
            onclick:function(){
                _.answer = "CHEAT";
                publish("slideshow/next");
            }
        });

        _hide(o.topWords); _fadeIn(o.topWords, 150+10);
        _hide(o.btmWords); _fadeIn(o.btmWords, 150+600);
        _hide(o.buttonCooperate); _fadeIn(o.buttonCooperate, 150+1200);
        _hide(o.buttonCheat); _fadeIn(o.buttonCheat, 150+1200);
        
        console.log('🎯 ONSTART completado (intro mostrada)');
    },
    
    onend: function(self){
        console.log('🎯 SLIDE 1 - ONEND');
        console.log('🎯 localStorage en onend:', localStorage.getItem('trustGameSave'));
        // Solo remover elementos de intro (NO los labels que se comparten con SLIDE 2)
        try { self.remove("topWords"); } catch(e) {}
        try { self.remove("btmWords"); } catch(e) {}
        // NO remover labelYou/labelThem - pueden ser útiles para SLIDE 2
    }
});

// ============================================
// SLIDE 2: JUEGO PRINCIPAL (sin ID explícito)
// ============================================
SLIDES.push({

    onstart: function(self){
        console.log('');
        console.log('══════════════════════════════════════════════════');
        console.log('🚀 SLIDE 2 (JUEGO) - ONSTART');
        console.log('══════════════════════════════════════════════════');
        
        var o = self.objects;
        console.log('🚀 self.objects disponibles:', Object.keys(o));
        console.log('🚀 o.iterated existe:', !!o.iterated);

        // Activar flag de juego activo
        if (typeof GameSaveManager !== 'undefined') {
            GameSaveManager.isGameActive = true;
        }

        // ============================================
        // LEER ESTADO GUARDADO DE LOCALSTORAGE
        // ============================================
        var save = readGameSave();
        console.log('🚀 Save leído:', save ? JSON.stringify(save) : 'null');
        
        // Estado del juego como CLOSURE VARIABLE
        // Esto protege el estado de cualquier reset externo
        var gameState = {
            roundIndex: (save && typeof save.roundIndex === 'number') ? save.roundIndex : 0,
            roundNum: (save && typeof save.roundNum === 'number') ? save.roundNum : 0,
            score: (save && typeof save.totalScore === 'number' && !isNaN(save.totalScore)) ? save.totalScore : 0,
            scoreboardA: (save && (typeof save.scoreboardA === 'number' && !isNaN(save.scoreboardA))) ? save.scoreboardA : 0,
            scoreboardB: (save && (typeof save.scoreboardB === 'number' && !isNaN(save.scoreboardB))) ? save.scoreboardB : 0,
            dpiBlockIndex: (save && typeof save.dpiBlockIndex === 'number') ? save.dpiBlockIndex : 0,
            dpiTrialInBlock: (save && typeof save.dpiTrialInBlock === 'number') ? save.dpiTrialInBlock : 0,
            dpiGlobalTrial: (save && typeof save.dpiGlobalTrial === 'number') ? save.dpiGlobalTrial : 0,
            dpiInPilot: save && save.dpiInPilot === true,
            pilotTrialsCompleted: (save && typeof save.pilotTrialsCompleted === 'number') ? save.pilotTrialsCompleted : 0,
            roundTimes: (save && Array.isArray(save.roundTimes)) ? save.roundTimes : [],
            roundTimesByOpponent: (save && Array.isArray(save.roundTimesByOpponent)) ? save.roundTimesByOpponent : []
        };
        
        var isRestoring = save && (save.roundIndex > 0 || save.roundNum > 0 || save.totalScore > 0);
        /** Solo en sesión DPI nueva: un único «Iniciar» antes de la primera decisión; luego solo espera ITI. */
        var _dpiNeedInitialIniciar = DPI_FULL_SESSION && !isRestoring;
        if (isRestoring && window.DPISpec) {
            if (DPISpec.loadEventLogFromStorage) DPISpec.loadEventLogFromStorage();
            if (save.dpiT0 != null && DPISpec.setT0) DPISpec.setT0(save.dpiT0);
            if (DPI_FULL_SESSION && DPISpec.startHeartbeat && !gameState.dpiInPilot) DPISpec.startHeartbeat();
        }
        
        console.log('🚀 gameState inicial:', JSON.stringify(gameState));
        console.log('🚀 isRestoring:', isRestoring);
        
        // Sincronizar variables globales para compatibilidad
        ROUND_INDEX = gameState.roundIndex;
        ROUND_NUM = gameState.roundNum;
        _.yourTotalScore = gameState.score;
        
        // ============================================
        // ESTABLECER OPONENTE VISUAL
        // ============================================
        var opponentId = ROUNDS[gameState.roundIndex] ? ROUNDS[gameState.roundIndex].id : 'tft';
        console.log('🚀 Estableciendo oponente visual:', opponentId, '(roundIndex=' + gameState.roundIndex + ')');
        
        if (o.iterated && o.iterated.chooseOpponent) {
            o.iterated.chooseOpponent(opponentId);
            console.log('🚀 ✅ o.iterated.chooseOpponent() llamado');
        } else {
            console.error('🚀 ❌ ERROR: o.iterated.chooseOpponent no existe!');
        }
        publish("iterated/newOpponent", [opponentId]);

        // ============================================
        // CREAR/CONFIGURAR BOTONES
        // ============================================
        // Si estamos restaurando, los botones NO existen - debemos crearlos
        if (isRestoring) {
            console.log('🚀 Creando botones para partida restaurada...');
            self.add({
                id:"buttonCooperate", type:"Button", x:275, y:450, uppercase:true,
                text_id:"label_cooperate",
                message: "iterated/cooperate"
            });
            self.add({
                id:"buttonCheat", type:"Button", x:495, y:453, uppercase:true,
                text_id:"label_cheat",
                message: "iterated/cheat"
            });
            // Actualizar referencia
            o = self.objects;
            console.log('🚀 Botones creados:', !!o.buttonCheat, !!o.buttonCooperate);
        }
        
        setTimeout(function(){
            if (o.buttonCheat) {
                o.buttonCheat.config.onclick = null;
                o.buttonCheat.config.message = DPI_FULL_SESSION ? "iterated/dpi/cheat" : "iterated/cheat";
            }
            if (o.buttonCooperate) {
                o.buttonCooperate.config.onclick = null;
                o.buttonCooperate.config.message = DPI_FULL_SESSION ? "iterated/dpi/cooperate" : "iterated/cooperate";
            }
            publish("buttonCheat/deactivate");
            publish("buttonCooperate/deactivate");
        }, 1);

        if (DPI_FULL_SESSION && window.DPIBalanceador) DPIBalanceador.resetBlock();
        if (DPI_FULL_SESSION && window.DPISpec) DPISpec.setBlockNum(gameState.dpiBlockIndex);

        var _decisionTimeout = null;
        var DECISION_MS = (window.DPISpec && window.DPISpec.SESSION_CONFIG) ? window.DPISpec.SESSION_CONFIG.decisionPhaseMs : 5000;

        if (DPI_FULL_SESSION && DPI_USE_NEXT_BUTTON) {
            self.add({
                id: "buttonSiguiente", type: "Button", x: 378, y: 420, size: "long",
                text_id: "label_cooperate",
                message: "iterated/dpi/next"
            });
            o = self.objects;
            if (o.buttonSiguiente && o.buttonSiguiente.setText2) o.buttonSiguiente.setText2("Siguiente \u2192");
            _hide(o.buttonSiguiente);
        }
        if (DPI_LOW_STIMULUS) { window.DPI_LOW_STIMULUS = true; if (typeof Howler !== "undefined") Howler.mute(true); }
        else window.DPI_LOW_STIMULUS = false;

        /** DECISION_ON (40) + reloj para RT: debe llamarse al abrir la ventana de decisión (2 s). */
        function dpiBeginDecisionWindow() {
            if (!window.DPISpec || !DPI_FULL_SESSION) return;
            DPISpec.setDecisionOnsetTime(DPISpec.highResNow());
            DPISpec.logEvent(40);
        }

        listen(self, "iterated/dpi/next", function() {
            if (_buttonsActive || !o.buttonSiguiente) return;
            _hide(o.buttonSiguiente);
            if (_decisionTimeout) clearTimeout(_decisionTimeout);
            _buttonsActive = true;
            dpiBeginDecisionWindow();
            publish("buttonCheat/activate");
            publish("buttonCooperate/activate");
            _decisionTimeout = setTimeout(function() {
                _decisionTimeout = null;
                _buttonsActive = false;
                publish("buttonCheat/deactivate");
                publish("buttonCooperate/deactivate");
                if (window.DPISpec) DPISpec.logEvent(41, { choice: "NULL", rt_ms: DECISION_MS });
                var agentStr = (window.DPIBalanceador && DPIBalanceador.getAgentMove) ? DPIBalanceador.getAgentMove("C") : "C";
                _lastHumanChoice = "NULL";
                _lastAgentChoice = agentStr;
                var agentPD = agentStr === "C" ? PD.COOPERATE : PD.CHEAT;
                var latencyMs = (window.DPISpec && DPISpec.getAgentLatencyMs) ? DPISpec.getAgentLatencyMs() : 500;
                publish("iterated/round/start");
                setTimeout(function() {
                    if (o.iterated && o.iterated.playOneRoundWithAgentMove) {
                        o.iterated.playOneRoundWithAgentMove(PD.COOPERATE, agentPD, { agent_latency_ms: Math.round(latencyMs), strategy: "balanceador" });
                    }
                }, latencyMs);
            }, DECISION_MS);
        });

        function dpiHandleChoice(choicePD, choiceStr) {
            if (_decisionTimeout) { clearTimeout(_decisionTimeout); _decisionTimeout = null; }
            _lastHumanChoice = choiceStr;
            if (window.DPISpec) {
                var onset = DPISpec.getDecisionOnsetTime();
                if (onset == null || isNaN(onset)) {
                    dpiBeginDecisionWindow();
                    onset = DPISpec.getDecisionOnsetTime();
                }
                var tHi = (window.DPISpec && DPISpec.highResNow) ? DPISpec.highResNow() : Date.now();
                DPISpec.logEvent(41, { choice: choiceStr, rt_ms: Math.round(tHi - onset) });
            }
            publish("iterated/round/start");
            var agentStr = (window.DPIBalanceador && DPIBalanceador.getAgentMove) ? DPIBalanceador.getAgentMove(choiceStr) : "C";
            _lastAgentChoice = agentStr;
            var agentPD = agentStr === "C" ? PD.COOPERATE : PD.CHEAT;
            var latencyMs = (window.DPISpec && DPISpec.getAgentLatencyMs) ? DPISpec.getAgentLatencyMs() : 500;
            setTimeout(function(){
                if (o.iterated && o.iterated.playOneRoundWithAgentMove) {
                    o.iterated.playOneRoundWithAgentMove(choicePD, agentPD, { agent_latency_ms: Math.round(latencyMs), strategy: "balanceador" });
                }
            }, latencyMs);
        }
        if (DPI_FULL_SESSION) {
            listen(self, "iterated/dpi/cooperate", function(){ dpiHandleChoice(PD.COOPERATE, "C"); });
            listen(self, "iterated/dpi/cheat", function(){ dpiHandleChoice(PD.CHEAT, "T"); });
        }

        if (o.iterated && o.iterated.dom) {
            o.iterated.dom.style.top = 183;
            o.iterated.dom.style.opacity = 1;
            o.iterated.dom.style.visibility = "visible";
            o.iterated.dom.style.display = "";
            if (o.iterated.syncIdlePeepLayers) o.iterated.syncIdlePeepLayers();
        }

        // ============================================
        // CREAR SCOREBOARD E INFO
        // ============================================
        self.add({id:"scoreboard", type:"IteratedScoreboard", x:378, y:85});
        self.add({
            id:"info", type:"TextBox",
            x:378, y:5, width:220, height:140, align:"center", size:15, color:"#333"
        });
        self.add({
            id:"credits_game", type:"TextBox",
            x:130, y:525, width:830,
            align:"right", color:"#888", size:10,
            text: "basado en The Evolution of Trust (Nicky Case, 2017) • adaptación: Mateo y Eden"
        });
        o = self.objects;

        var _hidden = true;
        _hide(o.scoreboard);
        _hide(o.info);
        if (o.credits_game) _hide(o.credits_game);

        var _buttonsActive = false;
        var _decisionOnsetTime = null;
        var _opponentStartTime = null;
        var _roundTimeoutId = null;
        var ROUND_TIMEOUT_MS = typeof ROUND_DECISION_MS !== 'undefined' ? ROUND_DECISION_MS : 2000; // 2 s para decidir
        var FEEDBACK_PLUS_ITI_MS = (window.DPISpec && window.DPISpec.SESSION_CONFIG) ? (window.DPISpec.SESSION_CONFIG.feedbackPhaseMs + window.DPISpec.SESSION_CONFIG.itiMs) : 4000;

        self.add({
            id: "buttonIniciar", type: "Button", x: 378, y: 420, size: "long",
            text_id: "label_cooperate",
            message: "iterated/iniciar"
        });
        o = self.objects;
        if (o.buttonIniciar && o.buttonIniciar.setText2) o.buttonIniciar.setText2("Iniciar \u2192");
        _hide(o.buttonIniciar);
        listen(self, "iterated/iniciar", function() {
            if (o.buttonIniciar && o.buttonIniciar.dom) _hide(o.buttonIniciar);
            if (_roundTimeoutId) { clearTimeout(_roundTimeoutId); _roundTimeoutId = null; }
            showInfo();
            saveGame();
            if (DPI_FULL_SESSION) {
                if (_dpiNeedInitialIniciar) _dpiNeedInitialIniciar = false;
                _opponentStartTime = Date.now();
                _buttonsActive = true;
                dpiBeginDecisionWindow();
                publish("buttonCheat/activate");
                publish("buttonCooperate/activate");
                return;
            }
            _opponentStartTime = Date.now();
            _decisionOnsetTime = Date.now();
            _buttonsActive = true;
            publish("buttonCheat/activate");
            publish("buttonCooperate/activate");
            _roundTimeoutId = setTimeout(function() {
                _roundTimeoutId = null;
                if (!_buttonsActive) return;
                _buttonsActive = false;
                publish("buttonCheat/deactivate");
                publish("buttonCooperate/deactivate");
                if (!gameState.roundTimes) gameState.roundTimes = [];
                gameState.roundTimes.push(2);
                saveGame();
                publish("iterated/round/end", [0, 0]);
                setTimeout(function() { showInfo(); saveGame(); }, 0);
            }, ROUND_TIMEOUT_MS);
        });
        function recordRoundTime() {
            if (_roundTimeoutId) { clearTimeout(_roundTimeoutId); _roundTimeoutId = null; }
            if (_decisionOnsetTime != null) {
                var rtSec = (Date.now() - _decisionOnsetTime) / 1000;
                if (!gameState.roundTimes) gameState.roundTimes = [];
                gameState.roundTimes.push(Math.round(rtSec * 1000) / 1000);
                showInfo();
                saveGame();
            }
        }
        if (!DPI_FULL_SESSION) {
            listen(self, "iterated/cooperate", recordRoundTime);
            listen(self, "iterated/cheat", recordRoundTime);
        }
        var _keyHandler = function(e) {
            if (!_buttonsActive) return;
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                e.stopPropagation();
                publish(DPI_FULL_SESSION ? "iterated/dpi/cooperate" : "iterated/cooperate");
                return false;
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                publish(DPI_FULL_SESSION ? "iterated/dpi/cheat" : "iterated/cheat");
                return false;
            }
        };
        window.addEventListener("keydown", _keyHandler, true);
        self._dpiKeyHandler = _keyHandler;
        self._dpiKeyHandlerCapture = true;

        // ============================================
        // FUNCIÓN showInfo - USA CLOSURE gameState
        // ============================================
        var _lastHumanChoice = null;
        var _lastAgentChoice = null;
        var showInfo = function(){
            var score = (typeof gameState.score === 'number' && !isNaN(gameState.score)) ? gameState.score : 0;
            var text;
            if (DPI_FULL_SESSION) {
                if (gameState.dpiInPilot) {
                    var ptc = typeof gameState.pilotTrialsCompleted === "number" ? gameState.pilotTrialsCompleted : 0;
                    text = "<b>PILOTO</b> (no cuenta en los 240)";
                    text += "<br>ensayo piloto: " + (ptc + 1) + " / " + DPI_PILOT_COUNT;
                    text += "<br>score: " + score;
                } else {
                var block = gameState.dpiBlockIndex + 1;
                var trial = gameState.dpiTrialInBlock + 1;
                var global = gameState.dpiGlobalTrial + 1;
                text = "block: " + block + " of " + DPI_BLOCKS;
                text += "<br>trial: " + trial + " / " + DPI_TRIALS_PER_BLOCK;
                text += "<br>total: " + global + " / " + DPI_TOTAL_TRIALS;
                text += "<br>score: " + score;
                }
            } else {
                var opp = gameState.roundIndex + 1;
                var total = ROUNDS.length;
                var round = gameState.roundNum + 1;
                var maxRound = ROUNDS[gameState.roundIndex] ? ROUNDS[gameState.roundIndex].num : '?';
                text = "oponente: " + opp + " de " + total;
                text += "<br>tu puntuación: " + score;
                text += "<br>ronda: " + round + " / " + maxRound;
                text += "<br><span style='color:#333;font-size:12px;font-weight:bold'>Controles: ← Cooperar &nbsp; → Traicionar</span>";
            }
            if (self.objects.info && self.objects.info.dom) {
                self.objects.info.dom.innerHTML = text;
            }
        };

        // ============================================
        // FUNCIÓN saveGame - GUARDA CLOSURE gameState
        // ============================================
        var saveGame = function() {
            console.log('💾 saveGame() - gameState:', JSON.stringify(gameState));
            try {
                var data = {
                    saved: true,
                    roundIndex: gameState.roundIndex,
                    roundNum: gameState.roundNum,
                    totalScore: gameState.score,
                    currentOpponent: ROUNDS[gameState.roundIndex] ? ROUNDS[gameState.roundIndex].id : 'tft',
                    scoreboardA: self.objects.scoreboard ? self.objects.scoreboard.score[0] : 0,
                    scoreboardB: self.objects.scoreboard ? self.objects.scoreboard.score[1] : 0,
                    savedAt: new Date().toISOString(),
                    dpiT0: (window.DPISpec && DPISpec.getT0) ? DPISpec.getT0() : null,
                    dpiBlockIndex: gameState.dpiBlockIndex,
                    dpiTrialInBlock: gameState.dpiTrialInBlock,
                    dpiGlobalTrial: gameState.dpiGlobalTrial,
                    dpiInPilot: gameState.dpiInPilot === true,
                    pilotTrialsCompleted: typeof gameState.pilotTrialsCompleted === "number" ? gameState.pilotTrialsCompleted : 0,
                    roundTimes: gameState.roundTimes || [],
                    roundTimesByOpponent: gameState.roundTimesByOpponent || []
                };
                localStorage.setItem('trustGameSave', JSON.stringify(data));
                if (window.DPISpec && DPISpec.saveEventLogToStorage) DPISpec.saveEventLogToStorage();
                console.log('💾 ✅ Guardado exitoso:', JSON.stringify(data));
                
                ROUND_INDEX = gameState.roundIndex;
                ROUND_NUM = gameState.roundNum;
                _.yourTotalScore = gameState.score;
            } catch(e) {
                console.error('💾 ❌ Error guardando:', e);
            }
        };

        // ============================================
        // RESTAURAR UI SI HAY PARTIDA GUARDADA
        // ============================================
        if (isRestoring) {
            console.log('🔄 Restaurando UI para partida guardada...');
            setTimeout(function() {
                // Restaurar scoreboard
                if (self.objects.scoreboard) {
                    self.objects.scoreboard.score = [gameState.scoreboardA, gameState.scoreboardB];
                    self.objects.scoreboard.showScore();
                    console.log('🔄 Scoreboard restaurado:', gameState.scoreboardA, '-', gameState.scoreboardB);
                }
                
                // Mostrar info
                showInfo();
                
                // Mostrar UI
                _hidden = false;
                _fadeIn(o.scoreboard, 10);
                _fadeIn(o.info, 10);
                if (o.credits_game) _fadeIn(o.credits_game, 10);
                
                // Mostrar Siguiente/Iniciar o activar botones
                setTimeout(function() {
                    if (DPI_FULL_SESSION && DPI_USE_NEXT_BUTTON && o.buttonSiguiente) _fadeIn(o.buttonSiguiente, 10);
                    else {
                        _decisionOnsetTime = Date.now();
                        _buttonsActive = true;
                        dpiBeginDecisionWindow();
                        publish("buttonCheat/activate");
                        publish("buttonCooperate/activate");
                    }
                    console.log('🔄 ✅ UI restaurada completamente');
                    console.log('🔄 gameState final:', JSON.stringify(gameState));
                }, 500);
            }, 500);
        } else {
            // Nueva partida - solo mostrar info
            showInfo();
        }

        // ============================================
        // EVENTO: INICIO DE RONDA
        // ============================================
        listen(self, "iterated/round/start", function(){
            console.log('🎮 round/start - desactivando botones');
            if (_roundTimeoutId) { clearTimeout(_roundTimeoutId); _roundTimeoutId = null; }
            _buttonsActive = false;
            publish("buttonCheat/deactivate");
            publish("buttonCooperate/deactivate");
            if (DPI_FULL_SESSION && window.DPISpec && DPISpec.setDecisionOnsetTime) {
                DPISpec.setDecisionOnsetTime(null);
            }
            if (typeof GameSaveManager !== 'undefined') {
                GameSaveManager.isGameActive = true;
            }
        });

        // ============================================
        // EVENTO: FIN DE RONDA
        // ============================================
        listen(self, "iterated/round/end", function(payoffA, payoffB){
            if (Array.isArray(payoffA)) {
                payoffB = payoffA[1];
                payoffA = payoffA[0];
            }
            console.log('');
            console.log('══════════════════════════════════════════════════');
            console.log('📍 round/end - payoffs:', payoffA, ',', payoffB);
            console.log('📍 gameState ANTES:', JSON.stringify(gameState));
            
            // Mostrar UI si estaba oculta
            if(_hidden){
            _hidden = false;
            _fadeIn(o.scoreboard, 10);
            _fadeIn(o.info, 10);
            if (o.credits_game) _fadeIn(o.credits_game, 10);
        }

            // Actualizar puntuación (evitar NaN si payoff no es número)
            var pA = (typeof payoffA === 'number' && !isNaN(payoffA)) ? payoffA : 0;
            var pB = (typeof payoffB === 'number' && !isNaN(payoffB)) ? payoffB : 0;
            self.objects.scoreboard.addScore(pA, pB);
            gameState.score = (typeof gameState.score === 'number' && !isNaN(gameState.score) ? gameState.score : 0) + pA;

            // Avanzar ronda
            gameState.roundNum++;
            ROUND_NUM = gameState.roundNum;
            _.yourTotalScore = gameState.score;
            
            console.log('📍 gameState DESPUÉS:', JSON.stringify(gameState));
            
            if (DPI_FULL_SESSION && window.DPIBalanceador && !gameState.dpiInPilot && _lastHumanChoice != null && _lastHumanChoice !== "NULL" && _lastAgentChoice != null) {
                DPIBalanceador.recordOutcome(_lastHumanChoice, _lastAgentChoice);
            }
            if (DPI_FULL_SESSION && gameState.dpiInPilot) {
                var ptDone = typeof gameState.pilotTrialsCompleted === "number" ? gameState.pilotTrialsCompleted : 0;
                if (window.DPISpec) {
                    DPISpec.setBlockNum(-1);
                    DPISpec.setTrialNum(ptDone);
                    DPISpec.setCumulativeHuman(gameState.score);
                    DPISpec.logEvent(51, {
                        payoff_human: pA,
                        payoff_agent: pB,
                        cumulative_human: gameState.score,
                        trial_num: ptDone,
                        block_num: -1
                    });
                    if (DPISpec.saveEventLogToStorage) DPISpec.saveEventLogToStorage();
                }
                showInfo();
                saveGame();
                gameState.pilotTrialsCompleted = ptDone + 1;
                if (gameState.pilotTrialsCompleted >= DPI_PILOT_COUNT) {
                    gameState.dpiInPilot = false;
                    gameState.pilotTrialsCompleted = 0;
                    gameState.dpiTrialInBlock = 0;
                    gameState.dpiGlobalTrial = 0;
                    if (window.DPISpec) {
                        DPISpec.logEvent(13);
                        DPISpec.setBlockNum(0);
                        DPISpec.setTrialNum(0);
                        DPISpec.logEvent(20);
                        DPISpec.logEvent(30);
                        if (DPISpec.startHeartbeat) DPISpec.startHeartbeat();
                    }
                    if (window.DPIBalanceador) DPIBalanceador.resetBlock();
                    setTimeout(function(){
                        if (DPI_USE_NEXT_BUTTON && o.buttonSiguiente) { _fadeIn(o.buttonSiguiente, 10); saveGame(); }
                        else { _buttonsActive = true; dpiBeginDecisionWindow(); publish("buttonCheat/activate"); publish("buttonCooperate/activate"); saveGame(); }
                    }, FEEDBACK_PLUS_ITI_MS);
                    return;
                }
                setTimeout(function(){
                    if (DPI_USE_NEXT_BUTTON && o.buttonSiguiente) { _fadeIn(o.buttonSiguiente, 10); saveGame(); }
                    else { _buttonsActive = true; dpiBeginDecisionWindow(); publish("buttonCheat/activate"); publish("buttonCooperate/activate"); saveGame(); }
                }, FEEDBACK_PLUS_ITI_MS);
                return;
            }
            if (DPI_FULL_SESSION) {
                gameState.dpiTrialInBlock++;
                gameState.dpiGlobalTrial++;
                if (window.DPISpec) {
                    DPISpec.setTrialNum(gameState.dpiGlobalTrial);
                    DPISpec.setCumulativeHuman(gameState.score);
                    DPISpec.logEvent(51, {
                        payoff_human: pA,
                        payoff_agent: pB,
                        cumulative_human: gameState.score,
                        trial_num: gameState.dpiGlobalTrial - 1,
                        block_num: gameState.dpiBlockIndex
                    });
                    if (DPISpec.saveEventLogToStorage) DPISpec.saveEventLogToStorage();
                }
                showInfo();
                saveGame();
                if (gameState.dpiGlobalTrial >= DPI_TOTAL_TRIALS) {
                    if (window.DPISpec) { DPISpec.logEvent(21); if (DPISpec.stopHeartbeat) DPISpec.stopHeartbeat(); }
                    if (typeof GameSaveManager !== 'undefined') GameSaveManager.isGameActive = false;
                    publish("slideshow/scratch");
                    return;
                }
                if (gameState.dpiTrialInBlock >= DPI_TRIALS_PER_BLOCK) {
                    if (window.DPISpec) {
                        DPISpec.logEvent(31);
                        DPISpec.logEvent(14);
                        DPISpec.setBlockNum(gameState.dpiBlockIndex + 1);
                    }
                    gameState.dpiBlockIndex++;
                    gameState.dpiTrialInBlock = 0;
                    if (window.DPIBalanceador) DPIBalanceador.resetBlock();
                    var restMs = (window.DPISpec && DPISpec.SESSION_CONFIG) ? DPISpec.SESSION_CONFIG.restDurationMs : 30000;
                    setTimeout(function(){
                        if (window.DPISpec) { DPISpec.logEvent(15); DPISpec.logEvent(30); }
                        showInfo();
                        setTimeout(function(){
                            if (DPI_USE_NEXT_BUTTON && o.buttonSiguiente) { _fadeIn(o.buttonSiguiente, 10); saveGame(); }
                            else { _buttonsActive = true; dpiBeginDecisionWindow(); publish("buttonCheat/activate"); publish("buttonCooperate/activate"); saveGame(); }
                        }, FEEDBACK_PLUS_ITI_MS);
                    }, restMs);
                    return;
                }
                setTimeout(function(){
                    if (DPI_USE_NEXT_BUTTON && o.buttonSiguiente) { _fadeIn(o.buttonSiguiente, 10); saveGame(); }
                    else { _buttonsActive = true; dpiBeginDecisionWindow(); publish("buttonCheat/activate"); publish("buttonCooperate/activate"); saveGame(); }
                }, FEEDBACK_PLUS_ITI_MS);
                return;
            }

            // Actualizar UI
            showInfo();
            if (window.DPISpec) {
                DPISpec.setTrialNum(gameState.roundNum);
                DPISpec.setCumulativeHuman(gameState.score);
                DPISpec.logEvent(51, {
                    payoff_human: pA,
                    payoff_agent: pB,
                    cumulative_human: gameState.score,
                    trial_num: gameState.roundNum - 1
                });
                if (DPISpec.saveEventLogToStorage) DPISpec.saveEventLogToStorage();
            }
            var maxRounds = ROUNDS[gameState.roundIndex] ? ROUNDS[gameState.roundIndex].num : 5;
            console.log('📍 maxRounds=' + maxRounds + ', roundNum=' + gameState.roundNum);

            if(gameState.roundNum >= maxRounds){
                console.log('📍 ¡OPONENTE COMPLETADO!');
                
                // Resetear ronda y avanzar oponente
                gameState.roundNum = 0;
                gameState.roundIndex++;
                
                console.log('📍 Nuevo gameState:', JSON.stringify(gameState));
                
                // GUARDAR INMEDIATAMENTE
                saveGame();

                if(gameState.roundIndex >= ROUNDS.length){
                    // ¡JUEGO TERMINADO!
                    console.log('🏆 ¡JUEGO COMPLETADO! Eliminando save...');
                    if (typeof GameSaveManager !== 'undefined') {
                        GameSaveManager.isGameActive = false;
                        GameSaveManager.deleteSave();
                    }
                    publish("slideshow/scratch");
                } else {
                    // Cambiar a nuevo oponente
                    var newOpponentId = ROUNDS[gameState.roundIndex].id;
                    console.log('📍 Cambiando a nuevo oponente:', newOpponentId);
                    
                    Scratcher.smallScratch(700, 260, 150, 162,
                    function(){
                        // Callback 1: cambiar visual
                        console.log('📍 smallScratch callback - cambiando visual');
                        if (o.iterated && o.iterated.chooseOpponent) {
                            o.iterated.chooseOpponent(newOpponentId);
                            o.iterated.playerA.resetFace();
                            o.iterated.playerB.resetFace();
                        }
                        publish("iterated/newOpponent", [newOpponentId]);
                        self.objects.scoreboard.reset();
                        gameState.roundTimes = [];
                        showInfo();
                    },
                    function(){
                        console.log('📍 smallScratch completado - mostrar Iniciar para nuevo jugador');
                        setTimeout(function(){
                            if (o.buttonIniciar && !DPI_FULL_SESSION) _fadeIn(o.buttonIniciar, 10);
                            saveGame();
                        }, FEEDBACK_PLUS_ITI_MS);
                    });
                }

            } else {
                // Continuar con el mismo oponente: esperar 3 s retroalimentación + 1 s transición (4 s) antes de siguiente ronda
                var feedbackPlusTransition = (typeof ROUND_FEEDBACK_MS !== 'undefined' ? ROUND_FEEDBACK_MS : 3000) + (typeof ROUND_TRANSITION_MS !== 'undefined' ? ROUND_TRANSITION_MS : 1000);
                console.log('📍 Continuando mismo oponente en ' + feedbackPlusTransition + ' ms');
                if (_roundTimeoutId) { clearTimeout(_roundTimeoutId); _roundTimeoutId = null; }
                setTimeout(function() {
                    try {
                        _buttonsActive = true;
                        _decisionOnsetTime = Date.now();
                        publish("buttonCheat/activate");
                        publish("buttonCooperate/activate");
                        saveGame();
                        if (!DPI_FULL_SESSION) {
                            _roundTimeoutId = setTimeout(function() {
                                _roundTimeoutId = null;
                                if (!_buttonsActive) return;
                                _buttonsActive = false;
                                publish("buttonCheat/deactivate");
                                publish("buttonCooperate/deactivate");
                                if (!gameState.roundTimes) gameState.roundTimes = [];
                                gameState.roundTimes.push(2);
                                saveGame();
                                publish("iterated/round/end", [0, 0]);
                                setTimeout(function() { showInfo(); saveGame(); }, 0);
                            }, ROUND_TIMEOUT_MS);
                        }
                    } catch (e) {
                        console.error('Error reactivando botones:', e);
                        _buttonsActive = true;
                        publish("buttonCheat/activate");
                        publish("buttonCooperate/activate");
                    }
                }, feedbackPlusTransition);
            }
            
            console.log('══════════════════════════════════════════════════');
        });

        function runDpiEstablishAndSessionEvents() {
            if (!window.DPISpec) return;
            DPISpec.establishT0();
            DPISpec.logEvent(1);
            DPISpec.logEvent(20);
            DPISpec.logEvent(30);
            if (DPI_FULL_SESSION && DPISpec.startHeartbeat) DPISpec.startHeartbeat();
        }
        /** Tras INSTR_OFF: SYNC_T0 + piloto (12) o sesión (20/30). Heartbeat solo tras sesión experimental. */
        function runDpiAfterIntroVideo() {
            if (!window.DPISpec) return;
            DPISpec.establishT0();
            DPISpec.logEvent(1);
            if (DPI_PILOT_COUNT > 0) {
                DPISpec.logEvent(12);
                gameState.dpiInPilot = true;
                gameState.pilotTrialsCompleted = 0;
            } else {
                DPISpec.logEvent(20);
                DPISpec.logEvent(30);
                if (DPISpec.startHeartbeat) DPISpec.startHeartbeat();
            }
        }
        function showIteratedChromeAfterStart() {
            _hidden = false;
            _fadeIn(o.scoreboard, 10);
            _fadeIn(o.info, 10);
            if (o.credits_game) _fadeIn(o.credits_game, 10);
            if (!DPI_FULL_SESSION) {
                if (o.buttonIniciar) _fadeIn(o.buttonIniciar, 10);
            }
            if (DPI_FULL_SESSION) {
                setTimeout(function(){
                    if (DPI_USE_NEXT_BUTTON && o.buttonSiguiente) _fadeIn(o.buttonSiguiente, 10);
                    else if (_dpiNeedInitialIniciar && o.buttonIniciar) _fadeIn(o.buttonIniciar, 10);
                    else {
                        _buttonsActive = true;
                        dpiBeginDecisionWindow();
                        publish("buttonCheat/activate");
                        publish("buttonCooperate/activate");
                    }
                }, 500);
            }
        }

        if (!isRestoring && window.DPISpec && DPI_FULL_SESSION) {
            DPISpec.logEvent(10);
            tryDpiIntroVideo(function () {
                DPISpec.logEvent(11);
                runDpiAfterIntroVideo();
                showIteratedChromeAfterStart();
                showInfo();
            });
        } else if (!isRestoring && window.DPISpec) {
            runDpiEstablishAndSessionEvents();
            showIteratedChromeAfterStart();
        } else if (!isRestoring) {
            showIteratedChromeAfterStart();
        }

        showInfo();
        
        console.log('🚀 SLIDE 2 ONSTART completado');
        console.log('══════════════════════════════════════════════════');
    },

    onend: function(self){
        console.log('🚀 SLIDE 2 - ONEND');
        if (self._dpiKeyHandler) {
            window.removeEventListener("keydown", self._dpiKeyHandler, true);
            self._dpiKeyHandler = null;
        }
        unlisten(self);
        self.clear();
    }
});

// ============================================
// SLIDE 3: RESULTADOS (sin ID explícito)
// ============================================
SLIDES.push({

    onstart: function(self){
        console.log('');
        console.log('══════════════════════════════════════════════════');
        console.log('🏆 SLIDE 3 (RESULTADOS) - ONSTART');
        console.log('══════════════════════════════════════════════════');
        console.log('🏆 _.yourTotalScore:', _.yourTotalScore);
        
        // Texto de resultado según puntuación total (el "1" = mensaje iterated_score_1 cuando score===7)
        var scoreTextID;
        var score = _.yourTotalScore;
        if(score==49) scoreTextID="5";
        else if(score>=34) scoreTextID="4";
        else if(score>=22) scoreTextID="3";
        else if(score>=8) scoreTextID="2";
        else if(score==7) scoreTextID="1";
        else scoreTextID="x";
        scoreTextID = "iterated_score_"+scoreTextID;

        self.add({
            id:"score1", type:"TextBox",
            x:24, y:32, width:243, height:26,
            text_id:"iterated_score_start"
        });

        self.add({
            id:"score2", type:"TextBox",
            x:114, y:44, width:151, height:132, align:"right", size:123,
            text: _.yourTotalScore+""
        });

        self.add({
            id:"score3", type:"TextBox",
            x:290, y:62, width:639, height:123,
            text: Words.get(scoreTextID)+" "+Words.get("iterated_score_end")+"<br><br>"+Words.get("who_were")
        });

        self.add({id:"char_tft", type:"CharacterTextBox", x:39, y:208, width:470, height:114, character: "tft"});
        self.add({id:"char_all_d", type:"CharacterTextBox", x:511, y:208, width:190, height:114, character: "all_d"});
        self.add({id:"char_all_c", type:"CharacterTextBox", x:731, y:208, width:200, height:114, character: "all_c"});
        self.add({id:"char_grudge", type:"CharacterTextBox", x:39, y:333, width:380, height:114, character: "grudge"});
        self.add({id:"char_prober", type:"CharacterTextBox", x:431, y:333, width:500, height:114, character: "prober"});

        self.add({
            id:"next", type:"TextBox",
            x:104, y:478, width:447, height:37,
            text_id: "characters_teaser"
        });

        self.add({
            id:"next_button", type:"Button", x:544, y:471, size:"long",
            text_id:"characters_button",
            message:"slideshow/scratch"
        });
    },
    
    onend: function(self){
        self.clear();
    }
});
