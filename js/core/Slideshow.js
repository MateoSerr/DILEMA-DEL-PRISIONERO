var SLIDES = [];

function Slideshow(config){

	var self = this;
	self.config = config;

	// DOM
	self.dom = config.dom;

	// Slide information
	self.slides = config.slides;

	// Reset: INITIAL VARIABLES
	self.reset = function(){

		// On End?
		if(self.currentSlide){
			if(self.currentSlide.onend) self.currentSlide.onend(self);
			unlisten(_); // hax
		}

		// CLEAR
		if(self.clear) self.clear();

		// Reset
		self.dom.innerHTML = "";
		self.slideIndex = -1;
		self.currentSlide = null;
		self.objects = {};

	};
	self.reset();

	//////////////////////////////////////////////////
	/////////////// GO TO NEXT SLIDE /////////////////
	//////////////////////////////////////////////////

	// Go to next slide
	self.nextSlide = function(){
		console.log('🎪 slideshow.nextSlide() - índice actual:', self.slideIndex);
		console.log('🎪 localStorage al entrar:', localStorage.getItem('trustGameSave') ? 'TIENE DATOS' : 'VACÍO');

		// On End?
		if(self.currentSlide && self.currentSlide.onend){
			console.log('🎪 Ejecutando onend de slide actual...');
			self.currentSlide.onend(self);
		}

		// Update the information
		if(self.slideIndex >= self.slides.length-1) {
			console.log('🎪 Ya estamos en la última slide');
			return;
		}
		self.slideIndex++;
		self.currentSlide = self.slides[self.slideIndex];
		console.log('🎪 Avanzando a índice:', self.slideIndex, ', slide id:', self.currentSlide.id || '(sin id)');

		// On Start
		if(self.currentSlide.onstart){
			console.log('🎪 Ejecutando onstart...');
			self.currentSlide.onstart(self);
		}

		// Send out message!
		publish("slideshow/slideChange", [self.currentSlide.id]);
		console.log('🎪 nextSlide completado');

	};

	// Subscribe to "next slide" message...
	subscribe("slideshow/next", function(){
		self.nextSlide();
	});



	//////////////////////////////////////////////////
	///////////// SLIDESHOW OBJECTS //////////////////
	//////////////////////////////////////////////////

	// Objects!
	self.objects = {};

	// Add Object
	self.add = function(objectConfig){

		// Create object
		var Classname = window[objectConfig.type];
		objectConfig.slideshow = self;
		var obj = new Classname(objectConfig);
		obj.slideshow = self;

		// Remember it
		self.objects[objectConfig.id] = obj;

		// Add it for real!
		return obj.add();

	};

	// Remove Object
	self.remove = function(objectID){

		// Find it...
		var obj = self.objects[objectID];

		// Remove from memory & DOM
		delete self.objects[objectID];
		return obj.remove();

	};

	// Clear: Remove ALL objects
	self.clear = function(){
		for(var id in self.objects) self.remove(id);
	};


	//////////////////////////////////////////////////
	///////////// FORCE GO TO SLIDE //////////////////
	//////////////////////////////////////////////////

	// FORCE go to a certain slide
	self.gotoSlide = function(id){
		console.log('🎪 slideshow.gotoSlide("' + id + '")');
		console.log('🎪 localStorage al entrar:', localStorage.getItem('trustGameSave'));

		// RESET IT ALL.
		console.log('🎪 Ejecutando self.reset()...');
		self.reset();
		console.log('🎪 reset() completado, self.objects:', Object.keys(self.objects));

		// Slide & SlideIndex
		self.currentSlide = self.slides.find(function(slide){
			return slide.id==id;
		});
		self.slideIndex = self.slides.indexOf(self.currentSlide);
		console.log('🎪 Slide encontrada, índice:', self.slideIndex);

		// On JUMP & on Start
		console.log('🎪 Ejecutando onjump...');
		if(self.currentSlide.onjump) self.currentSlide.onjump(self);
		console.log('🎪 onjump completado, self.objects:', Object.keys(self.objects));
		
		console.log('🎪 Ejecutando onstart...');
		if(self.currentSlide.onstart) self.currentSlide.onstart(self);
		console.log('🎪 onstart completado');

		// Send out message!
		publish("slideshow/slideChange", [self.currentSlide.id]);
		console.log('🎪 gotoSlide completado');

	};

	// Subscribe to the "force goto" message...
	subscribe("slideshow/goto", function(id){
		self.gotoSlide(id);
	});

}
