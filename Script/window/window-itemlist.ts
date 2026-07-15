
class ItemListWindow extends BaseWindow {

	_scrollbar: any = null;

	initialize() {
		this._scrollbar = createScrollbarObject(ItemListScrollbar, this);
	}

	moveWindowContent() {
		return this._scrollbar.moveInput();
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowXPadding() * 2);
	}

	setDefaultItemFormation() {
		var max = 7;
		var count = DataConfig.getMaxUnitItemCount();
		
		if (count > max) {
			count = max;
		}
		
		this.setItemFormation(count);
	}

	setItemFormation(count?) {
		this._scrollbar.setScrollFormation(1, count);
	}

	setUnitMaxItemFormation(unit?) {
		this._scrollbar.setUnitMaxItemFormation(unit);
	}

	setUnitItemFormation(unit?) {
		this._scrollbar.setUnitItemFormation(unit);
	}

	setStockItemFormation() {
		this._scrollbar.setStockItemFormation();
		this._scrollbar.enablePageChange();
	}

	setStockItemFormationFromWeaponType(weapontype?) {
		this._scrollbar.setStockItemFormationFromWeaponType(weapontype);
	}

	setActive(isActive?) {
		this._scrollbar.setActive(isActive);
	}

	setForceSelect(index?) {
		this._scrollbar.setForceSelect(index);
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}

	enableWarningState(isEnabled?) {
		this._scrollbar.enableWarningState(isEnabled);
	}

	getCurrentItem() {
		return this._scrollbar.getObject();
	}

	getItemIndex() {
		return this._scrollbar.getIndex();
	}

	setItemIndex(index?) {
		return this._scrollbar.setIndex(index);
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	resetItemList() {
		this._scrollbar.resetScrollData();
	}

	getItemFromIndex(index?) {
		return this._scrollbar.getObjectFromIndex(index);
	}

	getItemScrollbar() {
		return this._scrollbar;
	}
}

class ItemListScrollbar extends BaseScrollbar {

	_unit: any = null;

	_isWarningAllowed: any = false;

	_availableArray: any = null;

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var isAvailable, color, alpha;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		
		if (object === null) {
			return;
		}
		
		if (this._availableArray !== null) {
			isAvailable = this._availableArray[index];
		}
		else {
			isAvailable = true;
		}
		
		color = this._getTextColor(object, isSelect, index);
		alpha = this._getTextAlpha(object, isSelect, index, isAvailable);
		
		ItemRenderer.drawItemAlpha(x, y, object, color, font, true, alpha);
	}

	playOptionSound() {
		MediaControl.soundDirect('commandselect');
	}

	getObjectWidth() {
		return ItemRenderer.getItemWidth();
	}

	getObjectHeight() {
		return ItemRenderer.getItemHeight();
	}

	setUnitMaxItemFormation(unit?) {
		var i;
		var maxCount = DataConfig.getMaxUnitItemCount();
		
		this._unit = unit;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			this.objectSet(UnitItemControl.getItem(unit, i));
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	}

	setUnitItemFormation(unit?) {
		var i, item;
		var maxCount = DataConfig.getMaxUnitItemCount();
		
		this._unit = unit;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null) {
				this.objectSet(item);
			}
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	}

	setStockItemFormation() {
		var i;
		var maxCount = StockItemControl.getStockItemCount();
		
		this._unit = null;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			this.objectSet(StockItemControl.getStockItem(i));
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	}

	setStockItemFormationFromWeaponType(weapontype?) {
		var i, item;
		var maxCount = StockItemControl.getStockItemCount();
		
		this._unit = null;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			item = StockItemControl.getStockItem(i);
			if (item.getWeaponType() === weapontype) {
				this.objectSet(item);
			}
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	}

	enableWarningState(isEnabled?) {
		this._isWarningAllowed = isEnabled;
	}

	resetAvailableData() {
		var i, item;
		var length = this._objectArray.length;
		
		this._availableArray = [];
		
		for (i = 0; i < length; i++) {
			item = this._objectArray[i];
			if (item !== null) {
				this._availableArray.push(this._isAvailable(item, false, i));
			}
		}
	}

	setAvailableArray(arr?) {
		this._availableArray = arr;
	}

	getAvailableArray(arr?) {
		return this._availableArray;
	}

	_isAvailable(object?, isSelect?, index?) {
		var isAvailable;
		
		if (this._unit === null) {
			isAvailable = true;
		}
		else if (object.isWeapon()) {
			// Check if the item can be equipped when the item type is a weapon.
			isAvailable = ItemControl.isWeaponAvailable(this._unit, object);
		}
		else {
			// Check if the item can be used when the item type is not a weapon.
			isAvailable = ItemControl.isItemUsable(this._unit, object);
		}
		
		return isAvailable;
	}

	_getTextColor(object?, isSelect?, index?) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		
		if (this._isWarningItem(object)) {
			color = ColorValue.KEYWORD;
		}
		
		return color;
	}

	_isWarningItem(object?) {
		return this._isWarningAllowed && Miscellaneous.isTradeDisabled(this._unit, object);
	}

	_getTextAlpha(object?, isSelect?, index?, isAvailable?) {
		var alpha = 255;
		
		if (!isAvailable) {
			// // Draw it tinted if items cannot be used.
			alpha = 120;
		}
		
		return alpha;
	}
}

class ItemDropListScrollbar extends ItemListScrollbar {

	_trophyRefArray: any = null;

	resetDropMark() {
		var i, count, trophy, list;
		var length = this._objectArray.length;
		
		this._trophyRefArray = [];
		
		for (i = 0; i < length; i++) {
			this._trophyRefArray.push(false);
		}
		
		if (this._unit !== null && this._unit.getUnitType() === UnitType.ENEMY) {
			list = this._unit.getDropTrophyList();
			count = list.getCount();
			for (i = 0; i < count; i++) {
				trophy = list.getData(i);
				// Check if the contents of the trophy are items and if they need to be obtained immediately.
				if ((trophy.getFlag() & TrophyFlag.ITEM) && trophy.isImmediately()) {
					this._checkDrop(trophy);
				}
			}
		}
	}

	_checkDrop(trophy?) {
		var i;
		var length = this._objectArray.length;
		
		for (i = 0; i < length; i++) {
			if (!this._trophyRefArray[i]) {
				if (ItemControl.compareItem(this._objectArray[i], trophy.getItem())) {
					// Specify true so as to display in color if the same item as the trophy item is possessed.
					this._trophyRefArray[i] = true;
					break;
				}
			}
		}
	}

	_getTextColor(object?, isSelect?, index?) {
		var color = super._getTextColor(object, isSelect, index);
		
		if (this._isDropItem(index)) {
			color = ColorValue.LIGHT;
		}
		
		return color;
	}

	_isDropItem(index?) {
		if (this._unit !== null && this._unit.getUnitType() === UnitType.ENEMY) {
			return this._trophyRefArray[index];
		}
		
		return false;
	}
}

class ItemDurabilityListWindow extends ItemListWindow {

	initialize() {
		this._scrollbar = createScrollbarObject(ItemDurabilityListScrollbar, this);
	}

	setDurabilityItemFormation(unit?, repairItem?) {
		this._scrollbar.setDurabilityItemFormation(unit, repairItem);
	}
}

class ItemDurabilityListScrollbar extends ItemListScrollbar {

	_repairItem: any = null;

	setDurabilityItemFormation(unit?, repairItem?) {
		this._repairItem = repairItem;
		this.setUnitItemFormation(unit);
	}

	_getTextColor(object?, isSelect?, index?) {
		var color = super._getTextColor(object, isSelect, index);
		
		if (!Miscellaneous.isDurabilityChangeAllowed(this._repairItem, object)) {
			color = ColorValue.KEYWORD;
		}
		
		return color;
	}
}
