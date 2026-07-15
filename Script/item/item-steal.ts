
class StealItemSelection extends BaseItemSelection {

	isPosSelectable() {
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		if (targetUnit === null) {
			return false;
		}
		
		return Miscellaneous.isStealEnabled(this._unit, targetUnit, this._item.getStealInfo().getStealFlag());
	}
}

class StealItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	_unitItemStealScreen: any = null;

	enterMainUseCycle(itemUseParent?) {
		var screenParam;
		
		this._itemUseParent = itemUseParent;
		
		if (this._isImmediately()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		if (this._itemUseParent.isItemSkipMode()) {
			// To display the graphics from now, deactivate the skip.
			this._itemUseParent.setItemSkipMode(false);
		}
		
		// Prevents item durability from decreasing when closing the "Steal" screen without trading.
		itemUseParent.disableItemDecrement();
		
		screenParam = this._createScreenParam();
		
		this._unitItemStealScreen = createObject(UnitItemStealScreen);
		SceneManager.addScreen(this._unitItemStealScreen, screenParam);
		
		return EnterResult.OK;
	}

	moveMainUseCycle() {
		if (SceneManager.isScreenClosed(this._unitItemStealScreen)) {
			if (this._unitItemStealScreen.getScreenResult() === UnitItemTradeResult.TRADEEND) {
				// A trade was completed on the "Steal" screen. Therefore, reduce the durability of the "Steal" item.
				this._itemUseParent._isItemDecrementDisabled = false;
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawMainUseCycle() {
	}

	mainAction() {
		var flag;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		
		if (itemTargetInfo.targetUnit === null || itemTargetInfo.targetItem === null) {
			return;
		}
		
		if (itemTargetInfo.targetUnit.getUnitType() === UnitType.PLAYER && itemTargetInfo.targetItem.isImportance()) {
			// The important item which the player possesses cannot be traded.
			return;
		}
		
		flag = itemTargetInfo.item.getStealInfo().getStealFlag();
		if (!Miscellaneous.isStealEnabled(itemTargetInfo.unit, itemTargetInfo.targetUnit, flag)) {
			// Cannot steal due to lack of speed.
			return;
		}
		
		if (Miscellaneous.isStealTradeDisabled(itemTargetInfo.unit, itemTargetInfo.targetItem, flag)) {
			// Cannot steal because trade is prohibited for specified items or due to their weight. 
			return;
		}
		
		if (!UnitItemControl.pushItem(itemTargetInfo.unit, itemTargetInfo.targetItem)) {
			// Cannot add items any more because items which the item user possesses are full. 
			return;
		}
		
		// The targetUnit might include the targetItem as a trophy, if so, delete it.
		ItemControl.deleteTrophy(itemTargetInfo.targetUnit, itemTargetInfo.targetItem);
		
		// Remove targetItem from targetUnit because targetItem could be added in the unit.
		ItemControl.deleteItem(itemTargetInfo.targetUnit, itemTargetInfo.targetItem);
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}

	validateItem(itemTargetInfo?) {
		// If a player uses a "Steal" item from the item slot, it is stolen via the screen, so targetItem does not need to be initialized.
		if (itemTargetInfo.unit.getUnitType() === UnitType.PLAYER && root.getCurrentScene() !== SceneType.EVENT) {
			return itemTargetInfo.targetUnit !== null;
		}
		
		// However, if a "Steal" item is used with the "Use Item" event command, or if an enemy AI uses a "Steal" item, targetItem must be initialized.
		return itemTargetInfo.targetUnit !== null && itemTargetInfo.targetItem !== null;
	}

	_isImmediately() {
		// If targetItem has already been set, it can steal it immediately without displaying a trade screen.
		return this._itemUseParent.getItemTargetInfo().targetItem !== null;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitItemSteal();
		
		screenParam.unit = this._itemUseParent.getItemTargetInfo().unit;
		screenParam.targetUnit = this._itemUseParent.getItemTargetInfo().targetUnit;
		screenParam.stealFlag = this._itemUseParent.getItemTargetInfo().item.getStealInfo().getStealFlag();
		// Lock "Steal" items on the "Steal" screen to prevent trading.
		screenParam.lockedItem = this._itemUseParent.getItemTargetInfo().item;
		
		return screenParam;
	}
}

class StealItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Steal));
		
		y += ItemInfoRenderer.getSpaceY();
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	}

	getInfoPartsCount() {
		return 2;
	}
}

class StealItemPotency extends BaseItemPotency {

}

class StealItemAvailability extends BaseItemAvailability {

	isItemAllowed(unit?, targetUnit?, item?) {
		var stealFlag = item.getStealInfo().getStealFlag();
		
		return Miscellaneous.isStealEnabled(unit, targetUnit, stealFlag);
	}
}

class StealItemAI extends BaseItemAI {

	getItemScore(unit?, combination?) {
		var stealFlag;
		
		if (!UnitItemControl.isUnitItemSpace(unit)) {
			return AIValue.MIN_SCORE;
		}
		
		stealFlag = this._getStealFlag(unit, combination);
		if (!Miscellaneous.isStealEnabled(unit, combination.targetUnit, stealFlag)) {
			return AIValue.MIN_SCORE;
		}
		
		combination.targetItem = this._getBestItem(unit, combination, stealFlag);
		if (combination.targetItem === null) {
			return AIValue.MIN_SCORE;
		}
		
		return 150;
	}

	
	// Don't steal several items when AI processing.
	_getBestItem(unit?, combination?, stealFlag?) {
		var i, item;
		var arr = [];
		var count = UnitItemControl.getPossessionItemCount(combination.targetUnit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(combination.targetUnit, i);
			if (item === null) {
				continue;
			}
			
			if (item.isImportance() || item.isTradeDisabled()) {
				continue;
			}
			
			if (Miscellaneous.isStealTradeDisabled(unit, item, stealFlag)) {
				continue;
			}
			
			arr.push(item);
		}
		
		if (arr.length === 0) {
			return null;
		}
		
		this._sortItem(arr);
	
		return arr[0];
	}

	_getStealFlag(unit?, combination?) {
		var stealFlag = 0;
		
		if (combination.item !== null) {
			stealFlag = combination.item.getStealInfo().getStealFlag();
		}
		else if (combination.skill !== null) {
			stealFlag = combination.skill.getSkillValue();
		}
		
		return stealFlag;
	}

	_sortItem(arr?) {
		arr.sort(
			function(item1, item2) {
				var price1, price2;
				
				price1 = item1.getGold();
				price2 = item2.getGold();
				
				if (price1 > price2) {
					return -1;
				}
				else if (price1 < price2) {
					return 1;
				}
				
				return 0;
			}
		);
	}
}
