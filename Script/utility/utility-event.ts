
// This object is used by EventChecker.
// eventList consists of root.getCurrentSession().getAutoEventList(), root.getCurrentSession().getOpeningEventList(),
// and root.getCurrentSession().getEndingEventList(), with the exception of root.getCurrentSession().getCommunicationEventList().
// With the exception of communication events, these are lists that are executed automatically.
class EventCommonArray {

	static createArray(eventList?, eventType?) {
		var i, event, list, count;
		var firstArray = [];
		var lastArray = [];
		var eventArray = [];
		
		if (this._isMapCommonEnabled()) {
			list = root.getCurrentSession().getMapCommonEventList();
			count = list.getCount();
			for (i = 0; i < count; i++) {
				event = list.getData(i);
				if (event.getCommonEventInfo().getEventType() === eventType) {
					if (event.getCommonEventInfo().isFirst()) {
						firstArray.push(event);
					}
					else {
						lastArray.push(event);
					}
				}
			}
		}
		
		count = firstArray.length;
		for (i = 0; i < count; i++) {
			eventArray.push(firstArray[i]);
		}
		
		count = eventList.getCount();
		for (i = 0; i < count; i++) {
			eventArray.push(eventList.getData(i));
		}
		
		count = lastArray.length;
		for (i = 0; i < count; i++) {
			eventArray.push(lastArray[i]);
		}
		
		return eventArray;
	}

	static _isMapCommonEnabled() {
		return root.getBaseScene() !== SceneType.REST;
	}
}

class EventChecker extends BaseObject {

	_eventArray: any = null;

	_capsuleEvent: any = null;

	_eventIndex: any = 0;

	_isAllSkipEnabled: any = false;

	enterEventChecker(eventList?, eventType?) {
		this._eventArray = this._createEventArray(eventList, eventType);
		
		this._capsuleEvent = createObject(CapsuleEvent);
		this._eventIndex = 0;
		
		// EventCommandManager can track that the event ends
		EventCommandManager.setActiveEventChecker(this);
		
		return this._checkEvent();
	}

	moveEventChecker() {
		if (this._capsuleEvent === null) {
			EventCommandManager.setActiveEventChecker(null);
			return MoveResult.END;
		}
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			if (this._checkEvent() === EnterResult.NOTENTER) {
				EventCommandManager.setActiveEventChecker(null);
				this._capsuleEvent = null;
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	enableAllSkip() {
		this._isAllSkipEnabled = true;
	}

	_createEventArray(eventList?, eventType?) {
		return EventCommonArray.createArray(eventList, eventType);
	}

	_checkEvent() {
		var i, count, event, result;
		
		count = this._eventArray.length;
		for (i = this._eventIndex; i < count; i++) {
			this._eventIndex++;
			event = this._eventArray[i];
			
			if (event !== null && event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
				if (this._isAllSkipEnabled) {
					root.setEventSkipMode(true);
				}
				
				if (!this._isSessionEnabled()) {
					continue;
				}
				
				result = this._capsuleEvent.enterCapsuleEvent(event, true);
				if (result === EnterResult.OK) {
					return EnterResult.OK;
				}
			}
		}
		
		return EnterResult.NOTENTER;
	}

	
	// If the session doesn't exist or the map cannot be gotten, return false with this method.
	// For instance, when getting back to the title with "Change Scene" at the auto start event and
	// access to the map with the map common event, false is returned. 
	_isSessionEnabled() {
		var session = root.getCurrentSession();
		
		if (session === null) {
			return false;
		}
		
		return session.getCurrentMapInfo() !== null;
	}
}

// This object is used at the base opening event and the base ending event.
class RestEventChecker extends EventChecker {

	_isSessionEnabled() {
		return root.getCurrentSession() !== null;
	}
}

class RestAutoEventChecker extends EventChecker {

	_createEventArray(eventList?, restAutoType?) {
		var i, event, eventInfo;
		var count = eventList.getCount();
		var eventArray = [];
		
		for (i = 0; i < count; i++) {
			event = eventList.getData(i);
			eventInfo = event.getRestEventInfo();
			if (eventInfo === null) {
				continue;
			}
			
			if (eventInfo.getRestAutoType() === restAutoType) {
				eventArray.push(event);
			}
		}
		
		return eventArray;
	}

	_isSessionEnabled() {
		return root.getCurrentSession() !== null;
	}
}

class CapsuleEventMode {

	static RECOLLECTION: any = 0;

	static NORMAL: any = 1;

	static NONE: any = 2;
}

class CapsuleEvent extends BaseObject {

	_isExecuteMark: any = false;

	_event: any = null;

	_battleUnit: any = null;

	enterCapsuleEvent(event?, isExecuteMark?) {
		var mode, result, assocEvent;
		
		if (event === null) {
			return EnterResult.NOTENTER;
		}
		
		assocEvent = event.getAssociateRecollectionEvent();
		
		this._isExecuteMark = isExecuteMark;
		
		// Execute the recollection event.
		result = this._startRecollectionEvent(assocEvent);
		if (result === EnterResult.NOTENTER) {
			// The following code is executed, it means that the execution of the recollection event has ended,
			// or the recollection event has never existed.
			
			// Execute the normal event.
			result = this._startNormalEvent(event);
			if (result === EnterResult.NOTENTER) {
				this.changeCycleMode(CapsuleEventMode.NONE);
				return EnterResult.NOTENTER;
			}
			
			this._event = event;
			mode = CapsuleEventMode.NORMAL;
		}
		else {
			this._event = event;
			mode = CapsuleEventMode.RECOLLECTION;
		}
		
		this.changeCycleMode(mode);
		
		return result;
	}

	setBattleUnit(unit?) {
		this._battleUnit = unit;
	}

	moveCapsuleEvent() {
		var result;
		var mode = this.getCycleMode();
		
		if (mode === CapsuleEventMode.NONE) {
			return MoveResult.END;
		}
		
		if (EventCommandManager.isEventRunning(this._event)) {
			// Don't continue because the event is still executed.
			return MoveResult.CONTINUE;
		}
		
		if (mode === CapsuleEventMode.RECOLLECTION) {
			// If the recollection event ends, execute the normal event.
			result = this._startNormalEvent(this._event);
			if (result === EnterResult.NOTENTER) {
				this._doEndAction();
				return MoveResult.END;
			}
			
			this.changeCycleMode(CapsuleEventMode.NORMAL);
		}
		else if (mode === CapsuleEventMode.NORMAL) {
			// If the normal event ends, it means to end to process.
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_startNormalEvent(event?) {
		return this._startAndMarkEvent(event, this._isExecuteMark, this._battleUnit !== null);
	}

	_startRecollectionEvent(event?) {
		// The recollection event is always executed, so the second argument is true.
		return this._startAndMarkEvent(event, true, false);
	}

	_startAndMarkEvent(event?, isExecuteMark?, isBattle?) {
		if (event === null) {
			return EnterResult.NOTENTER;
		}
		
		// Execute before startEvent/startBattleEvent,
		// so that executed mark is disabled with "Event State Change" of the event command.
		if (isExecuteMark) {
			// With this calling, the event is executed.
			event.setExecutedMark(EventExecutedType.EXECUTED);
		}
		
		// startEvent (which executes events) internally identifies which event pages are enabled,
		// but a similar process is carried out in isEvent, where the result is cached.
		// It is more efficient to use the cached result from isEvent when startEvent is called immediately after isEvent.
		// Calling useCachedEventPage not only utilizes the cache, but it also has the following effects.
		// 1. The cost to identify which event pages are enabled is reduced because it is only calculated once.
		// 2. If it is calculated two times and the event condition is based on probability,
		// the first time may succeed but the second time may fail, so this is prevented.
		event.useCachedEventPage(true);
		
		if (isBattle) {
			event.startBattleEvent(this._battleUnit);
		}
		else {
			event.startEvent();
		}
		
		return EventCommandManager.returnEnterCode();
	}

	_doEndAction() {
		root.setEventSkipMode(false);
	}
}

class DemoMapEventMode {

	static BLACKOUT: any = 0;

	static EVENT: any = 1;

	static BLACKIN: any = 2;
}

class DemoMapEvent extends BaseObject {

	_mapId: any = 0;

	_eventChecker: any = null;

	_transition: any = null;

	_isTransitionEnabled: any = false;

	enterDemoMapEvent(mapId?) {
		this._prepareMemberData(mapId);
		return this._completeMemberData(mapId);
	}

	moveDemoMapEvent() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === DemoMapEventMode.BLACKOUT) {
			result = this._moveBlackout();
		}
		else if (mode === DemoMapEventMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === DemoMapEventMode.BLACKIN) {
			result = this._moveBlackin();
		}
		
		return result;
	}

	drawDemoMapEvent() {
		if (this.getCycleMode() === DemoMapEventMode.EVENT) {
			MapLayer.drawMapLayer();
			MapLayer.drawUnitLayer();
		}
	}

	backDemoMapEvent() {
		MapLayer.moveMapLayer();
		
		return MoveResult.CONTINUE;
	}

	enableTransition(isEnabled?) {
		this._isTransitionEnabled = isEnabled;
	}

	_moveBlackout() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			if (!this._startMap()) {
				if (!this._startBlackOut()) {
					return MoveResult.END;
				}
			}
			
			return MoveResult.CONTINUE;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			root.closeMap();
			
			if (!this._startBlackOut()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveBlackin() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_prepareMemberData(mapId?) {
		this._eventChecker = createObject(EventChecker);
		this._transition = createObject(SystemTransition);
		this._mapId = mapId;
	}

	_completeMemberData(mapId?) {
		if (mapId === -1) {
			return EnterResult.NOTENTER;
		}
		
		if (this._isTransitionEnabled && !SceneManager.isScreenFilled()) {
			this._transition.setFadeSpeed(this._getChangeSpeed());
			this._transition.setDestOut();
			this.changeCycleMode(DemoMapEventMode.BLACKOUT);
			return EnterResult.OK;
		}
		
		return this._startMap() ? EnterResult.OK : (EnterResult as any).NOENTER; // NOTE (JS->TS): typo in original - elsewhere it's NOTENTER
	}

	_startMap() {
		if (!root.openMap(this._mapId)) {
			return false;
		}
		
		SceneManager.resetCurrentMap();
		
		this._eventChecker.enterEventChecker(this._getEventList(), this._getEventType());
		
		this.changeCycleMode(DemoMapEventMode.EVENT);
		
		return true;
	}

	_startBlackOut() {
		if (this._isTransitionEnabled && SceneManager.isScreenFilled()) {
			this._transition.setFadeSpeed(this._getChangeSpeed());
			this._transition.setDestIn();
			this.changeCycleMode(DemoMapEventMode.BLACKIN);
			
			return true;
		}
		
		return false;
	}

	_getEventList() {
		// Session returned with this method is a Session of the map opened by OpenMap.
		return root.getCurrentSession().getOpeningEventList();
	}

	_getEventType() {
		return EventType.OPENING;
	}

	_getChangeSpeed() {
		return 8;
	}
}

class DynamicEvent extends BaseObject {

	_generator: any = null;

	_event: any = null;

	acquireEventGenerator() {
		this._generator = root.getEventGenerator();
		
		return this._generator;
	}

	executeDynamicEvent() {
		this._event = this._generator.execute();
		
		return EventCommandManager.returnEnterCode();
	}

	moveDynamicEvent() {
		if (EventCommandManager.isEventRunning(this._event)) {
			return MoveResult.CONTINUE;
		}
		
		return MoveResult.END;
	}
}

class DynamicAnime extends BaseObject {

	_motion: any = null;

	_isLoopMode: any = false;

	_defaultMotionColorIndex: any = 0;

	startDynamicAnime(anime?, x?, y?) {
		var motionParam;
		
		if (anime === null) {
			return null;
		}
		
		motionParam = StructureBuilder.buildMotionParam();
		motionParam.animeData = anime;
		motionParam.x = x;
		motionParam.y = y;
		motionParam.isRight = true;
		motionParam.motionId = 0;
		motionParam.motionColorIndex = this._defaultMotionColorIndex;
		
		this._motion = createObject(AnimeMotion);
		this._motion.setMotionParam(motionParam);
		
		return this._motion;
	}

	moveDynamicAnime() {
		var result;
		
		if (this._motion === null || InputControl.isStartAction()) {
			return MoveResult.END;
		}
		
		result = this._motion.moveMotion();
		
		MapLayer.setEffectMotion(this._motion);
		
		if (result !== MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		this._motion.nextFrame();
		if (this._motion.isLastFrame()) {
			MapLayer.setEffectMotion(null);
			if (this._isLoopMode) {
				this._motion.setFrameIndex(0);
			}
			else {
				this._motion = null;
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawDynamicAnime() {
		if (this._motion === null) {
			return;
		}
		
		if (this._motion.getScreenEffectRangeType() === EffectRangeType.ALL) {
			// If it's EffectRangeType.ALL, draw explicitly.
			this._motion.drawBackgroundAnime();
			this._motion.drawScreenColor();
		}
		
		this._motion.drawMotion(0, 0);
	}

	endEffect() {
		this._motion = null;
	}

	isEffectLast() {
		if (this._motion === null) {
			return true;
		}
		
		return this._motion.isLastFrame();
	}

	getEffectX() {
		return this._motion.getX();
	}

	getEffectY() {
		return this._motion.getY();
	}

	getFrameIndex() {
		return this._motion.getFrameIndex();
	}

	getFrameCount() {
		return this._motion.getFrameCount();
	}

	getAnimeMotion() {
		return this._motion;
	}

	setLoopMode(isLoopMode?) {
		this._isLoopMode = isLoopMode;
	}

	setDefaultMotionColorIndex(colorIndex?) {
		this._defaultMotionColorIndex = colorIndex;
	}
}
