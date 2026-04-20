Loader.addToManifest(Loader.manifest,{

	iterated_coin: "assets/iterated/iterated_coin.json",
	iterated_machine: "assets/iterated/iterated_machine.json",
	iterated_payoffs: "assets/iterated/iterated_payoffs.json",
	iterated_peep: "assets/iterated/iterated_peep.json",

	// SFX
	coin_insert: "assets/sounds/coin_insert.mp3",
	coin_get: "assets/sounds/coin_get.mp3",
	evil_laugh: "assets/sounds/evil_laugh.mp3",
	whoosh: "assets/sounds/whoosh.mp3",
	thump: "assets/sounds/thump.mp3",
	machine_start: "assets/sounds/machine_start.mp3"

});

// Antes: relleno blanco elíptico sobre la textura para tapar un artefacto; en la práctica borraba
// demasiado contorno de la cabeza (cabezas “rotas”). La textura original se deja intacta.
// (Si hiciera falta un parche puntual, hacerlo en PNG o con elipse mucho más pequeña y centrada.)
(function patchPeepHeadLineOnce() {
	window._peepHeadLinePatched = true;
})();

function Iterated(config){

	var self = this;
	self.id = config.id;
	// Depuración: abre con ?debugPeep=1 (o &debugPeep=1) y mira consola + marco rojo en los monitos.
	function isDebugPeep(){
		try { return /[?&]debugPeep=1(?:&|$)/.test(String(window.location.search || "")); } catch (e) { return false; }
	}
	
	// DOM
	self.dom = document.createElement("div");
	self.dom.className = "object iterated-container";
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";
	self.dom.style.width = "700px";
	self.dom.style.height = "250px";
	self.dom.style.minHeight = "250px";
	// .object ya es position:absolute; NO usar relative aquí: rompe el layout 960×540 del slideshow.
	self.dom.style.visibility = "visible";
	self.dom.style.opacity = "1";
	self.dom.style.zIndex = "2";
	self.dom.style.background = "transparent";

	// forceCanvas + resolution:1 evita recortes/rareos WebGL en algunos GPUs; los monitos en reposo van en DOM (CSS).
	var app = new PIXI.Application(700, 250, {transparent:true, resolution:1, antialias:true, forceCanvas:true});
	self.app = app;
	app.view.style.width = "700px";
	app.view.style.height = "250px";
	app.view.style.display = "block";
	app.view.style.position = "absolute";
	app.view.style.left = "0";
	app.view.style.top = "0";
	app.view.style.zIndex = "0";
	app.view.style.visibility = "visible";
	app.view.style.opacity = "1";
	self.dom.appendChild(app.view);

	// Monitos en reposo: PNG ya recortado (151×201) — evita canvas/atlas en runtime. Asset: iterated_peep_idle.png
	function resolveAssetUrl(rel) {
		var base = (typeof document !== "undefined" && document.baseURI) ? document.baseURI : window.location.href;
		try {
			return new URL(rel, base).href;
		} catch (e) {
			try { return new URL(rel, window.location.href).href; } catch (e2) { return rel; }
		}
	}
	// Misma URL para <img> DOM y cuerpo PIXI (Sprite): un solo asset, sin atlas U + arcos encima.
	var _idlePeepAssetV = "7";
	var _idlePeepUrl = resolveAssetUrl("assets/iterated/iterated_peep_idle.png?v=" + _idlePeepAssetV);
	function syncAfterPeepImgLoad() {
		if (typeof self._syncDomPeepsToIteratedRect === "function") {
			requestAnimationFrame(function(){ self._syncDomPeepsToIteratedRect(); });
		}
	}
	self._peepDomL = document.createElement("div");
	self._peepDomL.className = "iterated-peep-dom iterated-peep-dom--left";
	self._peepDomL.setAttribute("aria-hidden", "true");
	self._peepDomR = document.createElement("div");
	self._peepDomR.className = "iterated-peep-dom iterated-peep-dom--right";
	self._peepDomR.setAttribute("aria-hidden", "true");
	var _peepBox = "151px";
	var _peepH = "201px";
	self._peepDomL.style.width = self._peepDomR.style.width = _peepBox;
	self._peepDomL.style.height = self._peepDomR.style.height = _peepH;
	self._peepDomL.style.minHeight = self._peepDomR.style.minHeight = _peepH;
	self._peepDomL.style.boxSizing = self._peepDomR.style.boxSizing = "border-box";
	self._peepDomL.style.display = self._peepDomR.style.display = "block";
	self._peepImgL = document.createElement("img");
	self._peepImgL.className = "iterated-peep-idle-img";
	self._peepImgL.alt = "";
	self._peepImgL.draggable = false;
	self._peepDomL.appendChild(self._peepImgL);
	var _flipR = document.createElement("div");
	_flipR.className = "iterated-peep-flip";
	self._peepImgR = document.createElement("img");
	self._peepImgR.className = "iterated-peep-idle-img";
	self._peepImgR.alt = "";
	self._peepImgR.draggable = false;
	_flipR.appendChild(self._peepImgR);
	self._peepDomR.appendChild(_flipR);
	(function initPeepSprites(){
		var idleLocal = _idlePeepUrl;
		self._peepImgL.onload = self._peepImgR.onload = function(){ syncAfterPeepImgLoad(); };
		self._peepImgL.onerror = self._peepImgR.onerror = function(){
			console.warn("No se cargó iterated_peep_idle.png — debe existir en assets/iterated/ (PNG 151×201 recortado del atlas).");
		};
		self._peepImgL.src = idleLocal;
		self._peepImgR.src = idleLocal;
		// Imagen en caché: onload puede no dispararse.
		requestAnimationFrame(function(){
			if (self._peepImgL && self._peepImgL.complete && self._peepImgL.naturalWidth) syncAfterPeepImgLoad();
		});
	})();

	// Reposo: monitos como <img> (PNG recortado); se oculta el canvas PIXI para que no componga encima en algunos navegadores.
	self.syncIdlePeepLayers = function(){
		if (!self._peepDomL || !self._peepDomR || !self.playerA || !self.playerB) return;
		self._peepDomL.style.visibility = "visible";
		self._peepDomR.style.visibility = "visible";
		self.playerA.graphics.visible = false;
		self.playerB.graphics.visible = false;
		if (self.app && self.app.view) {
			self.app.view.style.visibility = "hidden";
			self.app.view.style.pointerEvents = "none";
		}
		if (typeof self._syncDomPeepsToIteratedRect === "function") self._syncDomPeepsToIteratedRect();
	};
	self._hideDomPeepsShowPixi = function(){
		if (!self._peepDomL || !self._peepDomR || !self.playerA || !self.playerB) return;
		self._peepDomL.style.visibility = "hidden";
		self._peepDomR.style.visibility = "hidden";
		self.playerA.graphics.visible = true;
		self.playerB.graphics.visible = true;
		if (self.app && self.app.view) {
			self.app.view.style.visibility = "visible";
			self.app.view.style.pointerEvents = "";
		}
	};

	// Monitos fuera del árbol del slideshow: #main tenía overflow:hidden y recortaba los laterales del tablero.
	self._syncDomPeepsToIteratedRect = function(){
		if (!self.dom || !self._peepDomL || !self._peepDomR) return;
		if (!self.dom.isConnected) return;
		if (self._peepDomL.style.visibility === "hidden") return;
		var r = self.dom.getBoundingClientRect();
		if (r.width < 50 || r.height < 50) return;
		// Si el rect devuelve un ancho ridículo (bug de layout), no encoger los monitos a un hilo.
		var rw = r.width;
		if (!isFinite(rw) || rw < 120 || rw > 1400) rw = 700;
		var scale = rw / 700;
		var peepW = 151 * scale;
		var peepH = 201 * scale;
		// Un poco menos de pad inferior para bajar el bloque y alejar la cabeza del borde superior del viewport (menos recorte).
		var padB = 9 * scale;
		var topY = r.bottom - padB - peepH;
		if (topY < 2) topY = 2;
		var lc = r.left + 62 * scale;
		var rc = r.left + 638 * scale;
		self._peepDomL.style.left = (lc - peepW / 2) + "px";
		self._peepDomL.style.top = topY + "px";
		self._peepDomL.style.width = peepW + "px";
		self._peepDomL.style.height = peepH + "px";
		self._peepDomR.style.left = (rc - peepW / 2) + "px";
		self._peepDomR.style.top = topY + "px";
		self._peepDomR.style.width = peepW + "px";
		self._peepDomR.style.height = peepH + "px";
		if (self._peepImgL && self._peepImgR) {
			self._peepImgL.style.width = "100%";
			self._peepImgL.style.height = "100%";
			self._peepImgR.style.width = "100%";
			self._peepImgR.style.height = "100%";
		}
		if (isDebugPeep()) {
			self._peepDomL.style.outline = self._peepDomR.style.outline = "3px solid #d00";
			console.log("[debugPeep] iterated getBoundingClientRect:", Math.round(r.width), "×", Math.round(r.height), "scale:", scale.toFixed(4));
			console.log("[debugPeep] peep box calculado:", Math.round(peepW), "×", Math.round(peepH));
			var bL = self._peepDomL.getBoundingClientRect();
			var bR = self._peepDomR.getBoundingClientRect();
			console.log("[debugPeep] peepL en pantalla:", Math.round(bL.width), "×", Math.round(bL.height), "@", Math.round(bL.left), Math.round(bL.top));
			console.log("[debugPeep] peepR en pantalla:", Math.round(bR.width), "×", Math.round(bR.height), "@", Math.round(bR.left), Math.round(bR.top));
			if (self._peepImgL && self._peepImgL.naturalWidth) console.log("[debugPeep] img natural:", self._peepImgL.naturalWidth, "×", self._peepImgL.naturalHeight);
		} else {
			self._peepDomL.style.outline = self._peepDomR.style.outline = "";
		}
	};
	function tearDownDomPeepsOverlay(){
		if (self._peepPosInterval) {
			clearInterval(self._peepPosInterval);
			self._peepPosInterval = null;
		}
		if (self._peepResizeObs) {
			self._peepResizeObs.disconnect();
			self._peepResizeObs = null;
		}
		if (self._peepMutationObs) {
			self._peepMutationObs.disconnect();
			self._peepMutationObs = null;
		}
		if (self._peepResizeFn) {
			window.removeEventListener("resize", self._peepResizeFn);
			self._peepResizeFn = null;
		}
		if (self._peepScrollFn) {
			window.removeEventListener("scroll", self._peepScrollFn, true);
			self._peepScrollFn = null;
		}
		if (self._peepDomL && self._peepDomL.parentNode) self._peepDomL.parentNode.removeChild(self._peepDomL);
		if (self._peepDomR && self._peepDomR.parentNode) self._peepDomR.parentNode.removeChild(self._peepDomR);
	}
	function mountDomPeepsOverlay(){
		if (!self._peepDomL || self._peepDomL.parentNode === document.body) return;
		document.body.appendChild(self._peepDomL);
		document.body.appendChild(self._peepDomR);
		self._peepDomL.classList.add("iterated-peep-dom--overlay");
		self._peepDomR.classList.add("iterated-peep-dom--overlay");
		self._peepResizeFn = function(){ self._syncDomPeepsToIteratedRect(); };
		window.addEventListener("resize", self._peepResizeFn);
		self._peepScrollFn = function(){ self._syncDomPeepsToIteratedRect(); };
		window.addEventListener("scroll", self._peepScrollFn, true);
		if (window.ResizeObserver) {
			self._peepResizeObs = new ResizeObserver(self._peepResizeFn);
			self._peepResizeObs.observe(self.dom);
		}
		if (window.MutationObserver) {
			self._peepMutationObs = new MutationObserver(self._peepResizeFn);
			self._peepMutationObs.observe(self.dom, { attributes: true, attributeFilter: ["style", "class"] });
		}
		self._peepPosInterval = setInterval(function(){ self._syncDomPeepsToIteratedRect(); }, 300);
	}

	///////////////////////////////////////////////
	//////////////// THE GRAPHICS /////////////////
	///////////////////////////////////////////////

	// Fondo de escena (textura ancha gris); oculto para DPI: la matriz es el SVG y los monitos en DOM.
	self.machine = _makeMovieClip("iterated_machine", {anchorX:0, anchorY:0, scale:0.5});
	app.stage.addChild(self.machine);
	self.machine.visible = false;

	self.playerA = new IteratedPeep({ idlePeepUrl: _idlePeepUrl });
	app.stage.addChild(self.playerA.graphics);

	self.playerB = new IteratedPeep({ opponent: true, idlePeepUrl: _idlePeepUrl });
	app.stage.addChild(self.playerB.graphics);

	self.payoffs = _makeMovieClip("iterated_payoffs", {scale:0.5});
	app.stage.addChild(self.payoffs);
	self.payoffs.x = 350;
	self.payoffs.y = 125;
	self.payoffs.gotoAndStop(0);
	self.payoffs.visible = false;

	app.stage.setChildIndex(self.machine, 0);
	app.stage.addChild(self.playerA.graphics);
	app.stage.addChild(self.playerB.graphics);

	// Matriz DPI reemplazo: R,T,S,P desde PD.PAYOFFS (PD.js). El "1" = P (ambos traicionan).
	var R = PD.PAYOFFS.R, T = PD.PAYOFFS.T, S = PD.PAYOFFS.S, P = PD.PAYOFFS.P;
	var matrixWrap = document.createElement("div");
	matrixWrap.className = "payoffs-matrix-replacement";
	// Sin estos estilos, el bloque puede ocupar todo el ancho y tapar los monitos (canvas).
	matrixWrap.style.cssText = "position:absolute;left:225px;top:0;width:250px;height:250px;max-width:250px;max-height:250px;box-sizing:border-box;pointer-events:none;z-index:8;overflow:visible;background:transparent;";
	matrixWrap.innerHTML =
		"<svg class='pm-diamond' viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'>" +
		"<defs><linearGradient id='pm-glow' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:#525252'/><stop offset='50%' style='stop-color:#3a3a3a'/><stop offset='100%' style='stop-color:#282828'/></linearGradient></defs>" +
		"<polygon class='pm-region pm-region-r' data-payoff='R' points='125,8 242,125 125,125 8,125' fill='url(#pm-glow)'/>" +
		"<polygon class='pm-region pm-region-st' data-payoff='S' points='8,125 125,125 125,8' fill='url(#pm-glow)'/>" +
		"<polygon class='pm-region pm-region-ts' data-payoff='T' points='125,125 242,125 125,242' fill='url(#pm-glow)'/>" +
		"<polygon class='pm-region pm-region-p' data-payoff='P' points='125,125 125,242 8,125' fill='url(#pm-glow)'/>" +
		"<path class='pm-outline' d='M125 8 L242 125 L125 242 L8 125 Z' fill='none' stroke-width='2.5'/>" +
		"<line x1='125' y1='8' x2='125' y2='242' stroke-width='1.5'/>" +
		"<line x1='8' y1='125' x2='242' y2='125' stroke-width='1.5'/>" +
		"</svg>" +
		"<span class='pm-num pm-r' style='left:92px;top:60px'>"+R+"</span><span class='pm-num pm-r' style='left:134px;top:60px'>"+R+"</span>" +
		"<span class='pm-num pm-s' style='left:42px;top:116px'>"+S+"</span><span class='pm-num pm-t' style='left:92px;top:116px'>"+T+"</span>" +
		"<span class='pm-num pm-t' style='left:134px;top:116px'>"+T+"</span><span class='pm-num pm-s' style='left:184px;top:116px'>"+S+"</span>" +
		"<span class='pm-num pm-p' style='left:92px;top:172px'>"+P+"</span><span class='pm-num pm-p' style='left:134px;top:172px'>"+P+"</span>" +
		"<div class='pm-edge-label pm-edge-they-cooperate' style='left:128px;top:28px;transform:rotate(45deg)'>"+Words.get("label_they_cooperate")+"</div>" +
		"<div class='pm-edge-label pm-edge-you-cooperate' style='left:44px;top:30px;transform:rotate(-45deg)'>"+Words.get("label_you_cooperate")+"</div>" +
		"<div class='pm-edge-label pm-edge-they-cheat' style='left:168px;top:72px;transform:rotate(45deg)'>"+Words.get("label_they_cheat")+"</div>" +
		"<div class='pm-edge-label pm-edge-you-cheat' style='left:8px;top:72px;transform:rotate(-45deg)'>"+Words.get("label_you_cheat")+"</div>";
	self.dom.appendChild(matrixWrap);
	// Los monitos (.iterated-peep-dom) se montan en document.body al llamar add() — ver mountDomPeepsOverlay.
	self.syncIdlePeepLayers();

	var _l1 = matrixWrap.querySelector(".pm-edge-they-cooperate");
	var _l2 = matrixWrap.querySelector(".pm-edge-you-cooperate");
	var _l3 = matrixWrap.querySelector(".pm-edge-they-cheat");
	var _l4 = matrixWrap.querySelector(".pm-edge-you-cheat");

	self._pmRegions = matrixWrap.querySelectorAll(".pm-region");

	self.highlightPayoff = function(payoffA){
		for (var i = 0; i < self._pmRegions.length; i++) self._pmRegions[i].classList.remove("highlight");
		var c = window.DPI_LOW_STIMULUS ? "#999" : "#FFE663";
		if(payoffA==PD.PAYOFFS.R){
			matrixWrap.querySelector(".pm-region-r").classList.add("highlight");
			_l1.style.color = _l2.style.color = c;
		}
		if(payoffA==PD.PAYOFFS.T){
			matrixWrap.querySelector(".pm-region-ts").classList.add("highlight");
			_l1.style.color = _l4.style.color = c;
		}
		if(payoffA==PD.PAYOFFS.S){
			matrixWrap.querySelector(".pm-region-st").classList.add("highlight");
			_l2.style.color = _l3.style.color = c;
		}
		if(payoffA==PD.PAYOFFS.P){
			matrixWrap.querySelector(".pm-region-p").classList.add("highlight");
			_l3.style.color = _l4.style.color = c;
		}
	};
	self.dehighlightPayoff = function(){
		for (var i = 0; i < self._pmRegions.length; i++) self._pmRegions[i].classList.remove("highlight");
		[_l1,_l2,_l3,_l4].forEach(function(label){
			label.style.color = "#f2f2f2";
		});
	};

	// HACK (oneoff slides)
	self.oneoffHighlight1 = function(yourAnswer){
		self.dehighlightPayoff();
		var c = window.DPI_LOW_STIMULUS ? "#999" : "#FFE663";
		var your = yourAnswer=="COOPERATE" ? _l2 : _l4;
		your.style.color = _l3.style.color = c;
	};
	self.oneoffHighlight2 = function(yourAnswer){
		self.dehighlightPayoff();
		var c = window.DPI_LOW_STIMULUS ? "#999" : "#FFE663";
		var your = yourAnswer=="COOPERATE" ? _l2 : _l4;
		your.style.color = _l1.style.color = c;
	};

	// Animiniminimination
	var _introMachine = -1;
	app.ticker.add(function(delta){
		Tween.tick();
		self.playerA.update(delta);
		self.playerB.update(delta);

		// IF: INTRODUCING MACHINE
		if(_introMachine>0){
			self.payoffs.gotoAndStop(4 + (Math.floor(_introMachine)%4));
			_introMachine -= 0.33;
			if(_introMachine<=0){
				self.dehighlightPayoff();
			}
		}

	});
	self.introMachine = function(){
		_introMachine = 40;
		if (!window.DPI_LOW_STIMULUS) Loader.sounds.machine_start.volume(0.65).play();
	};

	///////////////////////////////////////////////
	///////////////// LISTENERS ///////////////////
	///////////////////////////////////////////////

	self.chooseOpponent = function(id){
		console.log('🎭 Iterated.chooseOpponent llamado con id:', id);
		var LogicClass = window["Logic_"+id];
		if (!LogicClass) {
			console.error('❌ ERROR: No se encontró LogicClass para id:', id);
			return;
		}
		self.currentOpponentId = id;
		self.opponentLogic = new LogicClass();
		self.playerB.chooseHat(id);
		console.log('✅ Oponente cambiado visualmente a:', id);
	};

	self._doRoundWithMoves = function(yourMove, B) {
		var A = yourMove === "TRIP" ? PD.CHEAT : yourMove;
		var payoffs = PD.getPayoffs(A, B);
		self.playerA.TRIP = (yourMove === "TRIP");
		// Carteles en el canvas PIXI; durante unos segundos se ocultan los monitos DOM.
		try {
			self._hideDomPeepsShowPixi();
			if (self.playerA.showChoiceSign) self.playerA.showChoiceSign(A);
			if (self.playerB.showChoiceSign) self.playerB.showChoiceSign(B);
			setTimeout(function(){
				if (self.syncIdlePeepLayers) self.syncIdlePeepLayers();
			}, 2600);
		} catch (e) {
			console.warn("showChoiceSign:", e);
			if (self.syncIdlePeepLayers) self.syncIdlePeepLayers();
		}
		// OUTCOME_ON (50): usar temporizador real (no solo Tween) para que siempre exista antes del 51
		// aunque el ticker/Tween esté pausado o el foco esté fuera de la pestaña.
		var outcomeOnMs = 1100;
		setTimeout(function() {
			if (window.DPISpec) DPISpec.logEvent(50);
		}, outcomeOnMs);
		Tween_get(self.payoffs)
			.wait(_s(1.1))
			.call(function(){
				self.highlightPayoff(payoffs[0]);
			});
		setTimeout(function(){
			self.dehighlightPayoff();
			publish("iterated/round/end", payoffs);
		}, 2400);
		if (self.opponentLogic && self.opponentLogic.remember) self.opponentLogic.remember(B, A);
	};

	self.playOneRound = function(yourMove){
		var A = yourMove === "TRIP" ? PD.CHEAT : yourMove;
		var B = self.opponentLogic.play();
		if (window.DPISpec) {
			DPISpec.setCurrentStrategy(self.currentOpponentId || "");
			DPISpec.logEvent(42, { choice: B === PD.COOPERATE ? "C" : "T" });
		}
		self._doRoundWithMoves(yourMove, B);
	};

	/** meta42 opcional: { agent_latency_ms, strategy } para sesión DPI (un solo 42 por ensayo). */
	self.playOneRoundWithAgentMove = function(yourMove, agentMovePD, meta42){
		var B = agentMovePD;
		if (window.DPISpec) {
			var strat = (meta42 && meta42.strategy) ? meta42.strategy : "balanceador";
			DPISpec.setCurrentStrategy(strat);
			DPISpec.logEvent(42, {
				choice: B === PD.COOPERATE ? "C" : "T",
				agent_strategy: strat,
				agent_latency_ms: (meta42 && meta42.agent_latency_ms != null) ? meta42.agent_latency_ms : ""
			});
		}
		self._doRoundWithMoves(yourMove, B);
	};

	function runAfterLatency(yourMove, getB) {
		var latencyMs = (window.DPISpec && DPISpec.getAgentLatencyMs) ? DPISpec.getAgentLatencyMs() : 500;
		setTimeout(function(){
			var B = getB();
			if (window.DPISpec) {
				DPISpec.setCurrentStrategy(self.currentOpponentId || "");
				DPISpec.logEvent(42, { choice: B === PD.COOPERATE ? "C" : "T", agent_latency_ms: Math.round(latencyMs) });
			}
			self._doRoundWithMoves(yourMove, B);
		}, latencyMs);
	}

	listen(self, "iterated/cooperate", function(){
		if (window.DPISpec) {
			var onset = DPISpec.getDecisionOnsetTime();
			var tNow = (DPISpec.highResNow) ? DPISpec.highResNow() : Date.now();
			DPISpec.logEvent(41, { choice: "C", rt_ms: (onset != null && !isNaN(onset)) ? Math.round(tNow - onset) : "" });
		}
		publish("iterated/round/start");
		runAfterLatency(PD.COOPERATE, function(){ return self.opponentLogic.play(); });
	});

	listen(self, "iterated/cheat", function(){
		if (window.DPISpec) {
			var onset = DPISpec.getDecisionOnsetTime();
			var tNow = (DPISpec.highResNow) ? DPISpec.highResNow() : Date.now();
			DPISpec.logEvent(41, { choice: "T", rt_ms: (onset != null && !isNaN(onset)) ? Math.round(tNow - onset) : "" });
		}
		publish("iterated/round/start");
		runAfterLatency(PD.CHEAT, function(){ return self.opponentLogic.play(); });
	});

	listen(self, "iterated/TRIP", function(){
		publish("iterated/round/start");
		self.playOneRound("TRIP");
	});

	listen(self, "iterated/newOpponent", function(id){
		console.log('🎯 Iterated recibió evento iterated/newOpponent con id:', id, '(tipo:', typeof id + ')');
		if (!id) {
			console.error('❌ ERROR: id es undefined o null!');
			return;
		}
		// Si id es un array, tomar el primer elemento
		if (Array.isArray(id)) {
			console.warn('⚠️ id es un array, tomando el primer elemento:', id[0]);
			id = id[0];
		}
		self.chooseOpponent(id);
		self.playerA.resetFace();
		self.playerB.resetFace();
		console.log('✅ Iterated procesó evento iterated/newOpponent para:', id);
	});
	
	// CRÍTICO: Verificar si hay partida guardada ANTES de inicializar el oponente
	var ROUNDS_MAP = ["tft", "all_d", "all_c", "grudge", "prober"];
	var initialOpponent = "tft";
	
	try {
		var savedData = localStorage.getItem('trustGameSave');
		if (savedData) {
			var parsed = JSON.parse(savedData);
			if (parsed && parsed.saved && typeof parsed.roundIndex === 'number') {
				if (parsed.roundIndex >= 0 && parsed.roundIndex < ROUNDS_MAP.length) {
					initialOpponent = ROUNDS_MAP[parsed.roundIndex];
					console.log('🎮 Iterated: Oponente desde roundIndex=' + parsed.roundIndex + ':', initialOpponent);
				}
			}
		}
	} catch(e) {
		console.log('Iterated: Error leyendo partida guardada');
	}
	
	self.chooseOpponent(initialOpponent);

	///////////////////////////////////////////////
	///////////// ADD, REMOVE, KILL ///////////////
	///////////////////////////////////////////////

	// Add...
	self.add = function(){
		_add(self);
		mountDomPeepsOverlay();
		self._syncDomPeepsToIteratedRect();
	};

	// Remove...
	self.remove = function(){
		tearDownDomPeepsOverlay();
		app.destroy();
		unlisten(self);
		self.playerA.kill();
		self.playerB.kill();
		_remove(self);
	};

}

function IteratedScoreboard(config){

	var self = this;
	self.config = config;

	// DOM
	self.dom = document.createElement("div");
	self.dom.id = "scoreboard";
	self.dom.className = "object";
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	// Left score
	var left = document.createElement("div");
	self.dom.appendChild(left);

	// Right score
	var right = document.createElement("div");
	self.dom.appendChild(right);

	// Reset
	self.score = [0,0];
	self.reset = function(){
		self.score = [0,0];
		self.showScore();
	};
	self.addScore = function(a,b){
		var na = (typeof a === 'number' && !isNaN(a)) ? a : 0;
		var nb = (typeof b === 'number' && !isNaN(b)) ? b : 0;
		self.score[0] = (typeof self.score[0] === 'number' && !isNaN(self.score[0]) ? self.score[0] : 0) + na;
		self.score[1] = (typeof self.score[1] === 'number' && !isNaN(self.score[1]) ? self.score[1] : 0) + nb;
		self.showScore();
	};
	self.showScore = function(){
		var s0 = (typeof self.score[0] === 'number' && !isNaN(self.score[0])) ? self.score[0] : 0;
		var s1 = (typeof self.score[1] === 'number' && !isNaN(self.score[1])) ? self.score[1] : 0;
		left.innerHTML = s0;
		right.innerHTML = s1;
	};
	self.reset();

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

function IteratedPeep(config){

	var self = this;
	self.config = config;

	// Peep
	self.graphics = new PIXI.Container();
	var g = self.graphics;

	// Animation
	self.animated = new PIXI.Container();
	g.addChild(self.animated);

	// Coin
	self.coin = _makeMovieClip("iterated_coin", {scale:0.5});
	self.animated.addChild(self.coin);
	self.coin.visible = false;
	self.payoffCoins = [];
	for(var i=0;i<3;i++){
		var c = _makeMovieClip("iterated_coin", {scale:0.5});
		c.visible = false;
		self.animated.addChild(c);
		self.payoffCoins.push(c);
	}

	// Mismo raster que los <img> DOM (iterated_peep_idle.png): ojos quitados en build; sin trazo extra encima (evita “tumor”/doble curva).
	if (!config.idlePeepUrl) throw new Error("IteratedPeep requiere config.idlePeepUrl");
	var _bodyTex = PIXI.Texture.fromImage(config.idlePeepUrl);
	self.body = new PIXI.Sprite(_bodyTex);
	self.body.anchor.set(0.5, 0.95);
	self.body.gotoAndStop = function(){};
	self.animated.addChild(self.body);

	// Hat — oculto según diseño DPI (personajes sin sombrero)
	self.hat = _makeMovieClip("iterated_peep", {scale:0.5, anchorX:0.5, anchorY:0.95});
	self.animated.addChild(self.hat);
	self.hat.visible = false;
	self.hat.gotoAndStop(12);
	self.chooseHat = function(id){
		console.log('🎩 IteratedPeep.chooseHat llamado con id:', id);
		if (!id) {
			console.error('❌ ERROR: id es undefined o null en chooseHat!');
			return;
		}
		if (!PEEP_METADATA || !PEEP_METADATA[id]) {
			console.error('❌ ERROR: PEEP_METADATA[' + id + '] no existe!');
			console.error('   PEEP_METADATA disponible:', Object.keys(PEEP_METADATA || {}));
			return;
		}
		var frame = 13 + PEEP_METADATA[id].frame;
		console.log('   Frame calculado:', frame, '(13 +', PEEP_METADATA[id].frame + ')');
		console.log('   Frame anterior del sombrero:', self.hat.currentFrame);
		self.hat.gotoAndStop(frame);
		console.log('   Frame nuevo del sombrero:', self.hat.currentFrame);
		console.log('✅ Sombrero cambiado al frame:', frame, 'para oponente:', id);
		
		// Verificación adicional: asegurar que el frame realmente cambió
		if (self.hat.currentFrame !== frame) {
			console.error('❌ ERROR: El frame del sombrero NO cambió! Esperado:', frame, 'Actual:', self.hat.currentFrame);
			// Intentar nuevamente
			self.hat.gotoAndStop(frame);
			console.log('   Reintentando cambiar al frame:', frame);
		} else {
			console.log('✅ Verificación: El frame del sombrero cambió correctamente a:', frame);
		}
	};

	// Capa “face” desactivada: en este atlas cada frame es el mono completo; duplicar encima del body rompía la cabeza.
	self.face = _makeMovieClip("iterated_peep", {scale:0.5, anchorX:0.5, anchorY:0.95});
	self.animated.addChild(self.face);
	self.face.gotoAndStop(0);
	self.face.visible = false;
	self.restingFace = true;

	// Línea decorativa sobre la cabeza (desactivada: chocaba visualmente con el contorno del mono)
	self.headLine = new PIXI.Graphics();
	self.headLine.visible = false;
	self.animated.addChild(self.headLine);

	// Eyebrows — ocultos (sin expresiones)
	self.eyebrows = _makeMovieClip("iterated_peep", {scale:0.5, anchorX:0.5, anchorY:0.95});
	self.eyebrows.visible = false;
	self.animated.addChild(self.eyebrows);

	// Cartel: hijo de animated para heredar scale.x del oponente; más arriba y al costado para no tapar la cabeza.
	// Verde brillante = Cooperar, rojo brillante = Traicionar
	self.choiceSign = new PIXI.Graphics();
	self.animated.addChild(self.choiceSign);
	self.choiceSign.visible = false;
	self._choiceSignTimeout = null;
	self.showChoiceSign = function(move){
		if (!self.choiceSign || !PD) return;
		try {
			if (self._choiceSignTimeout) clearTimeout(self._choiceSignTimeout);
			self.choiceSign.clear();
			self.choiceSign.visible = true;
			var isGreen = (move === PD.COOPERATE);
			// Más alto y lateral (cx) que antes: el disco ya no cubría el arco superior de la cabeza (solo quedaba la U inferior).
			var radius = 20, ring = 4;
			var cy = -132, handY = -52;
			var cx = 66, handX = 44;
			var stickTop = cy + radius;
			// Palito: más grueso y recto (alineado con el centro del círculo)
			self.choiceSign.lineStyle(7, 0x333333, 1);
			self.choiceSign.moveTo(handX, handY);
			self.choiceSign.lineTo(cx, stickTop);
			self.choiceSign.lineStyle(0);
			// Fondo negro (círculo negro detrás, estilo imagen referencia)
			self.choiceSign.beginFill(0x000000);
			if (typeof self.choiceSign.drawCircle === "function") {
				self.choiceSign.drawCircle(cx, cy, radius + ring);
			}
			self.choiceSign.endFill();
			// Círculo de color brillante (verde brillante / rojo brillante)
			var fillColor = isGreen ? 0x00FF00 : 0xFF0000;
			self.choiceSign.beginFill(fillColor);
			if (typeof self.choiceSign.drawCircle === "function") {
				self.choiceSign.drawCircle(cx, cy, radius);
			} else {
				self.choiceSign.drawRect(cx - radius, cy - radius, radius * 2, radius * 2);
			}
			self.choiceSign.endFill();
			self._choiceSignTimeout = setTimeout(function(){
				self.choiceSign.visible = false;
				self._choiceSignTimeout = null;
			}, 2200);
		} catch (err) {
			console.warn("Cartel:", err);
		}
	};

	self.resetFace = function(){
		self.eyebrows.visible = false;
		self.body.gotoAndStop(0);
		self.restingFace = true;
	};

	// Posición: volcar el oponente en self.animated (no en el contenedor raíz) evita bounds/rareos con scale.x<0 en PIXI v4.
	g.y = 236;
	if(config.opponent){
		g.x = 700-62;
		self.animated.scale.x = -1;
	}else{
		g.x = 62;
	}

	/////////////////////////////////////////////
	/////// ACTUALLY ANIMATING THE MOVES ////////
	/////////////////////////////////////////////

	var _isTripping = false;
	var _isHopping = false;
	var _faceTripped = false;
	var _hopTimer = 0;
	var _faceTimer = 0;
	self.update = function(delta){

		if(self.restingFace || _faceTripped){
			self.body.gotoAndStop(0);
		}

		// Hopping
		if(!_isTripping){
			if(_isHopping){
				_hopTimer += delta;
				self.animated.y = -Math.abs(Math.sin(_hopTimer*0.4))*6;
			}else{
				self.animated.y = 0;
				_hopTimer = 0;
			}
		}
	};

	self.showScore = function(payoff){
	};

	self.payoff = undefined;
	self.animationDeferred = null;
	self.playMove = function(payoff){

		self.payoff = payoff;
		_animate1(); // start anim

		// Make a promise!
		self.animationDeferred = Q.defer();
		return self.animationDeferred.promise;

	};

	// Whip coin out
	var _animate1 = function(){
		self.coin.visible = true; // show coin
		self.coin.x = 10;
		self.coin.y = -30;
		Tween_get(self.coin)
			.to({x:60, y:-75}, _s(0.1), Ease.circOut)
			.wait(_s(0.2))
			.call(function(){
				_animate2(); // Sin tropezón ni movimientos de reacción
			});
	};

	// Walk towards machine (sin rebote)
	var _animate2 = function(){
		Tween_get(self.animated)
			.to({x:70}, _s(0.5), Ease.linear)
			.call(_animate3);
	};

	// ALT: Walk... and TRIP. 
	var _animate2_alt = function(){
		_isHopping = true;
		Tween_get(self.animated)
			.to({x:70/5}, _s(0.1), Ease.linear)
			.call(function(){
				_isHopping = false;
				_isTripping = true;
			})
			.to({rotation:Math.TAU/4.9, y:-11}, _s(0.05), Ease.quadIn)
			.call(function(){

				if (!window.DPI_LOW_STIMULUS) { Loader.sounds.thump.stereo(-0.9).volume(0.9).play(); Loader.sounds.squeak.stereo(-0.9).volume(0.9).play(); }

				self.eyebrows.visible = false;
				_faceTripped = true;
				self.coin.visible = false;
				g.scale.x = 1.2;
				g.scale.y = 1/g.scale.x;
				Tween_get(g.scale)
					.to({x:1, y:1}, _s(0.5), Ease.elasticOut);
			})
			.wait(_s(0.1))
			.call(_animate3_alt);
	};

	// Put coin in OR DON'T -- SHOW PAYOFF ON FACE
	var _animate3 = function(){
		_isHopping = false;

		// Rewarded or Suckered: PUT COIN IN
		if(self.payoff==PD.PAYOFFS.R || self.payoff==PD.PAYOFFS.S){

			Tween_get(self.coin)
				.to({x:95, y:-25}, _s(0.3), Ease.circInOut)
				.call(function(){

					self.restingFace = false;
					self.eyebrows.visible = false;
					self.body.gotoAndStop(0);
					self.coin.visible = false;

					// SOUND
					if(config.opponent){
						setTimeout(function(){
							if (!window.DPI_LOW_STIMULUS) Loader.sounds.coin_insert.stereo(0.9).volume(0.3).play();
						},50);
					}else{
						if (!window.DPI_LOW_STIMULUS) Loader.sounds.coin_insert.stereo(-0.9).volume(0.3).play();
					}

				});

		}

		// Punished or Tempted: DID NOT PUT COIN IN
		if(self.payoff==PD.PAYOFFS.P || self.payoff==PD.PAYOFFS.T){
			Tween_get(self.coin)
				.to({x:70, y:-50}, _s(0.3), Ease.linear)
				.call(function(){

					self.restingFace = false;
					self.eyebrows.visible = false;
					self.body.gotoAndStop(0);

					// WHOOSH SOUND
					if(config.opponent){
						setTimeout(function(){
							if (!window.DPI_LOW_STIMULUS) Loader.sounds.whoosh.stereo(0.9).volume(0.8).play();
						},50);
					}else{
						Loader.sounds.whoosh.stereo(-0.9).volume(0.8).play();
					}

					// Sin risa de burla ni movimiento de burla (T)

				})
				.to({x:50, y:-100}, _s(0.1), Ease.circOut);
		}

		// Next...
		Tween_get(self.animated)
			.wait(_s((self.payoff==PD.PAYOFFS.R) ? 0.6 : 0.9))
			.call(_animate4);

	};

	// ALT: Show dizzy face lay down for a while
	var _animate3_alt = function(){
		Tween_get(self.animated)
			.wait(_s(0.9))
			.call(_animate4_alt);
	};

	// Walk back (sin rebote)
	var _animate4 = function(){
		Tween_get(self.animated)
			.to({x:0}, _s(0.5), Ease.linear)
			.call(_animate5);
	};

	// ALT: Get back up
	var _animate4_alt = function(){
		Tween_get(self.animated)
			.to({x:0, y:0, rotation:0}, _s(0.5), Ease.quadInOut)
			.call(function(){
				_isTripping = false;
				_animate5();
			});
	};

	// Face back to "normal", put coin back, get coins (if any) thrown at you
	var _animate5 = function(){

		_isHopping = false;

		// Face back to normal
		if(!self.TRIP){
			self.restingFace = true;
		}

		// Sin expresiones: cejas siempre ocultas (no reacciones al ganar/perder)
		self.eyebrows.visible = false;

		// Put coin away if not already
		if(self.coin.visible){
			Tween_get(self.coin)
				.to({x:10, y:-30}, _s(0.1), Ease.circIn)
				.call(function(){
					self.coin.visible = false;
				});
		}

		// Coins thrown at you?
		if(self.payoff==PD.PAYOFFS.R || self.payoff==PD.PAYOFFS.T){

			// All the dang coins!
			for(var i=0;i<3;i++){
				var c = self.payoffCoins[i];
				c.x = 155;
				c.y = -25;
				(function(c,i,payoff){
					Tween_get(c)
						.wait(_s(i*0.2+0.1))
						.call(function(){
							c.visible = true;

							// COIN GET SOUND
							if(self.payoff==PD.PAYOFFS.R && i==2) return; // NOT last coin.
							if(config.opponent){
								setTimeout(function(){
									if (!window.DPI_LOW_STIMULUS) Loader.sounds.coin_get.stereo(0.9).volume(0.1).play();
								},50);
							}else{
								if (!window.DPI_LOW_STIMULUS) Loader.sounds.coin_get.stereo(-0.9).volume(0.1).play();
							}

						})
						.to({x:0}, _s(0.3), Ease.linear)
						.call(function(){
							c.visible = false;
						}); // x
					Tween_get(c)
						.wait(_s(i*0.2+0.1))
						.to({y:-120}, _s(0.15), Ease.circOut) // y
						.to({y:-20}, _s(0.15), Ease.circIn); // y
				})(c,i,self.payoff);
			}

			Tween_get(self.animated)
				.wait(_s(0.8))
				.call(_animateDone);

		}else{

			Tween_get(self.animated)
				.wait(_s(0.3))
				.call(_animateDone);
		}

	};

	// DONE
	var _animateDone = function(){
		if(self.TRIP){
			self.restingFace = true;
			self.body.gotoAndStop(0);
		}
		_faceTripped = false;
		self.animationDeferred.resolve();
	};

	// KILL
	self.kill = function(){
		// Remove ALL tweens
		Tween.removeTweens(self.animated);
		Tween.removeTweens(self.coin);
		for(var i=0;i<self.payoffCoins.length;i++){
			Tween.removeTweens(self.payoffCoins[i]);
		}
	};


}

