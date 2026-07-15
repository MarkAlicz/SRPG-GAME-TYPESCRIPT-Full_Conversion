
class ResurrectionItemSelection extends BaseItemSelection {

	_resurrectionScreen: any = null;

	setInitialSelection() {
		var screenParam = this._createScreenParam();
		
		this._resurrectionScreen = createObject(ResurrectionScreen);
		SceneManager.addScreen(this._resurrectionScreen, screenParam);
		
		return EnterResult.OK;
	}

	moveItemSelectionCycle() {
		var targetUnit;
		
		if (SceneManager.isScreenClosed(this._resurrectionScreen)) {
			targetUnit = this._resurrectionScreen.getResurrectionUnit();
			
			if (targetUnit === null) {
				this._isSelection = false;
				this._targetPos = null;
			}
			else {
				this._isSelection = true;
				if (!Miscellaneous.isPrepareScene()) {
					this._targetPos = PosChecker.getNearbyPos(this._unit, targetUnit);
				}
			}
			
			this._targetUnit = targetUnit;
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildResurrection();
		
		screenParam.unit = this._unit;
		screenParam.item = this._item;
		
		return screenParam;
	}
}

class ResurrectionItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	_item: any = null;

	_targetUnit: any = null;

	_targetPos: any = null;

	enterMainUseCycle(itemUseParent?) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		this._item = itemTargetInfo.item;
		this._targetUnit = itemTargetInfo.targetUnit;
		this._targetPos = itemTargetInfo.targetPos;
		
		if (!Miscellaneous.isPrepareScene()) {
			// For item use with AI, the position is not always initialized.
			if (this._targetPos === null) {
				this._targetPos = PosChecker.getNearbyPos(itemTargetInfo.unit, itemTargetInfo.targetUnit);
			}
			
			if (PosChecker.getUnitFromPos(this._targetPos.x, this._targetPos.y) !== null) {
				// Items are not reduced because the unit exists and no need to revive. 
				this._itemUseParent.disableItemDecrement();
				return EnterResult.NOTENTER;
			}
		}
		
		this.mainAction();
		
		return EnterResult.NOTENTER;
	}

	mainAction() {
		var type = this._item.getResurrectionInfo().getResurrectionType();
		
		if (Miscellaneous.isPrepareScene()) {
			type = ResurrectionType.MAX;
		}
		else {
			this._targetUnit.setMapX(this._targetPos.x);
			this._targetUnit.setMapY(this._targetPos.y);
			this._targetUnit.setSortieState(SortieType.SORTIE);
		}
		
		this._targetUnit.setAliveState(AliveType.ALIVE);
		this._targetUnit.setInvisible(false);
		this._targetUnit.setWait(false);
		
		// Enable to move with the enemy turn by deactivating acted.
		this._targetUnit.setOrderMark(OrderMarkType.FREE);
		
		this._changeHp(type);
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		var x, y;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var targetPos = itemUseParent.getItemTargetInfo().targetPos;
		
		if (Miscellaneous.isPrepareScene()) {
			return this.getUnitBasePos(itemUseParent, animeData);
		}
		
		if (targetPos === null) {
			targetPos = PosChecker.getNearbyPos(itemTargetInfo.unit, itemTargetInfo.targetUnit);
		}
		
		x = LayoutControl.getPixelX(targetPos.x);
		y = LayoutControl.getPixelY(targetPos.y);
		
		return LayoutControl.getMapAnimationPos(x, y, animeData);
	}

	_changeHp(type?) {
		var hp;
		var maxHp = ParamBonus.getMhp(this._targetUnit);
		
		if (type === ResurrectionType.MIN) {
			hp = 1;
		}
		else if (type === ResurrectionType.HALF) {
			hp = Math.floor(maxHp / 2);
		}
		else {
			hp = maxHp;
		}
		
		this._targetUnit.setHp(hp);
	}
}

class ResurrectionItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Resurrection));
	}

	getInfoPartsCount() {
		return 1;
	}
}

class ResurrectionItemPotency extends BaseItemPotency {

}

class ResurrectionItemAvailability extends BaseItemAvailability {

	isItemAvailableCondition(unit?, item?) {
		var arr = ResurrectionControl.getTargetArray(unit, item);
		
		// If there is the dead unit, even one unit, it's supposed to enable to use.
		return arr.length > 0;
	}
}

class ResurrectionItemAI extends BaseItemAI {

	getItemScore(unit?, combination?) {
		return combination.targetUnit.getLv() * 7;
	}

	getActionTargetType(unit?, item?) {
		return ActionTargetType.RESURRECTION;
	}
}

class ResurrectionControl {

	static getTargetArray(unit?, item?) {
		var i, j, count, list, targetUnit;
		var filter = FilterControl.getBestFilter(unit.getUnitType(), item.getFilterFlag());
		var listArray =  FilterControl.getDeathListArray(filter);
		var listCount = listArray.length;
		var arr= [];
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
