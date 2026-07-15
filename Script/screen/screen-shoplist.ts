
class ShopListScreenMode {

	static TOP: any = 0;

	static SCREEN: any = 1;
}

class ShopListScreen extends BaseScreen {
	_shopShelfWindow: any;


	_shopListWindow: any = null;

	_shopItemWindow: any = null;

	_shopEntryArray: any = null;

	_stockCountWindow: any = null;

	_shopScreenLauncher: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ShopListScreenMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ShopListScreenMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	}

	drawScreenCycle() {
		var xInfo, yInfo;
		var width = this._shopListWindow.getWindowWidth() + this._shopShelfWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._shopListWindow.getWindowHeight());
		
		this._shopListWindow.drawWindow(x, y);
		this._shopShelfWindow.drawWindow(x + this._shopListWindow.getWindowWidth(), y);
		
		xInfo = (x + width) - this._stockCountWindow.getWindowWidth();
		yInfo = (y - this._stockCountWindow.getWindowHeight());
		this._stockCountWindow.drawWindow(xInfo, yInfo);
	}

	drawScreenBottomText(textui?) {
		var text;
		var entry = this.getCurrentShopEntry();
		
		if (entry.isAvailable) {
			text = entry.data.getDescription();
		}
		else {
			text = '';
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('ShopList');
	}

	getCurrentShopEntry() {
		return this._shopEntryArray[this._shopListWindow.getListIndex()];
	}

	_prepareScreenMemberData(screenParam?) {
		this._shopListWindow = createWindowObject(ShopListWindow, this);
		this._shopShelfWindow = createWindowObject(ShopShelfWindow, this);
		this._stockCountWindow = createWindowObject(StockCountWindow, this);
		this._shopScreenLauncher = this._createScreenLauncher();
	}

	_completeScreenMemberData(screenParam?) {
		this._shopEntryArray = this._getShopEntryArray();
		
		this._shopListWindow.setWindowData();
		this._shopListWindow.setShopLayoutEntryArray(this._shopEntryArray);
		
		this._shopShelfWindow.setShopData(this._shopEntryArray[0].data);
	}

	_getShopEntryArray() {
		var i, data, entry;
		var arr = [];
		var list = this._getDataList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			entry = StructureBuilder.buildListEntry();
			
			entry.isAvailable = data.isShopDisplayable();
			if (entry.isAvailable) {
				entry.name = data.getName();
			}
			else {
				entry.name = StringTable.HideData_Question;
			}
			entry.data = data;
			
			arr.push(entry);
		}
		
		return arr;
	}

	_getDataList() {
		return root.getBaseData().getRestShopList();
	}

	_createScreenLauncher() {
		return createObject(ShopScreenLauncher);
	}

	_moveTop() {
		var input = this._shopListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startShopScreen();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			if (this._shopListWindow.isIndexChanged()) {
				this._shopShelfWindow.setShopData(this._shopEntryArray[this._shopListWindow.getListIndex()].data);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveScreen() {
		var result = this._shopScreenLauncher.moveScreenLauncher();
		
		if (result !== MoveResult.CONTINUE) {
			this._shopShelfWindow.setShopData(this._shopEntryArray[this._shopListWindow.getListIndex()].data);
			this._shopListWindow.enableSelectCursor(true);
			this.changeCycleMode(ShopListScreenMode.TOP);
			return MoveResult.CONTINUE;
		}
		
		return result;
	}

	_startShopScreen() {
		var entry = this.getCurrentShopEntry();
		
		if (!entry.isAvailable) {
			return;
		}
		
		this._shopScreenLauncher.setShopData(entry.data);
		this._shopScreenLauncher.openScreenLauncher();
		this.changeCycleMode(ShopListScreenMode.SCREEN);
	}
}

class ShopListWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(ShopListScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
	}

	setShopLayoutEntryArray(objectArray?) {
		this._scrollbar.setObjectArray(objectArray);
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

	getListIndex() {
		return this._scrollbar.getIndex();
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}

class ShopListScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var dx = 0;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var handle = object.data.getIconResourceHandle();
		
		if (object.isAvailable) {
			if (!handle.isNullHandle()) {
				dx = GraphicsFormat.ICON_WIDTH + 6;
				GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
			}
		}
		else {
			color = ColorValue.DISABLE;
		}
		
		TextRenderer.drawKeywordText(x + dx, y, object.name, length, color, font);
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = true;
		
		if (!object.isAvailable) {
			isSelect = false;
		}
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	getObjectWidth() {
		return DefineControl.getTextPartsWidth() + GraphicsFormat.ICON_WIDTH;
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}

class ShopShelfWindow extends BaseWindow {

	_shopData: any = null;

	_scrollbar: any = null;

	_shopItemArray: any = null;

	_inventoryArray: any = null;

	initialize() {
		this._scrollbar = createScrollbarObject(ShopShelfScrollbar, this);
	}

	setShopData(shopData?) {
		var count = LayoutControl.getObjectVisibleCount(ItemRenderer.getItemHeight(), 12);
		
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.enablePageChange();
		
		this._shopData = shopData;
		this._shopItemArray = shopData.getShopItemArray();
		this._inventoryArray = shopData.getInventoryNumberArray();
		
		this._arrangeInventoryArray();
		
		this._scrollbar.setObjectArray(this._shopItemArray);
		this._scrollbar.resetAvailableData();
	}

	moveWindowContent() {
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		if (this._shopData.isShopDisplayable()) {
			this._scrollbar.drawScrollbar(x, y);
		}
	}

	getInventoryArray() {
		return this._inventoryArray;
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	_arrangeInventoryArray() {
		var i;
		var count = this._inventoryArray.length;
		
		for (;;) {
			count = this._inventoryArray.length;
			for (i = 0; i < count; i++) {
				if (this._inventoryArray[i].getAmount() === -1) {
					this._inventoryArray.splice(i, 1);
					this._shopItemArray.splice(i, 1);
					break;
				}
			}
			
			if (i === count) {
				break;
			}
		}
	}
}

class ShopShelfScrollbar extends BaseScrollbar {

	_availableArray: any = null;

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var item = object;
		var arr = this.getParentInstance().getInventoryArray();
		var amount = arr[index].getAmount();
		
		if (!this._availableArray[index]) {
			// Dim the item which doesn't satisfy the condition.
			color = ColorValue.DISABLE;
		}
		
		ItemRenderer.drawShopItem(x, y, item, color, font, this._getPrice(item), amount);
	}

	resetAvailableData() {
		var i, item;
		var length = this._objectArray.length;
		
		this._availableArray = [];
		
		for (i = 0; i < length; i++) {
			item = this._objectArray[i];
			if (item !== null) {
				this._availableArray.push(this._isItemBuyable(item));
			}
		}
	}

	getObjectWidth() {
		return ItemRenderer.getShopItemWidth();
	}

	getObjectHeight() {
		return ItemRenderer.getItemHeight();
	}

	_isItemBuyable(item?) {
		return true;
	}

	_getPrice(item?) {
		return item.getGold();
	}
}


//------------------------------------------------------------------


class BonusListScreen extends ShopListScreen {
	_shopShelfWindow: any;


	getScreenInteropData() {
		return root.queryScreen('BonusList');
	}

	_prepareScreenMemberData(screenParam?) {
		this._shopListWindow = createWindowObject(ShopListWindow, this);
		this._shopShelfWindow = createWindowObject(BonusShelfWindow, this);
		this._stockCountWindow = createWindowObject(StockCountWindow, this);
		this._shopScreenLauncher = createObject(BonusScreenLauncher);
	}

	_getDataList() {
		return root.getBaseData().getRestBonusList();
	}
}

class BonusShelfWindow extends ShopShelfWindow {

	_bonusArray: any = null;

	_scrollbar: any = null;

	initialize() {
		this._scrollbar = createScrollbarObject(BonusShelfScrollbar, this);
	}

	setShopData(shopData?) {
		super.setShopData(shopData);
		
		this._bonusArray = shopData.getBonusNumberArray();
	}

	getBonusFromItem(item?) {
		var i;
		var count = this._shopItemArray.length;
			
		for (i = 0; i < count; i++) {
			if (ItemControl.compareItem(this._shopItemArray[i], item)) {
				return this._bonusArray[i];
			}
		}
		
		return 0;
	}
}

class BonusShelfScrollbar extends ShopShelfScrollbar {

	_getPrice(item?) {
		return this.getParentInstance().getBonusFromItem(item);
	}
}
