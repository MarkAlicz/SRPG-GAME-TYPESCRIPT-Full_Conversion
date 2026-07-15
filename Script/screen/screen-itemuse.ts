
class ItemUseScreenMode {

	static OPERATION: any = 0;

	static LIST: any = 1;

	static MESSENGER: any = 2;

	static HELP: any = 3;
}

class ItemUseScreen extends BaseScreen {

	_unit: any = null;

	_unitList: any = null;

	_itemUseOperationWindow: any = null;

	_unitItemWindow: any = null;

	_stockItemWindow: any = null;

	_itemInfoWindow: any = null;

	_itemUserWindow: any = null;

	_unitSimpleWindow: any = null;

	_dataChanger: any = null;

	_itemMessenger: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemUseScreenMode.OPERATION) {
			result = this._moveOperation();
		}
		else if (mode === ItemUseScreenMode.LIST) {
			result = this._moveList();
		}
		else if (mode === ItemUseScreenMode.MESSENGER) {
			result = this._moveMessenger();
		}
		else if (mode === ItemUseScreenMode.HELP) {
			result = this._moveHelp();
		}
		
		this._itemUserWindow.moveWindow();
		
		if (!this._itemUserWindow.getSkillInteraction().isHelpMode()) {
			this._itemInfoWindow.moveWindow();
		}
		
		return result;
	}

	drawScreenCycle() {
		var mode = this.getCycleMode();
		var width = this._getItemListWindow().getWindowWidth() + this._itemUserWindow.getWindowWidth();
		var height = this._itemUserWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._itemUseOperationWindow.drawWindow(x, y);
		this._getItemListWindow().drawWindow(x, y + this._itemUseOperationWindow.getWindowHeight());
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			this._drawSubWindow(x, y, this._itemUserWindow.getSkillInteraction().getInteractionWindow());
		}
		else if (mode === ItemUseScreenMode.OPERATION) {
			this._drawSubWindow(x, y, this._unitSimpleWindow);
		}
		else if (mode === ItemUseScreenMode.LIST || mode === (ItemUseScreenMode as any).USECHECK) { // NOTE (JS->TS): USECHECK isn't a defined value in the original
			this._drawSubWindow(x, y, this._itemInfoWindow);
		}
		
		this._itemUserWindow.drawWindow(x + this._getItemListWindow().getWindowWidth(), y);
		
		if (mode === ItemUseScreenMode.MESSENGER) {
			this._itemMessenger.drawMessenger();
		}
	}

	drawScreenBottomText(textui?) {
		var item;
		var mode = this.getCycleMode();
		var text = '';
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			text = this._itemUserWindow.getSkillInteraction().getHelpText();
		}
		else if (mode === ItemUseScreenMode.OPERATION) {
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
		return root.queryScreen('ItemUse');
	}

	isTargetSelectable(index?) {
		var count: any = 0;
		
		if (index === 0) {
			count = this._unitItemWindow.getItemScrollbar().getObjectCount() > 0;
		}
		else if (index === 1) {
			count = this._stockItemWindow.getItemScrollbar().getObjectCount() > 0;
		}
		
		return count > 0;
	}

	_prepareScreenMemberData(screenParam?) {
		this._unit = screenParam.unit;
		this._unitList = this._createUnitList();
		this._itemUseOperationWindow = createWindowObject(ItemUseOperationWindow, this);
		this._unitItemWindow = createWindowObject(ItemListWindow, this);
		this._stockItemWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
		this._itemUserWindow = createWindowObject(ItemUserWindow, this);
		this._unitSimpleWindow = this._createSimpleWindow();
		this._dataChanger = createObject(VerticalDataChanger);
		this._itemMessenger = createObject(ItemMessenger);
	}

	_completeScreenMemberData(screenParam?) {
		this._itemUseOperationWindow.setItemUseOperationData();
		this._unitItemWindow.setItemFormation(5);
		this._unitItemWindow.getItemScrollbar().enablePageChange();
		
		this._stockItemWindow.setItemFormation(5);
		this._stockItemWindow.getItemScrollbar().enablePageChange();
		
		this._updateItemAndWindow(-1);
		
		this._processMode(ItemUseScreenMode.OPERATION);
	}

	_moveOperation() {
		var index;
		var input = this._itemUseOperationWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		index = this._itemUseOperationWindow.getOperationIndex();
		
		if (input === ScrollbarInput.SELECT) {
			if (this.isTargetSelectable(index)) {
				this._processMode(ItemUseScreenMode.LIST);
			}
			else {
				this._playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		else {
			index = this._dataChanger.checkDataIndex(this._unitList, this._unit); 
			if (index !== -1) {
				this._changeData(index);
			}
		}
		
		return result;
	}

	_moveList() {
		var recentlyInput;
		var input = this._getItemListWindow().moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			if (this._isItemAvailable()) {
				this._itemMessenger.setMessenger(this._unit, this._getItemListWindow().getCurrentItem());
				this._processMode(ItemUseScreenMode.MESSENGER);
			}
			else {
				this._playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._itemUserWindow.getSkillInteraction().cancelInteraction();
			this._processMode(ItemUseScreenMode.OPERATION);
		}
		else {
			recentlyInput = this._getItemListWindow().getItemScrollbar().getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				if (this._itemUserWindow.getSkillInteraction().setHelpMode()) {
					this._processMode(ItemUseScreenMode.HELP);
				}
			}
			else {
				if (this._getItemListWindow().isIndexChanged()) {
					this._itemInfoWindow.setInfoItem(this._getItemListWindow().getCurrentItem());
				}
				
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveMessenger() {
		var index;
		
		if (this._itemMessenger.moveMessenger() !== MoveResult.CONTINUE) {
			if (this._itemMessenger.isItemUsed()) {
				this._getItemListWindow().getItemScrollbar().saveScroll();
				this._updateItemAndWindow(this._itemUseOperationWindow.getOperationIndex());
				this._getItemListWindow().getItemScrollbar().restoreScroll();
				
				index = this._itemUseOperationWindow.getOperationIndex();
				if (this.isTargetSelectable(index)) {
					this._processMode(ItemUseScreenMode.LIST);
				}
				else {
					this._processMode(ItemUseScreenMode.OPERATION);
				}
			}
			else {
				this._processMode(ItemUseScreenMode.LIST);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveHelp() {
		if (!this._itemUserWindow.getSkillInteraction().isHelpMode()) {
			this._processMode(ItemUseScreenMode.LIST);
		}
		
		return MoveResult.CONTINUE;
	}

	_drawSubWindow(x?, y?, window?) {
		var xInfo = (x + this._getItemListWindow().getWindowWidth()) - window.getWindowWidth();
		var yInfo = (y + this._itemUserWindow.getWindowHeight()) - window.getWindowHeight();
		
		window.drawWindow(xInfo, yInfo);
	}

	_changeData(index?) {
		var itemIndex = this._stockItemWindow.getItemIndex();
		var yScroll = this._stockItemWindow.getItemScrollbar().getScrollYValue();
		
		this._unit = this._unitList.getData(index);
		this._updateItemAndWindow(-1);
		
		if (itemIndex >= this._stockItemWindow.getItemScrollbar().getAvailableArray().length - 1) {
			itemIndex = 0;
			yScroll = 0;
		}
		
		// The stock window retains the previous position.
		this._stockItemWindow.setItemIndex(itemIndex);
		this._stockItemWindow.getItemScrollbar().setScrollYValue(yScroll);
		
		// The index of the unit window points to the first item.
		this._unitItemWindow.setItemIndex(0);
	}

	_updateItemAndWindow(index?) {
		if (index === 0) {
			this._resetUnitItemArray();
		}
		else if (index === 1) {
			this._deleteFromStock();
			this._resetStockItemArray();
		}
		else {
			// There is a possibility that revive occurs, so rebuild.
			this._unitList = this._createUnitList();
			
			this._resetUnitItemArray();
			this._resetStockItemArray();
		}
		
		this._unitSimpleWindow.setFaceUnitData(this._unit);
		this._itemUserWindow.setItemUserData(this._unit);
	}

	_resetUnitItemArray() {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var unitItemArray = [];
		var unitAvailableArray = [];
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(this._unit, i);
			if (!this._itemMessenger.isItemAllowed(this._unit, item)) {
				continue;
			}
			
			unitItemArray.push(item);
			unitAvailableArray.push(this._itemMessenger.isUsable(this._unit, item));
		}
		
		this._unitItemWindow.getItemScrollbar().setObjectArray(unitItemArray);
		this._unitItemWindow.getItemScrollbar().setAvailableArray(unitAvailableArray);
	}

	_resetStockItemArray() {
		var i, item;
		var count = StockItemControl.getStockItemCount();
		var stockItemArray = [];
		var stockAvailableArray = [];
		
		for (i = 0; i < count; i++) {
			item = StockItemControl.getStockItem(i);
			if (!this._itemMessenger.isItemAllowed(this._unit, item)) {
				continue;
			}
			
			stockItemArray.push(item);
			stockAvailableArray.push(this._itemMessenger.isUsable(this._unit, item));
		}
		
		this._stockItemWindow.getItemScrollbar().setObjectArray(stockItemArray);
		this._stockItemWindow.getItemScrollbar().setAvailableArray(stockAvailableArray);
	}

	_deleteFromStock() {
		var i, item;
		var count = StockItemControl.getStockItemCount();
		
		for (i = 0; i < count; i++) {
			item = StockItemControl.getStockItem(i);
			if (item.isWeapon()) {
				continue;
			}
			
			if (ItemControl.isItemBroken(item)) {
				StockItemControl.cutStockItem(i);
				return;
			}
		}
	}

	_isItemAvailable() {
		var itemIndex = this._getItemListWindow().getItemIndex();
		var arr = this._getItemListWindow().getItemScrollbar().getAvailableArray();
		
		return arr[itemIndex];
	}

	_getItemListWindow() {
		var index = this._itemUseOperationWindow.getOperationIndex();
		
		return index === 0 ? this._unitItemWindow : this._stockItemWindow;
	}

	_playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}

	_processMode(mode?) {
		if (mode === ItemUseScreenMode.OPERATION) {
			this._itemUseOperationWindow.enableSelectCursor(true);
			this._itemInfoWindow.setInfoItem(null);
			
			this._getItemListWindow().setActive(false);
			this._getItemListWindow().setForceSelect(-1);
		}
		else if (mode === ItemUseScreenMode.LIST) {
			this._getItemListWindow().enableSelectCursor(true);
			this._itemUseOperationWindow.enableSelectCursor(false);
			this._itemInfoWindow.setInfoItem(this._getItemListWindow().getCurrentItem());
		}
		else if (mode === ItemUseScreenMode.MESSENGER) {
			this._getItemListWindow().enableSelectCursor(false);
		}
		else if (mode === ItemUseScreenMode.HELP) {
			this._getItemListWindow().enableSelectCursor(false);
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

	_createUnitList() {
		return PlayerList.getAliveList();
	}
}

class ItemMessengerMode {

	static QUESTION: any = 0;

	static SELECTION: any = 1;

	static USE: any = 2;
}

class ItemMessenger extends BaseObject {

	_unit: any = null;

	_item: any = null;

	_questionWindow: any = null;

	_itemSelection: any = null;

	_itemUse: any = null;

	_isUsed: any = false;

	setMessenger(unit?, item?) {
		this._unit = unit;
		this._item = item;
		this._isUsed = false;
		
		if (this._isQuestionRequired()) {
			this._setQuestionData();
		}
		else {
			this._checkSelectionAndUse();
		}
	}

	moveMessenger() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemMessengerMode.QUESTION) {
			result = this._moveQuestion();
		}
		else if (mode === ItemMessengerMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === ItemMessengerMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	}

	drawMessenger() {
		var mode = this.getCycleMode();
		
		if (mode === ItemMessengerMode.QUESTION) {
			this._drawQuestion();
		}
		else if (mode === ItemMessengerMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === ItemMessengerMode.USE) {
			this._drawUse();
		}
	}

	isItemUsed() {
		return this._isUsed;
	}

	isItemAllowed(unit?, item?) {
		if (item.isWeapon()) {
			return false;
		}
		
		if (!this._isItemTypeAllowed(unit, item)) {
			return false;
		}
		
		if (!this._isWandAllowed(unit, item)) {
			return false;
		}
		return true;
	}

	isUsable(unit?, item?) {
		return ItemControl.isItemUsable(unit, item) && item.getTargetAggregation().isCondition(unit);
	}

	_isItemTypeAllowed(unit?, item?) {
		var result = false;
		var itemType = item.getItemType();
		var rangeType = item.getRangeType();
		
		if (itemType === ItemType.DOPING) {
			result = rangeType === SelectionRangeType.SELFONLY && DopingItemControl.isItemAllowed(unit, item);
		}
		else if (itemType === ItemType.CLASSCHANGE) {
			result = true;
		}
		else if (itemType === ItemType.SKILLGET) {
			result = rangeType === SelectionRangeType.SELFONLY;
		}
		else if (itemType === ItemType.RESURRECTION) {
			result = true;
		}
		else if (itemType === ItemType.DURABILITY) {
			result = rangeType === SelectionRangeType.SELFONLY;
		}
		
		return result;
	}

	_isWandAllowed(unit?, item?) {
		return true;
	}

	_isQuestionRequired() {
		var result = false;
		var itemType = this._item.getItemType();
		
		if (itemType === ItemType.DOPING || itemType === ItemType.SKILLGET) {
			result = true;
		}
		
		return result;
	}

	_moveQuestion() {
		var result = MoveResult.CONTINUE;
		
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				result = this._checkSelectionAndUse();
			}
			else {
				return MoveResult.END;
			}
		}
		
		return result;
	}

	_moveSelection() {
		var result = MoveResult.CONTINUE;
		
		if (this._itemSelection.moveItemSelectionCycle() !== MoveResult.CONTINUE) {
			if (this._itemSelection.isSelection()) {
				if (this._useItem() === EnterResult.NOTENTER) {
					this._isUsed = true;
					return MoveResult.END;
				}
				else {
					this.changeCycleMode(ItemMessengerMode.USE);
				}
			}
			else {
				return MoveResult.END;
			}
		}
		
		return result;
	}

	_moveUse() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			this._isUsed = true;
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawQuestion() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	}

	_drawSelection() {
		this._itemSelection.drawItemSelectionCycle();
	}

	_drawUse() {
		this._itemUse.drawUseCycle();
	}

	_setQuestionData() {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(StringTable.ItemUse_Question);
		this._questionWindow.setQuestionActive(true);
		this.changeCycleMode(ItemMessengerMode.QUESTION);
	}

	_checkSelectionAndUse() {
		var result = MoveResult.CONTINUE;
		
		this._itemSelection = ItemPackageControl.getItemSelectionObject(this._item);
		if (this._itemSelection !== null) {
			if (this._itemSelection.enterItemSelectionCycle(this._unit, this._item) === EnterResult.NOTENTER) {
				if (this._useItem() === EnterResult.NOTENTER) {
					this._isUsed = true;
					return MoveResult.END;
				}
				else {
					this.changeCycleMode(ItemMessengerMode.USE);
				}
			}
			else {
				this.changeCycleMode(ItemMessengerMode.SELECTION);
			}
		}
		return result;
	}

	_useItem() {
		var itemTargetInfo;
		
		this._itemUse = ItemPackageControl.getItemUseParent(this._item);
		itemTargetInfo = this._itemSelection.getResultItemTargetInfo();
		
		itemTargetInfo.unit = this._unit;
		itemTargetInfo.item = this._item;
		itemTargetInfo.isPlayerSideCall = true;
		
		return this._itemUse.enterUseCycle(itemTargetInfo);
	}
}

class ItemUserWindow extends BaseWindow {

	_unit: any = null;

	_statusScrollbar: any = null;

	_skillInteraction: any = null;

	initialize() {
		this._statusScrollbar = createScrollbarObject(ItemUseStatusScrollbar, this);
		this._skillInteraction = createObject(SkillInteractionLong);
	}

	setItemUserData(unit?) {
		var i;
		var weapon = ItemControl.getEquippedWeapon(unit);
		var arr = SkillControl.getSkillMixArray(unit, weapon, -1, '');
		var count = arr.length;
		var newSkillArray = [];
		
		for (i = 0; i < count; i++) {
			if (!arr[i].skill.isHidden()) {
				newSkillArray.push(arr[i]);
			}
		}
		
		this._skillInteraction.setSkillArray(newSkillArray);
		
		this._statusScrollbar.setStatusFromUnit(unit);
		
		this._unit = unit;
	}

	moveWindowContent() {
		this._statusScrollbar.moveScrollbarContent();
		
		this._skillInteraction.moveInteraction();
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		var pos;
		
		this._drawTop(x, y);
		
		pos = this._getStatusPos();
		this._statusScrollbar.drawScrollbar(x + pos.x, y + pos.y);
		
		pos = this._getSkillListPos();
		y = y + this.getWindowHeight() - pos.y;
		this._skillInteraction.getInteractionScrollbar().drawScrollbar(x + pos.x, y);
	}

	getWindowWidth() {
		return ItemRenderer.getItemWindowWidth() + 20;
	}

	getWindowHeight() {
		return DataConfig.isHighResolution() ? 400 : 320;
	}

	getSkillInteraction() {
		return this._skillInteraction;
	}

	_drawTop(x?, y?) {
		this._drawClass(x, y);
		this._drawClassName(x, y);
		this._drawUnitLevel(x, y);
		this._drawUnitHp(x, y);
	}

	_drawClass(xBase?, yBase?) {
		var x = xBase + 42;
		var y = yBase + 10;
		
		UnitRenderer.drawDefaultUnit(this._unit, x, y, null);
	}

	_drawClassName(xBase?, yBase?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var cls = this._unit.getClass();
		var range = this._getClassRange(xBase, yBase);
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, cls.getName(), -1, color, font);
	}

	_drawUnitLevel(xBase?, yBase?) {
		var x = xBase + 127 + this._getZoneStartX();
		var y = yBase + 5;
		
		ContentRenderer.drawLevelInfo(x, y, this._unit);
	}

	_drawUnitHp(xBase?, yBase?) {
		var x = xBase + 127 + this._getZoneStartX();
		var y = yBase + 45;
		var pic = root.queryUI('unit_gauge');
		
		ContentRenderer.drawUnitHpZone(x, y, this._unit, pic);
	}

	_getZoneStartX() {
		return 0;
	}

	_getClassRange(xBase?, yBase?) {
		return createRangeObject(xBase, yBase + 47, 120, 30);
	}

	_getStatusPos() {
		return createPos(0, 90);
	}

	_getSkillListPos() {
		return createPos(0, 60);
	}
}

class ItemUseOperationWindow extends BaseWindow {

	_scrollbar: any = null;

	setItemUseOperationData() {
		var arr = [StringTable.ItemUse_Unit, StringTable.ItemUse_Stock];
		
		this._scrollbar = createScrollbarObject(ItemUseOperationScrollbar, this);
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

class ItemUseOperationScrollbar extends BaseScrollbar {

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

	getScrollbarWidth() {
		return ItemRenderer.getItemWidth();
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
		return this.getParentInstance().getParentInstance().isTargetSelectable(index);
	}
}
