define([
	'jquery'
], function ($) {
	'use strict';

	var IS_TOUCH_DEVICE = ('ontouchstart' in document.documentElement);
	var DRAG_THRESHOLD = 5;

	var dragEvents = (function () {
		if (IS_TOUCH_DEVICE) {
			return {
				START: 'touchstart',
				MOVE: 'touchmove',
				END: 'touchend'
			};
		}
		else {
			return {
				START: 'mousedown',
				MOVE: 'mousemove',
				END: 'mouseup'
			};
		}
	}());

	$.fn.swappable = function(options) {
		var dragging = false;
		var $clone;
		var dragElement;
		var originalClientX, originalClientY;
		var $elements;
		var touchDown = false;
		var leftOffset, topOffset;

		options = $.extend({}, options);

		$elements = this;

		this.each(function() {
			// bindings to trigger drag on element
			var dragSelector = options.dragSelector;
			var self = this;
			var $this = $(this);

			if (dragSelector) {
				$this.on(dragEvents.START, dragSelector, dragStartHandler);
			} else {
				$this.on(dragEvents.START, dragStartHandler);
			}

			function dragStartHandler(e) {
				e.stopPropagation();
				touchDown = true;
				// dragging = true;
				originalClientX = e.clientX || e.originalEvent.touches[0].clientX;
				originalClientY = e.clientY || e.originalEvent.touches[0].clientY;
				dragElement = self;
			}
		});

		$(document).on(dragEvents.MOVE, dragMoveHandler)
			.on(dragEvents.END, dragEndHandler);

		function dragMoveHandler(e) {
			if (!touchDown) { return; }

			var $dragElement = $(dragElement);
			var dragDistanceX = (e.clientX  || e.originalEvent.touches[0].clientX) - originalClientX;
			var dragDistanceY = (e.clientY || e.originalEvent.touches[0].clientY) - originalClientY;

			if (dragging) {
				e.stopPropagation();

				$clone.css({
					left: leftOffset + dragDistanceX,
					top: topOffset + dragDistanceY
				});

				shiftHoveredElement($clone, $dragElement, $elements);

			// check for drag threshold
			} else if (Math.abs(dragDistanceX) > DRAG_THRESHOLD ||
					Math.abs(dragDistanceY) > DRAG_THRESHOLD) {
				$clone = clone($dragElement);

				// initialize left offset and top offset
				// will be used in successive calls of this function
				leftOffset = dragElement.offsetLeft - parseInt($dragElement.css('margin-left'))
					- parseInt($dragElement.css('padding-left'));
				topOffset = dragElement.offsetTop - parseInt($dragElement.css('margin-top'))
					- parseInt($dragElement.css('padding-top'));

				// put cloned element just above the dragged element
				$clone.css({
					left: leftOffset,
					top: topOffset
				});
				$dragElement.parent().append($clone);

				// hide dragged element
				$dragElement.css('visibility', 'hidden');

				dragging = true;
			}
		}

		function dragEndHandler(e) {
			if (dragging) {
				e.stopPropagation();
				dragging = false;
				$clone.remove();
				dragElement.style.visibility = 'visible';
			}

			touchDown = false;
		}
	};

	function clone($element) {
		var $clone = $element.clone();

		$clone.css({
			position: 'absolute',
			width: $element.width(),
			height: $element.height(),
			'z-index': 100000
		});

		return $clone;
	}

	/**
	 * find the element on which the dragged element is hovering
	 * @return {DOM Object} hovered element
	 */
	function getHoveredElement($clone, $dragElement, $swappableElements) {
		var cloneOffset = $clone.offset();
		var cloneWidth = $clone.width();
		var cloneHeight = $clone.height();
		var cloneLeftPosition = cloneOffset.left;
		var cloneRightPosition = cloneOffset.left + cloneWidth;
		var cloneTopPosition = cloneOffset.top;
		var cloneBottomPosition = cloneOffset.top + cloneHeight;
		var $currentElement;
		var horizontalMidPosition, verticalMidPosition;
		var offset, overlappingX, overlappingY, inRange;

		for (var i = 0; i < $swappableElements.length; i++) {
			$currentElement = $swappableElements.eq(i);

			if ($currentElement[0] === $dragElement[0]) { continue; }

			offset = $currentElement.offset();

			// current element width and draggable element(clone) width or height can be different
			horizontalMidPosition = offset.left + 0.5 * $currentElement.width();
			verticalMidPosition = offset.top + 0.5 * $currentElement.height();

			// check if this element position is overlapping with dragged element
			overlappingX = (horizontalMidPosition < cloneRightPosition) &&
				(horizontalMidPosition > cloneLeftPosition);

			overlappingY = (verticalMidPosition < cloneBottomPosition) &&
				(verticalMidPosition > cloneTopPosition);

			inRange = overlappingX && overlappingY;

			if (inRange) {
				return $currentElement[0];
			}
		}
	}

	function shiftHoveredElement($clone, $dragElement, $swappableElements) {
		var hoveredElement = getHoveredElement($clone, $dragElement, $swappableElements);

		if (hoveredElement !== $dragElement[0]) {
			// shift all other elements to make space for the dragged element
			var hoveredElementIndex = $swappableElements.index(hoveredElement);
			var dragElementIndex = $swappableElements.index($dragElement);
			if (hoveredElementIndex < dragElementIndex) {
				$(hoveredElement).before($dragElement);
			} else {
				$(hoveredElement).after($dragElement);
			}

			shiftElementPosition($swappableElements, dragElementIndex, hoveredElementIndex);
		}
	}

	function shiftElementPosition(arr, fromIndex, toIndex) {
		var temp = arr.splice(fromIndex, 1)[0];
		return arr.splice(toIndex, 0, temp);
	}

});
