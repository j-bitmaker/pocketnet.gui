var checkDiskSpace = require('check-disk-space').default


var nodecontrol = (function(){

	var self = new nModule();

	var essenses = {};

	var Essense = function(p){

		var primary = deep(p, 'history');

		var el, api = null, proxy = null,  info = null, system = null, step = 1, imported = false, 
		nodeLoading = true, getListwallets = true, listwalletsError = false, lastState = {}, history, 
		exchange = 'common', stakereport, loadFolder = false;

		var market_keys = {
			'mercatox' : 'last_price',
			'digifinex' : 'last',
			'bitforex' : 'last',
			'common' : 'last'
		}

		var transactionTypes = {
			0: 'Not Supported',
	
			1: 'PKOIN',
			2: 'Coinbase',
			3: 'Coinstake',
	
			100: 'Account (User)',
			101: 'Account (Video Server)',
			102: 'Account (Message Server)',
			103: 'Account Settings',
	
			200: 'Post',
			201: 'Video',
			202: 'Article',
			// 203: 'Server Ping',
	
			204: 'Comment',
			205: 'Comment (Edit)',
			206: 'Comment (Delete)',
	
			207: 'Delete Content',
	
			208: 'Boost Content',
	
			300: 'Rating',
			301: 'Rating (Comment)',
	
			302: 'Follow',
			303: 'Follow (Private)',
			304: 'Unfollow',
	
			305: 'Blocking',
			306: 'Unblocking',
	
			307: 'Complain',
	
			400: 'Moderation Request',
			401: 'Moderation Register',
			410: 'Moderation Flag',
			420: 'Moderation Vote',
		}

		var systemsettings = {
		
			'nodeenabled' : function(){

				if (system.node.enabled){

					var items = [{
						text : self.app.localization.e('easyNode_e10039'),
						action : function (clbk) {

							return proxy.system.request('set.node.enabled', {enabled : false}).then(r => {
								clbk()

								actions.refresh().then(r => {
									actions.refreshsystem()
								})
								
							})
						}
					}]

					menuDialog({
						items: items
					})

				}
				else{

					var items = [{
						text : self.app.localization.e('easyNode_e10040'),
						action : function (clbk) {

							getListwallets = true;
							nodeLoading = true;


							return proxy.system.request('set.node.enabled', {enabled : true}).then(r => {
								actions.refresh().then(r => {
									actions.refreshsystem()
								})

								clbk()
							})

						
						}
					}]

					menuDialog({
						items: items
					})

					

				}
			},
			
			'binPath' : function(caller, defaultPath){
				return proxy.system.request('set.node.binPath', {defaultPath: defaultPath}).then(r => {
					actions.refresh().then(r => {
						actions.refreshsystem()
					})
				}).catch(e => {

				})
			},
			'ndataPath' : function(caller, defaultPath){
				console.log('ndataPath!!!!!!!!!!!', defaultPath);

				if (loadFolder){
					return;
				}

				loadFolder = true;

				return proxy.system.request('set.node.ndataPath', {defaultPath: defaultPath}).then(r => {
					actions.refresh().then(r => {
						loadFolder = false;
						actions.refreshsystem()
					})
				}).catch(e => {
					loadFolder = false;
				})


			},
			'createWallet' : function(caller, defaultPath){

				new dialog({
					html : self.app.localization.e('createwalletq'),
					btn1text :  self.app.localization.e('yes'),
					btn2text :  self.app.localization.e('no'),

					class : 'zindex',

					success : function(){

						topPreloader(100);

						return proxy.system.request('set.node.createWallet', {}).then(r => {

							topPreloader(0);

							return proxy.system.request('set.node.gethdseed', {}).then(mnemonic => {
								
								console.log('r mnemonic: ', mnemonic);

								imported = true;
								renders.all();
								
								app.nav.api.load({
		
									open: true,
									inWnd: true,
									href: 'hdseed',
					
									essenseData: {
										proxy : proxy,
										mnemonic: mnemonic,
										dumpkey: true,
										showsavelabel : false,
			
									},
					
									clbk: function (p, s) {
					
									}
								})
		
							})
		
						}).catch(e => {

							topPreloader(0);

							if (e.code && e.message)
								sitemessage(`(${self.app.localization.e('dcode')} ${e.code}): ${e.message}`, null, 5000)
							else
								sitemessage(`Unknown error`)
		
						})

					}
				})


				
			},
            'dumpWallet' : function(caller, defaultPath){
				return proxy.system.request('set.node.dumpWallet', {}).then(r => {

                    if (r.filename)
                        sitemessage(`${self.app.localization.e('easyNode_e10041')} ${r.filename}`, null, 5000) // self.app.localization.e('successcopied')

				}).catch(e => {
                    if (e.code && e.message)
                        sitemessage(`(${self.app.localization.e('dcode')} ${e.code}): ${e.message}`, null, 5000)
                    else
                        sitemessage(`Unknown error`)
				})
			},
            'importWallet' : function(caller, defaultPath){

				self.app.nav.api.load({
					open : true,
					id : 'importwallet',
					inWnd : true,
					essenseData : {
						proxy : proxy,
						success : function(mnemonic){

							console.log("success!!!", mnemonic);

							sitemessage(`${self.app.localization.e('easyNode_e10042')}`, null, 5000);

							imported = true;

							renders.all();


						}

					}, 
				})

			},
		}

		var rif = null

		var calc = {
			netstakeweight : function(){
				return (deep(info, 'netstakeweight') || 189015830589274) / 100000000
			},
			point : function(t){

				var r = amount / calc.netstakeweight()
				var n = 1

				return amount * Math.pow( (1 + 1440 * 4.75 / calc.netstakeweight() ),  t)

			},

			price : function(c, currency){ //00
				if(!c) c = 0

				if(history && history[exchange] && history[exchange].length > c){

					var lexc = history[exchange][history[exchange].length - 1 + c]

					if (lexc && lexc.prices[currency]){
						return Number(lexc.prices[currency].data[market_keys[exchange]]|| '0')
					} 

					if(lexc && !lexc.prices[currency]) {

						var markets = Object.keys(market_keys)
						var index = markets.indexOf(exchange)


						if (index >= 0) {
							markets.splice(index, 1)
						}

						var max_result = markets.map(item => {

							if(!history[item]){
								return '0'
							}

							var price_log = history[item][history[item].length - 1]

							if(!price_log.prices[currency]) return '0'

							return Number(price_log.prices[currency].data[market_keys[item]] || '0')
						})

						max_result.push(0)

						return Math.max.apply(null, max_result)
					}

				}

				return 0
			},

			prevprice : function(c, currency){
				var i = -1
				var prevprice = 0
				var price = this.price(null, currency)

				do{
					prevprice = this.price(i, currency)
					i--
				}
				while(prevprice > 0 && (prevprice - price == 0))

				return prevprice
			},	

			stakereportseries : function(){

				var p = [];

				_.each(stakereport, function(pn, date){

					var d = new Date(date);
					var y = Number(pn);

					if (String(d) == 'Invalid Date' || Number.isNaN(y) ) return false;
											
					p.push({
						x : fromutc(d),
						y : y
					})

				})

				return p
			}

		}

		var actions = {

			loadhistory : function(clbk){ //00
				self.app.api.fetch('exchanges/history').then(result => {

					history = result.prices


					if(clbk) clbk()
				})
			},

			percToSum : function(perc, input){

				var sum = info.nodeControl.state.wallet.total * (perc / 100) / 100000000;

				input.val(sum);
			},

			sumToPerc : function(sum){

				sum = Number(sum);

				console.log('sum!!!', sum);

				var perc = Number(sum / (info.nodeControl.state.wallet.total / 10000000000)).toFixed(2);

				return perc


			},

			listwallets : function(){

				console.log('listwallets');
				
				proxy.fetchauth('manage', {
					action : 'set.node.wallet.listwallets',
					data : {}
				}).then(r => {

					console.log('listwallets success:', r);


					if (r && r.length){

						imported = true;

					} 

					listwalletsError = false;

					nodeLoading = false;					

					renders.all();



				}).catch(e => {
					
					console.log('listwallets err:', e)
					listwalletsError = true;
					nodeLoading = false;
					renders.all();

				})
			},

			refreshsystem : function(){
				return proxy.system.api.get.settings().then(s => {
					system = s

					renders.all()
				})
			},
			refresh : function(){
				return proxy.get.info().then(r => {

					this.tick(r.info)

					renders.all()

					return Promise.resolve()
				})
			},
			allsettings: function(){
				renders.all()
			},
			tick : function(state){
				info = state;

			},
			ticksettings : function(settings, s, changed){


				console.log('ticksettings!!!!!!!!!!!', s);
				if (changed){
					system = settings
				}

				if (rif){
					rifticker.cancel(rif)
                    ///cancelAnimationFrame(rif)
                }

				rif = rifticker.add((i) => {

					if (info.nodeControl.hasbin && (system && system.node && !system.node.enabled && getListwallets)){

						getListwallets = false;
						nodeLoading = false;
						renders.all();

					}

					if (!info.nodeControl.lock && system && system.node && system.node.enabled && info.nodeControl.hasbin && getListwallets){

						console.log('info.nodeControl.state', info.nodeControl.state);
						
						if (getListwallets){

							if (info.nodeControl.state && !_.isEmpty(info.nodeControl.state.info)){

								getListwallets = false;

								actions.listwallets();

							}

							if (info.nodeControl.state.status === 'stopped'){
								getListwallets = false;
								nodeLoading = false;
								renders.all();
							}


						}

					}
					
					var newState = {
						step: step,
						test : s.test,
						hasbin: s?.nodeControl?.hasbin,
						lock: s?.nodeControl?.lock,
						other: s?.nodeControl?.other,
						hasapplication: s?.nodeControl?.hasapplication,
						status: s?.nodeControl?.state?.status,
						info: _.isEmpty(s?.nodeControl?.state?.info || {}),
						enabled: system.node.enabled,
						hasUpdate: s?.nodeControl?.state?.hasUpdate,
						imported: imported,
					};
					
					let compareState = compareObjects(lastState, newState);
					let compareNodeControl = compareObjects(s.nodeControl, info.nodeControl)

					console.log('compareState:', compareState, compareNodeControl);

					lastState = newState;

					info = s;
					rif = null;

					if (info?.nodeControl?.state?.wallet) info.nodeControl.state.wallet.total = 15400000000;

					if (el.c){

						if (!compareState || info?.nodeControl?.lock == 'installing'){
				
							renders.nodelanding(el.c)
							renders.electronfornode()
	

							renders.nodecontentmanage(el.c, function(){
								renders.nodecontentstate(el.c)
								renders.nodecontentmanagewallet(el.c)
							})

						} else if (!compareNodeControl){

							renders.nodecontentstate(el.c)

						}
						
					}

				})
				
			},
			admin : function(){

				var address = self.app.user.address.value

				if(!address) return false

				if (proxy && info){
					return proxy.direct || _.indexOf(info.admins, address.address) > -1
				}

			},
			settings : function(el){
				el.find('[sys]').on('click', function(){
					var sys = $(this).attr('sys')
                    var path = $(this).attr('path')

					if (sys){
						var s = deep(systemsettings, sys)

						if (s) s($(this), path)
					}
				})
			},
			updateNode : function(){

				proxy.fetchauth('manage', {
					action : 'node.update',
					data : {
						all : 'all'
					}
				}).then(r => {

					actions.refresh().then(r => {
						renders.all()
					})

					topPreloader(100);

				}).catch(e => {

					sitemessage(self.app.localization.e('e13293'))

					actions.refresh().then(r => {
						renders.all()
					})

					topPreloader(100);

				})
			},
			installNode : function() {

				proxy.fetchauth('manage', {
					action : 'node.install',
					data : {}
				}).then(r => {

                    proxy.system.request('set.node.enabled', {enabled : true}).then(r => {

                        actions.refresh().then(r => {
                            renders.all()
                            topPreloader(100);
                        })
                        
                    })

				}).catch(e => {

					sitemessage(self.app.localization.e('e13293'))

					actions.refresh().then(r => {
						renders.all()
					})

					topPreloader(100);

				})
			},
			removeNode : function(all){

				proxy.fetchauth('manage', {
					action : 'node.delete',
					data : {
						all : all
					}
					
				}).then(r => {


					actions.refresh().then(r => {
						renders.all()
					})

					topPreloader(100);

				}).catch(e => {

					sitemessage(self.app.localization.e('e13293'))

					actions.refresh().then(r => {
						renders.all()
					})

					topPreloader(100);

				})
			},
		}

		var events = {
			
		}

		var lock = function(){
			el.c.find('.nodecontentmanage').addClass('lock')
		}

		var helpers = {
			series : function(){



				/*var data = _.map(blocktime, function(bt, i){
					return {
						y : calc.point(bt.block),
						x :i 
					}
				})*/
				return [{
					name : "Staking statistics",


					lineWidth: 3, // Make the line bold
					fillOpacity: 0.3, // Make the area more prominent with opacity
					color: "rgba(52, 72, 240, 0.6)",// Line color
					fillColor:  "rgba(52, 72, 240, 0.2)", // Area color (same as line)

					data : calc.stakereportseries()
				}]
			}
		}

		var chart = {
			prepare : function(el){
				var graph = new self.app.platform.objects.graph({
					el : el,
					shell : self.shell,
					// chart : {
					// 	caption : "Coins",
					// 	height : 470,
					// 	width : 670,
					// 	type : 'spline',
					// 	xtype : 'datetime',
					// 	yGridLineWidth : 0,
					// 	ypadding : 0,
						
					// },
					// chart: {
					// 	"type": "spline",
					// 	"caption": "Fork",
					// 	"removeLegend": true,
					// 	"disableYLabels": true,
					// 	"height": 150
					// },
					chart: {
						type: "area",
						xtype: "datetime",
						caption: "Texts count",
						yAxisOpposite: false,		
					}
				})

				graph.series = helpers.series(); 

				return graph
			},
			graph : function(_el, clbk){

				graph = chart.prepare(_el)

				graph.render({
					maxPointsCount : 10,
					prepareOptions : function(p){
						p.plotOptions.series = {
							states : {
								inactive: {
									opacity: 1
								},
								enableMouseTracking: false,
								hover : {
									halo: {
										size: 0,
									},
									enabled : false
								}
							}
						}

						p.plotOptions.spline = {
							animation: false,
							lineWidth: 1,
							marker: {
								enabled: false
							},
							states: {
								enableMouseTracking: false,
								hover: {
									enabled: false,
									lineWidth: 1,
									lineWidthPlus: 0,
									marker: {
										fillColor: "#000",
										lineColor: "#000"
									},
									halo: {
										opacity: 0
									}
								},

							}
						}
						
					}
				}, function(){

					if (clbk)
						clbk(graph, _el);

				});
				
				
			},


			pricechart : function(){

			}
		}

		var renders = {
			pricechart : function(el){

				var _el = el.find('.chart')

				console.log("_EL'", _el);

				_el.empty();

				var d = $('<div></div>', {
					class : 'chartWrapper'
				})

				_el.html(d)

				chart.graph(d, function(graph){
				})
				
			},
			all : function(){

				if (el.c){

				
					renders.nodelanding(el.c)
					renders.electronfornode()

					renders.nodecontentmanage(el.c, function(){
						renders.nodecontentstate(el.c)
						renders.nodecontentmanagewallet(el.c)
					})


					
					
				}
			},

			nodecontentmanagewallet : function(elc, clbk){
				if (actions.admin() && info.nodeControl.state.wallet) {


					self.shell({
						inner : html,
						name : 'nodecontentmanagewallet',
						data : {
							nodestate : info.nodeControl.state,
							nc : info.nodeControl,
							proxy : proxy,
							address: 'jsd382x832ksa82a'
						},

						el : elc.find('.walletWrapper')

					},
					function(p) {

                        actions.settings(p.el)

						p.el.find('.copy').on('click', function(){

							copyText(p.el.find('.address'))

							sitemessage(self.app.localization.e('waddresswascop'))
						})

						var inputSum = p.el.find('.inputSum')

						inputSum.on('change', function(){

							var v = Number($(this).val() || 0);

							var perc = actions.sumToPerc(v);

							p.el.find('.progressBar').val(perc);

						})

						inputSum.on('blur', function(){

							var v = Number($(this).val() || 0);
							var total = info.nodeControl.state.wallet.total / 100000000
							console.log('v total', v, total);

							if (v >= total){
								v = total
								p.el.find('.inputSum').val(v);
							}

							var perc = actions.sumToPerc(v);

							p.el.find('.progressBar').val(perc);
							
						})

						p.el.find('.progressBar').on('change', function(){

							var finalValue = $(this).val();
							console.log('New value after change:', finalValue);

							actions.percToSum(finalValue, inputSum);
						
						})

						p.el.find('.max').on('click', function(){

							var $range = p.el.find('.progressBar');
							var maxValue = $range.attr('max');						
							$range.val(maxValue);

							actions.percToSum(maxValue, inputSum);
						
						})

						p.el.find('.plus').on('click', function(){

							var $range = p.el.find('.progressBar');
							var currentValue = $range.val();
							var maxValue = Number($range.attr('max') || 0);
							var newValue = parseInt(currentValue) + (maxValue * 0.01); 
						
							if (newValue < maxValue) {
								$range.val(newValue);
							} else {
								newValue = maxValue
								$range.val(maxValue); 
							}

							actions.percToSum(newValue, inputSum);
						})

						p.el.find('.minus').on('click', function(){

							var $range = p.el.find('.progressBar');
							var currentValue = $range.val();
							var minValue = $range.attr('min');
							var maxValue = $range.attr('max');

							var newValue = parseInt(currentValue) - (maxValue * 0.01); 
						
							if (newValue >= minValue) {
							  $range.val(newValue);
							} else {
								newValue = minValue
							  $range.val(newValue); 
							}

							actions.percToSum(newValue, inputSum);
						})

						p.el.find('.tooltip').tooltipster({
							theme: 'tooltipster-light',
							maxWidth: 600,
							zIndex: 1006,
							position: 'bottom',
							contentAsHTML: true,
						});

						p.el.on('click', '.nodebalancedeposit', function() {
                            topPreloader(30);

                            proxy.fetchauth('manage', {
                                action : 'set.node.wallet.getnewaddress',
                                data : {}
                            }).then(r => {

                                new dialog({
                                    class : 'zindex',
                                    html : `${self.app.localization.e('easyNode_e10043')} ${r}`,
                                    btn1text : self.app.localization.e('dcopyToClipboard'),
                                    btn2text : self.app.localization.e('dcancel'),
                                    success : function(){
                                        copycleartext(r)
                                        sitemessage(self.app.localization.e('successcopied'))
                                    }
                                })
    
                            }).catch(e => {
                                sitemessage(deep(e, 'message') || self.app.localization.e('e13293'))
                            })
						})

                        p.el.on('click', '.nodebalancewithdraw', function(){

							inputDialogNew({
								caption : self.app.localization.e('easyNode_e10044'),
								class : 'addressdialog',
								wrap : true,
								values : [
                                    {
                                        defValue : '',
                                        validate : 'empty',
                                        placeholder : "Address",
                                        label : self.app.localization.e('easyNode_e10045')
                                    },
                                    {
                                        defValue : 0,
                                        validate : 'empty',
                                        placeholder : "Amount",
                                        label : `${self.app.localization.e('easyNode_e10046')} (PKOIN)`
                                    }
                                ],
								success : function(v){
                                    topPreloader(30)

                                    if (v.length < 2) {
                                        sitemessage(self.app.localization.e('easyNode_e10047'))
                                        return false
                                    }

                                    if (v[0].length != 34) {
                                        sitemessage(self.app.localization.e('easyNode_e10048'))
                                        return false
                                    }

                                    if (isNaN(Number(v[1]))) {
                                        sitemessage(self.app.localization.e('easyNode_e10049'))
                                        return false
                                    }

                                    proxy.fetchauth('manage', {
                                        action : 'set.node.wallet.sendtoaddress',
                                        data : {
                                            address: v[0],
                                            amount: Number(v[1])
                                        }
                                    }).then(r => {

                                        new dialog({
                                            class : 'zindex',
                                            html : `${self.app.localization.e('easyNode_e10050')} {r}`,
                                            btn1text : self.app.localization.e(self.app.localization.e('dcopyToClipboard')),
                                            btn2text : self.app.localization.e('dcancel'),
                                            success : function() {
                                                copycleartext(r)
                                                sitemessage(self.app.localization.e('successcopied'))
                                            }
                                        })
            
                                    }).catch(e => {
                                        sitemessage(deep(e, 'message') || self.app.localization.e('e13293'))
                                    })
								}
							})

						})

						// setTimeout(function(){

						// 	proxy.fetchauth('manage', {
						// 		action : 'set.node.wallet.listaddresses',
						// 		data : {}
						// 	}).then(r => {
	
						// 		console.log('new addresses r!!!!!!!!!!!', r);
	
						// 	}).catch(e => {
						// 		console.log('e!!!!!!!!!!!', e);
						// 	})

						// }, 70000)

						

						if (clbk)
							clbk()
					})
				}
			},
			nodelanding : function(elc, clbk){

				if(!info){
					return
				}

				self.shell({
					inner : html,
					name : 'landing',
					data : {
						nc : info.nodeControl,
						system : system,
					},

					el : elc.find('.landing')

				},
				function(p){

					p.el.find('.learnmore').on('click', function(){
						

						self.nav.api.go({
							href : 'easynode',
							history : true,
							open : true,
							inWnd : true,

							essenseData : {
								action : function(){

									globalpreloader(true)

									setTimeout(function(){

										new dialog({
											class : 'zindex',
											html : self.app.localization.e('easyNode_e10054'),
											btn1text : self.app.localization.e('dyes'),
											btn2text : self.app.localization.e('dno'),
											success : function(){
			
												lock()
												actions.installNode()
												
											}
										})

										globalpreloader(false)

									}, 600)

									

								}
							}
						})	

					})

					if (clbk)
						clbk()
				})

			},
			nodecontentmanage : function(elc, clbk){
				if(actions.admin()) {

					var timestamp = deep(info, 'nodeControl.state.timestamp')
					var dis = false

					if (timestamp && info.nodeControl.hasbin){
						dis = (new Date()) < ((new Date(timestamp)).addSeconds(5))
					}

					console.log('info.nodeControl', info.nodeControl, system.node, imported);

					self.shell({
						inner : html,
						name : 'nodecontentmanage',
						data : {
							step: step,
							test : info.test,
							nodestate : info.nodeControl.state,
							nc : info.nodeControl,
							proxy : proxy,
							system : system,
							dis : false,
							showdirect : true,
							imported: imported,
							nodeLoading: nodeLoading,
							listwalletsError: listwalletsError
						},

						el : elc.find('.manage')

					},
					function(p){
						
						proxy.system.request('set.node.wallet.listtransactions', 
							{
								label: '*',
								number: 10, 
								page: 0,
								include_watchonly: false
							}
						)
						.then(transactions => {
							console.log('a!!!!!!!!!!', transactions);

							transactions = [{
								txid: '0x1Fe2Dxjdsjzkjsdklsdjxjsllie593B9',
								type: 3,
								date: 1747834108546,
								amount: -0.0033
							}]

							self.shell({
								inner : html,
								name : 'nodecontenthistory',
								data : {
									transactions: transactions,
									transactionTypes: transactionTypes
								},
		
								el : p.el.find('.historyWrapper')
		
							}, function(p){

								p.el.find('.copy').on('click', function(){

									var full = $(this).attr('txid');

									copycleartext(full)
									sitemessage(self.app.localization.e('successcopied'))
								})

							})

							self.shell({
								inner : html,
								name : 'faq',
								data : {
									
								},
		
								el : p.el.find('.faqWrapper')
		
							}, function(p){

								var lorem = [
									'Это случайный текст-рыба, призванный показать, как будет выглядеть содержимое в раскрытом состоянии. Он не несет смысловой нагрузки и используется только для демонстрации.',
									'Ещё немного случайного содержания. Здесь можно разместить подробные ответы, ссылки и пояснения по теме вопроса.',
									'Третий блок текста. При необходимости разделите ответ на абзацы и списки, чтобы улучшить читаемость.',
									'Четвёртый фрагмент. Вы можете заменить эти тексты на реальные ответы позднее.',
									'Пятый фрагмент. Обратите внимание, что разворачивание работает плавно и не вызывает скачков макета.',
									'Шестой фрагмент. Содержимое подгоняется под ширину контейнера и корректно переносится.'
								]

								var $list = p.el.find('.faq-section .accordion-list');

								$list.find('.accordion-item').each(function(i){
									var txt = lorem[i % lorem.length]
									$(this).find('.accordion-text').text(txt)
								})

								var lockScrollTop = function(cb){
									var $win = p.el.closest('.customscroll');
									var restore = null;

									if ($win.length){
										var prev = $win.scrollTop();
										var headerOffset = 0;
										restore = function(){
											$win.scrollTop(prev + headerOffset);
										}
									}

									cb();

									if (restore) restore();
								}

								$list.on('click', '.accordion-item', function(e){
									var $item = $(this);

									lockScrollTop(function(){
										if ($item.hasClass('active')){
											$item.removeClass('active')
										} else {
											$list.find('.accordion-item.active').removeClass('active')
											$item.addClass('active')
										}
									})
								})

							})

							
						})
						.catch(e => {

							return Promise.reject(e)
						})

						proxy.system.request('set.node.wallet.getstakereport')
						.then(d => {

							console.log('d!!!!!!!!???', d);

							stakereport = d

							actions.loadhistory(function(){

								renders.pricechart(p.el)
		
							})

						}).catch(err => {
							console.log('errrr????', err);
						})


						enabledInstall = 0;

						var toggleEnabled = function(num){

							enabledInstall = num;

							if (enabledInstall === 1){

								p.el.find('.nodecontentmanage .second').addClass('enabled');
								p.el.find('.nodecontentmanage .second').removeClass('error');

							} else if (enabledInstall === -1){

								p.el.find('.nodecontentmanage .second').removeClass('enabled');
								p.el.find('.nodecontentmanage .second').addClass('error');

							} else {

								p.el.find('.nodecontentmanage .second').removeClass('enabled');
								p.el.find('.nodecontentmanage .second').removeClass('error');
							}
						}

						var toggleDiskSpace = function(){

							checkDiskSpace(info.nodeControl.node.dataPath).then((diskSpace) => {

								var freeGB = (diskSpace.free / 1000 / 1000 / 1000).toFixed(1);
								var sizeGB = (diskSpace.size  / 1000 / 1000 / 1000).toFixed(1);

								console.log("freeEl", p.el.find('.free'));
								p.el.find('.free').text(String(freeGB));
								p.el.find('.size').text(String(sizeGB));

								toggleEnabled(freeGB > 150 ? 1 : -1)

								console.log('diskspace', diskSpace, freeGB, sizeGB);

								
							})
						}

						if (step === 2){
							toggleDiskSpace();
						}

						console.log('ppppppp!!!!!!', p)

						p.el.find('.choosePath').on('click', function(){
							

							systemsettings.ndataPath();


						})

						p.el.find('.start').on('click', function(){

							step = 2;
							p.el.find('.notinstalled').addClass('second');

							toggleDiskSpace();

						})

						p.el.find('.back').on('click', function(){

							step = 1;

							toggleEnabled(0);
							p.el.find('.notinstalled').removeClass('second');

							
						})

						actions.settings(p.el)

						p.el.find('.removenode').on('click', function(){
							new dialog({
								class : 'zindex',
								html : self.app.localization.e('easyNode_e10053'),
								btn1text : self.app.localization.e('dyes'),
								btn2text : self.app.localization.e('dno'),
								success : function(){
									lock()
									actions.removeNode()
									
								}
							})
						})

						p.el.find('.install').on('click', () => {

							if (!system.node.ndataPath){
								return sitemessage(self.app.localization.e('easyNode_e10009'));
							}

							if (enabledInstall === 0){
								return sitemessage(self.app.localization.e('e28error'));
							}


							if (enabledInstall === -1){
								return sitemessage(self.app.localization.e('eDiskSpace'));
							}

							topPreloader(20);

							new dialog({
								class : 'zindex',
								html : self.app.localization.e('easyNode_e10054'),
								btn1text : self.app.localization.e('dyes'),
								btn2text : self.app.localization.e('dno'),
								success : function(){

									lock()
									actions.installNode()
									
								}
							})

						})

                        p.el.find('.stopInstall').on('click', () => {

							
							new dialog({
								class : 'zindex',
								html : self.app.localization.e('easyNode_e10065'),
								btn1text : self.app.localization.e('dyes'),
								btn2text : self.app.localization.e('dno'),
								success : function(){

									proxy.fetchauth('manage', {
										action : 'node.breakInstall',
										data : {}
									})
									
								}
							})


						})

						p.el.find('.toDefaultPath').on('click', function(){
							new dialog({
								class : 'zindex',
								html : self.app.localization.e('easyNode_e10055'),
								btn1text : self.app.localization.e('dyes'),
								btn2text : self.app.localization.e('dno'),
								success : function(){

									globalpreloader(true)

									proxy.fetchauth('manage', {

										action : 'set.node.defaultPaths',
										data : {}

									}).then(r => {

										actions.refresh().then(r => {
											actions.refreshsystem()

											globalpreloader(false)
										})
			
									}).catch(e => {

										globalpreloader(false)
										
										sitemessage(self.app.localization.e('e13293'))
			
									})
								}
							})
						})

						p.el.find('.refreshother').on("click", function(){

							globalpreloader(true)

							proxy.fetchauth('manage', {

								action : 'set.node.check',
								data : {}

							}).then(r => {

								actions.refresh().then(r => {
									actions.refreshsystem()

									setTimeout(function(){
										globalpreloader(false)
									}, 300)
									
								})
	
							}).catch(e => {

								setTimeout(function(){
									globalpreloader(false)
								}, 300)
								
								sitemessage(self.app.localization.e('e13293'))
	
							})
						})

						if (clbk)
							clbk()
					})

				}
			},
			nodecontentstate : function(elc, clbk){
				if(actions.admin()){

					self.shell({
						inner : html,
						name : 'nodecontentstate',
						data : {
							dis : false,
							system : system,
							manager : info.nodeManager,
							nodestate : info.nodeControl.state,
							nc : info.nodeControl,
						},

						el : elc.find('.nodestateWrapper')

					},
					function(p){

						actions.settings(p.el)
						

						p.el.find('.tooltip').tooltipster({
							theme: 'tooltipster-light',
							maxWidth: 600,
							zIndex: 1006,
							position: 'bottom',
							contentAsHTML: true,
						});

						p.el.find('.updatenode').on('click', function(){
							new dialog({
								class : 'zindex',
								html : self.app.localization.e('easyNode_e10051'),
								btn1text : self.app.localization.e('dyes'),
								btn2text : self.app.localization.e('dno'),
								success : function(){

									lock()

									actions.updateNode()
									
								}
							})
						})

						p.el.find('.removenodeall').on('click', function(){
							new dialog({
								class : 'zindex',
								html : self.app.localization.e('easyNode_e10052'),
								btn1text : self.app.localization.e('dyes'),
								btn2text : self.app.localization.e('dno'),
								success : function(){
									lock()
									actions.removeNode(true)
									
								}
							})
						})
						

						if (clbk)
							clbk()
					})

				}
			},
			electronfornode : function(clbk){
				if(!actions.admin() && !(typeof _Electron != 'undefined' && _Electron)) {

					self.shell({
						inner : html,
						name : 'electronfornode',
						data : {
							
						},

						el : el.c.find('.downloadelectron')

					},
					function(p){

						self.nav.api.load({
							id : 'applications',
							open : true,
							el : p.el.find('.applicationscontainer'),

							essenseData : {
								key  :'node',
								
							}
						})

						if (clbk)
							clbk()
					})

				}
				else{
					el.c.find('.downloadelectron').html('')
				}
			}
		}

		var state = {
			save : function(){

			},
			load : function(){
				
			}
		}

		var initEvents = function() {
            
			el.c.on('click', '.collapsepart .subcaption', function(){
				$(this).closest('.collapsepart').toggleClass('expanded')
			})

			el.c.on('click', '.saveFilePath', async function(){

				try {
					const directoryHandle = await window.showDirectoryPicker();
					console.log('Selected folder path:', directoryHandle);
				  } catch (error) {
					console.error('Error choosing folder:', error);
				  }

			})
			

		}

		var destroy = function(){
			if (proxy) {
				delete proxy.system.clbks.tick.components_nodecontrol
				delete proxy.clbks.tick.components_nodecontrol
			}
		}

		var make = function(){
			destroy()

			info = null


			if (proxy) {

				proxy.system.clbks.tick.components_nodecontrol = actions.ticksettings
				// proxy.clbks.tick.components_nodecontrol = actions.tick
			
				proxy.get.info().then(r => {

					info = r.info

					if (actions.admin()) {

						return proxy.system.request('get.settings').then((r) => {
							system = r;

							return Promise.resolve();
						})
					}
				}).then(() => {
					renders.all()
				}).catch(e => {
					console.error(e)
				})
			}

			else{
				info = {}
				renders.all()
			}

			
		}

		return {

			primary : primary,

			getdata : function(clbk, p){

				api = self.app.api

				var data = {};

				proxy = deep(p, 'settings.essenseData.proxy')
				
				if(!proxy){
					proxy = typeof _Electron != 'undefined' && _Electron ? self.app.api.get.direct() : null// : api.get.current()
				}
				
				clbk(data);

			},

			destroy : function(){
				el = {};

				destroy()
			},
			
			init : function(p){

				state.load();

				el = {};
				el.c = p.el.find('#' + self.map.id);

				make(proxy);
				initEvents();

				p.clbk(null, p);
			},

			wnd : {
				class : 'wndnodecontrol withoutButtons normalizedmobile',
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
	module.exports = nodecontrol;
}
else{

	app.modules.nodecontrol = {};
	app.modules.nodecontrol.module = nodecontrol;

}