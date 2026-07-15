
class DopingItemSelection extends BaseItemSelection {

}

class DopingItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	_parameterChangeWindow: any = null;

	enterMainUseCycle(itemUseParent?) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		
		if (itemUseParent.isItemSkipMode()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		this._parameterChangeWindow = createWindowObject(ParameterChangeWindow, this);
		this._parameterChangeWindow.setParameterChangeData(itemTargetInfo.targetUnit, itemTargetInfo.item);
		
		return EnterResult.OK;
	}

	moveMainUseCycle() {
		if (InputControl.isSelectAction()) {
			this.mainAction();
			return MoveResult.END;
		}
		else {
			this._parameterChangeWindow.moveWindow();
		}
		
		return MoveResult.CONTINUE;
	}

	drawMainUseCycle() {
		var x = LayoutControl.getCenterX(-1, this._parameterChangeWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._parameterChangeWindow.getWindowHeight());
		
		this._parameterChangeWindow.drawWindow(x, y);
	}

	mainAction() {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		
		ParameterControl.addDoping(itemTargetInfo.targetUnit, itemTargetInfo.item);
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}
}

class DopingItemPotency extends BaseItemPotency {

}

class DopingItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Doping));
		y += ItemInfoRenderer.getSpaceY();
		
		ItemInfoRenderer.drawDoping(x, y, this._item, false);
	}

	getInfoPartsCount() {
		return 1 + ItemInfoRenderer.getDopingCount(this._item, false);
	}
}

class DopingItemAvailability extends BaseItemAvailability {

	isItemAllowed(unit?, targetUnit?, item?) {
		return DopingItemControl.isItemAllowed(targetUnit, item);
	}
}

class DopingItemAI extends BaseItemAI {

}

class DopingItemControl {

	static isItemAllowed(targetUnit?, item?) {
		var i, value, cur, max;
		var count = ParamGroup.getParameterCount();
		var result = false;
		
		if (this._isItemAlwaysAllowed(targetUnit, item)) {
			return true;
		}
		
		for (i = 0; i < count; i++) {
			value = ParamGroup.getDopingParameter(item, i);
			if (value === 0) {
				continue;
			}
			
			cur = ParamGroup.getUnitValue(targetUnit, i);
			max = ParamGroup.getMaxValue(targetUnit, i);
			if (cur === max) {
				continue;
			}
			
			result = true;
			break;
		}
		
		return result;
	}

	static _isItemAlwaysAllowed(targetUnit?, item?) {
		return item.getExp() > 0;
	}
}
