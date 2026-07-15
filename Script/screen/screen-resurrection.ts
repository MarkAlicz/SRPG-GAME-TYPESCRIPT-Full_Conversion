
class ResurrectionScreenMode {

	static TOP: any = 0;

	static HELP: any = 1;

	static CHECK: any = 2;

	static EMPTY: any = 3;
}

class ResurrectionScreen extends BaseScreen {
	_infoWindow: any;


	_unitList: any = null;

	_selectUnit: any = null;

	_leftWindow: any = null;

	_unitMenuTopWindow: any = null;

	_unitMenuBottomWindow: any = null;

	_questionWindow: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode !== ResurrectionScreenMode.EMPTY) {
			this._moveAnimation();
		}
		
		if (mode === ResurrectionScreenMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ResurrectionScreenMode.HELP) {
			result = this._moveHelp();
		}
		else if (mode === ResurrectionScreenMode.CHECK) {
			result = this._moveCheck();
		}
		else if (mode === ResurrectionScreenMode.EMPTY) {
			result = this._moveEmpty();
		}
		
		return result;
	}

	drawScreenCycle() {
		if (this.getCycleMode() !== ResurrectionScreenMode.EMPTY) {
			this._drawMainWindow();
		}
		else {
			this._drawSubWindow();
		}
	}

	drawScreenBottomText(textui?) {
		var index, unit;
		var text = '';
		var mode = this.getCycleMode();
		var isDefault = false;
		
		if (mode === ResurrectionScreenMode.EMPTY) {
			return;
		}
		else if (mode === ResurrectionScreenMode.CHECK || MouseControl.isMouseMoving()) {
			isDefault = true;
		}
		else if (this._unitMenuTopWindow.isTracingHelp()) {
			text = this._unitMenuTopWindow.getHelpText();
		}
		else if (this._unitMenuBottomWindow.isHelpMode() || this._unitMenuBottomWindow.isTracingHelp()) {
			text = this._unitMenuBottomWindow.getHelpText();
		}
		else {
			isDefault = true;
		}
		
		if (isDefault) {
			index = this._leftWindow.getUnitListIndex();
			unit = this._unitList.getData(index);
			text = unit.getDescription();
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('Resurrection');
	}

	getResurrectionUnit() {
		return this._selectUnit;
	}

	_prepareScreenMemberData(screenParam?) {
		this._unitList = this._combineDeathList(screenParam);
		this._selectUnit = null;
		this._leftWindow = createWindowObject(ResurrectionListWindow, this);
		this._unitMenuTopWindow = createWindowObject(UnitMenuTopWindow, this);
		this._unitMenuBottomWindow = createWindowObject(UnitMenuBottomWindow, this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._infoWindow = createWindowObject(InfoWindow, this);
	}

	_completeScreenMemberData(screenParam?) {
		if (this._unitList.getCount() > 0) {
			this._leftWindow.setResurrectionList(this._unitList);
			this._questionWindow.setQuestionMessage(StringTable.ResurrectionLayout_Question);
			this._unitMenuTopWindow.setUnitMenuData();
			this._unitMenuBottomWindow.setUnitMenuData();
			
			this._setMenuUnit(0);
			
			this.changeCycleMode(ResurrectionScreenMode.TOP);
		}
		else {
			this._infoWindow.setInfoMessage(StringTable.ResurrectionLayout_Empty);
			this.changeCycleMode(ResurrectionScreenMode.EMPTY);
		}
	}

	_setMenuUnit(index?) {
		var unit = this._unitList.getData(index);
		
		this._unitMenuTopWindow.changeUnitMenuTarget(unit);
		this._unitMenuBottomWindow.changeUnitMenuTarget(unit);
	}

	_moveTop() {
		var recentlyInput;
		var result = MoveResult.CONTINUE;
		var input = this._leftWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._leftWindow.enableSelectCursor(false);
			this._questionWindow.setQuestionActive(true);
			
			// When selecting a possibility of revive, the item information window etc. is not be displayed.
			this._unitMenuBottomWindow.lockTracing(true);
			this.changeCycleMode(ResurrectionScreenMode.CHECK);
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._selectUnit = null;
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.NONE) {
			recentlyInput = this._leftWindow.getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				this._setHelpMode();
			}
			else {
				if (this._leftWindow.isIndexChanged()) {
					this._setMenuUnit(this._leftWindow.getUnitListIndex());
				}
			}
		}
		
		return result;
	}

	_moveHelp() {
		if (!this._unitMenuBottomWindow.isHelpMode()) {
			this._leftWindow.enableSelectCursor(true);
			this.changeCycleMode(UnitSortieMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCheck() {
		var index;
		
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				index = this._leftWindow.getUnitListIndex();
				this._selectUnit = this._unitList.getData(index);
				return MoveResult.END;
			}
			else {
				this._leftWindow.enableSelectCursor(true);
				this._unitMenuBottomWindow.lockTracing(false);
				this.changeCycleMode(ResurrectionScreenMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEmpty() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			this._playCancelSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAnimation() {
		this._unitMenuTopWindow.moveWindow();
		this._unitMenuBottomWindow.moveWindow();
		
		return MoveResult.CONTINUE;
	}

	_drawMainWindow() {
		var mode = this.getCycleMode();		
		var width = this._leftWindow.getWindowWidth() + this._unitMenuTopWindow.getWindowWidth();
		var height = this._leftWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		width = this._leftWindow.getWindowWidth();
		height = this._unitMenuTopWindow.getWindowHeight();
		
		this._leftWindow.drawWindow(x, y);
		this._unitMenuTopWindow.drawWindow(x + width, y);
		this._unitMenuBottomWindow.drawWindow(x + width, y + height);
		
		if (mode === ResurrectionScreenMode.CHECK) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
	}

	_drawSubWindow() {
		var x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
		
		this._infoWindow.drawWindow(x, y);
	}

	_setHelpMode() {
		if (this._unitMenuBottomWindow.setHelpMode()) {
			this._leftWindow.enableSelectCursor(false);
			this.changeCycleMode(UnitSortieMode.HELP);
		}
	}

	_combineDeathList(screenParam?) {
		var arr = ResurrectionControl.getTargetArray(screenParam.unit, screenParam.item);
		var list = StructureBuilder.buildDataList();
		
		list.setDataArray(arr);
		
		return list;
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}
}

class ResurrectionListWindow extends BaseWindow {

	_scrollbar: any = null;

	_unitList: any = null;

	setResurrectionList(unitList?) {
		this._unitList = unitList;
		
		this._scrollbar = createScrollbarObject(ResurrectionListScrollbar, this);
		this._scrollbar.setScrollFormation(1, 10);
		this._scrollbar.setDataList(unitList);
		this._scrollbar.setActive(true);
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
		return DefineControl.getFaceWindowHeight() + DefineControl.getUnitMenuBottomWindowHeight();
	}

	getUnitListIndex() {
		return this._scrollbar.getIndex();
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	getRecentlyInputType() {
		return this._scrollbar.getRecentlyInputType();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}

class ResurrectionListScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		
		TextRenderer.drawKeywordText(x, y, object.getName(), length, color, font);
	}

	playSelectSound() {
		MediaControl.soundDirect('commandselect');
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
