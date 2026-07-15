
class BattleResultScene extends BaseScene {

	_straightFlow: any = null;

	setSceneData() {
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	}

	moveSceneCycle() {
		var result = MoveResult.CONTINUE;
		
		this._moveCommonAnimation();
		
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._doEndAction();
			this._changeNextScene();
			return MoveResult.END;
		}
		
		return result;
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
		CurrentMap.setTurnSkipMode(false);
		
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntriesBefore(this._straightFlow);
		this._pushFlowEntriesMain(this._straightFlow);
		this._pushFlowEntriesAfter(this._straightFlow);
		this._straightFlow.enterStraightFlow();
	}

	_moveCommonAnimation() {
		MapLayer.moveMapLayer();
		return MoveResult.CONTINUE;
	}

	_doEndAction() {
	}

	_changeNextScene() {
		var mapId;
		var type = root.getSceneController().getRestSaveType();
		
		this._closeMusic();
		
		if (type === RestSaveType.AREA || type === RestSaveType.AREANOSAVE) {
			root.changeScene(SceneType.REST);
		}
		else {
			mapId = root.getSceneController().getNextMapId();
			root.getSceneController().startNewMap(mapId);
			root.changeScene(SceneType.BATTLESETUP);
		}
	}

	_closeMusic() {
		MediaControl.resetMusicList();
	}

	_pushFlowEntriesBefore(straightFlow?) {
		straightFlow.pushFlowEntry(BeforeTransitionFlowEntry);
	}

	_pushFlowEntriesMain(straightFlow?) {
		// Fadein/out on the screen process is not included in FlowEntry.
		// That's because if switched it to the next FlowEntry, get the color back to the original color.
		straightFlow.pushFlowEntry(MapVictoryFlowEntry);
		straightFlow.pushFlowEntry(MapResultFlowEntry);
		straightFlow.pushFlowEntry(ObtainTrophyFlowEntry);
	}

	_pushFlowEntriesAfter(straightFlow?) {
		straightFlow.pushFlowEntry(AfterTransitionFlowEntry);
		straightFlow.pushFlowEntry(MapEndFlowEntry);
		straightFlow.pushFlowEntry(BattleResultSaveFlowEntry);
	}
}

class BeforeTransitionFlowEntry extends BaseFlowEntry {

	_transition: any = null;

	enterFlowEntry(battleResultScene?) {
		this._prepareMemberData(battleResultScene);
		return this._completeMemberData(battleResultScene);
	}

	moveFlowEntry() {
		return this._transition.moveTransition();
	}

	_prepareMemberData(battleResultScene?) {
		this._transition = createObject(SystemTransition);
	}

	_completeMemberData(battleResultScene?) {
		var effect;
		
		if (SceneManager.isScreenFilled()) {
			// If it's EffectRangeType.ALL, the characters on the "logo" are all covered,
			// so change it to EffectRangeType.MAPANDCHAR.
			effect = root.getScreenEffect();
			effect.setRange(EffectRangeType.MAPANDCHAR);
			return EnterResult.NOTENTER;
		}
		
		this._transition.setFadeSpeed(5);
		this._transition.setEffectRangeType(EffectRangeType.MAPANDCHAR);
		this._transition.setVolume(160, 0, 0, true);
		
		return EnterResult.OK;
	}
}

class MapVictoryFlowEntry extends BaseFlowEntry {

	_counter: any = null;

	enterFlowEntry(battleResultScene?) {
		this._prepareMemberData(battleResultScene);
		return this._completeMemberData(battleResultScene);
	}

	moveFlowEntry() {
		if (InputControl.isSelectAction() || this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		var x, y;
		var pic = root.queryUI('mapclear_frame');
		var pic2 = root.queryTextUI('simple_frame').getUIImage();
		
		if (pic !== null) {
			x = LayoutControl.getCenterX(-1, pic.getWidth());
			y = LayoutControl.getCenterY(-1, pic.getHeight());
			
			if (pic2 !== null) {
				pic2.draw(x, y);
			}
			pic.draw(x, y);
		}
	}

	_prepareMemberData(battleResultScene?) {
		this._counter = createObject(CycleCounter);
	}

	_completeMemberData(battleResultScene?) {
		if (!this._isDisplayable()) {
			return EnterResult.NOTENTER;
		}
		
		this._counter.setCounterInfo(50);
		
		this._playMapVictory();
		
		return EnterResult.OK;
	}

	_isDisplayable() {
		if (root.getCurrentSession().getTrophyPoolList().getCount() > 0) {
			// If a trophy is pooled, even one, get it.
			return true;
		}
		
		// Check if it's enabled with game option and also enabled with "Victory Map".
		return DataConfig.isMapVictoryDisplayable() && root.getSceneController().isMapVictoryDisplayable();
	}

	_playMapVictory() {
		MediaControl.soundDirect('mapvictory');
	}
}

class MapResultFlowEntry extends BaseFlowEntry {

	_gold: any = 0;

	_bonus: any = 0;

	_scrollbar: any = null;

	enterFlowEntry(battleResultScene?) {
		this._prepareMemberData(battleResultScene);
		return this._completeMemberData(battleResultScene);
	}

	moveFlowEntry() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		var x = LayoutControl.getCenterX(-1, this._getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._getWindowHeight());
		
		this._drawGoldZone(x, y);
		this._drawBonusZone(x, y);
		this._drawItemZone(x, y);
	}

	_prepareMemberData(battleResultScene?) {
		this._gold = 0;
		this._bonus = 0;
		this._scrollbar = createScrollbarObject(ResultItemScrollbar, this);
	}

	_completeMemberData(battleResultScene?) {
		this._scrollbar.setScrollFormation(2, 6);
		this._setScrollData();
		
		if (!this._isDisplayable()) {
			return EnterResult.NOTENTER;
		}
		
		return EnterResult.OK;
	}

	_setScrollData() {
		var i, item, trophy, type;
		var list = root.getCurrentSession().getTrophyPoolList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			trophy = list.getData(i);
			type = trophy.getFlag();
			if (type & TrophyFlag.ITEM) {
				item = trophy.getItem();
				this._scrollbar.objectSet(item);
			}
			if (type & TrophyFlag.GOLD) {
				this._gold += trophy.getGold();
			}
			if (type & TrophyFlag.BONUS) {
				this._bonus += trophy.getBonus();
			}
		}
		
		this._scrollbar.objectSetEnd();
	}

	_drawGoldZone(x?, y?) {
		y += 40;
		this._drawAreaTitle(x, y, StringTable.BattleResult_GetGold);
		
		x += 200;
		NumberRenderer.drawNumberColor(x, y + 15, this._gold, 2, 255);
	}

	_drawBonusZone(x?, y?) {
		y += 110;
		this._drawAreaTitle(x, y, StringTable.BattleResult_GetBonus);
		
		x += 200;
		NumberRenderer.drawNumberColor(x, y + 15, this._bonus, 2, 255);
	}

	_drawItemZone(x?, y?) {
		y += 180;
		
		this._drawAreaTitle(x, y, StringTable.BattleResult_GetItem);
		this._scrollbar.drawScrollbar(x, y + 55);
	}

	_drawAreaTitle(x?, y?, title?) {
		var textui = root.queryTextUI('trophy_title');
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y, title, color, font, TextFormat.LEFT, pic, this._getTitlePartsCount());
	}

	_getWindowWidth() {
		return 480;
	}

	_getWindowHeight() {
		return 440;
	}

	getWindowTextUI() {
		return root.queryTextUI('default_window');
	}

	_getTitlePartsCount() {
		return 6;
	}

	_isDisplayable() {
		// If a trophy is pooled, even one trophy, collect it.
		return root.getCurrentSession().getTrophyPoolList().getCount() > 0;
	}
}

class ResultItemScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		ItemRenderer.drawItem(x, y, object, color, font, false);
	}

	getObjectWidth() {
		return ItemRenderer.getItemWidth();
	}

	getObjectHeight() {
		return ItemRenderer.getItemHeight();
	}
}

class ObtainTrophyFlowEntry extends BaseFlowEntry {

	_dynamicEvent: any = null;

	enterFlowEntry(battleResultScene?) {
		this._prepareMemberData(battleResultScene);
		return this._completeMemberData(battleResultScene);
	}

	moveFlowEntry() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	_prepareMemberData(battleResultScene?) {
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeMemberData(battleResultScene?) {
		var generator;
		var list = root.getCurrentSession().getTrophyPoolList();
		
		generator = this._dynamicEvent.acquireEventGenerator();
		
		this._setGoldAndBonus(generator, list);
		this._setItem(generator, list);
		this._setGuestItem(generator);
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	_setGoldAndBonus(generator?, list?) {
		var i, type, trophy;
		var gold = 0;
		var bonus = 0;
		var count = list.getCount();
		var isSkipMode = true;
		
		for (i = 0; i < count; i++) {
			trophy = list.getData(i);
			type = trophy.getFlag();
			if (type & TrophyFlag.GOLD) {
				gold += trophy.getGold();
			}
			if (type & TrophyFlag.BONUS) {
				bonus += trophy.getBonus();
			}
		}
		
		if (gold !== 0) {
			generator.goldChange(gold, IncreaseType.INCREASE, isSkipMode);
		}
		
		if (bonus !== 0) {
			generator.bonusChange(bonus, IncreaseType.INCREASE, isSkipMode);
		}
	}

	_setItem(generator?, list?) {
		var i, type, trophy, item;
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			trophy = list.getData(i);
			type = trophy.getFlag();
			if (type & TrophyFlag.ITEM) {
				item = trophy.getItem();
				generator.stockItemChange(item, IncreaseType.INCREASE, true);
			}
		}
	}

	_setGuestItem(generator?) {
		var i, j, count2, unit, item;
		var list = PlayerList.getAliveList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.isGuest()) {
				// The guest disappears when the map is completed.
				// So if the important item is possessed, store the item.
				count2 = UnitItemControl.getPossessionItemCount(unit);
				for (j = 0; j < count2; j++) {
					item = UnitItemControl.getItem(unit, j);
					if (item !== null && item.isImportance()) {
						generator.stockItemChange(item, IncreaseType.INCREASE, true);
						generator.unitItemChange(unit, item, IncreaseType.DECREASE, true);
					}
				}
			}
		}
	}
}

class AfterTransitionFlowEntry extends BaseFlowEntry {

	_transition: any = null;

	enterFlowEntry(battleResultScene?) {
		this._prepareMemberData(battleResultScene);
		return this._completeMemberData(battleResultScene);
	}

	moveFlowEntry() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_prepareMemberData(battleResultScene?) {
		this._transition = createObject(SystemTransition);
	}

	_completeMemberData(battleResultScene?) {
		if (SceneManager.isScreenFilled()) {
			return EnterResult.NOTENTER;
		}
		
		this._transition.setFadeSpeed(5);
		this._transition.setEffectRangeType(EffectRangeType.MAPANDCHAR);
		this._transition.setVolume(255, 0, 160, true);
		
		return EnterResult.OK;
	}

	_doEndAction() {
		MapLayer.getMarkingPanel().resetMarkingPanel();
		root.resetVisualEventObject();
	}
}

class MapEndFlowEntry extends BaseFlowEntry {
	_eventChecker: any;


	_evetChecker: any = null;

	enterFlowEntry(battleResultScene?) {
		this._prepareMemberData(battleResultScene);
		return this._completeMemberData(battleResultScene);
	}

	moveFlowEntry() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_prepareMemberData(battleResultScene?) {
		this._eventChecker = createObject(EventChecker);
	}

	_completeMemberData(battleResultScene?) {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getEndingEventList(), EventType.ENDING);
		if (result === EnterResult.NOTENTER) {
			return EnterResult.NOTENTER;
		}
			
		return EnterResult.OK;
	}

	_doEndAction() {
	}
}

class BattleResultSaveFlowEntry extends BaseFlowEntry {

	_loadSaveScreen: any = null;

	enterFlowEntry(battleResultScene?) {
		this._prepareMemberData(battleResultScene);
		return this._completeMemberData(battleResultScene);
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

	_prepareMemberData(battleResultScene?) {
	}

	_completeMemberData(battleResultScene?) {
		var param;
		var type = root.getSceneController().getRestSaveType();
		
		this._doSaveAction();
		
		if (type === RestSaveType.NOSAVE || type === RestSaveType.AREANOSAVE) {
			return EnterResult.NOTENTER;
		}
		
		param = this._createLoadSaveParam();
		this._loadSaveScreen = createObject(LoadSaveControl.getSaveScreenObject());
		SceneManager.addScreen(this._loadSaveScreen, param);
		
		return EnterResult.OK;
	}

	_createLoadSaveParam() {
		var param = ScreenBuilder.buildLoadSave();
		
		param.isLoad = false;
		param.scene = this._getSceneType();
		param.mapId = root.getSceneController().getNextMapId();
		
		return param;
	}

	_getSceneType() {
		var sceneType = SceneType.BATTLESETUP;
		var type = root.getSceneController().getRestSaveType();
		
		if (type === RestSaveType.AREA || type === RestSaveType.AREANOSAVE) {
			sceneType = SceneType.REST;
		}
		
		return sceneType;
	}

	_doSaveAction() {
		root.getCurrentSession().setTurnCount(0);
		
		root.getCurrentSession().removeGuestUnit();
		
		// The sortie unit this time is listed in the front of the list.
		UnitProvider.sortSortieUnit();
		
		// Recover the unit HP or the state to the origin.
		this._recoveryPlayerList();
		
		// Initialize the wait return of "Action Again".
		this._resetReactionTurnCount();
	}

	_resetReactionTurnCount() {
		var i, unit;
		var list = PlayerList.getMainList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			unit.setReactionTurnCount(0);
		}
	}

	_recoveryPlayerList() {
		if (DataConfig.isBattleSetupRecoverable() || this._getSceneType() === SceneType.REST) {
			UnitProvider.recoveryPlayerList();
		}
		else {
			UnitProvider.recoveryPlayerListWithoutHp();
		}
	}
}
