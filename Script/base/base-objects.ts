
class BaseEventCommand extends BaseObject {

	enterEventCommandCycle() {
		return EnterResult.NOTENTER;
	}

	moveEventCommandCycle() {
		// If the screen is not active, but some animation processing is needed, override this method.
		return MoveResult.END;
	}

	drawEventCommandCycle() {
	}

	backEventCommandCycle() {
	}

	mainEventCommand() {
	}

	isEventCommandContinue() {
		// Currently, if the event is a skip state, end by executing only main processing.
		// Even if graphics are not needed to be displayed, end by executing only a main processing.
		if (this.isSystemSkipMode()) {
			this.mainEventCommand();
			// Notify that event command processing should not be continued with the return false because main processing has ended.
			return false;
		}
		
		return true;
	}

	stopEventSkip() {
		root.setEventSkipMode(false);
	}

	isEventCommandSkipAllowed() {
		// The event command (such as Choice Show) which doesn't allow skip, return false.
		return true;
	}

	isSystemSkipMode() {
		// Skip has 2 kinds, event skip and turn skip.
		// Event skip occurs when skip key is pressed in the event and is to skip the event only.
		// It means that turn itself is not skipped.
		
		// Meanwhile, turn event is to skip the enemy's and player's turn themselves.
		// So each player's unit motion as well as the event occurs within the turn are skipped.
		// It means that turn skip includes the event skip, so specifies the isEventSkipMode.  
		return root.isEventSkipMode() || CurrentMap.isTurnSkipMode();
	}

	getEventCommandName() {
		// If implement original event command, return the name.
		return '';
	}
}

class BaseScene extends BaseObject {

	setSceneData(screenParam?) {
	}

	moveSceneCycle() {
		return MoveResult.END;
	}

	moveBackSceneCycle() {
		// If the screen is not active, but some animation processing is needed, override this method.
		return MoveResult.END;
	}

	drawSceneCycle() {
	}
}

class BaseScreen extends BaseObject {

	setScreenData(screenParam?) {
	}

	moveScreenCycle() {
		return MoveResult.END;
	}

	moveBackScreenCycle() {
		// If the screen is not active, but some animation processing is needed, override this method.
		return MoveResult.END;
	}

	drawScreenCycle() {
	}

	drawScreenTopText(textui?) {
		if (textui === null) {
			return;
		}
		
		TextRenderer.drawScreenTopText(this.getScreenTitleName(), textui);
	}

	drawScreenBottomText(textui?) {
		if (textui === null) {
			return;
		}
		
		TextRenderer.drawScreenBottomTextCenter('', textui);
	}

	getScreenInteropData() {
		return null;
	}

	getScreenTitleName() {
		var interopData = this.getScreenInteropData();
		
		if (interopData === null) {
			return '';
		}
		
		return interopData.getScreenTitleName();
	}

	getScreenBackgroundImage() {
		var interopData = this.getScreenInteropData();
		
		if (interopData === null) {
			return null;
		}
		
		return interopData.getScreenBackgroundImage();
	}

	getScreenMusicHandle() {
		var interopData = this.getScreenInteropData();
		
		if (interopData === null) {
			return root.createEmptyHandle();
		}
		
		return interopData.getScreenMusicHandle();
	}

	getScreenResult() {
		return true;
	}

	notifyChildScreenClosed() {
	}
}

class BaseWindow extends BaseObject {
	xRendering: any;
	yRendering: any;


	_isWindowEnabled: any = true;

	_drawParentData: any = null;

	initialize() {
	}

	moveWindow() {
		return this.moveWindowContent();
	}

	moveWindowContent() {
		return MoveResult.CONTINUE;
	}

	drawWindow(x?, y?) {
		var width = this.getWindowWidth();
		var height = this.getWindowHeight();
		
		if (!this._isWindowEnabled) {
			return;
		}
		
		this._drawWindowInternal(x, y, width, height);
		
		if (this._drawParentData !== null) {
			this._drawParentData(x, y);
		}
		
		// The move method enables to refer to the coordinate with a mouse.
		this.xRendering = x + this.getWindowXPadding();
		this.yRendering = y + this.getWindowYPadding();
		
		this.drawWindowContent(x + this.getWindowXPadding(), y + this.getWindowYPadding());
		
		this.drawWindowTitle(x, y, width, height);
	}

	drawWindowContent(x?, y?) {
	}

	drawWindowTitle(x?, y?, width?, height?) {
		var color, font, pic, titleWidth, dx;
		var titlePartsCount = this._getWindowTitlePartsCount();
		var textui = this.getWindowTitleTextUI();
		var text = this.getWindowTitleText();
		
		if (textui === null || text === '') {
			return;
		}
		
		color = textui.getColor();
		font = textui.getFont();
		pic = textui.getUIImage();
		titleWidth = TitleRenderer.getTitlePartsWidth() * (titlePartsCount + 2);
		dx = Math.floor((width - titleWidth) / 2);
		TextRenderer.drawFixedTitleText(x + dx, y - 40, text, color, font, TextFormat.CENTER, pic, titlePartsCount);
	}

	getWindowTextUI() {
		return root.queryTextUI('default_window');
	}

	getWindowTitleTextUI() {
		return null;
	}

	getWindowTitleText() {
		return '';
	}

	getWindowWidth() {
		return 100;
	}

	getWindowHeight() {
		return 100;
	}

	getWindowXPadding() {
		return DefineControl.getWindowXPadding();
	}

	getWindowYPadding() {
		return DefineControl.getWindowYPadding();
	}

	enableWindow(isWindowEnabled?) {
		this._isWindowEnabled = isWindowEnabled;
	}

	setDrawingMethod(method?) {
		this._drawParentData = method;
	}

	_drawWindowInternal(x?, y?, width?, height?) {
		var pic = null;
		var textui = this.getWindowTextUI();
		
		if (textui !== null) {
			pic = textui.getUIImage();
		}
		
		if (pic !== null) {
			WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		}
	}

	_getWindowTitlePartsCount() {
		return 3;
	}
}

class BaseWindowManager extends BaseObject {

	initialize() {
	}

	moveWindowManager() {
		return MoveResult.CONTINUE;
	}

	drawWindowManager() {
	}

	getTotalWindowWidth() {
		return 0;
	}

	getTotalWindowHeight() {
		return 0;
	}

	getPositionWindowX() {
		return 0;
	}

	getPositionWindowY() {
		return 0;
	}
}

class BaseNoticeView extends BaseObject {

	moveNoticeView() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawNoticeView(x?, y?) {
		var textui = this.getTitleTextUI();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = this.getTitlePartsCount();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		x += this._getNoticeStartX();
		y += this._getNoticeStartY();
		this.drawNoticeViewContent(x, y);
	}

	drawNoticeViewContent(x?, y?) {
	}

	getNoticeViewWidth() {
		return (this.getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth();
	}

	getNoticeViewHeight() {
		return TitleRenderer.getTitlePartsHeight();
	}

	getTitleTextUI() {
		return root.queryTextUI('support_title');
	}

	getTitlePartsCount() {
		return 6;
	}

	_getNoticeInterval() {
		return 100;
	}

	_getNoticeStartX() {
		return 30;
	}

	_getNoticeStartY() {
		return 18;
	}

	_getNoticeOffsetY() {
		return 0;
	}
}

class BaseFlowEntry extends BaseObject {

	enterFlowEntry(flowData?) {
		return EnterResult.NOTENTER;
	}

	moveFlowEntry() {
		return MoveResult.END;
	}

	moveBackFlowEntry() {
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
	}

	isFlowSkip() {
		return CurrentMap.isCompleteSkipMode();
	}
}

class BaseTurn extends BaseObject {

	initialize() {
	}

	openTurnCycle() {
	}

	moveTurnCycle() {
		return MoveResult.END;
	}

	drawTurnCycle() {
	}
}

class BaseBattle extends BaseObject {

	_battleTable: any = null;

	_attackFlow: any = null;

	_order: any = null;

	_attackInfo: any = null;

	_battlerRight: any = null;

	_battlerLeft: any = null;

	_effectArray: any = null;

	initialize() {
	}

	openBattleCycle() {
	}

	moveBattleCycle() {
		return MoveResult.END;
	}

	drawBattleCycle() {
	}

	backBattleCycle() {
	}

	eraseRoutine() {
	}

	notifyStopMusic() {
	}

	endBattle() {
	}

	getBattleTable() {
		return this._battleTable;
	}

	isSyncopeErasing() {
		return true;
	}

	isBattleSkipAllowed() {
		return true;
	}

	getAttackFlow() {
		return this._attackFlow;
	}

	getAttackOrder() {
		return this._order;
	}

	getAttackInfo() {
		return this._attackInfo;
	}

	getBattler(isRight?) {
		var battler;
		
		if (isRight) {
			battler = this._battlerRight;
		}
		else {
			battler = this._battlerLeft;
		}
		
		return battler;
	}

	
	// Active unit is the unit to attack from now on.
	// Active unit can be on the right side and on the left side.  
	getActiveBattler() {
		var unit = this._order.getActiveUnit();
		
		if (unit === this._battlerRight.getUnit()) {
			return this._battlerRight;
		}
		
		return this._battlerLeft;
	}

	
	// Passive unit is the unit to be attacked from now on.
	getPassiveBattler() {
		var unit = this._order.getPassiveUnit();
		
		if (unit === this._battlerRight.getUnit()) {
			return this._battlerRight;
		}
		
		return this._battlerLeft;
	}

	createEffect(anime?, x?, y?, right?, isHitCheck?) {
		var effect = createObject(RealEffect);
		
		if (anime === null) {
			return null;
		}
		
		effect.setupRealEffect(anime, x, y, right, this);
		effect.setHitCheck(isHitCheck);
		
		this._effectArray.push(effect);
		
		return effect;
	}

	createEasyEffect(anime?, x?, y?) {
		var effect = createObject(RealEffect);
		
		if (anime === null) {
			return null;
		}
		
		effect.setupRealEffect(anime, x, y, true, this);
		effect.setEasyFlag(true);
		
		this._effectArray.push(effect);
		
		return effect;
	}

	pushCustomEffect(object?) {
		this._effectArray.push(object);
	}

	getEffectArray() {
		return this._effectArray;
	}

	_moveEffect() {
		var i, effect;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			effect = this._effectArray[i];
			effect.moveEffect();
			if (effect.isEffectLast()) {
				i--;
				count--;
				this._removeEffect(effect);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAsyncEffect() {
		var i, effect;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			effect = this._effectArray[i];
			if (!effect.isAsync()) {
				continue;
			}
			
			effect.moveEffect();
			if (effect.isEffectLast()) {
				i--;
				count--;
				this._removeEffect(effect);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_drawEffect() {
		var i, effect;
		var effectArray = this._effectArray;
		var count = effectArray.length;
		
		for (i = 0; i < count; i++) {
			effect = effectArray[i];
			effect.drawEffect(0, 0, false);
		}
	}

	_removeEffect(effect?) {
		var i;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._effectArray[i] === effect) {
				this._effectArray.splice(i, 1);
				break;
			}
		}
	}

	_isSyncEffectLast() {
		var i;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			if (!this._effectArray[i].isAsync()) {
				return false;
			}
		}
		
		return true;
	}
}

class BaseCustomEffect extends BaseObject {

	_isLast: any = false;

	_isAsync: any = false;

	moveEffect() {
		return MoveResult.CONTINUE;
	}

	drawEffect(xScroll?, yScroll?) {
	}

	endEffect() {
		this._isLast = true;
	}

	isEffectLast() {
		return this._isLast;
	}

	getEffectX() {
		return 0;
	}

	getEffectY() {
		return 0;
	}

	setAsync(isAsync?) {
		this._isAsync = isAsync;
	}

	isAsync() {
		return this._isAsync;
	}

	getAnimeMotion() {
		return null;
	}
}
