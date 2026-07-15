
class UnitItemTradeResult {

	static TRADEEND: any = 0;

	static TRADENO: any = 1;
}

class UnitItemTradeScreen extends BaseScreen {

	_unitSrc: any = null;

	_unitDest: any = null;

	_isSrcScrollbarActive: any = false;

	_isSelect: any = false;

	_selectIndex: any = 0;

	_isSrcSelect: any = false;

	_maxItemCount: any = 0;

	_resultCode: any = 0;

	_itemListSrc: any = null;

	_itemListDest: any = null;

	_unitWindowSrc: any = null;

	_unitWindowDest: any = null;

	_itemInfoWindow: any = null;

	_srcPrevItemArray: any = null;

	_destPrevItemArray: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var input;
		var result = MoveResult.CONTINUE;
		
		if (this._isSrcScrollbarActive) {
			input = this._itemListSrc.moveWindow();
		}
		else {
			input = this._itemListDest.moveWindow();
		}
		
		if (input === ScrollbarInput.SELECT) {
			result = this._moveTradeSelect();
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = this._moveTradeCancel();
		}
		else if (input === ScrollbarInput.NONE) {
			result = this._moveTradeNone();
		}
		
		return result;
	}

	drawScreenCycle() {
		var xSpace = this._getItemIntervalX();
		var yLine = this._unitWindowSrc.getWindowHeight();
		var width = (this._itemListSrc.getWindowWidth() * 2) + xSpace;
		var x = LayoutControl.getCenterX(-1, width);
		var y = this._getStartY();
		
		this._unitWindowSrc.drawWindow(x, y);
		this._itemListSrc.drawWindow(x, y + yLine);
		
		x += this._itemListSrc.getWindowWidth() + xSpace;
		this._unitWindowDest.drawWindow(x, y);
		this._itemListDest.drawWindow(x, y + yLine);
	}

	getScreenInteropData() {
		return root.queryScreen('UnitItemTrade');
	}

	getScreenResult() {
		return this._resultCode;
	}

	_prepareScreenMemberData(screenParam?) {
		this._unitSrc = screenParam.unit;
		this._unitDest = screenParam.targetUnit;
		this._isSrcScrollbarActive = true;
		this._isSelect = false;
		this._selectIndex = 0;
		this._isSrcSelect = true;
		this._maxItemCount = DataConfig.getMaxUnitItemCount();
		this._resultCode = UnitItemTradeResult.TRADENO;
		this._itemListSrc = createWindowObject(ItemListWindow, this);
		this._itemListDest = createWindowObject(ItemListWindow, this);
		this._unitWindowSrc = createWindowObject(UnitSimpleWindow, this);
		this._unitWindowDest = createWindowObject(UnitSimpleWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
		this._srcPrevItemArray = new Array(this._maxItemCount);
		this._destPrevItemArray = new Array(this._maxItemCount);
	}

	_completeScreenMemberData(screenParam?) {
		var count = LayoutControl.getObjectVisibleCount(ItemRenderer.getItemHeight(), 15) - 3;
		
		if (count > DataConfig.getMaxUnitItemCount()) {
			count = DataConfig.getMaxUnitItemCount();
		}
		
		this._itemListSrc.setItemFormation(count);
		this._itemListSrc.setItemIndex(0);
		this._itemListSrc.enableWarningState(true);
		
		this._itemListDest.setItemFormation(count);
		this._itemListDest.setItemIndex(0);
		this._itemListDest.enableWarningState(true);
		
		this._arrangeItemArray(true, this._unitSrc, this._srcPrevItemArray);
		this._arrangeItemArray(true, this._unitDest, this._destPrevItemArray);
		
		this._itemListSrc.setActive(true);
		
		this._updateListWindow();
	}

	_moveTradeSelect() {
		// Check if the selection key was pressed in a state of selecting the item.
		if (this._isSelect) {
			if (!this._isTradable()) {
				this._playWarningSound();
				return MoveResult.CONTINUE;
			}
			
			// Swap the item.
			this._exchangeItem();
			
			// Update the window due to swap.
			this._updateListWindow();

			// Deactivate the selection state.
			this._selectCancel();
			
			// Update by changing the item.
			ItemControl.updatePossessionItem(this._unitSrc);
			ItemControl.updatePossessionItem(this._unitDest);
			
		}
		else {
			// Save the position to select.
			this._selectIndex = this._getTargetIndex();
			
			// Save if the selection was done at trade source or trade destination.
			this._isSrcSelect = this._isSrcScrollbarActive;
			
			// Set as a selection state.
			this._isSelect = true;
			
			// By calling setForceSelect, always display the cursor at the selected position.
			if (this._isSrcSelect) {
				this._itemListSrc.setForceSelect(this._selectIndex);
			}
			else {
				this._itemListDest.setForceSelect(this._selectIndex);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTradeCancel() {
		var isNoTrade;
		var result = MoveResult.CONTINUE;
		
		if (this._isSelect) {
			// Cancellation in a selection state is to deactivate the selection state.
			this._selectCancel();
		}
		else {	
			isNoTrade = this._arrangeItemArray(false, this._unitSrc, this._srcPrevItemArray) && this._arrangeItemArray(false, this._unitDest, this._destPrevItemArray);
			if (isNoTrade) {
				this._resultCode = UnitItemTradeResult.TRADENO;
				result = MoveResult.END;
			}
			else {
				this._resultCode = UnitItemTradeResult.TRADEEND;
				result = MoveResult.END;
			}
		}
		
		return result;
	}

	_moveTradeNone() {
		var item, isChanged;
		var isHorz = InputControl.isInputAction(InputType.LEFT) || InputControl.isInputAction(InputType.RIGHT);
		
		// Check if the cursor moved left/right.
		if (isHorz) {
			this._playCursorSound();
			if (this._isSrcScrollbarActive) {
				this._setActive(false);
				this._isSrcScrollbarActive = false;
			}
			else {
				this._isSrcScrollbarActive = true;
				this._setActive(true);
			}
		}
		else {
			this._checkTracingTrade();
		}
		
		if (this._isSrcScrollbarActive) {
			item = this._getSelectedItem(this._itemListSrc);
			isChanged = this._itemListSrc.isIndexChanged();
		}
		else {
			item = this._getSelectedItem(this._itemListDest);
			isChanged = this._itemListDest.isIndexChanged();
		}
		
		if (isChanged) {
			this._itemInfoWindow.setInfoItem(item);
		}
		
		return MoveResult.CONTINUE;
	}

	_getSelectedItem(itemList?) {
		var scrollbar = itemList.getItemScrollbar();
		var index = scrollbar.getForceSelectIndex();
		
		if (index === -1) {
			return scrollbar.getObject();
		}
		
		return scrollbar.getObjectFromIndex(index);
	}

	_isTradable() {
		// If the trade source and the trade destination are identical, allow it for sorting.
		if (this._isSrcSelect === this._isSrcScrollbarActive) {
			return true;
		}
		
		if (this._isTradeDisabled(this._unitSrc, this._getSelectedItem(this._itemListSrc))) {
			return false;
		}
		
		if (this._isTradeDisabled(this._unitDest, this._getSelectedItem(this._itemListDest))) {
			return false;
		}
		
		return true;
	}

	_isTradeDisabled(unit?, item?) {
		if (item === null) {
			return false;
		}
		
		return Miscellaneous.isTradeDisabled(unit, item);
	}

	_setActive(isSrc?) {
		if (isSrc) {
			this._itemListSrc.getItemScrollbar().setActiveSingle(true);
			this._itemListDest.getItemScrollbar().setActiveSingle(false);
		}
		else {
			this._itemListDest.getItemScrollbar().setActiveSingle(true);
			this._itemListSrc.getItemScrollbar().setActiveSingle(false);
		}
	}

	_exchangeItem() {
		var unitSrc = this._getTargetUnit(this._isSrcSelect);
		var unitDest = this._getTargetUnit(this._isSrcScrollbarActive);
		var srcIndex = this._selectIndex;
		var destIndex = this._getTargetIndex();
		var itemSrc = unitSrc.getItem(srcIndex);
		var itemDest = unitDest.getItem(destIndex);
		
		UnitItemControl.setItem(unitSrc, srcIndex, itemDest);
		UnitItemControl.setItem(unitDest, destIndex, itemSrc);
		UnitItemControl.arrangeItem(unitSrc);
		UnitItemControl.arrangeItem(unitDest);
	}

	_selectCancel() {
		this._isSelect = false;
		this._itemListSrc.setForceSelect(-1);
		this._itemListDest.setForceSelect(-1);
	}

	_arrangeItemArray(isSave?, unit?, arr?) {
		var i, result;
		
		if (isSave) {
			// Save the current item array.
			for (i = 0; i < this._maxItemCount; i++) {
				arr[i] = unit.getItem(i);
			}
			result = true;
		}
		else {
			// Compare between the saved item in the array and the current item.
			for (i = 0; i < this._maxItemCount; i++) {
				if (arr[i] !== unit.getItem(i)) {
					break;
				}
			}
			
			if (i === this._maxItemCount) {
				result = true;
			}
			else {
				result = false;
			}
		}
		
		return result;
	}

	_getTargetUnit(isSrc?) {
		var unit;
		
		if (isSrc) {
			unit = this._unitSrc;
		}
		else {
			unit = this._unitDest;
		}
		
		return unit;
	}

	_getTargetIndex() {
		var index;
		
		if (this._isSrcScrollbarActive) {
			index = this._itemListSrc.getItemIndex();
		}
		else {
			index = this._itemListDest.getItemIndex();
		}
		
		return index;
	}

	_updateListWindow() {
		this._itemListSrc.setUnitMaxItemFormation(this._unitSrc);
		this._itemListDest.setUnitMaxItemFormation(this._unitDest);
		
		this._unitWindowSrc.setFaceUnitData(this._unitSrc);
		this._unitWindowDest.setFaceUnitData(this._unitDest);
	}

	_getItemIntervalX() {
		return 30;
	}

	_getStartY() {
		var height = this._unitWindowSrc.getWindowHeight() + this._itemListSrc.getWindowHeight();
		
		return LayoutControl.getCenterY(-1, height);
	}

	_playCursorSound() {
		MediaControl.soundDirect('commandcursor');
	}

	_playWarningSound() {
		MediaControl.soundDirect('operationblock');
	}

	_checkTracingTrade() {
		var scrollbar, index;
		
		if (this._isSrcScrollbarActive) {
			scrollbar = this._itemListDest.getItemScrollbar();
		}
		else {
			scrollbar = this._itemListSrc.getItemScrollbar();
		}
		
		index = MouseControl.pointMouse(scrollbar);
		if (index !== -1) {
			if (this._isSrcScrollbarActive) {
				this._setActive(false);
				this._isSrcScrollbarActive = false;
			}
			else {
				this._isSrcScrollbarActive = true;
				this._setActive(true);
			}
			
			scrollbar.setIndex(index);
		}
	}
}


//------------------------------------------------------------------


class UnitItemStealScreen extends UnitItemTradeScreen {

	_stealFlag: any = 0;

	_dropTrophyArray: any = null;

	_screenParam: any = null;

	moveScreenCycle() {
		var result = super.moveScreenCycle();
		
		if (result === MoveResult.END) {
			// If the identical id item with the stolen item is included in the drop trophy, delete the trophy.
			// This is to prevent that item being obtained by stealing and that the item is also obtained by beating. 
			this._checkDropTrophy(this._unitDest);
		}
		
		return result;
	}

	getScreenInteropData() {
		return root.queryScreen('UnitItemSteal');
	}

	_prepareScreenMemberData(screenParam?) {
		super._prepareScreenMemberData(screenParam);
		this._stealFlag = screenParam.stealFlag;
		this._screenParam = screenParam;
	}

	_completeScreenMemberData(screenParam?) {
		super._completeScreenMemberData(screenParam);
		this._dropTrophyArray = this._createDropArray(screenParam.targetUnit);
	}

	_createDropArray(unit?) {
		var i, j, trophy, dropItem, count2;
		var list = unit.getDropTrophyList();
		var count = list.getCount();
		var arr = [];
		
		for (i = 0; i < count; i++) {
			trophy = list.getData(i);
			if (!(trophy.getFlag() & TrophyFlag.ITEM)) {
				continue;
			}
			
			dropItem = trophy.getItem();
			count2 = UnitItemControl.getPossessionItemCount(unit);
			for (j = 0; j < count2; j++) {
				if (ItemControl.compareItem(dropItem, UnitItemControl.getItem(unit, j))) {
					// The identical item with a trophy is possessed, so save the trophy.
					arr.push(trophy);
					break;
				}
			}
		}
		
		return arr;
	}

	_checkDropTrophy(unit?) {
		var i, j, trophy, count2;
		var count = this._dropTrophyArray.length;
		
		for (i = 0; i < count; i++) {
			trophy = this._dropTrophyArray[i];
			count2 = UnitItemControl.getPossessionItemCount(unit);
			for (j = 0; j < count2; j++) {
				if (ItemControl.compareItem(trophy.getItem(), UnitItemControl.getItem(unit, j))) {
					break;
				}
			}
			
			// No identical item with a trophy is possessed, so delete the trophy.
			if (j === count2) {
				root.getCurrentSession().getTrophyEditor().deleteTrophy(unit.getDropTrophyList(), trophy);
			}
		}
	}

	_moveTradeSelect() {
		var isNoTrade;
		var result = super._moveTradeSelect();
		
		// If the several pieces cannot be stolen, trade ends at the time of changing.
		if (!(this._stealFlag & StealFlag.MULTI)) {
			isNoTrade = this._arrangeItemArray(false, this._unitDest, this._destPrevItemArray);
			if (!isNoTrade) {
				this._resultCode = UnitItemTradeResult.TRADEEND;
				result = MoveResult.END;
			}
		}
		
		return result;
	}

	_isTradable() {
		// "Steal" cannot sort items.
		// If it's the enemy, prevent to change an order of weapons by sorting out.
		// If it's the player, prevent to obtain the exp by sorting items.
		if (this._isSrcSelect === this._isSrcScrollbarActive) {
			return false;
		}
		
		if (this._isTradeDisabled(this._unitSrc, this._getSelectedItem(this._itemListSrc))) {
			return false;
		}
		
		if (this._isTradeDisabled(this._unitDest, this._getSelectedItem(this._itemListDest))) {
			return false;
		}
		
		return true;
	}

	_isTradeDisabled(unit?, item?) {
		if (item === null) {
			return false;
		}
		
		if (item === this._screenParam.lockedItem) {
			// "Steal" items cannot be traded.
			return true;
		}
		
		if (unit.getUnitType() === UnitType.PLAYER && item.isImportance()) {
			// The important item which the player possesses cannot be traded.
			return true;
		}
		
		return Miscellaneous.isStealTradeDisabled(this._unitSrc, item, this._stealFlag);
	}
}
