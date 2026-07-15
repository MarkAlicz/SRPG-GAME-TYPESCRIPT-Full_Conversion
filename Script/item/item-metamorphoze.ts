
class MetamorphozeItemSelection extends BaseItemSelection {

	_metamorphozeSelectManager: any = null;

	setInitialSelection() {
		this._metamorphozeSelectManager = createObject(MetamorphozeSelectManager);
		this._metamorphozeSelectManager.setMetamorphozeSelectData(this._unit, this._item.getMetamorphozeInfo().getMetamorphozeReferenceList());
		return EnterResult.OK;
	}

	moveItemSelectionCycle() {
		if (this._metamorphozeSelectManager.moveWindowManager() !== MoveResult.CONTINUE) {
			this._targetMetamorphoze = this._metamorphozeSelectManager.getTargetMetamorphoze();
			if (this._targetMetamorphoze === null) {
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
		this._metamorphozeSelectManager.drawWindowManager();
	}
}

class MetamorphozeItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	_dynamicEvent: any = null;

	enterMainUseCycle(itemUseParent?) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		
		if (itemTargetInfo.targetMetamorphoze === null) {
			itemTargetInfo.targetMetamorphoze = this._getDefaultMetamorphozeData();
			if (itemTargetInfo.targetMetamorphoze === null) {
				return EnterResult.NOTENTER;
			}
		}
		
		this._checkItemLimit();
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitMetamorphozeFromItem(itemTargetInfo.unit, itemTargetInfo.targetMetamorphoze, MetamorphozeActionType.CHANGE, itemUseParent.isItemSkipMode(), itemTargetInfo.item);
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	moveMainUseCycle() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	validateItem(itemTargetInfo?) {
		return true;
	}

	_checkItemLimit() {
		var i, itemSrc;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var targetItem = itemTargetInfo.item;
		var metamorphozeData = itemTargetInfo.targetMetamorphoze;
		var count = metamorphozeData.getConvertItemCount();
		
		// Check if the used item is included in the conversion.
		for (i = 0; i < count; i++) {
			itemSrc = metamorphozeData.getConvertItemSrc(i);
			if (ItemControl.compareItem(itemSrc, targetItem)) {
				if (targetItem.getLimit() === 1) {
					// Mark so as to delete when the metamorphosis is deactivated.
					targetItem.setLimit(WeaponLimitValue.BROKEN);
				}
				else {
					// Reduce durability before conversion occurs.
					this._itemUseParent.decreaseItem();
				}
				
				// Disable because it's already been reduced.
				this._itemUseParent.disableItemDecrement();
				
				break;
			}
		}
	}

	_getDefaultMetamorphozeData() {
		var item = this._itemUseParent.getItemTargetInfo().item;
		var refList = item.getMetamorphozeInfo().getMetamorphozeReferenceList();
		
		if (refList.getTypeCount() === 0) {
			return null;
		}
		
		return refList.getTypeData(0);
	}
}

class MetamorphozeItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Metamorphoze));
	}

	getInfoPartsCount() {
		return 1;
	}
}

class MetamorphozeItemPotency extends BaseItemPotency {

}

class MetamorphozeItemAvailability extends BaseItemAvailability {

	isItemAvailableCondition(unit?, item?) {
		if (MetamorphozeControl.getMetamorphozeData(unit) !== null) {
			return false;
		}
		
		return item.getMetamorphozeInfo().getMetamorphozeReferenceList().getTypeCount() > 0;
	}
}

class MetamorphozeItemAI extends BaseItemAI {

	getItemScore(unit?, combination?) {
		var refList;
		
		if (MetamorphozeControl.getMetamorphozeData(unit) !== null) {
			return AIValue.MIN_SCORE;
		}
		
		refList = this._getReferenceList(unit, combination);
		
		return this._getScore(unit, combination, refList);
	}

	_getReferenceList(unit?, combination?) {
		var refList = null;
		
		if (combination.item !== null) {
			refList = combination.item.getMetamorphozeInfo().getMetamorphozeReferenceList();
		}
		else if (combination.skill !== null) {
			refList = combination.skill.getDataReferenceList();
		}
		
		return refList;
	}

	_getScore(unit?, combination?, refList?) {
		if (refList === null) {
			return AIValue.MIN_SCORE;
		}
		
		combination.targetMetamorphoze = refList.getTypeData(0);
		if (!MetamorphozeControl.isMetamorphozeAllowed(unit, combination.targetMetamorphoze)) {
			return AIValue.MIN_SCORE;
		}
		
		return 150;
	}
}

class MetamorphozeSelectMode {

	static QUESTION: any = 0;

	static SCREEN: any = 1;
}

class MetamorphozeSelectManager extends BaseWindowManager {

	_unit: any = null;

	_refList: any = null;

	_metamorphozeScreen: any = null;

	_targetMetamorphoze: any = null;

	setMetamorphozeSelectData(unit?, refList?) {
		var screenParam;
		
		this._unit = unit;
		this._refList = refList;
		
		screenParam = this._createScreenParam();
		
		this._metamorphozeScreen = createObject(MetamorphozeScreen);
		SceneManager.addScreen(this._metamorphozeScreen, screenParam);
	}

	moveWindowManager() {
		if (SceneManager.isScreenClosed(this._metamorphozeScreen)) {
			this._targetMetamorphoze = this._metamorphozeScreen.getScreenResult();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowManager() {
		
	}

	getTargetMetamorphoze() {
		return this._targetMetamorphoze;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildMultiClassChange();
		
		screenParam.unit = this._unit;
		screenParam.isMapCall = true;
		screenParam.refList = this._refList;
		
		return screenParam;
	}
}
