var hdseed = (function(){

	var self = new nModule();

	var essenses = {};

	var Essense = function(p){

		var primary = deep(p, 'history');

		var el, current = {}, ed = {}, mnemonicKey = '', proxy;

		var renders = {

			mnemonic : function(percent){

				var s = '';

				if(current.mnemonicMask){
					var index = (current.mnemonicMask.length * percent / 100).toFixed(0)

					_.each(current.mnemonicKey, function(l, curlindex){

						var a = _.indexOf(current.mnemonicMask, curlindex);

						if(a < index || l == ' '){
							s = s + l;
						}

						else
						{
							s = s + self.app.platform.values.alph[rand(0, self.app.platform.values.alph.length - 1)]
						}

						
					})
				}

				else{
					s = current.mnemonicKey
				}

				return s
			},

			mnemonicEffect : function(el, reverse, clbk){

				var a = indexArray(101);

				if(reverse) a.reverse()

					
				lazyEach({
					array : a,
					sync : true, 
					action : function(p){
						var percent = p.item;

						el.html(renders.mnemonic(percent))

						h = el.height();
						setTimeout(p.success, rand(1, 5));
					},

					all : {
						success : function(){

							if (clbk)
								clbk()
						}
					}
				})
			},

			key : function(clbk){

				self.shell({
					name :  'key',
					el : el.c.find(".keywrapper"),
					data : {
						mnemonicKey: mnemonicKey
					},
					animation : {
						id : 'slide',
						mnemonicKey: mnemonicKey
					},

				}, function(p){

					var m = p.el.find('.mnemonicKey')
					var name = 'pkey_'+self.app.platform.currentTime()

					renders.mnemonicEffect(m, false, function(){
						hiddenform.find('button').click();
					});

					var hiddenform = p.el.find('#loginform')

						hiddenform.on('submit', function(event) {
			
							event.preventDefault();
							event.stopPropagation();
			
							return false
						})	


					if(ed.showsavelabel) setTimeout(function(){

						hiddenform.find('.loginValue').val(current.mnemonicKey)

						p.el.find('.enter').click();
						
					}, 30) 

					p.el.find('.copy').on('click', function(){
						copyText(p.el.find('.hiddenMnemonicKey'))

						sitemessage(self.app.localization.e('successfullycopied'))
					})

					p.el.find('.save').on('click', function(){

						return proxy.system.request('set.node.dumpWallet', {}).then(r => {

							console.log('r filename', r, r.filename);

							if (r.filename)
								sitemessage(`${self.app.localization.e('easyNode_e10041')} ${r.filename}`, null, 5000) // self.app.localization.e('successcopied')

		
						}).catch(e => {
							
							if (e.code && e.message)
								sitemessage(`(${self.app.localization.e('dcode')} ${e.code}): ${e.message}`, null, 5000)
							else
								sitemessage(`Unknown error`)

						})
					})
					

					if (clbk)
						clbk(p);
				})
			},

			dontshowagain : function(){
				if (el && el.c)
					el.c.find('.dontshowagain').addClass('active')
			}
		}

		var state = {
			save : function(){

			},
			load : function(){
				
			}
		}

		var initEvents = function(){

			el.c.find('.nextaction').on('click', function(){
				self.closeContainer()

				if(isMobile() || window.cordova){
					self.app.nav.api.load({
						open : true,
						href : 'index',
						history : true,
					})

				}
			})
			
			el.c.find('.dontshowagain').on('click', function(){

				self.closeContainer()

				self.app.platform.sdk.registrations.donotshowprivate()

				/**if(isMobile()){

					self.app.nav.api.load({
		
						open : true,
						href : 'index',
						history : true,
		
					})

				}*/

			})

		}

		var make = function(){

			mnemonicKey = ed.mnemonic

			current = {}
			
			console.log('mnemonic: ',  mnemonicKey);

			if (mnemonicKey){

				current.mnemonicKey = mnemonicKey;

				current.mnemonicMask = _.shuffle(indexArray(current.mnemonicKey.length));

				current.mnemonicContent = current.mnemonicKey.split(' ')

				renders.key()

				setTimeout(function(){

					if (ed.showsavelabel)
						renders.dontshowagain()

				}, 2000)




			}
			else{

			}

			
		}

		return {
			primary : primary,

			getdata : function(clbk, p){

				var data = {};

				ed = p.settings.essenseData || {}

				data.ed = ed

				proxy = deep(p, 'settings.essenseData.proxy')
				
				if(!proxy){
					proxy = typeof _Electron != 'undefined' && _Electron ? self.app.api.get.direct() : null// : api.get.current()
				}

				clbk(data);

			},

			destroy : function(){
				el = {};
			},
			
			init : function(p){

				state.load();

				el = {};
				el.c = p.el.find('#' + self.map.id);
				
				

				initEvents();

				make()

				p.clbk(null, p);
			},
			wnd : {			
				showbetter : true,
				//header : isMobile() ? 'privatekey' : '',
				class : 'withoutButtons hdseedwnd ',
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
	module.exports = hdseed;
}
else{

	app.modules.hdseed = {};
	app.modules.hdseed.module = hdseed;

}