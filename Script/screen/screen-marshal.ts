
class MarshalScreenMode {

	static TOP: any = 0;

	static OPEN: any = 1;
}

class MarshalInfoWindowType {

	static ITEM: any = 0;

	static UNIT: any = 1;
}

class MarshalScreen extends BaseScreen {

	_unitList: any = null;

	_unitSelectWindow: any = null;

	_marshalCommandWindow: any = null;

	_itemListWindow: any = null;

	_unitSimpleWindow: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MarshalScreenMode.TOP) {
			result = this._moveTopMode();
		}
		else if (mode === MarshalScreenMode.OPEN) {
			result = this._moveOpenMode();
		}
		
		return result;
	}

	drawScreenCycle() {
		var object;
		var mode = this.getCycleMode();
		
		this._drawLeftWindow();
		
		if (mode === MarshalScreenMode.OPEN) {
			object = this._marshalCommandWindow.getObject();
			object.drawCommand();
			
			this._drawSubWindow();
		}
		
		this._drawRightWindow();
	}

	drawScreenBottomText(textui?) {
		var object = this._marshalCommandWindow.getObject();
		var text = object.getMarshalDescription();
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('UnitMarshal');
	}

	getUnitSelectWindow() {
		return this._unitSelectWindow;
	}

	notifyChildScreenClosed() {
		var object = this._marshalCommandWindow.getObject();
		
		object.notifyScreenClosed();
	}

	updateSubWindow() {
		var unit = this._unitSelectWindow.getCurrentUnit();
		
		this._itemListWindow.setUnitMaxItemFormation(unit);
		this._unitSimpleWindow.setFaceUnitData(unit);
	}

	updateUnitList() {
		this._unitList = this._createUnitList();
		this._unitSelectWindow.changeUnitList(this._unitList);
	}

	getUnitList() {
		return this._unitSelectWindow.getUnitList();
	}

	_prepareScreenMemberData(screenParam?) {
		this._unitList = this._createUnitList();
		this._unitSelectWindow = createWindowObject(UnitSelectWindow, this);
		this._marshalCommandWindow = createWindowObject(MarshalCommandWindow, this);
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._unitSimpleWindow = createWindowObject(UnitSimpleWindow, this);
	}

	_completeScreenMemberData(screenParam?) {
		this._marshalCommandWindow.setMarshalCommandData();
		this._marshalCommandWindow.enableSelectCursor(true);
		
		this._itemListWindow.setDefaultItemFormation();
		
		this._unitSelectWindow.setInitialList(this._unitList);
		this.changeCycleMode(MarshalScreenMode.TOP);
	}

	_moveTopMode() {
		var object;
		var input = this._marshalCommandWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			this._marshalCommandWindow.enableSelectCursor(false);
		
			object = this._marshalCommandWindow.getObject();
			object.openCommand();
			
			this.updateSubWindow();
			
			this.changeCycleMode(MarshalScreenMode.OPEN);
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		
		return result;
	}

	_moveOpenMode() {
		var object = this._marshalCommandWindow.getObject();
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			this._unitSelectWindow.setActive(false);
			this._marshalCommandWindow.enableSelectCursor(true);
			this.changeCycleMode(MarshalScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_drawLeftWindow() {
		var width = this._marshalCommandWindow.getWindowWidth() + this._unitSelectWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = this._getStartY();
		
		this._marshalCommandWindow.drawWindow(x, y);
	}

	_drawRightWindow() {
		var width = this._marshalCommandWindow.getWindowWidth() + this._unitSelectWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = this._getStartY();
		
		x += this._marshalCommandWindow.getWindowWidth();
		this._unitSelectWindow.drawWindow(x, y);
	}

	_drawSubWindow() {
		var x, y, width, subWindow;
		var object = this._marshalCommandWindow.getObject();
		
		if (object.isMarshalScreenOpened())	{
			return;
		}
		
		if (object.getInfoWindowType() === MarshalInfoWindowType.ITEM) {
			subWindow = this._itemListWindow;
		}
		else {
			subWindow = this._unitSimpleWindow;
		}
		
		width = this._marshalCommandWindow.getWindowWidth() + this._unitSelectWindow.getWindowWidth();
		y = this._getStartY() + this._unitSelectWindow.getWindowHeight() - subWindow.getWindowHeight();
		x = LayoutControl.getCenterX(-1, width);
		x += (this._marshalCommandWindow.getWindowWidth() - subWindow.getWindowWidth());
		
		subWindow.drawWindow(x, y);
	}

	_getStartY() {
		return LayoutControl.getCenterY(-1, this._unitSelectWindow.getWindowHeight());
	}

	_createUnitList() {
		return PlayerList.getAliveList();
	}
}

class MarshalBaseMode {

	static UNITSELECT: any = 0;

	static SCREEN: any = 1;
}

class MarshalBaseCommand extends BaseObject {

	// NOTE (JS->TS conversion): called polymorphically (this.isMarshalScreenCloesed()) but only
	// declared on 8 sibling subclasses in the original, never on this base - a template-method
	// pattern JS tolerates freely. Name matches the consistent (mis-spelled - "Cloesed") spelling
	// used throughout rather than silently correcting it.
	isMarshalScreenCloesed(): any { return undefined; }

	_unitSelectWindow: any = null;

	_parentMarshalScreen: any = null;

	openCommand() {
		this._unitSelectWindow.setActive(true);
		this._unitSelectWindow.setSingleMode();
	}

	moveCommand() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (mode === MarshalBaseMode.UNITSELECT) {
			result = this._moveUnitSelect();
		}
		else if (mode === MarshalBaseMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	}

	isMarshalScreenOpened() {
		return this.getCycleMode() === MarshalBaseMode.SCREEN;
	}

	drawCommand() {
	}

	checkCommand() {
		return true;
	}

	getCommandName() {
		return '';
	}

	getMarshalDescription() {
		return '';
	}

	setUnitSelectWindow(unitSelectWindow?) {
		this._unitSelectWindow = unitSelectWindow;
	}

	notifyScreenClosed() {
		this._parentMarshalScreen.updateSubWindow();
	}

	_moveUnitSelect() {
		var result = this._unitSelectWindow.moveWindow();
		
		if (this._unitSelectWindow.isIndexChanged()) {
			this._parentMarshalScreen.updateSubWindow();
		}
		
		if (result !== MoveResult.CONTINUE) {
			if (!this.checkCommand()) {
				this._closeCommand();
				return MoveResult.END;
			}
			
			this._unitSelectWindow.setActive(false);
			this.changeCycleMode(MarshalBaseMode.SCREEN);
			
			return MoveResult.CONTINUE;
		}
		
		return result;
	}

	_moveScreen() {
		if (this.isMarshalScreenCloesed()) {
			this.changeCycleMode(MarshalBaseMode.UNITSELECT);
			this._closeCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_closeCommand() {
	}
}

namespace MarshalCommand {
export class StockTrade extends MarshalBaseCommand {

	_stockItemTradeScreen: any = null;

	checkCommand() {
		var screenParam = this._createScreenParam();
			
		// The unit isn't set, it means that it was canceled, so end to process.
		if (screenParam.unit === null) {
			return false;
		}
		
		this._stockItemTradeScreen = createObject(DataConfig.isStockTradeWeaponTypeAllowed() ? CategoryStockItemTradeScreen : StockItemTradeScreen);
		SceneManager.addScreen(this._stockItemTradeScreen, screenParam);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return SceneManager.isScreenClosed(this._stockItemTradeScreen);
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.ITEM;
	}

	getCommandName() {
		return root.queryCommand('stockexchange_marshalcommand');
	}

	getMarshalDescription() {
		return StringTable.Marshal_StockTrade;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildStockItemTrade();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.unitList = this._parentMarshalScreen.getUnitList();
		
		return screenParam;
	}
}

export class ItemTrade extends MarshalBaseCommand {

	_unitItemTradeScreen: any = null;

	openCommand() {
		this._unitSelectWindow.setActive(true);
		this._unitSelectWindow.setDoubleMode();
	}

	checkCommand() {
		var screenParam = this._createScreenParam();
			
		if (screenParam.unit === null || screenParam.targetUnit === null) {
			return false;
		}
		
		if (screenParam.unit === screenParam.targetUnit) {
			this._unitSelectWindow.cancelDoubleMode();
			return true;
		}
		
		this._unitItemTradeScreen = createObject(UnitItemTradeScreen);
		SceneManager.addScreen(this._unitItemTradeScreen, screenParam);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return SceneManager.isScreenClosed(this._unitItemTradeScreen);
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.ITEM;
	}

	getCommandName() {
		return root.queryCommand('itemexchange_marshalcommand');
	}

	getMarshalDescription() {
		return StringTable.Marshal_ItemTrade;
	}

	notifyScreenClosed() {
		// Call cancelDoubleMode first.
		this._unitSelectWindow.cancelDoubleMode();
		this._parentMarshalScreen.updateSubWindow();
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitItemTrade();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.targetUnit = this._unitSelectWindow.getSecondUnit();
		
		return screenParam;
	}
}

export class UnitSort extends MarshalBaseCommand {

	openCommand() {
		this._unitSelectWindow.setActive(true);
		this._unitSelectWindow.setDoubleMode();
	}

	checkCommand() {
		var index, list;
		var unit = this._unitSelectWindow.getFirstUnit();
		var targetUnit = this._unitSelectWindow.getSecondUnit();
		
		if (unit === null || targetUnit === null) {
			return false;
		}
		
		list = PlayerList.getMainList();
		list.exchangeUnit(unit, targetUnit);
		
		index = this._unitSelectWindow.getUnitSelectIndex();
		
		// The unit changed to line, update a window.
		this._unitSelectWindow.resetSelectUnit();
		this._unitSelectWindow.updateUnitList(PlayerList.getAliveList());
		this._unitSelectWindow.setUnitSelectIndex(index);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return true;
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.UNIT;
	}

	getCommandName() {
		return root.queryCommand('unitsort_marshalcommand');
	}

	getMarshalDescription() {
		return StringTable.Marshal_UnitSort;
	}

	_moveUnitSelect() {
		var result = this._unitSelectWindow.moveWindow();
			
		if (this._unitSelectWindow.getRecentlyInputType() !== InputType.NONE) {
			this._parentMarshalScreen.updateSubWindow();
		}
		
		if (result !== MoveResult.CONTINUE) {
			this.checkCommand();
		}
		
		return result;
	}
}

export class UnitStatus extends MarshalBaseCommand {

	_unitMenuScreen: any = null;

	checkCommand() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._unitMenuScreen = createObject(UnitMenuScreen);
		SceneManager.addScreen(this._unitMenuScreen, screenParam);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return SceneManager.isScreenClosed(this._unitMenuScreen);
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.UNIT;
	}

	getCommandName() {
		return root.queryCommand('unitstatus_marshalcommand');
	}

	getMarshalDescription() {
		return StringTable.Marshal_UnitStatus;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitMenu();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.enummode = UnitMenuEnum.ALIVE;
		
		return screenParam;
	}
}

export class Shop extends MarshalBaseCommand {

	_shopData: any = null;

	_shopLayoutScreen: any = null;

	checkCommand() {
		var screenParam = this._createScreenParam();
			
		if (screenParam.unit === null) {
			return false;
		}
		
		this._shopLayoutScreen = createObject(ShopLayoutScreen);
		this._shopLayoutScreen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._shopLayoutScreen, screenParam);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return SceneManager.isScreenClosed(this._shopLayoutScreen);
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.ITEM;
	}

	getCommandName() {
		return this._shopData.getName();
	}

	getMarshalDescription() {
		return StringTable.Marshal_Shop;
	}

	setShopData(shopData?) {
		this._shopData = shopData;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._shopData;
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		
		return screenParam;
	}
}

export class Bonus extends MarshalBaseCommand {

	_shopData: any = null;

	_bonusLayoutScreen: any = null;

	checkCommand() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._bonusLayoutScreen = createObject(BonusLayoutScreen);
		this._bonusLayoutScreen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._bonusLayoutScreen, screenParam);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return SceneManager.isScreenClosed(this._bonusLayoutScreen);
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.ITEM;
	}

	getCommandName() {
		return this._shopData.getName();
	}

	getMarshalDescription() {
		return StringTable.Marshal_Bonus;
	}

	setShopData(shopData?) {
		this._shopData = shopData;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildBonusLayout();
		var shopData = this._shopData;
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		screenParam.bonusArray = shopData.getBonusNumberArray();
		
		return screenParam;
	}
}

export class ItemUse extends MarshalBaseCommand {

	_itemUseScreen: any = null;

	checkCommand() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._itemUseScreen = createObject(ItemUseScreen);
		SceneManager.addScreen(this._itemUseScreen, screenParam);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return SceneManager.isScreenClosed(this._itemUseScreen);
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.ITEM;
	}

	getCommandName() {
		return root.queryCommand('itemuse_marshalcommand');
	}

	getMarshalDescription() {
		return StringTable.Marshal_ItemUse;
	}

	notifyScreenClosed() {
		var unitSelectWindow = this._parentMarshalScreen.getUnitSelectWindow();
		var index = unitSelectWindow.getUnitSelectIndex();
		
		// If a resurrection item is used, the unit is restored to the list and must be rebuilt.
		this._parentMarshalScreen.updateUnitList();
		
		// Prevent the scroll position from being initialized when the list is rebuilt.
		unitSelectWindow.setUnitSelectIndex(index);
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildItemUse();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		
		return screenParam;
	}
}

export class ClassChange extends MarshalBaseCommand {

	_multiClassChangeScreen: any = null;

	openCommand() {
		super.openCommand();
		this._setSelectableArray();
	}

	checkCommand() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._multiClassChangeScreen = createObject(MultiClassChangeScreen);
		SceneManager.addScreen(this._multiClassChangeScreen, screenParam);
		
		return true;
	}

	isMarshalScreenCloesed() {
		return SceneManager.isScreenClosed(this._multiClassChangeScreen);
	}

	getInfoWindowType() {
		return MarshalInfoWindowType.UNIT;
	}

	getCommandName() {
		return root.queryCommand('classchange_marshalcommand');
	}

	getMarshalDescription() {
		return StringTable.Marshal_ClassChange;
	}

	_setSelectableArray() {
		var i, unit, classEntryArray;
		var list = this._parentMarshalScreen.getUnitList();
		var count = list.getCount();
		var arr = [];
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			classEntryArray = ClassChangeChecker.getClassEntryArray(unit, false);
			arr.push(classEntryArray.length > 0);
		}
		
		this._unitSelectWindow.getChildScrollbar().setSelectableArray(arr);
	}

	_closeCommand() {
		this._unitSelectWindow.getChildScrollbar().setSelectableArray(null);
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildMultiClassChange();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.isMapCall = false;
		
		return screenParam;
	}
}
}

class MarshalCommandWindow extends BaseWindow {

	_scrollbar: any = null;

	_objectArray: any = null;

	setMarshalCommandData() {
		this._prepareMarshalItem();
		this._createScrollbar();
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

	getObject() {
		return this._scrollbar.getObject();
	}

	getIndex() {
		return this._scrollbar.getIndex();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}

	_prepareMarshalItem() {
		var i, count;
		
		this._objectArray = [];
		this._configureMarshalItem(this._objectArray);
		
		count = this._objectArray.length;
		for (i = 0; i < count; i++) {
			this._objectArray[i]._parentMarshalScreen = this.getParentInstance();
			this._objectArray[i].setUnitSelectWindow(this.getParentInstance().getUnitSelectWindow());
		}
	}

	_createScrollbar() {
		this._scrollbar = createScrollbarObject(MarshalCommandScrollbar, this);
		this._scrollbar.setScrollFormation(1, this._objectArray.length);
		this._scrollbar.setObjectArray(this._objectArray);
	}

	_configureMarshalItem(groupArray?) {
		var isRest = root.getBaseScene() === SceneType.REST;
		
		if (isRest || root.getCurrentSession().isMapState(MapStateType.STOCKSHOW)) {
			groupArray.appendObject(MarshalCommand.StockTrade);
		}
		
		groupArray.appendObject(MarshalCommand.ItemTrade);
		groupArray.appendObject(MarshalCommand.UnitSort);
		groupArray.appendObject(MarshalCommand.UnitStatus);
		
		if (!isRest) {
			if (this._isShopVisible()) {
				this._appendShop(groupArray);
			}
			
			if (this._isBonusVisible()) {
				this._appendBonus(groupArray);
			}
		}
		
		if (DataConfig.isBattleSetupItemUseAllowed()) {
			groupArray.appendObject(MarshalCommand.ItemUse);
		}
		
		if (DataConfig.isBattleSetupClassChangeAllowed()) {
			groupArray.appendObject(MarshalCommand.ClassChange);
		}
	}

	_isShopVisible() {
		return this._isVisible(CommandLayoutType.UNITMARSHAL, CommandActionType.SHOP);
	}

	_isBonusVisible() {
		return this._isVisible(CommandLayoutType.UNITMARSHAL, CommandActionType.BONUS);
	}

	_isVisible(commandLayoutType?, commandActionType?) {
		var i, commandLayout;
		var list = root.getBaseData().getCommandLayoutList(commandLayoutType);
		var count = list.getCount();
		var result = false;
		
		for (i = 0; i < count; i++) {
			commandLayout = list.getData(i);
			if (commandLayout.getCommandActionType() === commandActionType) {
				if (commandLayout.getCommandVisibleType() !== CommandVisibleType.HIDE) {
					result = true;
				}
				break;
			}
		}
		
		return result;
	}

	_appendShop(groupArray?) {
		var i, shopData;
		var list = root.getCurrentSession().getCurrentMapInfo().getShopDataList();
		var count = list.getCount();
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(MarshalCommand.Shop);
				groupArray[groupArray.length - 1].setShopData(shopData);
			}
		}
	}

	_appendBonus(groupArray?) {
		var i, shopData;
		var list = root.getBaseData().getRestBonusList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(MarshalCommand.Bonus);
				groupArray[groupArray.length - 1].setShopData(shopData);
			}
		}
	}
}

class MarshalCommandScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var text = object.getCommandName();
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, text, length, color, font);
	}

	getObjectWidth() {
		return DefineControl.getTextPartsWidth();
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}
