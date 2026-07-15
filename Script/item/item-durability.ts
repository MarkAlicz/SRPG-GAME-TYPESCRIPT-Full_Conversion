
class DurabilityChangeSelectMode {

	static TARGETSELECT: any = 0;

	static ITEMSELECT: any = 1;
}

class DurabilityChangeItemSelection extends BaseItemSelection {

	_isSelf: any = false;

	_durabilitySelectManager: any = null;

	setInitialSelection() {
		var rangeType = this._item.getRangeType();
		
		if (rangeType === SelectionRangeType.SELFONLY) {
			this._isSelf = true;
			this._changeItemSelect();
		}
		else {
			this._changeTargetSelect();
		}
		
		return EnterResult.OK;
	}

	moveItemSelectionCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === DurabilityChangeSelectMode.TARGETSELECT) {
			result = this._moveTargetSelect();
		}
		else if (mode === DurabilityChangeSelectMode.ITEMSELECT) {
			result = this._moveItemSelect();
		}
		
		return result;
	}

	drawItemSelectionCycle() {
		var mode = this.getCycleMode();
		
		if (mode === DurabilityChangeSelectMode.TARGETSELECT) {
			this._posSelector.drawPosSelector();
		}
		else if (mode === DurabilityChangeSelectMode.ITEMSELECT) {
			this._durabilitySelectManager.drawWindowManager();
		}
	}

	_moveTargetSelect() {
		var result = this._posSelector.movePosSelector();
	
		if (result === PosSelectorResult.SELECT) {
			if (this.isPosSelectable()) {
				this._targetUnit = this._posSelector.getSelectorTarget(false);
				this._changeItemSelect();
				return MoveResult.CONTINUE;
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._isSelection = false;
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}

		return MoveResult.CONTINUE;
	}

	_moveItemSelect() {
		if (this._durabilitySelectManager.moveWindowManager() !== MoveResult.CONTINUE) {
			this._targetItem = this._durabilitySelectManager.getTargetItem();
			if (this._targetItem !== null) {
				this._isSelection = true;
				this._posSelector.endPosSelector();
				return MoveResult.END;
			}
			else {
				if (this._isSelf) {
					this._isSelection = false;
					this._posSelector.endPosSelector();
					return MoveResult.END;
				}
				else {
					this._changeTargetSelect();
				}
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_changeTargetSelect() {
		this.setUnitSelection();
		this.changeCycleMode(DurabilityChangeSelectMode.TARGETSELECT);
	}

	_changeItemSelect() {
		this._durabilitySelectManager = createObject(DurabilitySelectManager);
		this._durabilitySelectManager.setTargetUnit(this._targetUnit, this._item);
		this.changeCycleMode(DurabilityChangeSelectMode.ITEMSELECT);
	}
}

class DurabilityChangeType {

	static MAXRECOVERY: any = 0;

	static HALF: any = 1;

	static BREAK: any = 2;
}

class DurabilityChangeItemUse extends BaseItemUse {
	_dynamicEvent: any;


	enterMainUseCycle(itemUseParent?) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.itemDurabilityChange(itemTargetInfo.targetUnit, itemTargetInfo.targetItem, this._getDurability(itemTargetInfo), this._getIncreaseType(itemTargetInfo), itemUseParent.isItemSkipMode());
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	moveMainUseCycle() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}

	validateItem(itemTargetInfo?) {
		return itemTargetInfo.targetUnit !== null && itemTargetInfo.targetItem !== null;
	}

	_getDurability(itemTargetInfo?) {
		var durability = -1;
		var type = itemTargetInfo.item.getDurabilityInfo().getDurabilityChangeType();
		
		if (type === DurabilityChangeType.MAXRECOVERY) {
			durability = itemTargetInfo.targetItem.getLimitMax();
		}
		else if (type === DurabilityChangeType.HALF) {
			durability = Math.floor(itemTargetInfo.targetItem.getLimit() / 2);
		}
		
		return durability;
	}

	_getIncreaseType(itemTargetInfo?) {
		return IncreaseType.ASSIGNMENT;
	}
}

class DurabilityItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Durability));
		
		y += ItemInfoRenderer.getSpaceY();
		this._drawType(x, y);
		
		y += ItemInfoRenderer.getSpaceY();
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	}

	getInfoPartsCount() {
		return 3;
	}

	_drawType(x?, y?) {
		var type = this._item.getDurabilityInfo().getDurabilityChangeType();
		var arr = [StringTable.DurabilityType_Max, StringTable.DurabilityType_Half, StringTable.DurabilityType_Break];
		
		ItemInfoRenderer.drawKeyword(x, y, arr[type]);
	}
}

class DurabilityChangeItemPotency extends BaseItemPotency {

}

class DurabilityChangeItemAvailability extends BaseItemAvailability {

}

class DurabilityChangeItemAI extends BaseItemAI {

}

class DurabilitySelectManager extends BaseWindowManager {

	_targetUnit: any = null;

	_item: any = null;

	_targetItem: any = null;

	_itemListWindow: any = null;

	_itemInfoWindow: any = null;

	setTargetUnit(targetUnit?, item?) {
		this._targetUnit = targetUnit;
		this._item = item;
		
		this._itemListWindow = createWindowObject(ItemDurabilityListWindow, this);
		this._itemListWindow.setDefaultItemFormation();
		this._itemListWindow.setDurabilityItemFormation(targetUnit, item);
		this._itemListWindow.setActive(true);
		
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
	}

	moveWindowManager() {
		var targetItem = this._itemListWindow.getCurrentItem();
		var input = this._itemListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			if (!Miscellaneous.isDurabilityChangeAllowed(this._item, targetItem)) {
				this._playOperationBlockSound();
			}
			else {
				this._targetItem = targetItem;
				return MoveResult.END;
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._targetItem = null;
			return MoveResult.END;
		}
		
		if (this._itemListWindow.isIndexChanged()) {
			this._itemInfoWindow.setInfoItem(this._itemListWindow.getCurrentItem());
		}
		
		this._itemInfoWindow.moveWindow();
		
		return MoveResult.CONTINUE;
	}

	drawWindowManager() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);
		this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	}

	getTargetItem() {
		return this._targetItem;
	}

	getTotalWindowWidth() {
		return this._itemInfoWindow.getWindowWidth();
	}

	getTotalWindowHeight() {
		return this._itemListWindow.getWindowHeight() + this._getWindowInterval() + this._itemInfoWindow.getWindowHeight();
	}

	getPositionWindowX() {
		if (Miscellaneous.isPrepareScene()) {
			return LayoutControl.getCenterX(-1, this.getTotalWindowWidth());
		}
		
		return LayoutControl.getUnitBaseX(this._targetUnit, this.getTotalWindowWidth());
	}

	getPositionWindowY() {
		return LayoutControl.getCenterY(-1, 340);
	}

	_getWindowInterval() {
		return 10;
	}

	_playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}
}
