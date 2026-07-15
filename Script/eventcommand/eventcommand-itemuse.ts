
class ItemUseEventCommandMode {

	static SELECT: any = 0;

	static USE: any = 1;
}

class ItemUseEventCommand extends BaseEventCommand {

	_unit: any = null;

	_item: any = null;

	_targetUnit: any = null;

	_targetPos: any = null;

	_targetItem: any = null;

	_targetClass: any = null;

	_targetMetamorphoze: any = null;

	_itemUse: any = null;

	_itemUI: any = null;

	_objectArray: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemUseEventCommandMode.SELECT) {
			result = this._moveSelect();
		}	
		else if (mode === ItemUseEventCommandMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ItemUseEventCommandMode.SELECT) {
			this._drawSelect();
		}	
		else if (mode === ItemUseEventCommandMode.USE) {
			this._drawUse();
		}
	}

	isEventCommandSkipAllowed() {
		// Don't allow the skip by pressing the Start.
		return false;
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._unit = eventCommandData.getUseUnit();
		// Items that are not in the unit's possession cannot be used.
		this._item = UnitItemControl.getMatchItem(this._unit, eventCommandData.getUseItem());
		this._targetUnit = eventCommandData.getTargetUnit();
		this._targetPos = createPos(eventCommandData.getTargetX(), eventCommandData.getTargetY());
		this._targetItem = UnitItemControl.getMatchItem(this._targetUnit, eventCommandData.getTargetItem());
		this._targetClass = null;
		this._targetMetamorphoze = null;
		
		this._itemUI = null;
		this._objectArray = [];
		this._configureItemUI(this._objectArray);
		
		this.changeCycleMode(ItemUseEventCommandMode.SELECT);
	}

	_checkEventCommand() {
		var isUseSkip;
		
		if (this._unit === null) {
			return false;
		}
		
		if (this._item === null || this._item.isWeapon() || !this._isItemAllowed(this._item)) {
			return false;
		}
		
		isUseSkip = this._preCheck();
		
		if (this.isSystemSkipMode() && isUseSkip) {
			// If item use can be skipped, return false so as not to enter the cycle.
			return false;
		}
		
		return true;
	}

	_completeEventCommandMemberData() {
		return EnterResult.OK;
	}

	_preCheck() {
		this._createItemUI();
		
		if (this._itemUI.enterItemUI() === EnterResult.OK) {
			return false;
		}
		
		return this._beginItemUse();
	}

	_createItemUI() {
		var i;
		var count = this._objectArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._objectArray[i].isUIRequired(this._item)) {
				this._itemUI = this._objectArray[i];
				this._itemUI.setParentCommand(this);
				break;
			}
		}
		
		if (i === count) {
			this._itemUI = createObject(BaseItemUI);
		}
	}

	_beginItemUse() {
		var itemTargetInfo = StructureBuilder.buildItemTargetInfo();
		
		itemTargetInfo.unit = this._unit;
		itemTargetInfo.item = this._item;
		itemTargetInfo.targetUnit = this._targetUnit;
		itemTargetInfo.targetPos = this._targetPos;
		itemTargetInfo.targetItem = this._targetItem;
		itemTargetInfo.targetClass = this._targetClass;
		itemTargetInfo.targetMetamorphoze = this._targetMetamorphoze;
		
		this._itemUse = ItemPackageControl.getItemUseParent(this._item);
		
		this.changeCycleMode(ItemUseEventCommandMode.USE);
		
		return this._itemUse.enterUseCycle(itemTargetInfo) === EnterResult.NOTENTER;
	}

	_isItemAllowed(item?) {
		if (item.getItemType() === ItemType.UNUSABLE) {
			return false;
		}
		
		if (item.getLimit() === WeaponLimitValue.BROKEN) {
			return false;
		}
		
		return true;
	}

	_moveSelect() {
		if (this._itemUI.moveItemUI() !== MoveResult.END) {
			return MoveResult.CONTINUE;
		}
		
		return this._beginItemUse();
	}

	_moveUse() {
		if (this._itemUse.moveUseCycle() === MoveResult.END) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawSelect() {
		this._itemUI.drawItemUI();
	}

	_drawUse() {
		this._itemUse.drawUseCycle();
	}

	_configureItemUI(groupArray?) {
		groupArray.appendObject(ItemUI.CLASSCHANGE);
		groupArray.appendObject(ItemUI.METAMORPHOZE);
	}
}

class BaseItemUI extends BaseObject {

	_parentCommand: any = null;

	setParentCommand(parentCommand?) {
		this._parentCommand = parentCommand;
	}

	isUIRequired(item?) {
		return false;
	}

	enterItemUI() {
		return EnterResult.NOTENTER;
	}

	moveItemUI() {
		return MoveResult.END;
	}

	drawItemUI() {
	}

	_createDefaultItemUIData() {
		return {
			defaultData: null,
			total: 0
		};
	}

	_isUIVisible(data?) {
		// If an enemy unit uses the "Use Item" command, the UI is not displayed.
		if (data.total === 0 || this._parentCommand._unit.getUnitType() !== UnitType.PLAYER) {
			return false;
		}
		
		// If the current mode is skip mode and only one data exists, the UI is not displayed.
		if (this._parentCommand.isSystemSkipMode() && data.total === 1) {
			return false;
		}
		
		// If there are multiple class change candidates, the UI is displayed.
		// The UI can also be always displayed by specifying 0.
		return data.total > 1;
	}
}

namespace ItemUI {
export class CLASSCHANGE extends BaseItemUI {

	_classChangeSelectManager: any = null;

	isUIRequired(item?) {
		return item.getItemType() === ItemType.CLASSCHANGE;
	}

	enterItemUI() {
		var data = this._createItemUIData();
		
		this._parentCommand._targetUnit = this._parentCommand._unit;
		
		if (this._isUIVisible(data)) {
			this._classChangeSelectManager = createObject(ClassChangeSelectManager);
			this._classChangeSelectManager.setClassChangeSelectData(this._parentCommand._unit, this._parentCommand._item);
			SceneManager.setForceForeground(true);
			return EnterResult.OK;
		}
		
		this._parentCommand._targetClass = data.defaultData;
		
		return EnterResult.NOTENTER;
	}

	moveItemUI() {
		if (this._classChangeSelectManager.moveWindowManager() === MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		this._parentCommand._targetClass = this._classChangeSelectManager.getTargetClass();
		if (this._parentCommand._targetClass === null) {
			// If the UI is displayed with the "Use Item" command, the UI cannot be canceled.
			// In other words, the unit must always be class changed.
			this._classChangeSelectManager.setClassChangeSelectData(this._parentCommand._unit, this._parentCommand._item);
			return MoveResult.CONTINUE;
		}
		
		SceneManager.setForceForeground(false);
		
		return MoveResult.END;
	}

	drawItemUI() {
		this._classChangeSelectManager.drawWindowManager();
	}

	_createItemUIData() {
		var i;
		var data = this._createDefaultItemUIData();
		var arr = ClassChangeChecker.getClassEntryArray(this._parentCommand._unit, true);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			if (arr[i].isChange) {
				if (data.defaultData === null) {
					data.defaultData = arr[i].cls;
				}
				
				data.total++;
			}
		}
		
		return data;
	}
}

export class METAMORPHOZE extends BaseItemUI {

	_metamorphozeSelectManager: any = null;

	isUIRequired(item?) {
		return item.getItemType() === ItemType.METAMORPHOZE;
	}

	enterItemUI() {
		var data = this._createItemUIData();
		
		this._parentCommand._targetUnit = this._parentCommand._unit;
		
		if (this._isUIVisible(data)) {
			this._metamorphozeSelectManager = createObject(MetamorphozeSelectManager);
			this._metamorphozeSelectManager.setMetamorphozeSelectData(this._parentCommand._unit, this._parentCommand._item.getMetamorphozeInfo().getMetamorphozeReferenceList());
			SceneManager.setForceForeground(true);
			return EnterResult.OK;
		}
		
		this._parentCommand._targetMetamorphoze = data.defaultData;
		
		return EnterResult.NOTENTER;
	}

	moveItemUI() {
		if (this._metamorphozeSelectManager.moveWindowManager() === MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		this._parentCommand._targetMetamorphoze = this._metamorphozeSelectManager.getTargetMetamorphoze();
		if (this._parentCommand._targetMetamorphoze === null) {
			this._metamorphozeSelectManager.setMetamorphozeSelectData(this._parentCommand._unit, this._parentCommand._item.getMetamorphozeInfo().getMetamorphozeReferenceList());
			return MoveResult.CONTINUE;
		}
		
		SceneManager.setForceForeground(false);
		
		return MoveResult.END;
	}

	drawItemUI() {
		this._metamorphozeSelectManager.drawWindowManager();
	}

	_createItemUIData() {
		var i;
		var data = this._createDefaultItemUIData();
		var refList = this._parentCommand._item.getMetamorphozeInfo().getMetamorphozeReferenceList();
		var count = refList.getTypeCount();
		
		for (i = 0; i < count; i++) {
			if (data.defaultData === null) {
				data.defaultData = refList.getTypeData(i);
			}
			
			data.total++;
		}
		
		return data;
	}
}
}
