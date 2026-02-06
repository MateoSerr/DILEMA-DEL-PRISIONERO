Loader.addToManifest(Loader.manifest,{

	// SFX
	button1: "assets/sounds/button1.mp3",
	button2: "assets/sounds/button2.mp3",
	button3: "assets/sounds/button3.mp3"

});

function Button(config){

	var self = this;
	self.id = config.id;
	self.config = config;

	// Create DOM
	var button = document.createElement("div");
	button.className = "object";
	button.classList.add("button");
	if(config.size) button.setAttribute("size", config.size);
	self.dom = button;

	// TOOLTIP?
	if(config.tooltip){
		self.dom.style.width = 190;
		self.dom.style.height = 55;
		self.dom.style.position = "absolute";
		self.dom.setAttribute("data-balloon-length", "large");
		self.dom.setAttribute("data-balloon", Words.get(config.tooltip));
		self.dom.setAttribute("data-balloon-pos", "left");
	}

	// BG
	var bg = document.createElement("div");
	bg.id = "background";
	var text = document.createElement("div");
	text.id = "text";
	var hitbox = document.createElement("div");
	hitbox.id = "hitbox";
	button.appendChild(bg);
	button.appendChild(text);
	button.appendChild(hitbox);

	// Customize DOM
	button.style.left = config.x+"px";
	button.style.top = config.y+"px";
	self.setText = function(text_id){
		var words = Words.get(text_id);
		if(config.uppercase) words = words.toUpperCase();
		self.setText2(words);
	};
	self.setText2 = function(words){
		text.innerHTML = words;
	};
	self.setText(config.text_id);

	// On hover...
	hitbox.onmouseover = function(){
		if(self.active) button.setAttribute("hover","yes");
	};
	hitbox.onmouseout = function(){
		if(self.active) button.removeAttribute("hover");
	};

	// On click...
	hitbox.onclick = function(e){

		if(parseFloat(getComputedStyle(self.dom).opacity)<0.5) return; // DON'T CLICK INVISIBLE BUTTONS

		if(self.active){

			// NUEVA IDEA: Capturar el tiempo JUSTO ANTES de procesar la decisión
			// Esto asegura que siempre tengamos un tiempo preciso, sin depender de eventos externos
			var clickTimestamp = Date.now();
			
			// Si hay un StatsManager, guardar el timestamp del clic ANTES de cualquier otra cosa
			if (typeof StatsManager !== 'undefined') {
				// Si no hay un tiempo de inicio previo, usar el tiempo desde el último round/end
				if (StatsManager.decisionStartTime === null) {
					// Usar el tiempo desde el último round/end como fallback
					if (StatsManager.lastRoundEndTime) {
						StatsManager.decisionStartTime = StatsManager.lastRoundEndTime;
						console.log('⏱️ Usando tiempo desde último round/end como inicio');
					} else {
						// Si no hay round/end previo, iniciar ahora (será tiempo mínimo)
						StatsManager.decisionStartTime = clickTimestamp;
						console.log('⏱️ Iniciando temporizador en el clic (primera decisión)');
					}
				}
				// Guardar el timestamp del clic para cálculo preciso
				StatsManager.lastClickTimestamp = clickTimestamp;
			}

			// Sound!
			if(config.sound){
				Loader.sounds[config.sound].play();
			}else{
				var num = Math.ceil(Math.random()*3);
				Loader.sounds["button"+num].play();
			}

			// Actual Logic
			if(config.onclick) config.onclick();
			if(config.message) publish(config.message);

		}

	};

	// Activate/Deactivate
	self.active = true;
	self.activate = function(){
		self.active = true;
		button.removeAttribute("deactivated");
	};
	self.deactivate = function(){
		self.active = false;
		button.setAttribute("deactivated","yes");
		button.removeAttribute("hover");
	};
	if(config.active===undefined) config.active=true;
	if(!config.active) self.deactivate();

	// Listeners!
	if(self.id){
		listen(self, self.id+"/activate", self.activate);
		listen(self, self.id+"/deactivate", self.deactivate);
	}

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){
		unlisten(self);
		_remove(self);
	};

}