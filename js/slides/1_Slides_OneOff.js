// THE TRUST GAME - COOPERATE, YA NO?
SLIDES.push({

	id: "oneoff",

	onstart: function(self){

		Tournament.resetGlobalVariables();

		// Iterated Simulation
		self.add({id:"iterated", type:"Iterated", x:130, y:133});

		// Words on top & bottom
		self.add({
			id:"topWords", type:"TextBox", text_id:"oneoff_0_top",
			x:130, y:10, width:700, height:100, align:"center"
		});
		self.add({
			id:"btmWords", type:"TextBox", text_id:"oneoff_0_btm",
			x:130, y:397, width:700, height:100, align:"center"
		});

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

		// Buttons
		self.add({
			id:"btnCheat", type:"Button", x:275, y:463, text_id:"label_cheat", uppercase:true,
			onclick:function(){
				_.answer = "CHEAT";
				publish("slideshow/next");
			}
		});
		self.add({
			id:"btnCooperate", type:"Button", x:495, y:460, text_id:"label_cooperate", uppercase:true,
			onclick:function(){
				_.answer = "COOPERATE";
				publish("slideshow/next");
			}
		});

	},
	onend: function(self){
		//self.remove("labelYou");
		//self.remove("labelThem");
	}

},{

	onstart: function(self){

		try {
			var o = self.objects || {};
			var iterated = o.iterated;
			if (iterated != null && typeof iterated.oneoffHighlight1 === "function") {
				iterated.oneoffHighlight1(_.answer);
			}

			var t = o.topWords, b = o.btmWords;
			if (t) {
				if (_.answer === "COOPERATE") {
					t.setText(Words.get("oneoff_1_cooperated") + "<br>" + Words.get("oneoff_1_top"));
				} else {
					t.setText(Words.get("oneoff_1_cheated") + "<br>" + Words.get("oneoff_1_top"));
				}
			}
			if (b) b.setTextID("oneoff_1_btm");

			if (o.topWords) { _hide(o.topWords); _fadeIn(o.topWords, 160); }
			if (o.btmWords) { _hide(o.btmWords); _fadeIn(o.btmWords, 750); }
			if (o.btnCheat) { _hide(o.btnCheat); _fadeIn(o.btnCheat, 1350); }
			if (o.btnCooperate) { _hide(o.btnCooperate); _fadeIn(o.btnCooperate, 1350); }
		} catch (err) {
			console.warn("OneOff slide 2 onstart:", err);
		}

	},
	onend: function(self){
		try { self.remove("btmWords"); } catch (e) {}
	}

},{

	onstart: function(self){

		try {
			var o = self.objects || {};
			var iterated = o.iterated;
			// Payoff: solo si existe el sim iterated (evitar undefined)
			if (iterated != null && typeof iterated.oneoffHighlight2 === "function") {
				iterated.oneoffHighlight2(_.answer);
			}

			// Text
			var t = o.topWords;
			if (t && _.answer === "COOPERATE") {
				t.setText(Words.get("oneoff_2_cooperated") + "<br>" + Words.get("oneoff_2_top"));
			} else if (t) {
				t.setText(Words.get("oneoff_2_cheated") + "<br>" + Words.get("oneoff_2_top"));
			}
			self.add({
				id: "btmWords", type: "TextBox", text_id: "oneoff_2_btm",
				x: 130, y: 392, width: 700, height: 100, align: "center"
			});

			// Replace button
			self.remove("btnCheat");
			self.remove("btnCooperate");
			self.add({
				id: "btnNext", type: "Button", x: 304, y: 481, size: "long",
				text_id: "oneoff_button_next",
				message: "slideshow/next"
			});

			o = self.objects;
			if (o.topWords) { _hide(o.topWords); _fadeIn(o.topWords, 160); }
			if (o.btmWords) { _hide(o.btmWords); _fadeIn(o.btmWords, 750); }
			if (o.btnNext) { _hide(o.btnNext); _fadeIn(o.btnNext, 1350); }
		} catch (err) {
			console.warn("OneOff slide 3 onstart:", err);
		}

	},

	onend: function(self){

		try {
			var iterated = self.objects && self.objects.iterated;
			if (iterated != null && typeof iterated.dehighlightPayoff === "function") {
				iterated.dehighlightPayoff();
			}
		} catch (e) {}
		try { self.remove("topWords"); } catch (e) {}
		try { self.remove("btmWords"); } catch (e) {}
		try { self.remove("btnNext"); } catch (e) {}
		if (typeof _.clear === "function") _.clear();
	}

});

