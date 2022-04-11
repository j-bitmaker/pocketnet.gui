var complain = (function(){

	var self = new nModule();

	var essenses = {};

	var Essense = function(p){

		var primary = deep(p, 'history');

		var el, ess, sobj, selected, ed, textreason;

		var reasons = {

			post : [
				{
					name : self.app.localization.e('complainPorn'),
					gid : 1
				},
				{
					name : self.app.localization.e('complainPedo'),
					gid : 2
				},
				{
					name : self.app.localization.e('complainViolence'),
					gid : 3
				},
				{
					name : self.app.localization.e('complainNarco'),
					gid : 4
				}

			]			

		}


		var actions = {
			find : function(id){
				return _.find(reasons[ess], function(r){
					return (r.gid || r.id) == id
				})
			},			

			complain : function(clbk){

				self.app.platform.sdk.ustate.me(function(mestate){

					if(ess == 'post'){
							
						if(mestate && !mestate.trial){
							var complainContent = sobj.complain(selected);

							topPreloader(30);

						
							self.sdk.node.transactions.create.commonFromUnspent(

								complainContent,

								function(tx, error){

									topPreloader(100)

									if(!tx){

										self.app.platform.errorHandler(error, true)	
										
										if (clbk)
											clbk()
									}
									else
									{				
										
										successCheck()

										if (clbk)
											clbk(true)
									}

								}
							)
						}	

						else{

							var reason = ((actions.find(selected) || {}).name) || selected;

							self.app.complainletters.post({
								reason,
								address : mestate.address,
								postid : sobj.txid
							}, function(r){

								successCheck()
								
								if (clbk)
									clbk(r)
							})
						}

						
							
						

					}

					if(ess == 'user' && textreason){

						console.log(textreason, sobj.address, mestate.address)

						self.app.complainletters.user({
							reason : textreason,
							address1 : mestate.address,
							address2 : sobj.address
						}, function(r){

							successCheck()
							
							if (clbk)
								clbk(r)
						})

					}

				})

				
			},	

			nextActive : function(){

				if(selected || textreason){

					el.next.removeClass('disabled')

				}
				else
				{
					el.next.addClass('disabled')
				}
			},
		}

		var events = {
			close : function(){
				self.closeContainer();
			},

			complain : function(){

				if(!el.next.hasClass('disabled') && (selected || textreason)){

					actions.complain(function(r){

						if(r){
							self.closeContainer();

							if (ed.success)
								ed.success()
						}
						
					})
				}

			},

			

			select : function(){
				var id = $(this).attr('reason')

				var reason = actions.find(id);

				if (reason){

					if($(this).hasClass('active')){

					}
					else
					{
						el.c.find('.reason').removeClass('active');

						selected = null

						$(this).addClass('active')

						selected = reason.gid						

						actions.nextActive()
					}

				}
			}
		}

		var renders = {
			reasons : function(){
				self.shell({
					name :  'reasons',
					inner : html,
					el : el.reasons,
					data : {
						reasons : reasons[ess]
					},

				}, function(p){
					p.el.find('.reason').on('click', events.select)
				})
			}

		}

		var state = {
			save : function(){

			},
			load : function(){
				
			}
		}

		var initEvents = function(){
			
			el.c.find('.cancel').on('click', events.close)

			el.next.on('click', events.complain)

			el.c.find('textarea').on('keyup', function(){
				textreason = $(this).val()
				actions.nextActive()
			})
		}

		var make = function(){
			renders.reasons()
		}

		return {
			primary : primary,

			getdata : function(clbk, p){

				selected = null;
				textreason = ''

				ess = deep(p, 'settings.essenseData.item') || 'post';

				sobj = deep(p, 'settings.essenseData.obj') || null;

				ed = p.settings.essenseData || {};

				if (sobj){
					var data = {
						ess : ess
					};

					clbk(data);
				}

			},

			destroy : function(){
				el = {};
			},
			
			init : function(p){

				state.load();

				el = {};
				el.c = p.el.find('#' + self.map.id);
				el.reasons = el.c.find('.reasons')
				el.next = el.c.find('.next')

				initEvents();

				make()

				p.clbk(null, p);
			},
			wnd : {
				class : 'withoutButtons transparent small complain'
			}
		}
	};



	self.run = function(p){

		var essense = self.addEssense(essenses, Essense, p);

		self.init(essense, p);

	};

	self.stop = function(){

		_.each(essenses, function(essense){

			essense.destroy();

		})

	}

	return self;
})();


if(typeof module != "undefined")
{
	module.exports = complain;
}
else{

	app.modules.complain = {};
	app.modules.complain.module = complain;

}