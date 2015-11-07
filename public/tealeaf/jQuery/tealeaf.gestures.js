/**
 * Licensed Materials - Property of IBM
 * � Copyright IBM Corp. 2014
 * US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/**
 * @fileOverview The Gesture module implements the logic for capturing Hammer.js gesture events.
 * @version 4.0.0.1607
 * @exports gesture
 */

/*global TLT:true */
/*global Hammer:true */

TLT.addModule("gestures", function (context) {
    "use strict";

	var tlTypes = {
            "input:radio": "radioButton",
            "input:checkbox": "checkBox",
            "input:text": "textBox",
            "input:password": "textBox",
            "input:file": "fileInput",
            "input:button": "button",
            "input:submit": "submitButton",
            "input:reset": "resetButton",
            "input:image": "image",
            "input:color": "color",
            "input:date": "date",
            "input:datetime": "datetime",
            "input:datetime-local": "datetime-local",
            "input:number": "number",
            "input:email": "email",
            "input:tel": "tel",
            "input:search": "search",
            "input:url": "url",
            "input:time": "time",
            "input:week": "week",
            "input:month": "month",
            "textarea:": "textBox",
            "select:": "selectList",
            "button:": "button",
            "a:": "link"
        },
        utils = context.utils,
		firstTouches = [],
		tapCount = 0,
		swipeOk = true,
		timer,
		gestureOptions = {
			swipeAfterPinchInterval: 300,
			doubleTapInterval: 300,
			preventMouse: true,
			dragMinDistance: 10
		},
		hammertimeArray = [],
		elementArray = [],
		gestureOptionsArray = [],
		prevGestureQueueEvent,
		hammerVersion,
		startEventTarget,
		currentClientState = null,
		isApple = utils.isiOS,
        isAndroidChrome = navigator.userAgent.indexOf("Chrome") > -1 && utils.isAndroid,
        devicePixelRatio = window.devicePixelRatio || 1,
        deviceOriginalWidth = (window.screen ? window.screen.width : 0),
        deviceOriginalHeight = (window.screen ? window.screen.height : 0),
        deviceToolbarHeight = (window.screen ? window.screen.height - window.screen.availHeight : 0),
		i;

	/**
     * Posts Gesture Event to Queue
     * @private
     * @param {object} queueEvent A queueEvent created with createGestureQueueEvent.
     * @return {void}
     */
    function postGestureEvent(queueEvent) {
        context.post(queueEvent);
		context.post(currentClientState);
    }

    /**
     * Get tlEvent from webEvent.
     * @private
     * @param {object} webEvent A webEvent with properties a type 11 object that is a control.
     * @return {string} tlEvent.
     */
    function getTlEvent(webEvent) {
        var tlEvent;

		//We consider the Hammer.js event named "drag" a swipe. We currently do not support the Hammer.js event named "swipe".
		if (webEvent.type === "drag") {
			tlEvent = "swipe";
		//We consider the Hammer.js event named "hold" a tapHold. There is no Hammer.js event called "tapHold".
		} else if (webEvent.type === "hold") {
			tlEvent = "tapHold";
		} else {
			tlEvent = webEvent.type;
		}

        if (typeof tlEvent === "string") {
            tlEvent = tlEvent.toLowerCase();
        } else {
            tlEvent = "unknown";
        }

        return tlEvent;
    }
	/**
     * Gets the top left X & Y values of a webEvent target.
     * @private
     * @param {WebEvent} webEvent Normalized browser event
     * @return value of top left X & Y
     */
	function getElementTopLeft(webEvent) {
		var target = webEvent.gesture.target,
			topLeftY = 0,
			topLeftX = 0;
		while (target && target.tagName !== "BODY") {
			topLeftY += target.offsetTop;
			topLeftX += target.offsetLeft;
			target = target.offsetParent;
		}
		return { topLeftX: topLeftX, topLeftY: topLeftY };
	}

    /**
     * Gets the relative X & Y values to a webEvent.
     * @private
     * @param {WebEvent} webEvent Normalized browser event
     * @return String value of relative X & Y
     */
    function getRelativeXY(webEvent, touchX, touchY) {
        var elementX = getElementTopLeft(webEvent).topLeftX,
            elementY = getElementTopLeft(webEvent).topLeftY,
            width = webEvent.gesture.target.offsetWidth,
            height = webEvent.gesture.target.offsetHeight,
            relX = Math.abs((touchX - elementX) / width).toFixed(1),
            relY = Math.abs((touchY - elementY) / height).toFixed(1);

        relX = relX > 1 || relX < 0 ? 0.5 : relX;
        relY = relY > 1 || relY < 0 ? 0.5 : relY;

        return relX + "," + relY;
    }

	/**
     * Used to create the client state message from a webEvent.
     * @private
     * @function
     * @name gesture-getClientStateMessage
     * @param {object} webEvent A webEvent that will be used to create the clientState.
     * @return {object} Client state message object.
     */
    function getClientStateMessage(webEvent) {
		//For gesture generated type 1 events, the event will always be named touchend, this may be changed in future releases.
        var documentElement = document.documentElement,
            documentBody = document.body,
            msg = {
                type: 1,
                clientState: {
                    pageWidth: document.width || (!documentElement ? 0 : documentElement.offsetWidth),
                    pageHeight: Math.max((!document.height ? 0 : document.height), (!documentElement ? 0 : documentElement.offsetHeight), (!documentElement ? 0 : documentElement.scrollHeight)),
                    viewPortWidth: window.innerWidth || documentElement.clientWidth,
                    viewPortHeight: window.innerHeight || documentElement.clientHeight,
                    viewPortX: window.pageXOffset || (!documentElement ? (!documentBody ? 0 : documentBody.scrollLeft) : documentElement.scrollLeft || 0),
                    viewPortY: window.pageYOffset || (!documentElement ? (!documentBody ? 0 : documentBody.scrollTop) : documentElement.scrollTop || 0),
                    deviceOrientation: window.orientation || 0,
                    event: "touchend"
                }
            },
            deviceWidth = 1,
            scaleWidth = 1;

        if (Math.abs(msg.clientState.deviceOrientation) === 90) {
            if (isApple || isAndroidChrome) {
                deviceWidth = deviceOriginalHeight - deviceToolbarHeight;
            } else {
                // Need to display web content no smaller than 320 or it will look incorrect. Older Android devices give these values due to they are built on a webview and not an actual browser.
                deviceWidth = deviceOriginalWidth <= 320 ? deviceOriginalHeight - deviceToolbarHeight : ((deviceOriginalHeight / devicePixelRatio) - deviceToolbarHeight);
            }
        } else {
            if (isApple || isAndroidChrome) {
                deviceWidth = deviceOriginalWidth + deviceToolbarHeight;
            } else {
                // Need to display web content no smaller than 320 or it will look incorrect. Older Android devices give these values due to they are built on a webview and not an actual browser.
                deviceWidth = deviceOriginalWidth <= 320 ? deviceOriginalWidth - deviceToolbarHeight : ((deviceOriginalWidth / devicePixelRatio) - deviceToolbarHeight);
            }
        }

        scaleWidth = (msg.clientState.viewPortWidth === 0 ? 1 : deviceWidth / msg.clientState.viewPortWidth);

        // Made scale a bit smaller to adjust for scroll bars that appear on top of content on certain browsers.
        msg.clientState.deviceScale = (scaleWidth - 0.02).toFixed(3);

		return msg;
	}

    /**
     * Cleans a gesture touch by removing fields if they do not exist, are null, or otherwise should not be included. Works by cleaning the first object in the sent array.
     * @private
     * @param {obj} touch Gesture touch object (an object containing  information about a single position of a single finger).
	 * @param {string} tlType The tealeaf name of the element.
     * @return Array A cleaned touchPosition array.
     */
	function cleanGestureQueueEvent(touch, tlType) {

		//Delete relXY for radio buttons.
		if (tlType === "radioButton") {
			delete touch.control.position.relXY;
		}
		//Delete the element name from the touch position if name does not exist.
		if (touch.control.name === null || touch.control.name === undefined || touch.control.name === "") {
			delete touch.control.name;
		}
		//Delete the element subType from the touch position if subType does not exist.
		if (touch.control.subType === null || touch.control.subType === undefined || touch.control.subType === "") {
			delete touch.control.subType;
		}
	}

	/**
     * Creates a gesture queue event with the specified options.
     * @private
     * @param {obj} options Includes the data that will be used to create the gesture queue event.
     * @return Object A gesture queue event.

Queue Event JSON Schema

{
    "$ref" : "MessageHeader",
    "event": {
        "description": "Event from control",
        "type": "object",
        "properties": {
            "tlEvent": {
                "title": "Tealeaf type of event",
                "type": "string",
                "required": true
            },
            "type": {
                "title": "Type of event framework reports",
                "type": "string",
                "required": false
            }
        }
    },
    "touches": {
        "description": "Gestures touch objects per finger.",
        "type": "array",
        "required": true
        "items": {
                "description": "Touch objects per finger starting with intial and ends with last object when finger is lifted from device.",
                "type": "array",
                "required": true,
                "$ref": "Touch"
            }
        }
    },
    "direction": {
        "title": "The direction of the swipe which can be up, down. left or right.",
        "type": "string",
        "required": false
    },
    "velocityX": {
        "title": "The velocity of this measured in pixels per second along the x axis",
        "type": "float",
        "required": false
    },
    "velocityY": {
        "title": "The velocity of this measured in pixels per second along the y axis",
        "type": "float",
        "required": false
    }

     */
	function createGestureQueueEvent(options) {
		var control,
			tlEventType = getTlEvent(utils.getValue(options, "webEvent")),
			tagName = utils.getValue(options, "webEvent.gesture.target.tagName") || "BODY",
			elType = tagName.toLowerCase() === "input" ? utils.getValue(options, "webEvent.target.element.type") : "",
			tlType = tlTypes[tagName.toLowerCase() + ":" + elType] || tagName,
			eventSubtype = utils.getValue(options, "webEvent.target.subtype"),
			tlTouches = [],
			hammerTouches,
			hammerTouchesLocation,
			saveFirstTouch,
			addFirstTouch,
			screenWidth,
			screenHeight,
			i;

		//First get the client state and save it to be posted when the gesture event is posted.
		currentClientState = getClientStateMessage(utils.getValue(options, "webEvent"));

		//Screen width and height are not updated in landscape mode for iOS devices.
		if (utils.isiOS && utils.getOrientationMode(window.orientation) === "LANDSCAPE") {
			screenWidth = screen.height;
			screenHeight = screen.width;
		} else {
			screenWidth = screen.width;
			screenHeight = screen.height;
		}

		if (hammerVersion === "1") {
			hammerTouches = options.webEvent.gesture.touches;
			hammerTouchesLocation = "webEvent.gesture.touches.";
			saveFirstTouch = (tlEventType === "swipe" && !(prevGestureQueueEvent !== undefined && prevGestureQueueEvent.event.tlEvent === "swipe")) || (tlEventType === "pinch" && !(prevGestureQueueEvent !== undefined && prevGestureQueueEvent.event.tlEvent === "pinch"));
			addFirstTouch = tlEventType === "swipe" || tlEventType === "pinch";
		} else {
			hammerTouches = options.webEvent.gesture.pointers;
			hammerTouchesLocation = "webEvent.gesture.pointers.";
			saveFirstTouch = utils.getValue(options, "webEvent.gesture.firstOrLastSwipeEvent") === "first" || utils.getValue(options, "webEvent.gesture.firstOrLastPinchEvent") === "first";
			addFirstTouch = utils.getValue(options, "webEvent.gesture.firstOrLastSwipeEvent") === "last" || utils.getValue(options, "webEvent.gesture.firstOrLastPinchEvent") === "last";
		}
		//Cycle through all finger touches.
		for (i = 0; i < hammerTouches.length; i += 1) {
			//Add the final position of each finger. All gestures apply.
			tlTouches.push(
				[
					{
						position: {
							y: utils.getValue(options, hammerTouchesLocation + i + ".clientY") * screenHeight / window.innerHeight,
							x: utils.getValue(options, hammerTouchesLocation + i + ".clientX") * screenWidth / window.innerWidth
						},
						control: {
							position: {
								width: utils.getValue(options, hammerTouchesLocation + i + ".target.offsetWidth"),
								height: utils.getValue(options, hammerTouchesLocation + i + ".target.offsetHeight"),
								relXY: getRelativeXY(options.webEvent, utils.getValue(options, hammerTouchesLocation + i + ".pageX"), utils.getValue(options, hammerTouchesLocation + i + ".pageY"))
							},
							id: utils.getValue(options, hammerTouchesLocation + i + ".target.id") || context.getXPathFromNode(utils.getValue(options, hammerTouchesLocation + i + ".target")),
							idType: utils.getValue(options, "webEvent.target.idType"),
							name: utils.getValue(options, hammerTouchesLocation + i + ".target.name"),
							tlType: tlType,
							type: tagName,
							subType: elType
						}
					}
				]
			);

			//Clean after adding a position of a finger
			cleanGestureQueueEvent(tlTouches[i][0], tlType);
		}

		//Save the first touches for pinch and swipe events.
		if (saveFirstTouch) {
			//Cycle through all finger touches.
			for (i = 0; i < hammerTouches.length; i += 1) {
				firstTouches.push(tlTouches[i][0]);
			}
		}

		//Add in the first touch for pinch and swipe events.
		if (addFirstTouch) {
			//Cycle through all finger touches.
			for (i = 0; i < hammerTouches.length; i += 1) {
				tlTouches[i].unshift(firstTouches[i]);
			}
		}

		//Build the control object
		control = {
			type: 11,
			event: {
				tlEvent: tlEventType,
				type: tagName
			},
			touches: tlTouches
		};

		//Handle Gestures with Velocity, currently just swipe
		if (tlEventType === "swipe") {
			control.velocityX = options.webEvent.gesture.velocityX;
			control.velocityY = options.webEvent.gesture.velocityY;
		}

		//Handle Gestures with Direction, currently swipe and pinch
		if (tlEventType === "swipe") {
			control.direction = options.webEvent.gesture.direction;
			//Hammer JS 2 supplies the directions as the numbers 2,4,8,16(left,right,up,down)
			if (control.direction === 2) {
				control.direction = "left";
			}
			if (control.direction === 4) {
				control.direction = "right";
			}
			if (control.direction === 8) {
				control.direction = "up";
			}
			if (control.direction === 16) {
				control.direction = "down";
			}
		}
		if (tlEventType === "pinch") {
			if (options.webEvent.gesture.scale > 1) {
				control.direction = "open";
			} else if (options.webEvent.gesture.scale < 1) {
				control.direction = "close";
			}
		}
		//Add the event subtype if it exists.
		if (eventSubtype !== undefined && eventSubtype !== null) {
			control.event.subType = eventSubtype;
		}

		return control;
	}

	/**
     * Handles the fired gesture event, except tap which gets handled specially in handleTap.
     * @private
     * @param {string} id ID of the target the event is fired on.
	 * @param {obj} webEvent The event object.
     */
	function handleGesture(id, webEvent) {
		if (hammerVersion === "1") {
			//Immediately post a doubletap, tap, or hold event.
			if (webEvent.type === "doubletap" || webEvent.type === "hold" || webEvent.type === "tap") {
				postGestureEvent(createGestureQueueEvent({
					webEvent: webEvent,
					id: id,
					currState: utils.getValue(webEvent, "target.state")
				}));
			} else if (webEvent.type === "release" && prevGestureQueueEvent !== undefined && (prevGestureQueueEvent.event.tlEvent === "swipe" || prevGestureQueueEvent.event.tlEvent === "pinch")) {
				//If a release is fired after a pinch/swipe post that pinch/swipe since it is the final pinch/swipe. The logic to store the first pinch/touch is included in createGestureQueueEvent.
				postGestureEvent(prevGestureQueueEvent);
				//Reset the previous gesture event after posting it.
				prevGestureQueueEvent = undefined;
				//Reset firstTouches used in createGestureQueueEvent
				firstTouches = [];
			} else if (webEvent.type === "drag" || webEvent.type === "pinch") {
				//Store an event to be posted later. Note that webEvent.type === "drag" is the tlEvent swipe.
				prevGestureQueueEvent = createGestureQueueEvent({
					webEvent: webEvent,
					id: id,
					currState: utils.getValue(webEvent, "target.state")
				});
			}
		} else {
			//Immediately post a doubletap, tap, or hold event.
			if (webEvent.type === "doubletap" || webEvent.type === "tapHold" || webEvent.type === "tap") {
				postGestureEvent(createGestureQueueEvent({
					webEvent: webEvent,
					id: id,
					currState: utils.getValue(webEvent, "target.state")
				}));
			} else if (webEvent.gesture.firstOrLastSwipeEvent === "last" || webEvent.gesture.firstOrLastPinchEvent === "last") {
				postGestureEvent(createGestureQueueEvent({
					webEvent: webEvent,
					id: id,
					currState: utils.getValue(webEvent, "target.state")
				}));
				//Reset firstTouches used in createGestureQueueEvent
				firstTouches = [];
			} else if (webEvent.gesture.firstOrLastSwipeEvent === "first" || webEvent.gesture.firstOrLastPinchEvent === "first") {
				//The logic to store the first pinch/touch is included in createGestureQueueEvent.
				createGestureQueueEvent({
					webEvent: webEvent,
					id: id,
					currState: utils.getValue(webEvent, "target.state")
				});
			}
		}
	}

	/**
     * Specially handles the tap gesture event
     * @private
     * @param {string} id ID of the target the event is fired on.
	 * @param {obj} webEvent The event object.
     */
    function handleTap(id, webEvent) {
		var position = utils.indexOf(elementArray, webEvent.target.element),
			doubleTapInterval;
		//if all events are configured to window the elementArray and gestureOptionsArray will be empty because the user has not configured special handling of some events/elements
		if (position === -1) {
			doubleTapInterval = gestureOptions.doubleTapInterval;
		} else {
			doubleTapInterval = gestureOptionsArray[position].doubleTapInterval || gestureOptions.doubleTapInterval;
		}
		//Increment the tap count as more taps happen
        tapCount += 1;

        if (tapCount === 1) {
            timer = setTimeout(function () {
                handleGesture(id, webEvent);
				//Reset the tap count after the specified delay
                tapCount = 0;
            }, doubleTapInterval);
        } else {
            clearTimeout(timer);
			//Change the tap into a doubletap
			webEvent.type = "doubletap";
			handleGesture(id, webEvent);
			//Reset the tap count after a doubletap
            tapCount = 0;
        }
	}

	/**
     * Specially handles the pinch and swipe gesture event
     * @private
     * @param {string} id ID of the target the event is fired on.
	 * @param {obj} webEvent The event object.
     */
    function handlePinchAndSwipe(id, webEvent) {
		var position = utils.indexOf(elementArray, webEvent.target.element),
			swipeAfterPinchInterval;

		if (gestureOptionsArray[position]) {
			swipeAfterPinchInterval = gestureOptionsArray[position].swipeAfterPinchInterval || gestureOptions.swipeAfterPinchInterval;
		} else {
			swipeAfterPinchInterval = gestureOptions.swipeAfterPinchInterval;
		}

		if (swipeOk && (webEvent.type === "swipe" || webEvent.type === "drag")) {
			handleGesture(id, webEvent);
		}

        if (webEvent.type === "pinch") {
		    handleGesture(id, webEvent);
			//Do not capture swipe events immediately after a pinch
			swipeOk = false;
            timer = setTimeout(function () {
				//Allow swipe events after the timeout
                swipeOk = true;
            }, swipeAfterPinchInterval);
        }
	}

	function createEvent(eventData) {
		var webEvent;
		if (document.createEvent) {
			webEvent = document.createEvent("HTMLEvents");
			//the arguments are event name, bubbles, cancelable
			webEvent.initEvent(eventData.type, true, true);
			webEvent.gesture = eventData;
		} else {
			webEvent = document.createEventObject();
			webEvent.eventType = eventData.type;
			webEvent.gesture = eventData;
		}
		return webEvent;
	}

	function callEvent(ev, target) {
		if (target === undefined) {
			return;
		}
		if (document.createEvent) {
			target.dispatchEvent(ev);
		} else {
			target.fireEvent("on" + ev.eventType, ev);
		}
	}

	function callTealeafEvent(eventData) {
		var eventName = eventData.type,
			target = eventData.target;

		if (eventName === "tap") {
			callEvent(createEvent(eventData), target);
			startEventTarget = undefined;
		} else if (eventName === "press") {
			//the tealeaf event tapHold is called press in hammer.js 2.0 
			eventData.type = "tapHold";
			callEvent(createEvent(eventData), target);
			startEventTarget = undefined;
		} else if (eventName === "panstart") {
			//the tealeaf event swipe is called pan in hammer.js 2.0
			eventData.type = "swipe";
			//Save the fact this is the first swipe event since the data is lost when panstart is renamed to swipe
			eventData.firstOrLastSwipeEvent = "first";
			callEvent(createEvent(eventData), target);
			startEventTarget = target;
		} else if (eventName === "panend") {
			//the tealeaf event swipe is called pan in hammer.js 2.0
			eventData.type = "swipe";
			//Save the fact this is the last swipe event since the data is lost when panend is renamed to swipe
			eventData.firstOrLastSwipeEvent = "last";
			//Use the target of the panstart as the panend target could be different
			callEvent(createEvent(eventData), startEventTarget);
			startEventTarget = undefined;
		} else if (eventName === "pinchstart") {
			eventData.type = "pinch";
			//Save the fact this is the last pinch event since the data is lost when pinchstart is renamed to pinch
			eventData.firstOrLastPinchEvent = "first";
			callEvent(createEvent(eventData), target);
			startEventTarget = target;
		} else if (eventName === "pinchend") {
			eventData.type = "pinch";
			//Save the fact this is the last pinch event since the data is lost when pinchend is renamed to pinch
			eventData.firstOrLastPinchEvent = "last";
			//Use the target of the pinchstart as the pinchend target could be different
			callEvent(createEvent(eventData), startEventTarget);
			startEventTarget = undefined;
		}
	}

    // Return the module's interface object. This contains callback functions which
    // will be invoked by the UIC core.
    return {
        // Expose private functions for unit testing
		createGestureQueueEvent: createGestureQueueEvent,
		utils: utils,
		handleGesture: handleGesture,
		handleTap: handleTap,
		tlTypes: tlTypes,
        postGestureEvent: postGestureEvent,
        getTlEvent: getTlEvent,
		cleanGestureQueueEvent: cleanGestureQueueEvent,
		gestureOptions: gestureOptions,
		init: function () {
			var cssSelectors,
				cssSelectorArray,
				elements = [],
				gestureEvents = TLT.getCoreConfig().modules.gestures.events,
				targets = TLT.getCoreConfig().modules.gestures.targets,
				elementGestureOptions = {
					doubleTapInterval: 300,
					preventMouse: true,
					dragMinDistance: 10
				},
				elementPosition,
				hammertime,
				eventsToEnable = "",
				eventName,
				counter = 0,
				j,
				k;

			//Check hammer.js is available and check the version
			if (typeof Hammer === "function") {
				//Set the hammer version to the major version number to easily compare between Hammer.js 1.x.x and 2.x.x
				hammerVersion = Hammer.VERSION.split(".")[0];
			} else {
				console.log("Hammer JS not found, gesture module not initialized");
				return;
			}

			if (hammerVersion === "1") {
				//Set hammer default options so that default behaviors are not prevented
				Hammer.defaults.behavior.userSelect = "auto";
				Hammer.defaults.behavior.userDrag = "auto";
				Hammer.defaults.behavior.contentZooming = "auto";
				Hammer.defaults.behavior.touchCallout = "default";
				Hammer.defaults.behavior.touchAction = "auto";
			}

			if (context.getConfig()) {
				//Add the user specified gesture options to gestureOptions, overriding the default options if there is a conflict
				utils.extend(true, gestureOptions, context.getConfig().options);
			}

			//Build the element and gestureOptions arrays. This is to avoid creating multiple hammertimes for an element.
			//Iterate over all of the gesture events specified in the user configuration
			for (i = 0; i < gestureEvents.length; i += 1) {
				eventName = gestureEvents[i].name;
				//Set the css selectors that will determine what elements hammertimes should be registered for
				cssSelectors = gestureEvents[i].target;
				//Check if Hammer is being enabled for the entire page
				if (cssSelectors === window) {
					if (hammerVersion === "1") {
						hammertimeArray.push(new Hammer(window, utils.clone(gestureOptions)));
					}
				} else {
					//Separate each css selector
					cssSelectorArray = cssSelectors.split(", ");
					//iterate over all of the css selectors
					for (j = 0; j < cssSelectorArray.length; j += 1) {
						//Query for each element the css selector applies to
						elements = TLT.getService('browser').queryAll(cssSelectorArray[j], document);
						//Iterate over each element.
						for (k = 0; k < elements.length; k += 1) {
							elementPosition = utils.indexOf(elementArray, elements[k]);
							//check if element is unique
							if (elementPosition === -1) {
								//add element to the elementArray
								elementArray.push(elements[k]);
								//add the gestureOptions to the gestureOptionsArray
								gestureOptionsArray.push(utils.clone(gestureOptions));
								//If the event is not configured by the user in gesture options, set the event to be enabled
								if (gestureOptionsArray[counter][eventName] === undefined) {
									gestureOptionsArray[counter][eventName] = true;
								}
								counter += 1;
							} else {
								//If the event is not configured by the user in gesture options, set the event to be enabled. Use the current elementPosition because gestureOptionsArray and elementArray are a 1:1 match.
								if (gestureOptionsArray[elementPosition][eventName] === undefined) {
									gestureOptionsArray[elementPosition][eventName] = true;
								}
							}
						}
					}
				}
			}
			//check if the user set gesture targets
			if (typeof targets === "object") {
				//Set the custom gesture options for the elements that are specified in the user configuration and also are in elementArray
				//Iterate over all the targets in targetOptions
				for (i = 0; i < targets.length; i += 1) {
					//Add the user specified  gesture options to elementGestureOptions, overriding the default options if there is a conflict
					utils.extend(true, elementGestureOptions, targets[i].options);
					//Set the css selectors that will determine what elements have custom options set
					cssSelectors = targets[i].target;
					//Separate each css selector
					cssSelectorArray = cssSelectors.split(", ");
					//iterate over all of the css selectors
					for (j = 0; j < cssSelectorArray.length; j += 1) {
						//Query for each element the css selector applies to
						elements = TLT.getService('browser').queryAll(cssSelectorArray[j], document);
						//Iterate over each element.
						for (k = 0; k < elements.length; k += 1) {
							elementPosition = utils.indexOf(elementArray, elements[k]);
							//check if the element is in the element Array
							if (elementPosition !== -1) {
								//update the gestureOptions in the gestureOptionsArray
								gestureOptionsArray[elementPosition] = utils.clone(elementGestureOptions);
							}
						}
					}
				}
			}
			//enable hammer js for the specified elements
			if (hammerVersion === "1") {
				for (i = 0; i < elementArray.length; i += 1) {
					hammertimeArray.push(new Hammer(elementArray[i], gestureOptionsArray[i]));
				}
			} else {
				for (i = 0; i < elementArray.length; i += 1) {
					eventsToEnable = "";
					hammertime = new Hammer.Manager(elementArray[i]);
					if (gestureOptionsArray[i].tap) {
						hammertime.add(new Hammer.Tap({event: 'tap'}));
						eventsToEnable += "tap ";
					}
					if (gestureOptionsArray[i].swipe) {
						hammertime.add(new Hammer.Pan({direction: Hammer.DIRECTION_ALL}));
						eventsToEnable += "panstart panend ";
					}
					if (gestureOptionsArray[i].tapHold) {
						hammertime.add(new Hammer.Press());
						eventsToEnable += "press ";
					}
					if (gestureOptionsArray[i].pinch) {
						hammertime.add(new Hammer.Pinch({enable: true}));
						eventsToEnable += "pinchstart pinchend";
					}
					if (eventsToEnable !== "") {
						hammertime.on(eventsToEnable, function hammertimeOnCallback(eventData) {
							if ((eventData.type === "panend" || eventData.type === "pinchend") && elementArray.indexOf(startEventTarget) > -1) {
								//a pan or pinch might start on a element that is being captured and end on a element that is not being captured
								callTealeafEvent(eventData);
							} else if (elementArray.indexOf(eventData.target) > -1) {
								//hammer.js 2.0 no longer relies on firing it's own gesture events like in hammer.js 1.0. Because of this an event should be created and fired.
								callTealeafEvent(eventData);
							}
						});
					}
					hammertimeArray.push(hammertime);
				}
			}
        },
        destroy: function () {
			//Turn off all the hammertimes
			if (hammertimeArray !== undefined && hammertimeArray !== null) {
				for (i = 0; i < hammertimeArray.length; i += 1) {
					hammertimeArray[i].off("tap press pinchstart pinchend panstart panend");
					hammertimeArray[i].enabled = false;
				}
			}
			//Reset the hammertime, gestureOptions and element arrays
			hammertimeArray = [];
			elementArray = [];
			gestureOptionsArray = [];
        },
        onevent: function (webEvent) {
			var id = null,
				position;

            // Sanity checks
            if (typeof webEvent !== "object" || !webEvent.type || !webEvent.gesture || !webEvent.target) {
                return;
            }
			//Find the position of the element in elementArray to find the corresponding gesture option object
			position = utils.indexOf(elementArray, webEvent.target.element);
			if (gestureOptionsArray[position] === undefined) {
				if (webEvent.gesture.pointerType === "mouse" && gestureOptions.preventMouse) {
					return;
				}
			} else {
				if (webEvent.gesture.pointerType === "mouse" && gestureOptionsArray[position].preventMouse) {
					return;
				}
			}

			id = utils.getValue(webEvent, "target.id");

            switch (webEvent.type) {
			case "tap":
				handleTap(id, webEvent);
				break;
			case "swipe":
				handlePinchAndSwipe(id, webEvent);
				break;
			case "pinch":
				handlePinchAndSwipe(id, webEvent);
				break;
			case "tapHold":
				handleGesture(id, webEvent);
				break;
			case "hold":
				handleGesture(id, webEvent);
				break;
			case "drag":
				handlePinchAndSwipe(id, webEvent);
				break;
			case "release":
				handleGesture(id, webEvent);
				break;
			}
        }
    };

});
