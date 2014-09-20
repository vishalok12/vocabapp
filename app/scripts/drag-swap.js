define([
	'jquery'
], function ($) {
	'use strict';

	var IS_TOUCH_DEVICE = ('ontouchstart' in document.documentElement);
	var DRAG_THRESHOLD = 5;
	var dragging = false;
	var $clone;
	var dragElement;
	var originalClientX, originalClientY;
	var $elements;
	var leftOffset, topOffset;
	var touchDown = false;

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

	function init() {
		$(document).on(dragEvents.MOVE, dragMoveHandler)
			.on(dragEvents.END, dragEndHandler);
	}

	$.fn.swappable = function() {
		$elements = this;

		// bindings to trigger drag on element
		this.on(dragEvents.START, dragStartHandler);

		function dragStartHandler(e) {
			if ($(this).hasClass('ds-no-drag')) { return; }

			e.stopPropagation();
			e.preventDefault();

			touchDown = true;
			// dragging = true;
			originalClientX = e.clientX || e.originalEvent.touches[0].clientX;
			originalClientY = e.clientY || e.originalEvent.touches[0].clientY;
			dragElement = this;
		}
	};

	function clone($element) {
		var $clone = $element.clone();

		$clone.css({
			position: 'absolute',
			width: $element.outerWidth(),
			height: $element.outerHeight(),
			left: dragElement.offsetLeft,
			top: dragElement.offsetTop,
			'z-index': 100000
		});

		$element.parent().append($clone);

		return $clone;
	}

	function dragMoveHandler(e) {
		if (!touchDown) { return; }

		var dragDistanceX = (e.clientX  || e.originalEvent.touches[0].clientX) - originalClientX;
		var dragDistanceY = (e.clientY || e.originalEvent.touches[0].clientY) - originalClientY;

		if (dragging) {
			e.stopPropagation();

			$clone.css({
				left: leftOffset + dragDistanceX,
				top: topOffset + dragDistanceY
			});

			shiftHoveredElement($clone, $(dragElement), $elements);

		// check for drag threshold
		} else if (Math.abs(dragDistanceX) > DRAG_THRESHOLD ||
				Math.abs(dragDistanceY) > DRAG_THRESHOLD) {
			$clone = clone($(dragElement));

			leftOffset = dragElement.offsetLeft;
			topOffset = dragElement.offsetTop;

			// hide dragged element
			dragElement.style.opacity = 0;

			dragging = true;
		}
	}

	function dragEndHandler(e) {
		if (dragging) {
			e.stopPropagation();
			dragging = false;
			$clone.remove();
			dragElement.style.opacity = 1;
		} else if (touchDown) {
			// fire click event as user didn't drag
			// click event by default won't work as there is e.preventDefault in dragstart
			$(e.target).trigger('click');
		}

		touchDown = false;
	}

	/**
	 * find the element on which the dragged element is hovering
	 * @return {DOM Object} hovered element
	 */
	function getHoveredElement($clone, $dragElement, $swappableElements) {
		var cloneOffset = $clone.offset();
		var elemWidth = $clone.width();
		var elemHeight = $clone.height();
		var cloneLeftPosition = cloneOffset.left;
		var cloneRightPosition = cloneOffset.left + elemWidth;
		var cloneTopPosition = cloneOffset.top;
		var cloneBottomPosition = cloneOffset.top + elemHeight;
		var $currentElement;

		for (var i = 0; i < $swappableElements.length; i++) {
			$currentElement = $swappableElements.eq(i);

			if ($currentElement[0] === $dragElement[0]) { continue; }

			var offset = $currentElement.offset();

			// check if this element position is overlapping with dragged element
			var overlappingX = (offset.left + 0.5 * elemWidth < cloneRightPosition) &&
				(offset.left + 0.5 * elemWidth > cloneLeftPosition);

			var overlappingY = (offset.top + 0.5 * elemHeight < cloneBottomPosition) &&
				(offset.top + 0.5 * elemHeight > cloneTopPosition);

			var inRange = overlappingX && overlappingY;

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

	// initialize
	init();

	function shiftElementPosition(arr, fromIndex, toIndex) {
		var temp = arr.splice(fromIndex, 1)[0];
		return arr.splice(toIndex, 0, temp);
	}

});
