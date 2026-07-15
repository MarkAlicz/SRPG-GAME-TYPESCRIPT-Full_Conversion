
class ItemSelectMenuMode {

	static ITEMSELECT: any = 0;

	static WORK: any = 1;

	static DISCARD: any = 2;
}

class ItemSelectMenuResult {

	static USE: any = 0;

	static CANCEL: any = 1;

	static NONE: any = 2;
}

class ItemSelectMenu extends BaseWindowManager {

	_unit: any = null;

	_itemListWindow: any = null;

	_itemInfoWindow: any = null;

	_itemWorkWindow: any = null;

	_discardManager: any = null;

	_forceSelectIndex: any = -1;

	_isDiscardAction: any = false;

	setMenuTarget(unit?) {
		this._unit = unit;
		
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
		this._itemWorkWindow = createWindowObject(ItemWorkWindow, this);
		this._discardManager = createObject(DiscardManager);
		
		this._itemWorkWindow.setupItemWorkWindow();
		
		this._resetItemList();
		
		this._processMode(ItemSelectMenuMode.ITEMSELECT);
	}

	moveWindowManager() {
		var mode = this.getCycleMode();
		var result = ItemSelectMenuResult.NONE;
		
		if (mode === ItemSelectMenuMode.ITEMSELECT) {
			result = this._moveItemSelect();
		}
		else if (mode === ItemSelectMenuMode.WORK) {
			result = this._moveWork();
		}
		else if (mode === ItemSelectMenuMode.DISCARD) {
			result = this._moveDiscard();
		}
		
		this._itemInfoWindow.moveWindow();
		
		return result;
	}

	drawWindowManager() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);

		this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
		
		if (this.getCycleMode() === ItemSelectMenuMode.WORK) {
			this._itemWorkWindow.drawWindow(x + this._itemListWindow.getWindowWidth(), y);
		}
		
		if (this.getCycleMode() === ItemSelectMenuMode.DISCARD) {
			this._discardManager.drawWindowManager();
		}
	}

	getTotalWindowWidth() {
		return this._itemInfoWindow.getWindowWidth() + this._itemWorkWindow.getWindowWidth();
	}

	getTotalWindowHeight() {
		return this._itemListWindow.getWindowHeight() + this._getWindowInterval() + this._itemInfoWindow.getWindowHeight();
	}

	getPositionWindowX() {
		var width = this.getTotalWindowWidth();
		return LayoutControl.getUnitBaseX(this._unit, width);
	}

	getPositionWindowY() {
		return LayoutControl.getCenterY(-1, 340);
	}

	getSelectItem() {
		return this._itemListWindow.getCurrentItem();
	}

	isDiscardAction() {
		return this._isDiscardAction;
	}

	isWorkAllowed(index?) {
		var result = false;
		var item = this._itemListWindow.getCurrentItem();
		
		if (item.isWeapon()) {
			if (index === 0) {
				result = ItemControl.isWeaponAvailable(this._unit, item);
			}
			else if (index === 1) {
				result = !item.isImportance();
			}
		}
		else {
			if (index === 0) {
				result = this._isItemUsable(item);
			}
			else if (index === 1) {
				result = !item.isImportance();
			}
		}
		
		return result;
	}

	_moveItemSelect() {
		var input = this._itemListWindow.moveWindow();
		var result = ItemSelectMenuResult.NONE;
		
		if (input === ScrollbarInput.SELECT) {
			this._itemWorkWindow.setItemWorkData(this._itemListWindow.getCurrentItem());
			this._processMode(ItemSelectMenuMode.WORK);
		}
		else if (input === ScrollbarInput.CANCEL) {
			ItemControl.updatePossessionItem(this._unit);
			result = ItemSelectMenuResult.CANCEL;
		}
		else {
			if (this._itemListWindow.isIndexChanged()) {
				this._itemInfoWindow.setInfoItem(this._itemListWindow.getCurrentItem());
			}
		}
		
		return result;
	}

	_moveWork() {
		var index;
		var input = this._itemWorkWindow.moveWindow();
		var result = ItemSelectMenuResult.NONE;
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemWorkWindow.getWorkIndex();
			if (this.isWorkAllowed(index)) {
				result = this._doWorkAction(index);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._processMode(ItemSelectMenuMode.ITEMSELECT);
		}
		
		return result;
	}

	_moveDiscard() {
		var discardResult = this._discardManager.moveWindowManager();
		var result = ItemSelectMenuResult.NONE;
		
		if (discardResult === DiscardWindowResult.DISCARD) {
			this._discardItem();
			if (UnitItemControl.getPossessionItemCount(this._unit) === 0) {
				ItemControl.updatePossessionItem(this._unit);
				result = ItemSelectMenuResult.CANCEL;
			}
			else {
				this._processMode(ItemSelectMenuMode.ITEMSELECT);
			}
		}
		else if (discardResult === DiscardWindowResult.CANCEL) {
			this._processMode(ItemSelectMenuMode.ITEMSELECT);
		}
		
		return result;
	}

	_discardItem() {
		var index = this._itemListWindow.getItemIndex();
		
		UnitItemControl.cutItem(this._unit, index);
		
		this._resetItemList();
		
		this._isDiscardAction = true;
	}

	_doWorkAction(index?) {
		var item = this._itemListWindow.getCurrentItem();
		var result = ItemSelectMenuResult.NONE;
		
		if (item.isWeapon()) {
			if (index === 0) {
				ItemControl.setEquippedWeapon(this._unit, item);
				this._resetItemList();
				this._processMode(ItemSelectMenuMode.ITEMSELECT);
			}
			else if (index === 1) {
				this._processMode(ItemSelectMenuMode.DISCARD);
			}
		}
		else {
			if (index === 0) {
				result = ItemSelectMenuResult.USE;
			}
			else if (index === 1) {
				this._processMode(ItemSelectMenuMode.DISCARD);
			}
		}
		
		return result;
	}

	_isItemUsable(item?) {
		var obj;
		
		// Wands cannot be used from the item list.
		if (item.isWand()) {
			return false;
		}
		
		if (!ItemControl.isItemUsable(this._unit, item)) {
			return false;
		}
		
		obj = ItemPackageControl.getItemAvailabilityObject(item);
		if (obj === null) {
			return false;
		}
		
		return obj.isItemAvailableCondition(this._unit, item);
	}

	_getWindowInterval() {
		return 10;
	}

	_resetItemList() {
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var visibleCount = 8;
		
		if (count > visibleCount) {
			count = visibleCount;
		}
		
		this._itemListWindow.setItemFormation(count);
		this._itemListWindow.setUnitItemFormation(this._unit);
	}

	_processMode(mode?) {
		if (mode === ItemSelectMenuMode.ITEMSELECT) {
			this._forceSelectIndex = -1;
			this._itemListWindow.enableSelectCursor(true);
		}
		else if (mode === ItemSelectMenuMode.WORK) {
			this._itemListWindow.enableSelectCursor(false);
		
			this._itemWorkWindow.setWorkIndex(0);
			this._itemWorkWindow.enableSelectCursor(true);
		}
		else if (mode === ItemSelectMenuMode.DISCARD) {
			this._discardManager.setDiscardItem(this._itemListWindow.getCurrentItem());
		}
		
		this.changeCycleMode(mode);
	}
}

class ItemWorkWindow extends BaseWindow {

	_scrollbar: any = null;

	setupItemWorkWindow() {
		this._scrollbar = createScrollbarObject(ItemWorkScrollbar, this);
		this._scrollbar.setScrollFormation(1, 2);
	}

	setItemWorkData(item?) {
		var arr;
		
		if (item.isWeapon()) {
			arr = [StringTable.ItemWork_Equipment, StringTable.ItemWork_Discard];
			this._scrollbar.setObjectArray(arr);
		}
		else {
			arr = [StringTable.ItemWork_Use, StringTable.ItemWork_Discard];
			this._scrollbar.setObjectArray(arr);
		}
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
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	getWorkIndex() {
		return this._scrollbar.getIndex();
	}

	setWorkIndex(index?) {
		this._scrollbar.setIndex(index);
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}

class ItemWorkScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (!this._isEnabled(index)) {
			color = ColorValue.DISABLE;
		}
	
		TextRenderer.drawKeywordText(x, y, object, length, color, font);
	}

	playSelectSound() {
		var index = this.getIndex();
		var isSelect = this._isEnabled(index);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	getObjectWidth() {
		return 85;
	}

	getObjectHeight() {
		return 35;
	}

	_getTextLength() {
		return this.getObjectWidth();
	}

	_isEnabled(index?) {
		return this.getParentInstance().getParentInstance().isWorkAllowed(index);
	}
}
