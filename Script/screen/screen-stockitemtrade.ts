
class StockItemTradeMode {

	static OPERATION: any = 0;

	static STORE: any = 1;

	static EXTRACT: any = 2;

	static STOREWARNING: any = 3;

	static EXTRACTWARNING: any = 4;

	static MENU: any = 5;
}

class StockItemTradeResult {

	static TRADEEND: any = 0;

	static TRADENO: any = 1;
}

class StockItemTradeScreen extends BaseScreen {

	_unit: any = null;

	_unitList: any = null;

	_resultCode: any = 0;

	_isAction: any = false;

	_unitItemWindow: any = null;

	_stockItemWindow: any = null;

	_itemOperationWindow: any = null;

	_itemInfoWindow: any = null;

	_infoWindow: any = null;

	_stockCountWindow: any = null;

	_unitSimpleWindow: any = null;

	_dataChanger: any = null;

	_unitMenuScreen: any = null;

	_returnmode: any = 0;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === StockItemTradeMode.OPERATION) {
			result = this._moveOperation();
		}
		else if (mode === StockItemTradeMode.STORE) {
			result = this._moveStore();
		}
		else if (mode === StockItemTradeMode.EXTRACT) {
			result = this._moveExtract();
		}
		else if (mode === StockItemTradeMode.STOREWARNING) {
			result = this._moveStoreWarning();
		}
		else if (mode === StockItemTradeMode.EXTRACTWARNING) {
			result = this._moveExtractWarning();
		}
		else if (mode === StockItemTradeMode.MENU) {
			result = this._moveMenu();
		}
		
		this._itemInfoWindow.moveWindow();
		
		return result;
	}

	drawScreenCycle() {
		this._drawMainWindow();
		this._drawSubWindow();
	}

	drawScreenBottomText(textui?) {
		var item;
		var text = '';
		
		if (this.getCycleMode() === StockItemTradeMode.OPERATION) {
			text = StringTable.Marshal_StockOperation;
		}
		else {
			item = this._itemInfoWindow.getInfoItem();
			if (item !== null) {
				text = item.getDescription();
			}
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('StockItemTrade');
	}

	getScreenResult() {
		return this._resultCode;
	}

	isStoreAllowed() {
		// No possession item exists, so no more item can be stored.
		if (UnitItemControl.getPossessionItemCount(this._unit) === 0) {
			return false;
		}
		
		// The stock has no space, so no more items can be stored.
		if (!StockItemControl.isStockItemSpace()) {
			return false;
		}
		
		return true;
	}

	isExtractAllowed() {
		// No stock item exists, no more items can be withdrawn.
		if (StockItemControl.getStockItemCount() === 0) {
			return false;
		}
		
		// No blank at the unit item, no more item can be withdrawn.
		if (!UnitItemControl.isUnitItemSpace(this._unit)) {
			return false;
		}
		
		return true;
	}

	_prepareScreenMemberData(screenParam?) {
		this._unit = screenParam.unit;
		this._unitList = screenParam.unitList;
		this._resultCode = StockItemTradeResult.TRADENO;
		this._isAction = false;
		this._unitItemWindow = createWindowObject(ItemListWindow, this);
		this._stockItemWindow = createWindowObject(ItemListWindow, this);
		this._itemOperationWindow = createWindowObject(ItemOperationWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
		this._infoWindow = createWindowObject(InfoWindow, this);
		this._stockCountWindow = createWindowObject(StockCountWindow, this);
		this._unitSimpleWindow = this._createSimpleWindow();
		this._dataChanger = createObject(VerticalDataChanger);
	}

	_completeScreenMemberData(screenParam?) {
		var count = LayoutControl.getObjectVisibleCount(ItemRenderer.getItemHeight(), 15) - 2;
		
		if (count > DataConfig.getMaxUnitItemCount()) {
			count = DataConfig.getMaxUnitItemCount();
		}
		
		this._unitItemWindow.setItemFormation(count);
		this._unitItemWindow.enableWarningState(true);
		
		count = LayoutControl.getObjectVisibleCount(ItemRenderer.getItemHeight(), 15);
		this._stockItemWindow.setItemFormation(count);
		
		if (this._unitSimpleWindow !== null) {
			this._unitSimpleWindow.setFaceUnitData(this._unit);
		}
		
		this._updateListWindow();
		
		this._processMode(StockItemTradeMode.OPERATION);
	}

	_moveOperation() {
		var index;
		var input = this._itemOperationWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemOperationWindow.getOperationIndex();
			if (index === 0 && this.isExtractAllowed()) {
				this._processMode(StockItemTradeMode.EXTRACT);
			}
			else if (index === 1 && this.isStoreAllowed()) {
				this._processMode(StockItemTradeMode.STORE);
			}
			else if (index === 2 && this.isStoreAllowed()) {
				this._storeAllItem();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._isAction) {
				// Process after the item update ended.
				this._resultCode = StockItemTradeResult.TRADEEND;
			}
			else {
				this._resultCode = StockItemTradeResult.TRADENO;
			}
			
			// Process after the item update ended.
			ItemControl.updatePossessionItem(this._unit);
			
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.OPTION) {
			this._openMenu();
		}
		else if (this.getCycleMode() === StockItemTradeMode.OPERATION) {
			if (this._unitSimpleWindow === null || this._unitList === null) {
				return result;
			}
			
			index = this._dataChanger.checkDataIndex(this._unitList, this._unit); 
			if (index !== -1) {
				this._unit = this._unitList.getData(index);
				this._unitItemWindow.setUnitItemFormation(this._unit);
				this._unitSimpleWindow.setFaceUnitData(this._unit);
			}
		}
		
		return result;
	}

	_moveStore() {
		var item;
		var input = this._unitItemWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			if (Miscellaneous.isTradeDisabled(this._unit, this._unitItemWindow.getCurrentItem())) {
				this._playOperationBlockSound();
				return MoveResult.CONTINUE;
			}
			
			// Store the item.
			this._storeItem();
			
			if (!this.isStoreAllowed()) {
				this._processMode(StockItemTradeMode.OPERATION);
				this._itemInfoWindow.setInfoItem(null);
			}
			
			// If trade is done even once, set true.
			this._isAction = true;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._itemInfoWindow.setInfoItem(null);
			this._processMode(StockItemTradeMode.OPERATION);
		}
		else if (input === ScrollbarInput.NONE) {
			if (this._unitItemWindow.isIndexChanged()) {
				item = this._unitItemWindow.getCurrentItem();
				this._itemInfoWindow.setInfoItem(item);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveExtract() {
		var item;
		var input = this._stockItemWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {	
			// Take the item out.
			this._extractItem();
			
			if (!this.isExtractAllowed()) {
				this._processMode(StockItemTradeMode.OPERATION);
				this._itemInfoWindow.setInfoItem(null);
			}
			
			// If trade is done even once, set true.
			this._isAction = true;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._itemInfoWindow.setInfoItem(null);
			this._processMode(StockItemTradeMode.OPERATION);
		}
		else if (input === ScrollbarInput.NONE) {
			if (this._stockItemWindow.isIndexChanged()) {
				item = this._stockItemWindow.getCurrentItem();
				this._itemInfoWindow.setInfoItem(item);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveStoreWarning() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			this._processMode(StockItemTradeMode.OPERATION);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveExtractWarning() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			this._processMode(StockItemTradeMode.OPERATION);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveMenu() {
		if (SceneManager.isScreenClosed(this._unitMenuScreen)) {
			this._unit = this._unitMenuScreen.getCurrentTarget();
			this._unitItemWindow.setUnitItemFormation(this._unit);
			this._unitSimpleWindow.setFaceUnitData(this._unit);
			
			this.changeCycleMode(this._returnmode);
		}
		
		return MoveResult.CONTINUE;
	}

	_openMenu() {
		var screenParam = this._createScreenParam();
		
		this._unitMenuScreen = createObject(UnitMenuScreen);
		SceneManager.addScreen(this._unitMenuScreen, screenParam);
		
		this._returnmode = this.getCycleMode();
		
		this.changeCycleMode(StockItemTradeMode.MENU);
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitMenu();
		
		screenParam.unit = this._unit;
		screenParam.enummode = root.getBaseScene() === SceneType.FREE ? UnitMenuEnum.SINGLE : UnitMenuEnum.ALIVE;
		
		return screenParam;
	}

	_drawMainWindow() {
		var xInfo, yInfo;
		var unitWindowWidth = this._unitItemWindow.getWindowWidth();
		var stockWindowHeight = this._stockItemWindow.getWindowHeight();
		var width = this._unitItemWindow.getWindowWidth() + this._stockItemWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, stockWindowHeight);
		
		this._itemOperationWindow.drawWindow(x, y);
		this._unitItemWindow.drawWindow(x, y + this._itemOperationWindow.getWindowHeight());
		
		if (this._isRightSideInfoWindow()) {
			this._stockItemWindow.drawWindow(x + unitWindowWidth, y);
			
			xInfo = x + this._stockItemWindow.getWindowWidth();
			yInfo = (y + stockWindowHeight) - this._itemInfoWindow.getWindowHeight();
			this._itemInfoWindow.drawWindow(xInfo, yInfo);
		}
		else {
			xInfo = (x + unitWindowWidth) - this._itemInfoWindow.getWindowWidth();
			yInfo = (y + stockWindowHeight) - this._itemInfoWindow.getWindowHeight();
			this._itemInfoWindow.drawWindow(xInfo, yInfo);
			
			// Draw after _unitItemWindow or _itemInfoWindow so that the cursor doesn't overlap.
			this._stockItemWindow.drawWindow(x + unitWindowWidth, y);
		}
		
		xInfo = (x + unitWindowWidth + this._stockItemWindow.getWindowWidth()) - this._stockCountWindow.getWindowWidth();
		yInfo = (y - this._stockCountWindow.getWindowHeight());
		this._stockCountWindow.drawWindow(xInfo, yInfo);
		
		if (this._unitSimpleWindow !== null && this._unitList !== null && this.getCycleMode() === StockItemTradeMode.OPERATION) {
			xInfo = (x + unitWindowWidth) - this._unitSimpleWindow.getWindowWidth();
			yInfo = (y + stockWindowHeight) - this._unitSimpleWindow.getWindowHeight();
			this._unitSimpleWindow.drawWindow(xInfo, yInfo);
		}
	}

	_drawSubWindow() {
		var x, y;
		var mode = this.getCycleMode();
		
		if (mode === StockItemTradeMode.STOREWARNING) {
			x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
			this._infoWindow.drawWindow(x, y);
		}
	}

	_storeItem() {
		var index = this._unitItemWindow.getItemIndex();
		var item = UnitItemControl.getItem(this._unit, index);
		
		if (item === null) {
			return;
		}
		
		this._cutUnitItem(index);
		this._pushStockItem(item);
		
		this._updateListWindow();
		this._itemInfoWindow.setInfoItem(this._unitItemWindow.getCurrentItem());
	}

	_extractItem() {
		var index = this._stockItemWindow.getItemIndex();
		var item = StockItemControl.getStockItem(index);
		
		if (item === null) {
			return;
		}
		
		this._cutStockItem(index);
		this._pushUnitItem(item);
		
		this._updateListWindow();
		this._itemInfoWindow.setInfoItem(this._stockItemWindow.getCurrentItem());
	}

	_storeAllItem() {
		var i, count, item;
				
		for (;;) {
			if (!this.isStoreAllowed()) {
				break;
			}
			
			count = UnitItemControl.getPossessionItemCount(this._unit);
			for (i = 0; i < count; i++) {
				if (!Miscellaneous.isTradeDisabled(this._unit, UnitItemControl.getItem(this._unit, i))) {
					break;
				}
			}
			
			if (i === count) {
				break;
			}
			
			item = this._cutUnitItem(i);
			if (item === null) {
				break;
			}
			this._pushStockItem(item);
		}
		
		this._updateListWindow();
		
		this._isAction = true;
	}

	_isRightSideInfoWindow() {
		return this.getCycleMode() === StockItemTradeMode.STORE;
	}

	_cutUnitItem(index?) {
		return UnitItemControl.cutItem(this._unit, index);
	}

	_cutStockItem(index?) {
		StockItemControl.cutStockItem(index);
	}

	_pushUnitItem(item?) {
		UnitItemControl.pushItem(this._unit, item);
	}

	_pushStockItem(item?) {
		StockItemControl.pushStockItem(item);
	}

	_updateListWindow() {
		// If the unit item or the stock item was changed,
		// enter of window should be updated, so process for that.
		this._updateItemWindow(true);
		
		this._updateItemWindow(false);
	}

	_updateItemWindow(isStock?) {
		var itemWindow, scrollbar;
		
		if (isStock) {
			itemWindow = this._stockItemWindow;
		}
		else {
			itemWindow = this._unitItemWindow;
		}
		scrollbar = itemWindow.getItemScrollbar();
		
		scrollbar.saveScroll();
		
		if (isStock) {
			itemWindow.setStockItemFormation();
		}
		else {
			itemWindow.setUnitItemFormation(this._unit);
		}
		
		scrollbar.restoreScroll();
	}

	_playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}

	_processMode(mode?) {
		if (mode === StockItemTradeMode.OPERATION) {
			this._itemOperationWindow.setItemOperationData();
			this._itemOperationWindow.enableSelectCursor(true);
			
			this._unitItemWindow.setActive(false);
			this._unitItemWindow.setForceSelect(-1);
			this._stockItemWindow.setActive(false);
			this._stockItemWindow.setForceSelect(-1);
		}
		else if (mode === StockItemTradeMode.STORE) {
			this._unitItemWindow.enableSelectCursor(true);
			this._itemOperationWindow.enableSelectCursor(false);
			this._itemInfoWindow.setInfoItem(this._unitItemWindow.getCurrentItem());
		}
		else if (mode === StockItemTradeMode.EXTRACT) {
			this._stockItemWindow.enableSelectCursor(true);
			this._itemOperationWindow.enableSelectCursor(false);
			this._itemInfoWindow.setInfoItem(this._stockItemWindow.getCurrentItem());
		}
		else if (mode === StockItemTradeMode.STOREWARNING) {
			this._infoWindow.setInfoMessage(StringTable.ItemChange_StockItemFull);
		}
		else if (mode === StockItemTradeMode.EXTRACTWARNING) {
			this._infoWindow.setInfoMessage(StringTable.ItemChange_StockItemFull);
		}
		
		this.changeCycleMode(mode);
	}

	_createSimpleWindow() {
		var obj;
		
		if (DataConfig.isHighResolution()) {
			obj = createWindowObject(UnitSimpleWindow, this);
		}
		else {
			obj = createWindowObject(UnitSimpleNameWindow, this);
		}
		
		return obj;
	}
}

class StockCountWindow extends BaseWindow {

	moveWindowContent() {
		return MoveResult.END;
	}

	drawWindowContent(x?, y?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		NumberRenderer.drawNumber(x + 42, y, StockItemControl.getStockItemCount());
		
		TextRenderer.drawKeywordText(x + 60, y, '/', -1, color, font);
		
		NumberRenderer.drawNumber(x + 95, y, DataConfig.getMaxStockItemCount());
	}

	getWindowWidth() {
		return 140;
	}

	getWindowHeight() {
		return DefineControl.getCurrencyWindowHeight();
	}
}

class ItemOperationWindow extends BaseWindow {

	_scrollbar: any = null;

	setItemOperationData() {
		var arr = [StringTable.StockItem_Extract, StringTable.StockItem_Store, StringTable.StockItem_AllStore];
		
		this._scrollbar = createScrollbarObject(ItemOperationScrollbar, this);
		this._scrollbar.setScrollFormation(arr.length, 1);
		this._scrollbar.setObjectArray(arr);
	}

	moveWindowContent() {
		return this._scrollbar.moveInput();
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowWidth() {
		return ItemRenderer.getItemWindowWidth();
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	getOperationIndex() {
		return this._scrollbar.getIndex();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}

class ItemOperationScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var color;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var length = this._getTextLength();
		
		if (this._isEnabled(index)) {
			color = textui.getColor();
		}
		else {
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
		return Math.floor(ItemRenderer.getItemWidth() / 3);
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight() - 3;
	}

	_getTextLength() {
		return this.getObjectWidth();
	}

	_isEnabled(index?) {
		if (index === 0) {
			return this.getParentInstance().getParentInstance().isExtractAllowed();
		}
		else if (index === 1) {
			return this.getParentInstance().getParentInstance().isStoreAllowed();
		}
		else if (index === 2) {
			return this.getParentInstance().getParentInstance().isStoreAllowed();
		}
		else {
			return true;
		}
	}
}


//------------------------------------------------------------------


class CategoryStockItemTradeScreen extends StockItemTradeScreen {

	_stockCategory: any = null;

	_prepareScreenMemberData(screenParam?) {
		super._prepareScreenMemberData(screenParam);
		
		this._stockCategory = createObject(StockCategory);
		this._stockCategory.setStockCategory(this._stockItemWindow);
	}

	_moveOperation() {
		var result = super._moveOperation();
		
		if (result === MoveResult.END) {
			return result;
		}
		
		if (this.getCycleMode() === StockItemTradeMode.OPERATION) {
			if (this.isExtractAllowed() && this._stockCategory.checkDirectClick() !== -1) {
				this._processMode(StockItemTradeMode.EXTRACT);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveExtract() {
		var index = this._stockCategory.checkStockCategory();
		
		if (index !== -1) {
			return MoveResult.CONTINUE;
		}
		
		return super._moveExtract();
	}

	_drawMainWindow() {
		var stockWindowHeight = this._stockItemWindow.getWindowHeight();
		var width = this._unitItemWindow.getWindowWidth() + this._stockItemWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, stockWindowHeight);
		
		super._drawMainWindow();
		
		this._stockCategory.xRendering = x + width;
		this._stockCategory.yRendering = y;
		this._stockCategory.windowHeight = stockWindowHeight;
		this._stockCategory.drawStockCategory();
	}

	_extractItem() {
		var item = this._stockItemWindow.getCurrentItem();
		var index = StockItemControl.getIndexFromItem(item);
		
		if (item === null) {
			return;
		}
		
		this._cutStockItem(index);
		this._pushUnitItem(item);
		
		this._updateListWindow();
		this._itemInfoWindow.setInfoItem(this._stockItemWindow.getCurrentItem());
	}

	_updateListWindow() {
		this._updateStockWindow();
		this._updateItemWindow(false);
	}

	_updateStockWindow() {
		var weapontype = this._stockCategory.getWeaponType();
		var scrollbar = this._stockItemWindow.getItemScrollbar();
		
		scrollbar.saveScroll();
		
		this._stockItemWindow.setStockItemFormationFromWeaponType(weapontype);
		
		scrollbar.restoreScroll();
	}
}

class StockCategory extends BaseScrollbar {

	_arr: any = null;

	_index: any = 0;

	_stockItemWindow: any = null;

	xRendering: any = 0;

	yRendering: any = 0;

	windowHeight: any = 0;

	setStockCategory(stockItemWindow?) {
		var i, obj;
		var arr = this._getWeaponTypeArray();
		var count = arr.length;
		
		this._arr = [];
		
		for (i = 0; i < count; i++) {
			obj = {};
			obj.weaponType = arr[i];
			obj.index = 0;
			obj.scrollYValue = 0;
			this._arr.push(obj);
		}
		
		this._stockItemWindow = stockItemWindow;
	}

	checkStockCategory() {
		var index = -1;
		
		if (root.isMouseAction(MouseType.LEFT)) {
			index = this._getSelectIndex();
		}
		else if (InputControl.isInputAction(InputType.LEFT)) {
			index = this._getChangeIndex(true);
		}
		else if (InputControl.isInputAction(InputType.RIGHT)) {
			index = this._getChangeIndex(false);
		}
		
		if (index !== -1) {
			this._changeNewStockItem(index);
		}
		
		return index;
	}

	
	// Called directly when weapon type is selected, bypassing "Take out".
	checkDirectClick() {
		var index = -1;
		
		if (root.isMouseAction(MouseType.LEFT)) {
			index = this._getSelectIndex();
			if (index !== -1) {
				this._changeNewStockItem(index);
			}
		}
		
		return index;
	}

	getWeaponType() {
		return this._arr[this._index].weaponType;
	}

	drawStockCategory() {
		var i;
		var count = this._arr.length;
		var x = this.xRendering;
		var y = this.yRendering;
		
		this._drawWindow(x, y);
		x += this._getOffsetX();
		y += this._getOffsetY();
		
		for (i = 0; i < count; i++) {
			this._drawWeaponType(x, y, this._arr[i].weaponType, this._index === i);
			if (this._isNextCol(y)) {
				y = this.yRendering + this._getOffsetY();
				x += 28;
			}
			else {
				y += this._getInterval();
			}
		}
	}

	_changeNewStockItem(index?) {
		var itemNew;
		var itemPrev = this._stockItemWindow.getCurrentItem();
		
		this._setNewIndex(index);
		
		itemNew = this._stockItemWindow.getCurrentItem();
		if (itemPrev !== itemNew) {
			SceneManager.getLastScreen()._itemInfoWindow.setInfoItem(itemNew);
		}
	}

	_setNewIndex(index?) {
		var obj;
		var scrollbar = this._stockItemWindow.getItemScrollbar();
		
		// Saves scroll position for the previous weapon type before switching.
		obj = this._arr[this._index];
		obj.index = scrollbar.getIndex();
		if (obj.index < 0) {
			obj.index = 0;
		}
		obj.scrollYValue = scrollbar.getScrollYValue();
		
		// Switches to new weapon type.
		obj = this._arr[index];
		this._stockItemWindow.setStockItemFormationFromWeaponType(obj.weaponType);
		scrollbar.setIndex(obj.index);
		scrollbar.setScrollYValue(obj.scrollYValue);
		this._index = index;
	}

	_isNextCol(y?) {
		return y + this._getInterval() >= this.yRendering + this.windowHeight - (this._getOffsetY() * 2);
	}

	_getCol() {
		var i;
		var y = this.yRendering;
		var count = this._arr.length;
		var col = 0;
		var isNext = false;
		
		y += this._getOffsetY();
		
		for (i = 0; i < count; i++) {
			if (isNext) {
				col++;
				isNext = false;
			}
			
			if (this._isNextCol(y)) {
				y = this.yRendering + this._getOffsetY();
				isNext = true;
			}
			else {
				y += this._getInterval();
			}
		}
		
		return col;
	}

	_drawWeaponType(x?, y?, object?, isSelect?) {
		var handle = object.getIconResourceHandle();
		var graphicsRenderParam = StructureBuilder.buildGraphicsRenderParam();
		var alpha = isSelect ? 255 : 190;
		
		graphicsRenderParam.alpha = alpha;
		GraphicsRenderer.drawImageParam(x, y, handle, GraphicsType.ICON, graphicsRenderParam);
	}

	_drawWindow(x?, y?) {
		var width = 46 + (26 * this._getCol());
		var height = this.windowHeight;
		var textui = this._getWindowTextUI();
		var pic = textui.getUIImage();
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
	}

	_getWeaponTypeArray() {
		var i, j, list, count, weapontype;
		var arr = [];
		
		for (i = 0; i < 4; i++) {
			list = root.getBaseData().getWeaponTypeList(i);
			count = list.getCount();
			for (j = 0; j < count; j++) {
				weapontype = list.getData(j);
				if (this._isWeaponTypeAllowed(weapontype)) {
					arr.push(weapontype);
				}
			}
		}
		
		return arr;
	}

	_getSelectIndex() {
		var i, range;
		var count = this._arr.length;
		var x = this.xRendering + this._getOffsetX();
		var y = this.yRendering + this._getOffsetY();
		
		for (i = 0; i < count; i++) {
			range = createRangeObject(x, y, GraphicsFormat.ICON_WIDTH, GraphicsFormat.ICON_HEIGHT);
			if (MouseControl.isHovering(range)) {
				this._playCheckSound();
				return i;
			}
			
			if (this._isNextCol(y)) {
				y = this.yRendering + this._getOffsetY();
				x += 28;
			}
			else {
				y += this._getInterval();
			}
		}
		
		return -1;
	}

	_getChangeIndex(isLeft?) {
		var index = this._index;
		
		if (isLeft) {
			if (--index === -1) {
				index = this._arr.length - 1;
			}
		}
		else {
			if (++index === this._arr.length) {
				index = 0;
			}
		}
		
		this._playCheckSound();
		
		return index;
	}

	_getInterval() {
		return 28;
	}

	_getOffsetX() {
		return 10;
	}

	_getOffsetY() {
		return 14;
	}

	_isWeaponTypeAllowed(weapontype?) {
		return weapontype.isStockTradeVisible();
	}

	_getWindowTextUI() {
		return root.queryTextUI('default_window');
	}

	_playCheckSound() {
		MediaControl.soundDirect('commandselect');
	}
}
