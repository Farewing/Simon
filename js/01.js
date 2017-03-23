$(document).ready(function() {

	var AudioContext = window.AudioContext || window.webkitAudioContext || false;

	if (!AudioContext) {
		alert('Sorry, but the Web Audio API is not supported by your browser.' + ' Please, consider downloading the latest version of ' + 'Google Chrome or Mozilla Firefox');
	} else {

		var audioCtx = new window.AudioContext();
		var frequencies = [380, 340, 300, 260];

		var oscillator = audioCtx.createOscillator();
		oscillator.frequency.value = 110;
		oscillator.type = 'triangle';
		oscillator.start(0.0);
		var errNode = audioCtx.createGain();
		oscillator.connect(errNode);
		errNode.gain.value = 0;
		errNode.connect(audioCtx.destination);

		// var mediaElementSource = audioCtx.createMediaElementSource($('#audio'));
		// var winNode = audioCtx.createGain();
		// mediaElementSource.connect(winNode);
		// winNode.gain.value = 0;
		// winNode.connect(audioCtx.destination);

		var ramp = 0.05;
		var vol = 0.5;
		var data;

		var oscillators = frequencies.map(function(frq) {
			var osc = audioCtx.createOscillator();
			osc.type = 'sine';
			osc.frequency.value = frq;
			osc.start(0.0); //delay optional parameter is mandatory on Safari
			return osc;
		});

		var gainNodes = oscillators.map(function(osc) {
			var g = audioCtx.createGain();
			osc.connect(g);
			g.connect(audioCtx.destination);
			g.gain.value = 0;
			return g;
		});

		function playErrTone() {
			errNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + ramp);
			//console.log("playErrTone.....................");
		};

		function stopErrTone() {
			errNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
		};


		function playGoodTone(num) {
			gainNodes[num].gain.linearRampToValueAtTime(vol, audioCtx.currentTime + ramp);
		};

		function stopGoodTones() {
			gainNodes.forEach(function(g) {
				g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
			});
		};

		function playHappyTones() {
			game.media.play();
			game.reppTime = setTimeout(function(){
				game.media.pause();
			},15000);		

		}

		var game = {};

		game.reset = function() {
			this.init();
			this.strict = false;
		}

		game.init = function() {
			this.sequence = [];
			this.lock = true;
			this.count = 0;
			this.index = 0;
			this.media = document.getElementById("audio");
		};

		function gameStart() {
			resetTimers();
			game.media.pause();
			$('.count').text('--').removeClass('led-off');
			showMessage("--", 1);
			game.init();
			addStep();
		}

		function resetTimers() {
			clearInterval(game.seqItval);
			clearInterval(game.ctItval);
			clearInterval(game.cttItval);
			clearTimeout(game.sqTime);
			clearTimeout(game.repTime);
		}

		function toggleStrict() {
			$('#mode-led').toggleClass('led-on');
			game.strict = !game.strict;
		}

		function light(num) {
			playGoodTone(num);
			game.currPush = $('#' + num);
			game.currPush.addClass('light');
			console.log("点灯");
		}

		function outlight() {
			stopGoodTones();
			if (game.currPush)
				game.currPush.removeClass('light');
			console.log("guandeng   ");
			game.currPush = undefined;

		}

		function showMessage(msg, times) {
			$('.count').text(msg);
			var rep = function() {
				$('.count').addClass('led-off');
				game.repTime = setTimeout(function() {
					$('.count').removeClass('led-off');
				}, 250);
			};
			rep();
			var cnt = 0;
			game.ctItval = setInterval(function() {
				rep();
				cnt++;
				if (cnt == times)
					clearInterval(game.ctItval);
			}, 500);
		}

		function showSequence() {
			var i = 0;
			game.index = 0;
			game.seqItval = setInterval(function() {
				displayCount();
				game.lock = true;
				light(game.sequence[i]);
				game.sqTime = setTimeout(outlight, 500);
				i++;
				if (i == game.sequence.length) {
					clearInterval(game.seqItval);
					$('.push').removeClass('unclickable').addClass('clickable');
					game.lock = false;
					game.sqTime = setTimeout(notifyError, 5000);
				}
			}, 800);
		}

		function addStep() {
			//game.timeStep = setTimeStep(game.count++);
			game.count++;
			game.sequence.push(Math.floor(Math.random() * 4));
			game.sqTime = setTimeout(showSequence, 500);
		};

		function displayCount() {
			var p = (game.count < 10) ? "0" : "";
			$('.count').text(p + (game.count + ''));
		}

		function notifyWin() {
			var cnt = 0;
			playHappyTones();
			game.cttItval = setInterval(function() {
				$('.push').addClass('light');
				game.toHndl = setTimeout(function() {
					$('.push').removeClass('light');
				}, 100);
				cnt++;
				if (cnt === 20) {
					clearInterval(game.cttItval);
				}
			}, 200);

			showMessage('**', 7);
		}

		function notifyError(obj) {
			game.lock = true;
			$('.push').removeClass('clickable').addClass('unclickable');
			var repp = function() {
				obj.addClass('light');
				playErrTone();
				game.reppTime = setTimeout(function() {
					obj.removeClass('light');
					stopErrTone();
				}, 250);
			};
			var j = 0;
			if (obj) {
				repp();
				game.cttItval = setInterval(function() {
					repp();
					j++;
					if (j == 2)
						clearInterval(game.cttItval);
				}, 300);
			}
			game.sqTime = setTimeout(function() {
				if (game.strict)
					gameStart();
				else
					showSequence();
			}, 2500);

			showMessage('!!', 2);
		}

		function pushColor(obj) {
			if (!game.lock) {
				clearTimeout(game.sqTime);
				var pushNum = obj.attr('id');
				if (pushNum == game.sequence[game.index] && game.index < game.sequence.length) {
					light(pushNum);
					//game.lastPush = obj;
					game.index++;
					if (game.index == 1) {
						$('.push').removeClass('clickable').addClass('unclickable');
						game.sqTime = setTimeout(notifyWin, 800);
					} else if (game.index < game.sequence.length) {
						game.sqTime = setTimeout(notifyError, (game.index < 10) ? 5000 : 8000);
					} else {
						$('.push').removeClass('clickable').addClass('unclickable');
						addStep();
					}
				} else {
					$('.push').removeClass('clickable').addClass('unclickable');
					notifyError(obj);
				}
			}
		}

		$(".slot").on("click", function() {
			$("#pwr-sw").toggleClass("sw-on");
			if ($("#pwr-sw").hasClass("sw-on") == true) {
				$(".count").removeClass("led-off");
				$("#start").on("click", gameStart);
				$("#strict").on("click", toggleStrict);
			} else {
				game.reset();
				$('.count').text('--');
				$('.count').addClass('led-off');
				$('#mode-led').removeClass('led-on');
				$('.push').removeClass('clickable').addClass('unclickable');
				$('#start').off('click');
				$('#strict').off('click');
				resetTimers();
			}
		});

		$('.push').mousedown(function() {
			pushColor($(this));
		});

		$('*').mouseup(function(e) {
			e.stopPropagation();
			if (!game.lock)
				outlight();
		});

		game.reset();
	}

});