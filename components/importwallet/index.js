var importwallet = (function(){

	var self = new nModule();

	var essenses = {};

	//var essense = null;

	var Essense = function(p){

		var primary = deep(p, 'history');

		var id = 'secondary', proxy = null;

		if (primary) id = 'primary';
		if (p.inWnd) id = 'window';

		//////////////////////////////

		var el,
			essenseData,
			initialParameters;
		var validation = function(m){
			return bitcoin.bip39.validateMnemonic(m)
		};

		var events = {

		
			add : function(){
				var p = {};

				var hdseed = trim(el.login.val());

				globalpreloader(true);

				// return proxy.system.request('set.node.createWallet', {blank: true}).then(r => {



				// })
				
				return proxy.system.request('set.node.sethdseed', {hdseed: hdseed}).then(mnemonic => {

					console.log('r importwallet: ', mnemonic);

					if (essenseData.success)
						essenseData.success(mnemonic);

					globalpreloader(false);

					self.closeContainer();

				}).catch(e => {

					globalpreloader(false);


					if (e.code && e.message)
						sitemessage(`(${self.app.localization.e('dcode')} ${e.code}): ${e.message}`, null, 5000)
					else
						sitemessage(`Unknown error`)

					self.closeContainer()


				})				

			},

		}

		var initEvents = function(p){
			
			el.enter.on('click', events.add);

			el.login.on('focus', function() {
				el.c.find('.uploadFile').addClass('hidden');
				el.c.find('.showPassword').removeClass('hidden');
			});

			el.login.on('blur', function(e) {
				const focusOnShowPassword = $(e.relatedTarget).is('.showPassword');
				const val = el.login.val();

				if (focusOnShowPassword) {
					/**
					 * If new focus target is ShowPassword button,
					 * returning focus to the input, so user can
					 * proceed typing.
					 */
					el.login.focus();

					return;
				}

				if (val.length) {
					return;
				}

				el.c.find('.uploadFile').removeClass('hidden');
				el.c.find('.showPassword').addClass('hidden');
		    });

			el.c.find('.showPassword').on('click', (e) => {
				const btnIcon = $(e.currentTarget).find('.icon i');
				const passwordVal = el.login.val();

				if (btnIcon.is('.fa-eye')) {
					btnIcon.removeClass('fa-eye');
					btnIcon.addClass('fa-eye-slash');

					el.login.attr('type', 'text');
				} else {
					btnIcon.addClass('fa-eye');
					btnIcon.removeClass('fa-eye-slash');

					el.login.attr('type', 'password');
				}

				/**
				 * When input type is changed, the caret will be
				 * automatically moved to the start. This
				 * code returns to the end of input.
				 *
				 * Type change is async action, so giving 10ms
				 * to the DOM to get done the change.
				 */
				setTimeout(() => {
					el.login[0].setSelectionRange(passwordVal.length, passwordVal.length);
				}, 10);
			});

			el.c.find('.inputUploadFile').on('change', function(file){

				console.log('file!!!', file.path);

				globalpreloader(true);

				return proxy.system.request('set.node.createWallet', {}).then(r => {

					return proxy.system.request('set.node.sethdseedfromdump', {path: this.files[0].path}).then(mnemonic => {

						globalpreloader(false);
						
						if (essenseData.success)
							essenseData.success(mnemonic);

						self.closeContainer();
						
						console.log('r importwallet: ', mnemonic);
					

					})

				}).catch(e => {

					globalpreloader(false);


					if (e.code && e.message)
						sitemessage(`(${self.app.localization.e('dcode')} ${e.code}): ${e.message}`, null, 5000)
					else
						sitemessage(`Unknown error`)

					self.closeContainer()


				})


			})

	       
		}

		var make = function(){
		}

		return {

			primary : primary,

			id : id,

			getdata : function(clbk, p){

				proxy = deep(p, 'settings.essenseData.proxy')

				var data = {
				};

				clbk(data);

			},

			destroy : function(){
				el = {};
			},
			
			init : function(p){

				el = {};
				el.c = p.el.find('#' + self.map.id)

				el.login = el.c.find(".loginValue");
				el.enter = el.c.find('.enter');

				essenseData = p.essenseData || {};
				initialParameters = p;

				initEvents(p);

				make();

				p.clbk(null, p);

			},

			tooltip : {
				options : {
					position : 'left',
					functionPosition: function(instance, helper, position){
				        position.coord.top = 10;
				        position.coord.left += 10;

				        return position;
				    }
				},
				event : 'mouseenter'
				
			},

			wnd : {
				class : 'importwalletwnd normalizedmobile maxheight'
			}
		}
	};

	self.run = function(p){

		var essense = self.addEssense(essenses, Essense, p);

		self.init(essense, p);

	};

	self.stop = function(){

		_.each(essenses, function(essense){

			window.rifticker.add(() => {
				essense.destroy();
			})

		})

	}

	return self;
})();


if(typeof module != "undefined")
{
	module.exports = importwallet;
}
else{

	app.modules.importwallet = {};
	app.modules.importwallet.module = importwallet;

}