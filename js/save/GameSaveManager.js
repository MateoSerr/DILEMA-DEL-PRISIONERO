// ============================================
// GAME SAVE MANAGER - VERSIÓN CON DIAGNÓSTICO
// ============================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 GameSaveManager.js CARGADO');
console.log('📦 localStorage ahora:', localStorage.getItem('trustGameSave'));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

var GameSaveManager = {
    
    gameData: null,
    isGameActive: false,
    
    // ============================================
    // INICIALIZAR
    // ============================================
    init: function() {
        var self = this;
        console.log('📦 GameSaveManager.init()');
        
        // Cargar datos guardados
        this.loadFromStorage();
        
        console.log('📦 gameData después de cargar:', JSON.stringify(this.gameData));
        
        // Si hay partida guardada, mostrar diálogo
        if (this.gameData && this.gameData.saved) {
            console.log('📦 Hay partida guardada, preparando diálogo...');
            var checkReady = function() {
                if (typeof slideshow !== 'undefined' && typeof publish !== 'undefined') {
                    console.log('📦 slideshow y publish disponibles, mostrando diálogo');
                    self.showDialog();
                } else {
                    console.log('📦 Esperando slideshow y publish...');
                    setTimeout(checkReady, 200);
                }
            };
            setTimeout(checkReady, 1000);
        } else {
            console.log('📦 No hay partida guardada');
        }
    },
    
    // ============================================
    // CARGAR DESDE STORAGE
    // ============================================
    loadFromStorage: function() {
        console.log('📦 loadFromStorage()');
        try {
            var raw = localStorage.getItem('trustGameSave');
            console.log('📦 raw:', raw);
            if (raw) {
                this.gameData = JSON.parse(raw);
                console.log('📦 parsed:', JSON.stringify(this.gameData));
            }
        } catch(e) {
            console.error('📦 Error:', e);
            this.gameData = null;
        }
    },
    
    // ============================================
    // MOSTRAR DIÁLOGO
    // ============================================
    showDialog: function() {
        var self = this;
        var data = this.gameData;
        
        console.log('📦 showDialog() - data:', JSON.stringify(data));
        
        if (!data || !data.saved) {
            console.log('📦 No hay datos válidos, no mostrando diálogo');
            return;
        }
        
        var ROUNDS_SAVE = (typeof ROUNDS !== 'undefined' && ROUNDS.length) ? ROUNDS : [{id:"tft", num:240, name:"Copycat"}];
        var opponentName = ROUNDS_SAVE[data.roundIndex] ? (ROUNDS_SAVE[data.roundIndex].name || ('Oponente ' + (data.roundIndex + 1))) : 'Oponente ' + (data.roundIndex + 1);
        var maxRounds = ROUNDS_SAVE[data.roundIndex] ? ROUNDS_SAVE[data.roundIndex].num : 240;
        
        var dialog = document.createElement('div');
        dialog.id = 'continue-dialog';
        dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;justify-content:center;align-items:center;';
        
        dialog.innerHTML = '<div style="background:white;padding:40px;border-radius:15px;max-width:500px;text-align:center;font-family:Arial,sans-serif;">' +
            '<h1 style="margin-top:0;color:#333;">🎮 Partida Guardada</h1>' +
            '<div style="margin:25px 0;color:#666;font-size:16px;">' +
            '<p><strong>Oponente:</strong> ' + opponentName + ' (' + (data.roundIndex + 1) + ' de 5)</p>' +
            '<p><strong>Ronda:</strong> ' + (data.roundNum + 1) + ' / ' + maxRounds + '</p>' +
            '<p><strong>Puntuación:</strong> ' + (data.totalScore || 0) + ' puntos</p>' +
            '<p style="color:#999;font-size:12px;">roundIndex=' + data.roundIndex + ', roundNum=' + data.roundNum + '</p>' +
            '</div>' +
            '<div style="display:flex;gap:15px;justify-content:center;">' +
            '<button id="btn-continue" style="background:#4089DD;color:white;border:none;padding:15px 30px;border-radius:8px;cursor:pointer;font-size:18px;font-weight:bold;">▶️ Continuar</button>' +
            '<button id="btn-new" style="background:#666;color:white;border:none;padding:15px 30px;border-radius:8px;cursor:pointer;font-size:18px;">🆕 Nueva</button>' +
            '</div>' +
            '</div>';
        
        document.body.appendChild(dialog);
        
        document.getElementById('btn-continue').onclick = function() {
            console.log('📦 ▶️ Botón CONTINUAR presionado');
            console.log('📦 localStorage ANTES de navegar:', localStorage.getItem('trustGameSave'));
            document.body.removeChild(dialog);
            console.log('📦 Ejecutando publish("slideshow/scratch", ["iterated"])');
            publish("slideshow/scratch", ["iterated"]);
        };
        
        document.getElementById('btn-new').onclick = function() {
            console.log('📦 🆕 Botón NUEVA presionado');
            self.deleteSave();
            console.log('📦 Guardado eliminado');
            document.body.removeChild(dialog);
            console.log('📦 Ejecutando publish("slideshow/scratch", ["iterated"])');
            publish("slideshow/scratch", ["iterated"]);
        };
    },
    
    // ============================================
    // ELIMINAR GUARDADO
    // ============================================
    deleteSave: function() {
        console.log('📦 deleteSave()');
        this.gameData = null;
        this.isGameActive = false;
        try {
            localStorage.removeItem('trustGameSave');
            if (window.DPISpec && DPISpec.clearEventLogStorage) DPISpec.clearEventLogStorage();
            if (window.DPISpec && DPISpec.clearEventLog) DPISpec.clearEventLog();
            console.log('📦 localStorage eliminado');
        } catch(e) {
            console.error('📦 Error eliminando:', e);
        }
    },
    
    // ============================================
    // GUARDAR
    // ============================================
    saveGame: function(roundIndex, roundNum, totalScore, currentOpponent, scoreboardA, scoreboardB) {
        console.log('📦 saveGame():', roundIndex, roundNum, totalScore);
        try {
            this.gameData = {
                saved: true,
                roundIndex: roundIndex || 0,
                roundNum: roundNum || 0,
                totalScore: totalScore || 0,
                currentOpponent: currentOpponent,
                scoreboardA: scoreboardA || 0,
                scoreboardB: scoreboardB || 0,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('trustGameSave', JSON.stringify(this.gameData));
            console.log('📦 Guardado:', JSON.stringify(this.gameData));
        } catch(e) {
            console.error('📦 Error guardando:', e);
        }
    }
};

// Inicializar
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() { GameSaveManager.init(); }, 500);
        });
    } else {
        setTimeout(function() { GameSaveManager.init(); }, 500);
    }
}
