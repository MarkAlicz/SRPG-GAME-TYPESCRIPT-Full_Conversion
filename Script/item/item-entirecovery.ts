
class EntireRecoveryItemSelection extends BaseItemSelection {

	setInitialSelection() {
		// Entire recovery items have no concept to select someone,
		// so it's supposed to have selected at the beginning.
		this._isSelection = true;
		return EnterResult.NOTENTER;
	}
}

class EntireRecoveryItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	enterMainUseCycle(itemUseParent?, animeData?) {
		this._itemUseParent = itemUseParent;
		
		this.mainAction();
		
		return EnterResult.OK;
	}

	mainAction() {
		var i, targetUnit;
		var info = this._itemUseParent.getItemTargetInfo();
		var arr = EntireRecoveryControl.getTargetArray(info.unit, info.item);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			targetUnit = arr[i];
			this._recoveryHp(targetUnit);
		}
		
		return false;
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		var size = Miscellaneous.getFirstKeySpriteSize(animeData, 0);
		var x = LayoutControl.getCenterX(-1, size.width);
		var y = LayoutControl.getCenterY(-1, size.height) - 20;
		
		return createPos(x, y);
	}

	validateItem(itemTargetInfo?) {
		return true;
	}

	_recoveryHp(unit?) {
		var hp = unit.getHp();
		var maxMhp = ParamBonus.getMhp(unit);
		
		hp += this._getValue(unit);
		
		if (hp > maxMhp) {
			hp = maxMhp;
		}
		
		unit.setHp(hp);
	}

	_getValue(targetUnit?) {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var plus = Calculator.calculateRecoveryItemPlus(itemTargetInfo.unit, targetUnit, itemTargetInfo.item);
		var recoveryInfo = itemTargetInfo.item.getEntireRecoveryInfo();
		
		return Calculator.calculateRecoveryValue(targetUnit, recoveryInfo.getRecoveryValue(), recoveryInfo.getRecoveryType(), plus);
	}
}

class EntireRecoveryItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_EntireRecovery));
		y += ItemInfoRenderer.getSpaceY();
		
		this._drawValue(x, y);
	}

	getInfoPartsCount() {
		return 2;
	}

	_drawValue(x?, y?) {
		var recoveryInfo = this._item.getEntireRecoveryInfo();
		
		if (recoveryInfo.getRecoveryType() === RecoveryType.SPECIFY) {
			ItemInfoRenderer.drawKeyword(x, y, StringTable.Recovery_Value);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, recoveryInfo.getRecoveryValue());	
		}
		else {
			ItemInfoRenderer.drawKeyword(x, y, StringTable.Recovery_All);
			x += ItemInfoRenderer.getSpaceX();
		}
	}
}

class EntireRecoveryItemPotency extends BaseItemPotency {

}

class EntireRecoveryItemAvailability extends BaseItemAvailability {

	isItemAvailableCondition(unit?, item?) {
		var i, targetUnit;
		var arr = EntireRecoveryControl.getTargetArray(unit, item);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			targetUnit = arr[i];
			if (targetUnit.getHp() !== ParamBonus.getMhp(targetUnit)) {
				// The current HP is not the maximum HP which means that the HP is reduced.
				// If there is the unit who has a low HP, even one unit, it's supposed that the item can be used.
				return true;
			}
		}
		
		return false;
	}
}

class EntireRecoveryItemAI extends BaseItemAI {

	getItemScore(unit?, combination?) {
		var i, targetUnit;
		var score = 0;
		var maxScore = this._getMaxScore();
		var arr = EntireRecoveryControl.getTargetArray(unit, combination.item);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			targetUnit = arr[i];
			
			score += this._getScore(targetUnit);
			
			// When the score is high enough, considering entire recovery should be implemented, so stop checking any more. 
			if (score >= maxScore) {
				break;
			}
		}
		
		if (score === 0) {
			score = AIValue.MIN_SCORE;
		}
		
		return score;
	}

	getActionTargetType(unit?, item?) {
		return ActionTargetType.ENTIRERECOVERY;
	}

	_isCondition(unit?, targetUnit?, item?) {
		return item.getTargetAggregation().isCondition(targetUnit);
	}

	_getScore(unit?) {
		var baseHp;
		var maxHp = ParamBonus.getMhp(unit);
		var currentHp = unit.getHp();
		
		if (currentHp === maxHp) {
			return 0;
		}
		
		baseHp = Math.floor(maxHp * 0.25);
		if (currentHp < baseHp) {
			return 50;
		}
		
		baseHp = Math.floor(maxHp * 0.5);
		if (currentHp < baseHp) {
			return 30;
		}
		
		baseHp = Math.floor(maxHp * 0.75);
		if (currentHp < baseHp) {
			return 10;
		}
		
		return 0;
	}

	_getMaxScore() {
		return 150;
	}
}

class EntireRecoveryControl {

	static getTargetArray(unit?, item?) {
		var i, j, count, list, targetUnit;
		var filter = FilterControl.getBestFilter(unit.getUnitType(), item.getFilterFlag());
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		var arr = [];
		var aggregation = item.getTargetAggregation();
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				if (!aggregation.isCondition(targetUnit)) {
					continue;
				}
				
				if (!this._isTargetAllowed(unit, targetUnit, item)) {
					continue;
				}
				
				arr.push(targetUnit);
			}
		}
		
		return arr;
	}

	static _isTargetAllowed(unit?, targetUnit?, item?) {
		return true;
	}
}
