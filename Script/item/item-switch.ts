
class SwitchItemSelection extends BaseItemSelection {

	setInitialSelection() {
		// Switch items have no concept to select someone,
		// so it's supposed to have selected at the beginning.
		this._isSelection = true;
		return EnterResult.NOTENTER;
	}
}

class SwitchItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	enterMainUseCycle(itemUseParent?) {
		this._itemUseParent = itemUseParent;
		
		this.mainAction();
		
		return EnterResult.OK;
	}

	mainAction() {
		this._itemUseParent.getItemTargetInfo().item.getSwitchInfo().startSwitchChange();
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		var size = Miscellaneous.getFirstKeySpriteSize(animeData, 0);
		var x = LayoutControl.getCenterX(-1, size.width);
		var y = LayoutControl.getCenterY(-1, size.height) - 20;
		
		return createPos(x, y);
	}
}

class SwitchItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Switch));
	}

	getInfoPartsCount() {
		return 1;
	}

	validateItem(itemTargetInfo?) {
		return true;
	}
}

class SwitchItemPotency extends BaseItemPotency {

}

class SwitchItemAvailability extends BaseItemAvailability {

	isItemAvailableCondition(unit?, item?) {
		return true;
	}
}

class SwitchItemAI extends BaseItemAI {

}
