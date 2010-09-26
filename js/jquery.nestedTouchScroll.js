
jQuery.fn.touchScroll = function(settings) {
	settings = jQuery.extend({ }, settings);

	if(settings.boundingElement) {
		settings.boundingBox = {
			top: settings.boundingElement.height() - this.height(),
			left: settings.boundingElement.width() - this.width(),
			right: this.width(),
			bottom: this.height()
		}
		settings.boundingElement = null;
	}

	if(!settings.elasticDuration) settings.elasticDuration = 600;

	settings.kinetic = true;

	this.touchDrag(settings);
}

jQuery.fn.touchScrollIndicator = function(settings) {
	
	settings = jQuery.extend({
		updateInterval: 100,
		direction: 'vertical',
		onDragStart: function() {
			scrollBar.css('opacity', '1');
			interval = window.setInterval(function() {
				var top = Math.round(0 - $this.position().top / fullHeight * (scrollBarHeight - scrollBoxHeight));
				top = Math.min(scrollBarHeight - 6, top);
				top = Math.max(top, 6 - scrollBoxHeight);

				var tmpHeight = scrollBoxHeight;
				if(scrollBoxHeight + top > scrollBarHeight) tmpHeight = scrollBarHeight - top;

				if(top != lastTop) {
					scrollBox.setWebkitPosition(0, top);
					lastTop = top;
				}

			}, 100);
		},

		onSnapBackEnd: function() {
			window.clearInterval(interval);
			scrollBar.css('opacity', '0');
		}
	}, settings);

	var $this = $('div.content');
	var boundingBox = $('div.boundingBox');

	var scrollBarHeight = boundingBox.height() - 10;
	var fullHeight = $this.height() - boundingBox.height();
	var scrollBoxHeight = Math.min(boundingBox.height() / $this.height() * scrollBarHeight, scrollBarHeight);

	var scrollBar = $('<div>').css( {
		'width': '6px',
		'height': (scrollBarHeight) + 'px',
		'opacity': '0',
		'position': 'absolute',
		'-webkit-border-radius': '3px',
		'-webkit-mask-image': '-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))',
	 	'right': '5px',
		'top': '5px',
		'overflow': 'hidden',
		'-webkit-mask-clip': 'padding-box',
		'-webkit-transition-property': 'opacity',
		'-webkit-transition-timing-function': 'linear',
		'-webkit-transition-duration': '300ms'
	});

	var scrollBox = $('<div>').css( {
		'width': '6px',
		'height': scrollBoxHeight + 'px',
		'background-color': 'black',
		'opacity': '0.5',
		'position': 'absolute',
		'-webkit-border-radius': '3px',
		'-webkit-transition-property': '-webkit-transform',
		'-webkit-transition-timing-function': 'linear',
		'-webkit-transition-duration': settings.updateInterval + 'ms'
	});

	boundingBox.append(scrollBar.append(scrollBox));

	var interval = null;
	var lastTop = -10000000;

	$this.touchScroll(settings);
}