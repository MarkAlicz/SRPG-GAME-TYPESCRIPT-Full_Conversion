
// Rule:
// 1. When the unit item is full, display the window to send items to the stock.
// 2. However, if the skip or images non display is enabled, display the window without condition.
// 3. If the target to increase the item is the enemy unit, even if it's full, nothing occurs.
// 4. The command to decrease the item can decrease the important item, too.
// 5. When the item in the stock is full, if the item is added, it means to discard the item, however, the important item cannot be discarded.

class ItemChangeMode {

	static NOTICE: any = 0;

	static UNITITEMFULL: any = 1;

	static STOCKITEMFULL: any = 2;
}

class ItemChangeEventCommand extends BaseEventCommand {

	// NOTE (JS->TS conversion): never assigned anywhere in the original codebase - only read (~line 72).
	_isChangeSuccess: any = undefined;

	_targetUnit: any = null;

	_targetItem: any = null;

	_increaseType: any = 0;

	_isStockChange: any = false;

	_isStockSend: any = false;

	_itemIndex: any = 0;

	_itemArray: any = null;

	_itemChangeView: any = null;

	_unitItemFull: any = null;

	_stockItemFull: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemChangeMode.NOTICE) {
			result = this._moveNotice();
		}
		else if (mode === ItemChangeMode.UNITITEMFULL) {
			result = this._moveUnitItemFull();
		}
		else if (mode === ItemChangeMode.STOCKITEMFULL) {
			result = this._moveStockItemFull();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ItemChangeMode.NOTICE) {
			this._drawNotice();
		}
		else if (mode === ItemChangeMode.UNITITEMFULL) {
			this._drawUnitItemFull();
		}
		else if (mode === ItemChangeMode.STOCKITEMFULL) {
			this._drawStockItemFull();
		}
	}

	isEventCommandSkipAllowed() {
		// To allow the skip by pressing Start is when the item can be obtained only.
		// If the item is full, the skip is not allowed.
		return this.getCycleMode() === ItemChangeMode.NOTICE && this._isChangeSuccess;
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._targetUnit = eventCommandData.getTargetUnit();
		this._targetItem = eventCommandData.getTargetItem();
		this._increaseType = eventCommandData.getIncreaseValue();
		this._isStockChange = eventCommandData.isStockChange();
		this._isStockSend = eventCommandData.isStockSend();
		this._itemIndex = 0;
		this._itemArray = null;
		this._itemChangeView = createWindowObject(ItemChangeNoticeView, this);
		this._unitItemFull = createObject(UnitItemFull);
		this._stockItemFull = createObject(StockItemFull);
	}

	_checkEventCommand() {
		if (this._targetItem === null) {
			return false;
		}
		
		if (!this._isStockChange) {
			if (this._targetUnit === null) {
				// Regardless of increase/decrease of the unit item, if the unit is enabled, return false.
				return false;
			}
			
			// If trade prohibited, change increase/decrease for the unit to increase/decrease for the stock.
			if (!Miscellaneous.isItemAccess(this._targetUnit)) {
				this._isStockChange = true;
			}
		}
		
		if (this._isStockChange) {
			this._itemArray = ItemChangeControl.changeStockItem(this._targetItem, this._increaseType);
		}
		else {
			// If not the player, cannot send it to the stock.
			if (this._targetUnit.getUnitType() !== UnitType.PLAYER) {
				this._isStockSend = false;
			}
			
			this._itemArray = ItemChangeControl.changeUnitItem(this._targetUnit, this._targetItem, this._increaseType, this._isStockSend);
		}
		
		if (this.isSystemSkipMode() && this._itemArray.length === 0) {
			// If adding item has ended without problem, return false so as not to enter the cycle.
			return false;
		}
		
		return true;
	}

	_completeEventCommandMemberData() {
		if (this._increaseType !== IncreaseType.ALLRELEASE) {
			this._itemChangeView.setItemChangeData(this._targetItem, this._increaseType);
			this.changeCycleMode(ItemChangeMode.NOTICE);
		}
		else {
			if (!this._checkItemArray()) {
				return EnterResult.NOTENTER;
			}
		}
		
		return EnterResult.OK;
	}

	_checkItemArray() {
		var item = this._itemArray[this._itemIndex];
		
		if (this._itemIndex === this._itemArray.length) {
			return false;
		}
		
		if (this._isStockChange) {
			this._stockItemFull.setItemFullData(this._targetUnit, item);
			this.changeCycleMode(ItemChangeMode.STOCKITEMFULL);
		}
		else {
			// Even if the item cannot be added, if a target is not the player, end it.
			if (this._targetUnit.getUnitType() !== UnitType.PLAYER) {
				return false;
			}
			else {
				if (this._isUnitItemSlotAvailable(item)) {
					this._unitItemFull.setItemFullData(this._targetUnit, item);
					this.changeCycleMode(ItemChangeMode.UNITITEMFULL);
				}
				else {
					this._stockItemFull.setItemFullData(this._targetUnit, item);
					this.changeCycleMode(ItemChangeMode.STOCKITEMFULL);
				}
			}
		}
		
		this._itemIndex++;
		
		return true;
	}

	_isUnitItemSlotAvailable(item?) {
		return StockItemControl.isStockItemSpace();
	}

	_moveNotice() {
		if (this._itemChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			if (this._itemArray.length === 0) {
				// Item increase/decrease has ended without problem, so allow to end it.
				return MoveResult.END;
			}
			else {
				if (!this._checkItemArray()) {
					return MoveResult.END;
				}
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveUnitItemFull() {
		if (this._unitItemFull.moveWindowManager() !== MoveResult.CONTINUE) {
			if (!this._checkItemArray()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveStockItemFull() {
		if (this._stockItemFull.moveWindowManager() !== MoveResult.CONTINUE) {
			if (!this._checkItemArray()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_drawNotice() {
		var x = LayoutControl.getCenterX(-1, this._itemChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._itemChangeView.getNoticeViewHeight());
		
		this._itemChangeView.drawNoticeView(x, y);
	}

	_drawUnitItemFull() {
		this._unitItemFull.drawWindowManager();
	}

	_drawStockItemFull() {
		this._stockItemFull.drawWindowManager();
	}
}

class ItemChangeNoticeView extends BaseNoticeView {

	_targetItem: any = null;

	_increaseType: any = null;

	_titlePartsCount: any = 0;

	setItemChangeData(item?, type?) {
		this._targetItem = item;
		this._increaseType = type;
		
		this._setTitlePartsCount();
		
		if (this._increaseType === IncreaseType.INCREASE) {
			this._playItemGetSound();
		}
	}

	drawNoticeViewContent(x?, y?) {
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._increaseType === IncreaseType.INCREASE ? StringTable.GetTitle_ItemChange : StringTable.LostTitle_ItemChange;
		var infoColor = this._increaseType === IncreaseType.INCREASE ? ColorValue.KEYWORD : ColorValue.INFO;
		var width = TextRenderer.getTextWidth(text, font) + 5;
		
		TextRenderer.drawKeywordText(x, y + this._getNoticeOffsetY(), text, -1, infoColor, font);
		ItemRenderer.drawItem(x + width, y, this._targetItem, color, font, false);
	}

	getTitlePartsCount() {
		return this._titlePartsCount;
	}

	_setTitlePartsCount() {
		var font = this.getTitleTextUI().getFont();
		var textWidth = TextRenderer.getTextWidth(this._targetItem.getName(), font) + this._getNoticeInterval() + (TitleRenderer.getTitlePartsWidth() * 2);
		
		this._titlePartsCount = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
	}

	_playItemGetSound() {
		MediaControl.soundDirect('itemget');
	}
}

class ItemChangeHelpWindow extends BaseWindow {

	_messageAnalyzer: any = null;

	setItemHelpData(text?) {
		var messageAnalyzerParam = this._createMessageAnalyzerParam();
		
		this._messageAnalyzer = createObject(MessageAnalyzer);
		this._messageAnalyzer.setMessageAnalyzerParam(messageAnalyzerParam);
		this._messageAnalyzer.setMessageAnalyzerText(text);
	}

	moveWindowContent() {
		this._messageAnalyzer.moveMessageAnalyzer();
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		// If there are notifications to say that items are full over several pages,
		// it looks strange. So these strings shouldn't be specified at func. Several pages are not liked,
		// so don't specify the argument about the cursor.
		this._messageAnalyzer.drawMessageAnalyzer(x, y, -1, -1, null);
	}

	getWindowWidth() {
		return 480;
	}

	getWindowHeight() {	
		return 80;
	}

	_createMessageAnalyzerParam() {
		var textui = this.getWindowTextUI();
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = textui.getColor();
		messageAnalyzerParam.font = textui.getFont();
		messageAnalyzerParam.messageSpeedType = SpeedType.DIRECT;
		
		return messageAnalyzerParam;
	}
}

class ItemChangeTargetItemWindow extends BaseWindow {

	_unit: any = null;

	_targetItem: any = null;

	setItemTargetData(unit?, item?) {
		this._unit = unit;
		this._targetItem = item;
	}

	moveWindowContent() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, StringTable.ItemChange_TargetItem, -1, color, font);
		
		if (Miscellaneous.isTradeDisabled(this._unit, this._targetItem)) {
			color = ColorValue.KEYWORD;
		}
		
		y += 30;
		ItemRenderer.drawItem(x, y, this._targetItem, color, font, false);
	}

	getWindowWidth() {
		return 480 - ItemRenderer.getItemWindowWidth();
	}

	getWindowHeight() {
		return 100;
	}
}

class BaseItemFull extends BaseWindowManager {

	_unit: any = null;

	_targetItem: any = null;

	_itemListWindow: any = null;

	_questionWindow: any = null;

	_helpWindow: any = null;

	_targetItemWindow: any = null;

	initialize() {
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemListWindow.setDefaultItemFormation();
		this._itemListWindow.enableWarningState(true);
		
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage('');
		
		this._helpWindow = createWindowObject(ItemChangeHelpWindow, this);
		
		this._targetItemWindow = createWindowObject(ItemChangeTargetItemWindow, this);
	}

	setItemFullData(unit?, item?) {
		this._unit = unit;
		this._targetItem = item;
		
		this._helpWindow.setItemHelpData(this.getItemFullString());
		this._targetItemWindow.setItemTargetData(unit, item);
	}

	moveWindowManager() {
		return MoveResult.CONTINUE;
	}

	drawWindowManager() {
	}

	getPositionWindowX() {
		var width = this.getTotalWindowWidth();
		
		return LayoutControl.getCenterX(-1, width);
	}

	getPositionWindowY() {
		var height = this.getTotalWindowHeight();
		
		return LayoutControl.getCenterY(-1, height);
	}

	getTotalWindowWidth() {
		return this._itemListWindow.getWindowWidth() + this._targetItemWindow.getWindowWidth();
	}

	getTotalWindowHeight() {
		return this._itemListWindow.getWindowHeight() + this._helpWindow.getWindowHeight();
	}

	getItemFullString() {
		return '';
	}

	drawOtherWindow() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var width = this._itemListWindow.getWindowWidth();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);
		this._targetItemWindow.drawWindow(x + width, y);
		
		this._helpWindow.drawWindow(x, y + height);
	}

	drawItemQuestionWindow() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	}

	playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}
}

class UnitItemFullMode {

	static TOP: any = 0;

	static TRADEQUESTION: any = 1;

	static STOCKQUESTION: any = 2;
}

class UnitItemFull extends BaseItemFull {

	setItemFullData(unit?, item?) {
		super.setItemFullData(unit, item);
		
		this._itemListWindow.setUnitItemFormation(this._unit);
		this._itemListWindow.setActive(true);
		
		this.changeCycleMode(UnitItemFullMode.TOP);
	}

	moveWindowManager() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === UnitItemFullMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === UnitItemFullMode.TRADEQUESTION) {
			result = this._moveTradeQuestion();
		}
		else if (mode === UnitItemFullMode.STOCKQUESTION) {
			result = this._moveStockQuestion();
		}
		
		this._helpWindow.moveWindow();
	
		return result;
	}

	drawWindowManager() {
		var mode = this.getCycleMode();
		
		this.drawOtherWindow();
		
		if (mode !== UnitItemFullMode.TOP) {
			this.drawItemQuestionWindow();
		}
	}

	getItemFullString() {
		return StringTable.ItemChange_UnitItemFull;
	}

	_moveTop() {
		var index, item;
		var input = this._itemListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemListWindow.getItemIndex();
			item = UnitItemControl.getItem(this._unit, index);
			
			if (this._isSelectAllowed(item)) {
				// Set the window mode to ask if trading for the item.
				this._itemListWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionMessage(StringTable.ItemChange_TradeTitle);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(UnitItemFullMode.TRADEQUESTION);
			}
			else {
				this.playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._isCancelAllowed(this._targetItem)) {
				// Set the window mode to ask if sending an obtained item to the stock.
				this._itemListWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionMessage(StringTable.ItemChange_StockSendTitle);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(UnitItemFullMode.STOCKQUESTION);
			}
			else {
				this.playOperationBlockSound();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTradeQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				// Possessed item is stored in the stock, and set the obtained item at the empty place.
				this._tradeItem();
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(UnitItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveStockQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				// Send the obtained item to the stock.
				StockItemControl.pushStockItem(this._targetItem);
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(UnitItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_tradeItem() {
		var index = this._itemListWindow.getItemIndex();
		var item = UnitItemControl.getItem(this._unit, index);
		
		UnitItemControl.setItem(this._unit, index, this._targetItem);
		StockItemControl.pushStockItem(item);
	}

	_isSelectAllowed(item?) {
		return !Miscellaneous.isTradeDisabled(this._unit, item)
	}

	_isCancelAllowed(item?) {
		return !Miscellaneous.isTradeDisabled(this._unit, item)
	}
}

class StockItemFullMode {

	static TOP: any = 0;

	static TRADEQUESTION: any = 1;

	static THROWQUESTION: any = 2;
}

class StockItemFull extends BaseItemFull {

	setItemFullData(unit?, item?) {
		super.setItemFullData(unit, item);
		
		this._itemListWindow.setStockItemFormation();
		this._itemListWindow.setActive(true);
		
		this.changeCycleMode(StockItemFullMode.TOP);
	}

	moveWindowManager() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === StockItemFullMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === StockItemFullMode.TRADEQUESTION) {
			result = this._moveTradeQuestion();
		}
		else if (mode === StockItemFullMode.THROWQUESTION) {
			result = this._moveThrowQuestion();
		}
		
		this._helpWindow.moveWindow();
		
		return result;
	}

	drawWindowManager() {
		var mode = this.getCycleMode();
		
		this.drawOtherWindow();
		
		if (mode !== StockItemFullMode.TOP) {
			this.drawItemQuestionWindow();
		}
	}

	getItemFullString() {
		return StringTable.ItemChange_StockItemFull;
	}

	_moveTop() {
		var index, item;
		var input = this._itemListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemListWindow.getItemIndex();
			item = StockItemControl.getStockItem(index);
			
			// If the item is not important, set a mode to check if it's traded or not.
			if (this._isSelectAllowed(item)) {
				this._itemListWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionMessage(StringTable.ItemChange_TradeTitle);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(StockItemFullMode.TRADEQUESTION);
			}
			else {
				this.playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			// If the selected item is not important, set a mode to check if it's discarded or not.
			if (this._isCancelAllowed(this._targetItem)) {
				this._itemListWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionMessage(StringTable.ItemChange_StockThrowTitle);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(StockItemFullMode.THROWQUESTION);
			}
			else {
				this.playOperationBlockSound();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTradeQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				// Send the target item to the stock.
				this._tradeItem();
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(StockItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveThrowQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._throwItem(this._targetItem);
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(StockItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_tradeItem() {
		var index = this._itemListWindow.getItemIndex();
		var item = StockItemControl.getStockItem(index);
		
		StockItemControl.setStockItem(index, this._targetItem);
		this._throwItem(item);
	}

	_throwItem(item?) {
	}

	_isSelectAllowed(item?) {
		return !item.isImportance() && !Miscellaneous.isTradeDisabled(this._unit, item)
	}

	_isCancelAllowed(item?) {
		return !item.isImportance();
	}
}