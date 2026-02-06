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

// Configuración de oponentes
var ROUNDS = [
    {id:"tft", num:5},
    {id:"all_d", num:4},
    {id:"all_c", num:4},
    {id:"grudge", num:5},
    {id:"prober", num:7}
];

// Variables globales (para compatibilidad)
var ROUND_INDEX = 0;
var ROUND_NUM = 0;

// Exponer ROUNDS globalmente
window.ROUNDS = ROUNDS;

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
            currentOpponent: data.currentOpponent || ROUNDS[data.roundIndex || 0].id
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
        
        // Nueva partida - mostrar intro
        o.iterated.introMachine();

        self.add({
            id:"topWords", type:"TextBox", text_id:"iterated_intro_top",
            x:130, y:10, width:700, height:100, align:"center"
        });
        self.add({
            id:"btmWords", type:"TextBox", text_id:"iterated_intro_btm",
            x:130, y:410, width:700, height:100, align:"center"
        });

        self.add({
            id:"buttonCheat", type:"Button", x:275, y:453, uppercase:true,
            text_id:"label_cheat",
            onclick:function(){
                _.answer = "CHEAT";
                publish("slideshow/next");
            }
        });
        self.add({
            id:"buttonCooperate", type:"Button", x:495, y:450, uppercase:true,
            text_id:"label_cooperate",
            onclick:function(){
                _.answer = "COOPERATE";
                publish("slideshow/next");
            }
        });

        _hide(o.topWords); _fadeIn(o.topWords, 150+10);
        _hide(o.btmWords); _fadeIn(o.btmWords, 150+600);
        _hide(o.buttonCheat); _fadeIn(o.buttonCheat, 150+1200);
        _hide(o.buttonCooperate); _fadeIn(o.buttonCooperate, 150+1200);
        
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
            roundIndex: save ? save.roundIndex : 0,
            roundNum: save ? save.roundNum : 0,
            score: save ? save.totalScore : 0,
            scoreboardA: save ? save.scoreboardA : 0,
            scoreboardB: save ? save.scoreboardB : 0
        };
        
        // Determinar si estamos restaurando una partida
        var isRestoring = save && (save.roundIndex > 0 || save.roundNum > 0 || save.totalScore > 0);
        
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
                id:"buttonCheat", type:"Button", x:275, y:453, uppercase:true,
                text_id:"label_cheat",
                message: "iterated/cheat"
            });
            self.add({
                id:"buttonCooperate", type:"Button", x:495, y:450, uppercase:true,
                text_id:"label_cooperate",
                message: "iterated/cooperate"
            });
            // Actualizar referencia
            o = self.objects;
            console.log('🚀 Botones creados:', !!o.buttonCheat, !!o.buttonCooperate);
        }
        
        setTimeout(function(){
            if (o.buttonCheat) {
                o.buttonCheat.config.onclick = null;
                o.buttonCheat.config.message = "iterated/cheat";
            }
            if (o.buttonCooperate) {
                o.buttonCooperate.config.onclick = null;
                o.buttonCooperate.config.message = "iterated/cooperate";
            }
            publish("buttonCheat/deactivate");
            publish("buttonCooperate/deactivate");
        }, 1);

        if (o.iterated && o.iterated.dom) {
            o.iterated.dom.style.top = 183;
        }

        // ============================================
        // CREAR SCOREBOARD E INFO
        // ============================================
        self.add({id:"scoreboard", type:"IteratedScoreboard", x:378, y:85});
        self.add({
            id:"info", type:"TextBox",
            x:378, y:45, width:200, height:50, align:"center", size:15
        });

        var _hidden = true;
        _hide(o.scoreboard);
        _hide(o.info);

        // ============================================
        // FUNCIÓN showInfo - USA CLOSURE gameState
        // ============================================
        var showInfo = function(){
            var opp = gameState.roundIndex + 1;
            var total = ROUNDS.length;
            var score = gameState.score;
            var round = gameState.roundNum + 1;
            var maxRound = ROUNDS[gameState.roundIndex] ? ROUNDS[gameState.roundIndex].num : '?';
            
            var text = "opponent: " + opp + " of " + total;
            text += "<br>your total score: " + score;
            text += "<br>round: " + round + " / " + maxRound;
            
            console.log('📊 showInfo() → opp:' + opp + '/' + total + ', score:' + score + ', round:' + round + '/' + maxRound);
            
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
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem('trustGameSave', JSON.stringify(data));
                console.log('💾 ✅ Guardado exitoso:', JSON.stringify(data));
                
                // Sincronizar globales
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
                
                // Activar botones
                setTimeout(function() {
                    publish("buttonCheat/activate");
                    publish("buttonCooperate/activate");
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
            publish("buttonCheat/deactivate");
            publish("buttonCooperate/deactivate");
            if (typeof GameSaveManager !== 'undefined') {
                GameSaveManager.isGameActive = true;
            }
        });

        // ============================================
        // EVENTO: FIN DE RONDA
        // ============================================
        listen(self, "iterated/round/end", function(payoffA, payoffB){
            console.log('');
            console.log('══════════════════════════════════════════════════');
            console.log('📍 round/end - payoffs:', payoffA, ',', payoffB);
            console.log('📍 gameState ANTES:', JSON.stringify(gameState));
            
            // Mostrar UI si estaba oculta
            if(_hidden){
                _hidden = false;
                _fadeIn(o.scoreboard, 10);
                _fadeIn(o.info, 10);
            }

            // Actualizar puntuación
            self.objects.scoreboard.addScore(payoffA, payoffB);
            gameState.score += payoffA;

            // Avanzar ronda
            gameState.roundNum++;
            
            console.log('📍 gameState DESPUÉS:', JSON.stringify(gameState));
            
            // Actualizar UI
            showInfo();
            
            // Obtener máximo de rondas para este oponente
            var maxRounds = ROUNDS[gameState.roundIndex] ? ROUNDS[gameState.roundIndex].num : 5;
            console.log('📍 maxRounds=' + maxRounds + ', roundNum=' + gameState.roundNum);

            // ¿Terminamos con este oponente?
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
                        showInfo();
                    },
                    function(){
                        // Callback 2: activar botones
                        console.log('📍 smallScratch completado - activando botones');
                        publish("buttonCheat/activate");
                        publish("buttonCooperate/activate");
                        saveGame();
                    });
                }

            } else {
                // Continuar con el mismo oponente
                console.log('📍 Continuando mismo oponente, activando botones');
                publish("buttonCheat/activate");
                publish("buttonCooperate/activate");
                saveGame();
            }
            
            console.log('══════════════════════════════════════════════════');
        });

        // ============================================
        // INICIAR PARTIDA SI ES NUEVA
        // ============================================
        if (!isRestoring) {
            console.log('🚀 Nueva partida - ejecutando primera acción en 10ms');
            setTimeout(function(){
                if(_.answer=="COOPERATE"){
                    console.log('🚀 Primera acción: COOPERATE');
                    publish("iterated/cooperate");
                }else{
                    console.log('🚀 Primera acción: CHEAT');
                    publish("iterated/cheat");
                }
            }, 10);
        }

        // Mostrar info inicial
        showInfo();
        
        console.log('🚀 SLIDE 2 ONSTART completado');
        console.log('══════════════════════════════════════════════════');
    },

    onend: function(self){
        console.log('🚀 SLIDE 2 - ONEND');
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
