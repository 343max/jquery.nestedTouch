if (!console.dir) console.dir = function(a) { console.log(JSON.stringify(a)); };

jQuery.clientSupportsTouch = function() {
	return !(document.ontouchmove === undefined);
}

jQuery.fn.setWebkitPosition = function(x, y, translate3d) {
	if(translate3d) {
		this.css('-webkit-transform', 'translate3d(' + x + 'px, ' + y + 'px, 0px)');
	} else {
		this.css('-webkit-transform', 'translate(' + x + 'px, ' + y + 'px)');		
	}
}

jQuery.fn.setWebkitPositionAnimated = function(x, y, duration, translate3d, timingFunction, callback) {
	if(!duration) duration = 500;
	if(!timingFunction) timingFunction = 'ease-out';

	$this = this;

	$this.css('-webkit-transition-duration', duration + 'ms');
	$this.setWebkitPosition(x, y, translate3d);

	window.setTimeout(function() {
		$this.css('-webkit-transition-duration', '0');
		if(callback) callback();
	}, duration + 50);
}

jQuery.fn.touchDrag = function(settings) {
	var $this = $(this);

	settings = jQuery.extend({
		direction: 'both',
		elastic: false,
		boundingElement: null,
		boundingBox: {top: 0, left: 0, bottom: document.height, right: document.width},
		dragHorizontal: true,
		dragVertical: true,
		elasticDuration: 300,
		elasticAnimationTimingFunction: 'ease-out',
		kinetic: false,
		kineticDuration: 700,
		maxSpeed: 1200,
		kineticTimingFunction: 'ease-out',
		snapTo: null,
		abortOnWrongDirection: false,
		onDragStart: null,
		onDragMove: null,
		onDragEnd: null,
		onKineticMovementEnd: null,
		onSnapBackEnd: null,
		animationCssClass: null,
		translate3d: false
	}, settings);

	if(settings.boundingElement) {
		//settings.boundingBox = settings.boundingElement.position();
		settings.boundingBox = {top: 0, left: 0};
		settings.boundingBox.right = settings.boundingBox.left + settings.boundingElement.width();
		settings.boundingBox.bottom = settings.boundingBox.top + settings.boundingElement.height();
	}

	settings.boundingBox.right -= $this.width();
	settings.boundingBox.bottom -= $this.height();

	if(settings.direction == 'vertical') settings.dragHorizontal = false;
	if(settings.direction == 'horizontal') settings.dragVertical = false;

	if(settings.snapTo) settings.kinetic = true;
	if(settings.kinetic) settings.elastic = true;

	var distance = function(p1, p2) {
		return Math.sqrt(Math.pow(p1.top - p2.top, 2) + Math.pow(p1.left - p2.left, 2));
	}

	var execCallback = function(callbacks, params) {
		if(!callbacks) return;
		if(typeof(callbacks == 'function')) callbacks = [callbacks];

		params.boundingBox = settings.boundingBox;

		params.relativePositionY = (params.top - settings.boundingBox.top) / (settings.boundingBox.bottom - settings.boundingBox.top);
		params.relativePositionX = (params.left - settings.boundingBox.left) / (settings.boundingBox.right - settings.boundingBox.left);

		$.each(callbacks, function() {
			var fn = $.proxy(this, $this);
			fn(params);
		});
	}

	var regularInterval = null;
	var lastEvent = null;

	$.each(this, function() {
		this.ontouchstart = function(e) {
			e.preventDefault();
			return $(this).trigger('ontouchstart', [e]);
		}

		this.ontouchmove = function(e) {
			e.preventDefault();
			return $(this).trigger('ontouchmove', [e]);
		}

		this.ontouchend = function(e) {
			e.preventDefault();
			return $(this).trigger('ontouchend', [e]);
		}
	});

	if(settings.elastic) {
		$this.css({
			'-webkit-transition-property': '-webkit-transform',
			'-webkit-transition-timing-function': settings.elasticAnimationTimingFunction,
			'-webkit-transition-duration': '0'
		});
	}

	$this.die('ontouchstart');
	$this.die('ontouchmove');
	$this.die('ontouchend');

	$this.live('ontouchstart', function(jEvent, touchEvent) {
		if (touchEvent.touches.length != 1)
			return false;

		var xSpeed = 0;
		var ySpeed = 0;
		var time = (new Date()).getTime();

		var position = $this.position();
		var startTime = (new Date()).getTime();
		var currentTouchPosition = startTouchPosition = {top: touchEvent.touches[0].clientY, left: touchEvent.touches[0].clientX };
		
		var top = lastTop = position.top;
		var left = lastLeft = position.left;

		var firstTouch = { clientX: touchEvent.touches[0].clientX, clientY: touchEvent.touches[0].clientY };
		
		var offset = {deltaX: touchEvent.touches[0].clientX - position.left, deltaY: touchEvent.touches[0].clientY - position.top};

		execCallback(settings.onDragStart, position);

		if(settings.animationCssClass != null) $this.addClass(settings.animationCssClass);

		$this.live('ontouchmove', function(jEvent, touchEvent) {
			if (touchEvent.touches.length != 1)
				return false;

			currentTouchPosition = {top: touchEvent.touches[0].clientY, left: touchEvent.touches[0].clientX };

			if(firstTouch != null && settings.abortOnWrongDirection) {
				var deltaX = touchEvent.touches[0].clientX - firstTouch.clientX;
				var deltaY = touchEvent.touches[0].clientY - firstTouch.clientY;

				var horizontal = Math.abs(deltaX) > Math.abs(deltaY);

				if(settings.dragHorizontal != horizontal) {
					$this.die('ontouchmove');
					$this.die('ontouchend');
					return false;
				}

				firstTouch = null;
			}

			if(!settings.dragHorizontal) {
				var left = position.left;
			} else {
				var left = touchEvent.touches[0].clientX - offset.deltaX;
				if(left < settings.boundingBox.left) left = outside(left, settings.boundingBox.left);
				if(left > settings.boundingBox.right) left = outside(left, settings.boundingBox.right);
			}

			if(!settings.dragVertical) {
				var top = position.top;
			} else {
				var top = touchEvent.touches[0].clientY - offset.deltaY;
				if(top < settings.boundingBox.top) top = outside(top, settings.boundingBox.top);
				if(top > settings.boundingBox.bottom) top = outside(top, settings.boundingBox.bottom);
			}

			if(settings.kinetic) {
				var newTime = (new Date()).getTime();
				var dTime = newTime - time;

				if(dTime > 20) {
					xSpeed = (lastLeft - left) / dTime * 1000;
					ySpeed = (lastTop - top) / dTime * 1000;

					if(xSpeed > settings.maxSpeed) xSpeed = settings.maxSpeed;
					if(xSpeed < -settings.maxSpeed) xSpeed = -settings.maxSpeed;
					if(ySpeed > settings.maxSpeed) ySpeed = settings.maxSpeed;
					if(ySpeed < -settings.maxSpeed) ySpeed = -settings.maxSpeed;

					lastTop = top;
					lastLeft = left;

					time = newTime;
				}

			}

			execCallback(settings.onDragMove, {'top': top, 'left': left});

			$this.setWebkitPosition(left, top, settings.translate3d);
		});

		$this.live('ontouchend', function(jEvent, touchEvent) {

			$this.die('ontouchmove');
			$this.die('ontouchend');

			if(distance(startTouchPosition, currentTouchPosition) == 0) {
				$(touchEvent.target.nodeName == '#text' ? touchEvent.target.parentNode : touchEvent.target).trigger('click');
			}

			if(!settings.elastic) {
				var snapBack = function() {
					execCallback(settings.onKineticMovementEnd, {'top': top, 'left': left});
				};
			} else {
				var snapBack = function() {
					execCallback(settings.onKineticMovementEnd, {'top': top, 'left': left});

					var currentPosition = $this.position();
					var finalPosition = {left: currentPosition.left,  top: currentPosition.top};

					if(settings.dragHorizontal) {
						if(finalPosition.left < settings.boundingBox.left) finalPosition.left = settings.boundingBox.left;
						if(finalPosition.left > settings.boundingBox.right) finalPosition.left = settings.boundingBox.right;
					}

					if(settings.dragVertical) {
						if(finalPosition.top < settings.boundingBox.top) finalPosition.top = settings.boundingBox.top;
						if(finalPosition.top > settings.boundingBox.bottom) finalPosition.top = settings.boundingBox.bottom;
					}

					var snapBackEndCallback = function() {
						execCallback(settings.onSnapBackEnd, {'top': top, 'left': left});
						if(settings.animationCssClass != null) $this.removeClass(settings.animationCssClass);
					}

					if((currentPosition.top != finalPosition.top) || (currentPosition.left != finalPosition.left)) {
						$this.setWebkitPositionAnimated(finalPosition.left, finalPosition.top, settings.elasticDuration, settings.translate3d, settings.elasticAnimationTimingFunction, snapBackEndCallback);
					} else {
						snapBackEndCallback();
					}
				};
			}

			if(!settings.kinetic) {
				snapBack();
			} else {
				var position = $this.position();

				position.top -= ySpeed / 1000 * settings.kineticDuration;
				position.left -= xSpeed / 1000 * settings.kineticDuration;

				if(settings.snapTo) {
					var finalPosition = position;
					var bestSnapPoint = -1;
					var bestDistance = 100000000;

					$.each(settings.snapTo, function(i) {
						var d = distance(position, this);
						if(d < bestDistance) {
							bestDistance = d;
							finalPosition = this;
							bestSnapPoint = i;
						}
					});

					if(finalPosition.snapedIn) finalPosition.snapedIn();

					position = finalPosition;

				} else {
					var margin = 200;

					if(settings.dragHorizontal) {
						if(position.left < settings.boundingBox.left - margin) position.left = settings.boundingBox.left - margin;
						if(position.left > settings.boundingBox.righ + margin) position.left = settings.boundingBox.right + margin;
					}

					if(settings.dragVertical) {
						if(position.top < settings.boundingBox.top - margin) position.top = settings.boundingBox.top - margin;
						if(position.top > settings.boundingBox.bottom + margin) position.top = settings.boundingBox.bottom + margin;
					}
				}

				$this.setWebkitPositionAnimated(position.left, position.top, settings.kineticDuration, settings.translate3d, settings.kineticTimingFunction, snapBack);
			}
		});
	});

	function outside(pos, margin) {
		if(!settings.elastic) {
			return margin;
		} else {
			return margin - (margin - pos) / 2;
		}
	}
}
