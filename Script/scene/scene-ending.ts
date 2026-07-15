
class EndingScene extends BaseScene {

	_straightFlow: any = null;

	setSceneData() {
		// When entering the ending, notify that the game was completed immediately.
		// If the forced termination occurs after this processing, prevent to disable the completion.
		root.getSceneController().completeGame();
		
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	}

	moveSceneCycle() {
		this._moveCommonAnimation();
		
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawSceneCycle() {
		MapLayer.drawUnitLayer();
		this._straightFlow.drawStraightFlow();
	}

	moveBackSceneCycle() {
		this._moveCommonAnimation();
		return MoveResult.CONTINUE;
	}

	_prepareSceneMemberData() {
		this._straightFlow = createObject(StraightFlow);
	}

	_completeSceneMemberData() {
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		this._straightFlow.enterStraightFlow();
	}

	_moveCommonAnimation() {
		MapLayer.moveMapLayer();
		return MoveResult.CONTINUE;
	}

	_doEndAction() {
		// All FlowEntry calls have been completed, so return to the title screen.
		root.resetGame();
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(EndingBlckOutFlowEntry);
		straightFlow.pushFlowEntry(EndingMapEndFlowEntry);
		straightFlow.pushFlowEntry(EndingSaveFlowEntry);
		straightFlow.pushFlowEntry(EndingLogoFlowEntry);
	}
}

class EndingBlckOutFlowEntry extends BaseFlowEntry {

	_transition: any = null;

	enterFlowEntry(endingScene?) {
		this._prepareMemberData(endingScene);
		return this._completeMemberData(endingScene);
	}

	moveFlowEntry() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._transition.drawTransition();
	}

	_prepareMemberData(endingScene?) {
		this._transition = createObject(SystemTransition);
	}

	_completeMemberData(endingScene?) {
		if (SceneManager.isScreenFilled()) {
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
		this._transition.setDestOut();
		this._transition.setFadeSpeed(3);
		
		return EnterResult.OK;
	}

	_doEndAction() {
		// To save the completed, recover the player and remove the guest.
		UnitProvider.recoveryPlayerList();
		root.getCurrentSession().removeGuestUnit();
		
		root.resetVisualEventObject();
	}
}

class EndingMapEndFlowEntry extends BaseFlowEntry {
	_eventChecker: any;


	_evetChecker: any = null;

	enterFlowEntry(endingScene?) {
		this._prepareMemberData(endingScene);
		return this._completeMemberData(endingScene);
	}

	moveFlowEntry() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_prepareMemberData(endingScene?) {
		this._eventChecker = createObject(EventChecker);
	}

	_completeMemberData(endingScene?) {
		var result;
		
		// If the ending event has already been executed, don't continue.
		if (root.getSceneController().isEndingEventExecuted()) {
			return EnterResult.NOTENTER;
		}
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getEndingEventList(), EventType.ENDING);
		if (result === EnterResult.NOTENTER) {
			return EnterResult.NOTENTER;
		}
			
		return EnterResult.OK;
	}

	_doEndAction() {
	}
}

class EndingSaveFlowEntry extends BaseFlowEntry {

	_loadSaveScreen: any = null;

	enterFlowEntry(endingScene?) {
		this._prepareMemberData(endingScene);
		return this._completeMemberData(endingScene);
	}

	moveFlowEntry() {
		if (SceneManager.isScreenClosed(this._loadSaveScreen)) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		root.getGraphicsManager().fill(0x0);
	}

	_prepareMemberData(endingScene?) {
	}

	_completeMemberData(endingScene?) {
		var screenParam;
		
		if (!root.getSceneController().isCompletedSaveFlag()) {
			return EnterResult.NOTENTER;
		}
		
		// Before executing "Ending" with "Change Scene",
		// if "Call Save Screen" selected "Save as Game Completed", isCompletedSaveFlag returns true.
		// So save the game complete data in the save file.
		screenParam = this._createScreenParam();
		this._loadSaveScreen = createObject(LoadSaveControl.getSaveScreenObject());
		SceneManager.addScreen(this._loadSaveScreen, screenParam);
		
		return EnterResult.OK;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildLoadSave();
		
		screenParam.isLoad = false;
		screenParam.mapId = MapIdValue.COMPLETE;
		screenParam.scene = SceneType.REST;
		
		return screenParam;
	}
}

class EndingLogoMode {

	static BLACKIN: any = 0;

	static LOGO: any = 1;
}

class EndingLogoFlowEntry extends BaseFlowEntry {

	_transition: any = null;

	_scrollBackground: any = null;

	enterFlowEntry(endingScene?) {
		this._prepareMemberData(endingScene);
		return this._completeMemberData(endingScene);
	}

	moveFlowEntry() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (InputControl.isStartAction()) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		if (mode === EndingLogoMode.BLACKIN) {
			result = this._moveBlackin();
		}
		else if (mode === EndingLogoMode.LOGO) {
			result = this._moveLogo();
		}
		
		return result;
	}

	drawFlowEntry() {
		this._scrollBackground.drawScrollBackground();
		this._transition.drawTransition();
	}

	_prepareMemberData(endingScene?) {
		this._transition = createObject(SystemTransition);
		this._scrollBackground = createObject(ScrollBackground);
	}

	_completeMemberData(endingScene?) {
		MediaControl.musicPlayNew(root.querySoundHandle('endingmusic'));
		
		this._setBackgroundData();
		
		SceneManager.setEffectAllRange(true);
		this._transition.setDestIn();
		this._transition.setFadeSpeed(2);
		this.changeCycleMode(EndingLogoMode.BLACKIN);
		
		return EnterResult.OK;
	}

	_setBackgroundData() {
		var pic = root.getSceneController().getSceneBackgroundImage(SceneType.ENDING);
		
		this._scrollBackground.startScrollBackground(pic);
	}

	_moveBlackin() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this.changeCycleMode(EndingLogoMode.LOGO);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveLogo() {
		if (InputControl.isSelectAction()) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_doEndAction() {
	}
}
