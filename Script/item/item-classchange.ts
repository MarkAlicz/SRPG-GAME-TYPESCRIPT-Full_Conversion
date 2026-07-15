
class ClassChangeItemSelection extends BaseItemSelection {

	_classChangeSelectManager: any = null;

	setInitialSelection() {
		this._classChangeSelectManager = createObject(ClassChangeSelectManager);
		this._classChangeSelectManager.setClassChangeSelectData(this._unit, this._item);
		return EnterResult.OK;
	}

	moveItemSelectionCycle() {
		if (this._classChangeSelectManager.moveWindowManager() !== MoveResult.CONTINUE) {
			this._targetClass = this._classChangeSelectManager.getTargetClass();
			if (this._targetClass === null) {
				this._isSelection = false;
			}
			else {
				this._isSelection = true;
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawItemSelectionCycle() {
		this._classChangeSelectManager.drawWindowManager();
	}
}

class ClassChangeItemUse extends BaseItemUse {

	_dynamicEvent: any = null;

	_itemUseParent: any = null;

	enterMainUseCycle(itemUseParent?) {
		var generator, result;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		
		if (!this._isChangeAllowed(itemTargetInfo)) {
			// If the items are not used, the number of items use cannot be reduced. 
			itemUseParent.disableItemDecrement();
			return EnterResult.NOTENTER;
		}
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.classChange(itemTargetInfo.targetUnit, itemTargetInfo.targetClass, itemUseParent.isItemSkipMode());
		
		result = this._dynamicEvent.executeDynamicEvent();
		if (result === EnterResult.NOTENTER) {
			this.mainAction();
		}
		
		return result;
	}

	moveMainUseCycle() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result === MoveResult.END) {
			this.mainAction();
		}
		
		return result;
	}

	mainAction() {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		
		if (this._isLevelReset(itemTargetInfo)) {
			this._resetLevel(itemTargetInfo);
			if (this._isExpReset()) {
				this._resetExp(itemTargetInfo);
			}
		}
	}

	validateItem(itemTargetInfo?) {
		return true;
	}

	_isChangeAllowed(itemTargetInfo?) {
		if (itemTargetInfo.targetClass === null) {
			return false;
		}
		
		return true;
	}

	_isLevelReset(itemTargetInfo?) {
		return itemTargetInfo.item.getClassChangeInfo().isLevelReset();
	}

	_resetLevel(itemTargetInfo?) {
		itemTargetInfo.unit.setLv(1);
	}

	_isExpReset() {
		return true;
	}

	_resetExp(itemTargetInfo?) {
		itemTargetInfo.unit.setExp(0);
	}
}

class ClassChangeItemInfo extends BaseItemInfo {

	_arr: any = null;

	setInfoItem(item?) {
		var i, count, classGroup, name;
		var info = item.getClassChangeInfo();
		
		this._arr = [];
		
		super.setInfoItem(item);
		
		if (info.isClassInfoDisplayable()) {
			// Class group can be supposed to have the same name,
			// set things excluding duplication in the _arr. 
			count = info.getClassGroupCount();
			for (i = 0; i < count; i++) {
				classGroup = info.getClassGroupData(i);
				name = classGroup.getName();
				
				if (this._arr.indexOf(name) !== -1) {
					continue;
				}
				
				this._arr.push(name);
			}
		}
	}

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_ClassChange));
		y += ItemInfoRenderer.getSpaceY();
		
		if (this._arr.length > 0) {
			this._drawList(x, y);
		}
	}

	getInfoPartsCount() {
		return 1 + this._arr.length;
	}

	_drawList(x?, y?, list?) {
		var i;
		var count = this._arr.length;
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		ItemInfoRenderer.drawKeyword(x, y, StringTable.ClassChangeInfo_Target);
		x += ItemInfoRenderer.getSpaceX();
		
		for (i = 0 ; i < count; i++) {
			TextRenderer.drawKeywordText(x, y, this._arr[i], -1, color, font);
			y += ItemInfoRenderer.getSpaceY();
		}
	}
}

class ClassChangeItemPotency extends BaseItemPotency {

}

class ClassChangeItemAvailability extends BaseItemAvailability {

}

class ClassChangeItemAI extends BaseItemAI {

}

class ClassChangeSelectMode {

	static MSG: any = 0;

	static SCREEN: any = 1;
}

class ClassChangeSelectManager extends BaseWindowManager {
	_classChangeScreen: any;


	_unit: any = null;

	_targetClass: any = null;

	_infoWindow: any = null;

	setClassChangeSelectData(unit?, item?) {
		var group, screenParam;
		
		this._unit = unit;
		this._targetClass = null;
		this._infoWindow = createWindowObject(InfoWindow, this);
		
		// The mode change occurs inside.
		group = this._checkGroup(unit, item);
		if (group === null) {
			return;
		}
		
		screenParam = this._createScreenParam();
		this._classChangeScreen = createObject(MultiClassChangeScreen);
		SceneManager.addScreen(this._classChangeScreen, screenParam);
		
		this.changeCycleMode(ClassChangeSelectMode.SCREEN);
	}

	moveWindowManager() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ClassChangeSelectMode.MSG) {
			result = this._moveMsg();
		}
		else if (mode === ClassChangeSelectMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	}

	drawWindowManager() {
		var mode = this.getCycleMode();
		
		if (mode === ClassChangeSelectMode.MSG) {
			this._drawMsg();
		}
	}

	getTargetClass() {
		return this._targetClass;
	}

	_moveMsg() {
		var result = this._infoWindow.moveWindow();
		
		if (result === MoveResult.END) {
			this._playCancelSound();
		}
		
		return result;
	}

	_moveScreen() {
		if (SceneManager.isScreenClosed(this._classChangeScreen)) {
			this._targetClass = this._classChangeScreen.getScreenResult();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawMsg() {
		var x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
		
		this._infoWindow.drawWindow(x, y);
	}

	_checkGroup(unit?, item?) {
		var classGroupId, classUpMaxCount;
		
		if (DataConfig.isBattleSetupClassChangeAllowed()) {
			// If class can be changed in the SceneType.BATTLESETUP, class group 2 is used.
			classGroupId = unit.getClassGroupId2();
			classUpMaxCount = 1;
		}
		else {
			if (unit.getClassUpCount() === 0) {
				// If class has never been changed yet, class group 1 is used. 
				classGroupId = unit.getClassGroupId1();
			}
			else {
				// If class has been changed, class group 2 is used.
				classGroupId = unit.getClassGroupId2();
			}
			classUpMaxCount = 2;
		}
		
		// If id is -1, it means that this unit cannot change the class.
		if (classGroupId === -1) {
			this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChange);
			this.changeCycleMode(ClassChangeSelectMode.MSG);
			return null;
		}
		
		return this._checkGroupInternal(unit, item, classGroupId, classUpMaxCount);
	}

	_checkGroupInternal(unit?, item?, classGroupId?, classUpMaxCount?) {
		var i;
		var info = item.getClassChangeInfo();
		var count = info.getClassGroupCount();
		var group = null;
		
		// Check if the unit's groupId is included.
		for (i = 0; i < count; i++) {
			group = info.getClassGroupData(i);
			if (group.getId() === classGroupId) {
				break;
			}
		}
		
		// If groupId is not included, it means that the unit cannot change the class with the item.
		if (i === count) {
			this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChangeItem);
			this.changeCycleMode(ClassChangeSelectMode.MSG);
			return null;
		}
		
		if (unit.getClassUpCount() >= classUpMaxCount) {
			// Class has already changed, so no more class change is possible.
			this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChangeMore);
			this.changeCycleMode(ClassChangeSelectMode.MSG);
			return null;
		}
		
		return group;
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildMultiClassChange();
		
		screenParam.unit = this._unit;
		screenParam.isMapCall = true;
		
		return screenParam;
	}
}
