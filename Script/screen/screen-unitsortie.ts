
class UnitSortieMode {

	static TOP: any = 0;

	static HELP: any = 1;
}

class UnitSortieResult {

	static NONE: any = 0;

	static START: any = 1;
}

class UnitSortieScreen extends BaseScreen {

	_unitList: any = null;

	_leftWindow: any = null;

	_unitMenuTopWindow: any = null;

	_unitMenuBottomWindow: any = null;

	_resultCode: any = 0;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (this._isStartTitlePressed()) {
			return this._moveStart();
		}
		
		this._moveAnimation();
		
		if (mode === UnitSortieMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === UnitSortieMode.HELP) {
			result = this._moveHelp();
		}
		
		return result;
	}

	drawScreenCycle() {
		var width = this._leftWindow.getWindowWidth() + this._unitMenuTopWindow.getWindowWidth();
		var height = this._leftWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		width = this._leftWindow.getWindowWidth();
		height = this._unitMenuTopWindow.getWindowHeight();
		
		this._leftWindow.drawWindow(x, y);
		this._unitMenuTopWindow.drawWindow(x + width, y);
		this._unitMenuBottomWindow.drawWindow(x + width, y + height);
		
		this._drawStartTitle(x, y);
	}

	drawScreenBottomText(textui?) {
		if (this._unitMenuTopWindow.isTracingHelp()) {
			TextRenderer.drawScreenBottomText(this._unitMenuTopWindow.getHelpText(), textui);
		}
		else if (this._unitMenuBottomWindow.isHelpMode() || this._unitMenuBottomWindow.isTracingHelp()) {
			TextRenderer.drawScreenBottomText(this._unitMenuBottomWindow.getHelpText(), textui);
		}
		else {
			this._drawSortieText(textui);
		}
	}

	getScreenInteropData() {
		return root.queryScreen('UnitSortie');
	}

	getResultCode() {
		return this._resultCode;
	}

	_prepareScreenMemberData(screenParam?) {
		this._unitList = this._createUnitList();
		this._leftWindow = createWindowObject(UnitSortieListWindow, this);
		this._unitMenuTopWindow = createWindowObject(UnitMenuTopWindow, this);
		this._unitMenuBottomWindow = createWindowObject(UnitMenuBottomWindow, this);
	}

	_completeScreenMemberData(screenParam?) {
		this._leftWindow.setSortieList(this._unitList);
		this._unitMenuTopWindow.setUnitMenuData();
		this._unitMenuBottomWindow.setUnitMenuData();
		this._setMenuUnit(0);
	}

	_setMenuUnit(index?) {
		var unit = this._unitList.getData(index);
		
		this._unitMenuTopWindow.changeUnitMenuTarget(unit);
		this._unitMenuBottomWindow.changeUnitMenuTarget(unit);
	}

	_moveTop() {
		var recentlyInput;
		var input = this._leftWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			result = this._moveSelect();
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = this._moveCancel();
		}
		else if (input === ScrollbarInput.START) {
			result = this._moveStart();
		}
		else if (input === ScrollbarInput.NONE) {
			recentlyInput = this._leftWindow.getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				this._setHelpMode();
			}
			else {
				this._moveNone();
			}
		}
		
		return result;
	}

	_moveSelect() {
		var index = this._leftWindow.getUnitListIndex();
		
		SceneManager.getActiveScene().getSortieSetting().setSortieMark(index);
		return MoveResult.CONTINUE;
	}

	_moveCancel() {
		this._resultCode = UnitSortieResult.NONE;
		// Change to move the selected sortie unit to the front position.
		UnitProvider.sortSortieUnit();
		return MoveResult.END;
	}

	_moveStart() {
		this._resultCode = UnitSortieResult.START;
		return MoveResult.END;
	}

	_moveNone() {
		if (this._leftWindow.isIndexChanged()) {
			this._setMenuUnit(this._leftWindow.getUnitListIndex());
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAnimation() {
		this._unitMenuTopWindow.moveWindow();
		this._unitMenuBottomWindow.moveWindow();
		
		return MoveResult.CONTINUE;
	}

	_moveHelp() {
		if (!this._unitMenuBottomWindow.isHelpMode()) {
			this._leftWindow.enableSelectCursor(true);
			this.changeCycleMode(UnitSortieMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_setHelpMode() {
		if (this._unitMenuBottomWindow.setHelpMode()) {
			this._leftWindow.enableSelectCursor(false);
			this.changeCycleMode(UnitSortieMode.HELP);
		}
	}

	_getSortiePos(pic?) {
		return {
			picWidth: UIFormat.SCREENFRAME_WIDTH,
			textY: root.getGameAreaHeight() - 48,
			picY: root.getGameAreaHeight() - UIFormat.SCREENFRAME_HEIGHT
		};
	}

	_drawSortieText(textui?) {
		var text = StringTable.UnitSortie_Max;
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var pos = this._getSortiePos(pic);
		var x = LayoutControl.getCenterX(-1, pos.picWidth);
		var y = pos.textY;
		var textWidth = TextRenderer.getTextWidth(text, font);
		var space = 25;
		var memberWidth = 55;
		var width = pos.picWidth - textWidth - (memberWidth + space);
		var dx = Math.floor(width / 2);
		
		if (pic !== null) {
			pic.draw(x, pos.picY);
		}
		
		TextRenderer.drawKeywordText(x + dx, y, text, -1, color, font);
		this._drawMemberData(x + dx + textWidth + space, y, textui);
	}

	_drawMemberData(x?, y?, textui?) {
		var text;
		var color = textui.getColor();
		var font = textui.getFont();
		var digitWidth = DefineControl.getNumberSpace();
		var count = SceneManager.getActiveScene().getSortieSetting().getSortieCount();
		var maxCount = SceneManager.getActiveScene().getSortieSetting().getDefaultSortieMaxCount();
		
		NumberRenderer.drawNumberColor(x, y, count, 1, 255);
		
		x += digitWidth;
		text = '/';
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
		
		x += TextRenderer.getTextWidth(text, font);
		x += digitWidth;
		NumberRenderer.drawNumberColor(x, y, maxCount, 1, 255);
	}

	_drawStartTitle(x?, y?) {
		var range = this._getStartTitleRange(x, y);
		var textui = root.queryTextUI('start_title');
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		if (pic !== null) {
			TextRenderer.drawFixedTitleText(range.x, range.y, StringTable.UnitSortie_Start, color, font, TextFormat.CENTER, pic, this._getTitlePartsCount());
		}
	}

	_isStartTitlePressed() {
		var width = this._leftWindow.getWindowWidth() + this._unitMenuTopWindow.getWindowWidth();
		var height = this._leftWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		if (MouseControl.isRangePressed(this._getStartTitleRange(x, y))) {
			MediaControl.soundDirect('commandselect');
			return true;
		}
		
		return false;
	}

	_getStartTitleRange(x?, y?) {
		var width = this._leftWindow.getWindowWidth() + this._unitMenuTopWindow.getWindowWidth();
		
		x = (x + width) - ((this._getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth());
		y = y - this._getTitleRangeOffsetY();
		
		return createRangeObject(x, y, TitleRenderer.getTitlePartsWidth() * 5, TitleRenderer.getTitlePartsHeight());
	}

	_getTitleRangeOffsetY() {
		return 42;
	}

	_getTitlePartsCount() {
		return 3;
	}

	_createUnitList() {
		return PlayerList.getAliveList();
	}
}

class UnitSortieListWindow extends BaseWindow {

	_scrollbar: any = null;

	_unitList: any = null;

	setSortieList(unitList?) {
		var count = Math.floor(this.getWindowHeight() / DefineControl.getTextPartsHeight());
		
		this._unitList = unitList;
		
		this._scrollbar = createScrollbarObject(UnitSortieListScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
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
		return this._scrollbar.enableSelectCursor(isActive);
	}
}

class UnitSortieListScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var data = this._getSortieColorAndAlpha(object);
		
		TextRenderer.drawAlphaText(x, y + 5, object.getName(), length, data.color, data.alpha, font);
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = true;
		
		if (this._isForceSortie(object)) {
			isSelect = false;
		}
		else if (!this._isSortie(object)) {
			isSelect = false;
		}
		else if (SceneManager.getActiveScene().getSortieSetting().getSortieCount() === SceneManager.getActiveScene().getSortieSetting().getDefaultSortieMaxCount()) {
			if (object.getSortieState() === SortieType.SORTIE) {
				isSelect = true;
			}
			else {
				isSelect = false;
			}
		}
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	playStartSound() {
		MediaControl.soundDirect('commandselect');
	}

	getObjectWidth() {
		return DefineControl.getTextPartsWidth();
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_getSortieColorAndAlpha(object?) {
		var color;
		var alpha = 255;
		
		if (this._isForceSortie(object)) {
			color = ColorValue.KEYWORD;
		}
		else if (!this._isSortie(object)) {
			color = ColorValue.INFO;
			alpha = 180;
		}
		else if (object.getSortieState() === SortieType.UNSORTIE) {
			color = ColorValue.DISABLE;
		}
		else {
			color = this.getParentTextUI().getColor();
		}
		
		return {
			color: color,
			alpha: alpha
		};
	}

	_isForceSortie(object?) {
		return SceneManager.getActiveScene().getSortieSetting().isForceSortie(object);
	}

	_isSortie(object?) {
		return SceneManager.getActiveScene().getSortieSetting().isSortie(object);
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}
