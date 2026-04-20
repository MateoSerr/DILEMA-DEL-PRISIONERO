var slideshow, slideSelect;

function trustRunMainApp(){

	// PRELOADER
	Q.all([
		Loader.loadAssets(Loader.manifestPreload),
		Words.convert("words.html?v=4")
	]).then(function(){

		// CHANGE DOM
		document.body.removeChild($("#preloader"));
		$("#main").style.display = "block";
		$("#footer").style.display = "block";

		(function trustMountRoleBar() {
			var bar = document.getElementById("trust-role-bar");
			if (!bar || !window.AppRole) return;
			bar.style.display = "flex";
			var span = document.getElementById("trust-role-label");
			if (span) {
				span.textContent = AppRole.isAdmin()
					? "Equipo (datos y exportación) · "
					: "Participante (tarea) · ";
			}
			var bteam = document.getElementById("trust-btn-team");
			if (bteam) {
				if (AppRole.isPlayer && AppRole.isPlayer()) {
					bteam.style.display = "";
					bteam.onclick = function() {
						if (AppRole.switchToAdmin) AppRole.switchToAdmin();
					};
				} else {
					bteam.style.display = "none";
				}
			}
			var bp = document.getElementById("trust-btn-player");
			if (bp) {
				if (AppRole.isAdmin && AppRole.isAdmin()) {
					bp.style.display = "";
					bp.onclick = function() {
						if (AppRole.switchToPlayer) AppRole.switchToPlayer();
					};
				} else {
					bp.style.display = "none";
				}
			}
			var br = document.getElementById("trust-btn-repick");
			if (br) {
				br.onclick = function() {
					if (AppRole.clearRoleAndReload) AppRole.clearRoleAndReload();
				};
			}
			var bpan = document.getElementById("trust-btn-admin-panel");
			if (bpan) {
				if (AppRole.isAdmin && AppRole.isAdmin()) {
					bpan.style.display = "";
					bpan.onclick = function() {
						try {
							window.location.href = new URL("admin.html", window.location.href).href;
						} catch (e) {
							window.location.href = "admin.html";
						}
					};
				} else {
					bpan.style.display = "none";
				}
			}
			var blo = document.getElementById("trust-btn-logout");
			if (blo) {
				blo.onclick = function() {
					try {
						sessionStorage.removeItem(AppRole.STORAGE_KEY || "trust_app_role");
						sessionStorage.removeItem(AppRole.LOGIN_OK_KEY || "trust_login_ok");
					} catch (e) {}
					try {
						if (window.TrustLocalAuth && TrustLocalAuth.signOut) TrustLocalAuth.signOut();
					} catch (e2) {}
					try {
						if (window.TrustAuth && TrustAuth.signOut) TrustAuth.signOut();
					} catch (e3) {}
					window.location.href = window.location.pathname;
				};
			}
		})();

		if ((!window.AppRole || AppRole.isAdmin()) && window.DPIOperatorHUD && typeof DPIOperatorHUD.init === "function") {
			DPIOperatorHUD.init();
		}

		// Slideshow
		slideshow = new Slideshow({
			dom: $("#slideshow"),
			slides: SLIDES
		});

		// Slide Select
		slideSelect = new SlideSelect({
			dom: $("#select"),
			slides: SLIDES
		});
		slideSelect.dom.style.display = "none";
		subscribe("start/game", function(){
			// Solo administrador: selector de diapositivas (saltos). Jugador: solo flujo del juego.
			if (!window.AppRole || AppRole.isAdmin()) {
				slideSelect.dom.style.display = "block";
			} else {
				slideSelect.dom.style.display = "none";
			}
			$("#translations").style.display = "none";

			// Ir directo al juego iterado (monos + máquina) para que se vea todo
			publish("slideshow/scratch", ["iterated"]);
		});

		// SOUND
		var _soundIsOn = true;
		$("#sound").onclick = function(){
			_soundIsOn = !_soundIsOn;
			Howler.mute(!_soundIsOn);
			$("#sound").setAttribute("sound", _soundIsOn?"on":"off");
		};

		// LOAD REAL THINGS
		Loader.loadAssets(
			Loader.manifest,
			function(){
				publish("preloader/done");
			},
			function(ratio){
				publish("preloader/progress", [ratio]);
			}
		);

		// First slide!
		slideshow.nextSlide();

	});

}

window.onload = function(){
	function go() {
		trustRunMainApp();
	}
	if (window.__TRUST_AUTH_READY__) {
		go();
		return;
	}
	var id = setInterval(function() {
		if (!window.__TRUST_AUTH_READY__) return;
		clearInterval(id);
		go();
	}, 25);
};