
class UnitMenuMode {

	static TOP: any = 0;

	static HELP: any = 1;
}

class UnitMenuEnum {

	static ALIVE: any = 0;

	static SORTIE: any = 1;

	static SINGLE: any = 2;
}

class UnitMenuScreen extends BaseScreen {

	_unit: any = null;

	_unitEnumMode: any = 0;

	_unitList: any = null;

	_activePageIndex: any = 0;

	_topWindow: any = null;

	_bottomWindowArray: any = null;

	_unitSentenceWindow: any = null;

	_pageChanger: any = null;

	_dataChanger: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		this._moveAnimation();
		
		if (mode === UnitMenuMode.TOP) {
			result = this._moveTopMode();
		}
		else if (mode === UnitMenuMode.HELP) {
			result = this._moveHelpMode();
		}
		
		return result;
	}

	drawScreenCycle() {
		var x, y;
		var index = this._activePageIndex;
		var width = this._topWindow.getWindowWidth();
		var topHeight = this._topWindow.getWindowHeight();
		var bottomHeight = this._bottomWindowArray[index].getWindowHeight();
		var interval = DefineControl.getWindowInterval();
		
		if (this._isUnitSentenceVisible()) {
			x = LayoutControl.getCenterX(-1, width + this._unitSentenceWindow.getWindowWidth());
		}
		else {
			x = LayoutControl.getCenterX(-1, width);
		}
		y = LayoutControl.getCenterY(-1, topHeight + bottomHeight + interval);
		
		this._topWindow.drawWindow(x, y);
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow.drawWindow(x + width, y);
		}
		this._bottomWindowArray[index].drawWindow(x, y + topHeight + interval);
		
		// this._pageChanger.drawPage cannot be called after this._topWindow.drawWindow.
		// If it's done, scroll cursor is displayed over the item window.
		// For _setMenuData, by calling setDrawingMethod, the cursor is drawn before that.
	}

	drawScreenBottomText(textui?) {
		var text;
		var index = this._activePageIndex;
		
		if (this._topWindow.isTracingHelp()) {
			text = this._topWindow.getHelpText();
		}
		else if (this._bottomWindowArray[index].isHelpMode() || this._bottomWindowArray[index].isTracingHelp()) {
			text = this._bottomWindowArray[index].getHelpText();
		}
		else {
			text = this._getBottomDescription();
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('UnitMenu');
	}

	getCurrentTarget() {
		return this._unit;
	}

	getPageChanger() {
		return this._pageChanger;
	}

	_prepareScreenMemberData(screenParam?) {
		this._unit = screenParam.unit;
		this._unitEnumMode = screenParam.enummode;
		this._unitList = this._getUnitList(this._unit);
		this._activePageIndex = 0;
		this._topWindow = createObject(UnitMenuTopWindow);
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow = createObject(UnitSentenceWindow);
		}
		this._bottomWindowArray = [];
		this._pageChanger = createObject(HorizontalPageChanger);
		this._dataChanger = createObject(VerticalDataChanger);
	}

	_completeScreenMemberData(screenParam?) {
		this._configureBottomWindows(this._bottomWindowArray);
		this._setMenuData();
		this._setNewTarget(this._unit);
		this._playMenuOpenSound();
		
		this._pageChanger.setPageData(this._bottomWindowArray.length, this._bottomWindowArray[0].getWindowWidth(), this._bottomWindowArray[0].getWindowHeight());
		
		this.changeCycleMode(UnitMenuMode.TOP);
	}

	_setMenuData() {
		var i, count;
		var method = function(x, y) {
			SceneManager.getLastScreen().getPageChanger().drawPage(x, y);
		};
		
		this._topWindow.setUnitMenuData();
		
		count = this._bottomWindowArray.length;
		for (i = 0; i < count; i++) {
			this._bottomWindowArray[i].setDrawingMethod(method);
			this._bottomWindowArray[i].setUnitMenuData();
		}
	}

	_setNewTarget(unit?) {
		var i, count;
		
		this._unit = unit;
		
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow.setUnitData(unit);
		}
		
		this._topWindow.changeUnitMenuTarget(unit);
		
		count = this._bottomWindowArray.length;
		for (i = 0; i < count; i++) {
			this._bottomWindowArray[i].changeUnitMenuTarget(unit);
		}
	}

	_moveTopMode() {
		var index;
		var result = MoveResult.CONTINUE;
		
		this._pageChanger.movePage();
		
		if (this._pageChanger.checkPage()) {
			this._activePageIndex = this._pageChanger.getPageIndex();
			return result;
		}
		
		// If up/down key is pressed, the unit is switched with _changeTarget.
		if (InputControl.isSelectAction()) {
			result = this._selectAction();
		}
		else if (InputControl.isCancelAction()) {
			result = this._cancelAction();
		}
		else if (InputControl.isOptionAction()) {
			result = this._optionAction();
		}
		else {
			index = this._dataChanger.checkDataIndex(this._unitList, this._unit); 
			if (index !== -1) {
				this._setNewTarget(this._unitList.getData(index));
			}
		}
		
		return result;
	}

	_moveHelpMode() {
		if (!this._bottomWindowArray[this._activePageIndex].isHelpMode()) {
			this.changeCycleMode(UnitMenuMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAnimation() {
		this._topWindow.moveWindow();
		this._bottomWindowArray[this._activePageIndex].moveWindow();
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow.moveWindow();
		}
		
		return MoveResult.CONTINUE;
	}

	_selectAction() {
		return this._optionAction();
	}

	_cancelAction() {
		this._playMenuCancelSound();
		return MoveResult.END;
	}

	_optionAction() {
		var result = this._bottomWindowArray[this._activePageIndex].setHelpMode();
		
		if (result) {
			this.changeCycleMode(UnitMenuMode.HELP);
		}
		
		return MoveResult.CONTINUE;
	}

	_getUnitList(unit?) {
		var list: any = [];
		var type = unit.getUnitType();
		
		if (type === UnitType.PLAYER) {
			if (this._unitEnumMode === UnitMenuEnum.ALIVE) {
				if (unit.isGuest()) {
					// If the unit is a guest, switch it to the guest unit.
					list = root.getCurrentSession().getGuestList();
				}
				else {
					list = PlayerList.getAliveDefaultList();
				}
			}
			else if (this._unitEnumMode === UnitMenuEnum.SORTIE) {
				// If sortie ends, the guest is included in the PlayerList.
				list = PlayerList.getSortieDefaultList();
			}
			else if (this._unitEnumMode === UnitMenuEnum.SINGLE) {
				list = StructureBuilder.buildDataList();
				list.setDataArray([unit]);
			}
		}
		else if (type === UnitType.ENEMY) {
			list = EnemyList.getAliveDefaultList();
		}
		else if (type === UnitType.ALLY) {
			list = AllyList.getAliveDefaultList();
		}
		
		return list;
	}

	_getBottomDescription() {
		return this._unit.getDescription();
	}

	_isUnitSentenceVisible() {
		return true;
	}

	_playMenuOpenSound() {
		MediaControl.soundDirect('commandopen');
	}

	_playMenuCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}

	_configureBottomWindows(groupArray?) {
		groupArray.appendWindowObject(UnitMenuBottomWindow, this);
	}
}

class UnitMenuTopWindow extends BaseWindow {

	_unit: any = null;

	_mhp: any = 0;

	setUnitMenuData() {
	}

	changeUnitMenuTarget(unit?) {
		this._unit = unit;
		this._mhp = ParamBonus.getMhp(unit);
	}

	moveWindowContent() {
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		this._drawUnitFace(x, y);
		this._drawUnitName(x, y);
		this._drawUnitClass(x, y);
		this._drawUnitLevel(x, y);
		this._drawUnitHp(x, y);
		this._drawFusionIcon(x, y);
	}

	getWindowWidth() {
		return DefineControl.getUnitMenuWindowWidth();
	}

	getWindowHeight() {
		return DefineControl.getFaceWindowHeight();
	}

	getWindowXPadding() {
		return DefineControl.getFaceXPadding();
	}

	getWindowYPadding() {
		return DefineControl.getFaceYPadding();
	}

	getWindowTextUI() {
		return root.queryTextUI('face_window');
	}

	getWindowUI() {
		return root.queryTextUI('face_window').getUIImage();
	}

	isTracingHelp() {
		var range = createRangeObject(this.xRendering + 120, this.yRendering + 50, 170, 32);
		
		return MouseControl.isHovering(range) && this._unit.getClass().getDescription() !== '';
	}

	getHelpText() {
		var text = '';
		
		if (this.isTracingHelp()) {
			text = this._unit.getClass().getDescription();
		}
		
		return text;
	}

	_drawUnitFace(xBase?, yBase?) {
		var alpha = 255;
		
		if (this._unit.getHp() === 0) {
			// Execute when revive.
			alpha = 128;
		}
		
		ContentRenderer.drawUnitFace(xBase, yBase, this._unit, false, alpha);
	}

	_drawUnitName(xBase?, yBase?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getUnitTextLength();
		var x = xBase + 130;
		var y = yBase + 15;
		
		TextRenderer.drawText(x, y, this._unit.getName(), length, color, font);
	}

	_drawUnitClass(xBase?, yBase?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getClassTextLength();
		var x = xBase + 120;
		var y = yBase + 50;
		var cls = this._unit.getClass();
		
		UnitRenderer.drawDefaultUnit(this._unit, x, y, null);
		TextRenderer.drawText(x + 45, y + 13, cls.getName(), length, color, font);
	}

	_drawUnitLevel(xBase?, yBase?) {
		var x = xBase + 303;
		var y = yBase + 10;
		
		ContentRenderer.drawLevelInfo(x, y, this._unit);
	}

	_drawUnitHp(xBase?, yBase?) {
		var x = xBase + 303;
		var y = yBase + 50;
		var pic = root.queryUI('unit_gauge');
		
		ContentRenderer.drawUnitHpZoneEx(x, y, this._unit, pic, this._mhp);
	}

	_drawFusionIcon(xBase?, yBase?) {
		var handle;
		var x = xBase + 102;
		var y = yBase + 11;
		
		if (FusionControl.getFusionParent(this._unit) === null) {
			return;
		}
		
		handle = FusionControl.getFusionData(this._unit).getIconResourceHandle();
		if (handle.isNullHandle()) {
			return;
		}
		
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
	}

	_getUnitTextLength() {
		return 180;
	}

	_getClassTextLength() {
		return 145;
	}
}

class BaseMenuBottomWindow extends BaseWindow {

	setUnitMenuData() {
	}

	changeUnitMenuTarget(unit?) {
	}

	moveWindowContent() {
		return MoveResult.END;
	}

	drawWindowContent(x?, y?) {
	}

	getWindowWidth() {
		return DefineControl.getUnitMenuWindowWidth();
	}

	getWindowHeight() {
		return DefineControl.getUnitMenuBottomWindowHeight();
	}

	setHelpMode() {
		return false;
	}

	isHelpMode() {
		return false;
	}

	isTracingHelp() {
		return false;
	}

	getHelpText() {
		return '';
	}
}

class UnitMenuHelp {

	static ITEM: any = 0;

	static SKILL: any = 1;
}

class UnitMenuBottomWindow extends BaseMenuBottomWindow {

	_statusScrollbar: any = null;

	_unit: any = null;

	_unitMenuHelp: any = 0;

	_isTracingLocked: any = false;

	_skillInteraction: any = null;

	_itemInteraction: any = null;

	setUnitMenuData() {
		this._skillInteraction = createObject(SkillInteraction);
		this._itemInteraction = createObject(ItemInteraction);
		this._statusScrollbar = createScrollbarObject(UnitStatusScrollbar, this);	
	}

	changeUnitMenuTarget(unit?) {
		this._unit = unit;
		this._unitMenuHelp = 0;
		
		this._itemInteraction.setData(unit);
		this._itemInteraction.setWindowTextUI(this.getWindowTextUI());
		this._setSkillData(unit);
		
		this._statusScrollbar.setStatusFromUnit(unit);
		
		this._skillInteraction.checkInitialTopic();
		this._itemInteraction.checkInitialTopic();
	}

	moveWindowContent() {
		var recentlyInput;
		
		this._itemInteraction.moveInteraction();
		this._skillInteraction.moveInteraction();
		
		if (!this.isHelpMode()) {
			return MoveResult.CONTINUE;
		}
		
		if (this._unitMenuHelp === UnitMenuHelp.ITEM) {
			recentlyInput = this._itemInteraction.getInteractionScrollbar().getRecentlyInputType();
			if (this._skillInteraction.isHelpAvailable() && (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT)) {
				this._itemInteraction.cancelInteraction();
				this._unitMenuHelp = UnitMenuHelp.SKILL;
				this._skillInteraction.setHelpMode();
			}
		}
		else if (this._unitMenuHelp === UnitMenuHelp.SKILL) {
			recentlyInput = this._skillInteraction.getInteractionScrollbar().getRecentlyInputType();
			if (this._itemInteraction.isHelpAvailable() && (recentlyInput === InputType.UP || recentlyInput === InputType.DOWN)) {
				this._skillInteraction.cancelInteraction();
				this._unitMenuHelp = UnitMenuHelp.ITEM;
				this._itemInteraction.setHelpMode();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		this._drawParamArea(x, y);
		this._drawItemArea(x, y);
		this._drawWeaponTypeArea(x, y);
		this._drawSkillArea(x, y);
		this._drawInfoWindow(x, y);
	}

	isHelpMode() {
		return this._itemInteraction.isHelpMode() || this._skillInteraction.isHelpMode();
	}

	isTracingHelp() {
		return this._itemInteraction.isTracingHelp() || this._skillInteraction.isTracingHelp();
	}

	setHelpMode() {
		if (this._itemInteraction.setHelpMode()) {
			this._unitMenuHelp = UnitMenuHelp.ITEM;
			return true;
		}
		
		if (this._skillInteraction.setHelpMode()) {
			this._unitMenuHelp = UnitMenuHelp.SKILL;
			return true;
		}
		
		return false;
	}

	getHelpText() {
		var text = '';
		var help = this._getActiveUnitMenuHelp();
		
		if (help === UnitMenuHelp.ITEM) {
			text = this._itemInteraction.getHelpText();
		}
		else if (help === UnitMenuHelp.SKILL) {
			text = this._skillInteraction.getHelpText();
		}
		
		return text;
	}

	lockTracing(isLocked?) {
		this._isTracingLocked = isLocked;
	}

	_setSkillData(unit?) {
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
	}

	_drawItemArea(xBase?, yBase?) {
		this._itemInteraction.getInteractionScrollbar().drawScrollbar(xBase, yBase);
	}

	_drawParamArea(xBase?, yBase?) {
		var dx = 15;
		
		this._statusScrollbar.drawScrollbar(xBase + ItemRenderer.getItemWidth() + dx, yBase);
	}

	_drawWeaponTypeArea(xBase?, yBase?) {
		var dy = this._itemInteraction.getInteractionScrollbar().getScrollbarHeight() + 14;
		
		WeaponTypeRenderer.drawClassWeaponList(xBase, yBase + dy, this._unit.getClass());
	}

	_drawSkillArea(xBase?, yBase?) {
		var dy = this._itemInteraction.getInteractionScrollbar().getScrollbarHeight() + 14;
		var width = 230;
		
		this._skillInteraction.getInteractionScrollbar().drawScrollbar(xBase + width, yBase + dy);
	}

	_drawInfoWindow(xBase?, yBase?) {
		var x, help;
		
		if (this._isTracingLocked) {
			return;
		}
		
		help = this._getActiveUnitMenuHelp();
		
		if (help === UnitMenuHelp.SKILL) {
			this._skillInteraction.getInteractionWindow().drawWindow(xBase, yBase);
		}
		else if (help === UnitMenuHelp.ITEM) {
			x = xBase + ItemRenderer.getItemWidth();
			if (x + this._itemInteraction.getInteractionWindow().getWindowWidth() > root.getGameAreaWidth()) {
				x -= x + this._itemInteraction.getInteractionWindow().getWindowWidth() - root.getGameAreaWidth();
				x -= 8;
			}
			
			this._itemInteraction.getInteractionWindow().drawWindow(x, yBase);
		}
	}

	_getActiveUnitMenuHelp() {
		var help = -1;
		
		if (this._itemInteraction.isTracingHelp()) {
			help = UnitMenuHelp.ITEM;
		}
		else if (this._skillInteraction.isTracingHelp()) {
			help = UnitMenuHelp.SKILL;
		}
		else if (this._itemInteraction.isHelpMode()) {
			help = UnitMenuHelp.ITEM;
		}
		else if (this._skillInteraction.isHelpMode()) {
			help = UnitMenuHelp.SKILL;
		}
		
		return help;
	}
}

class IconItemScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var handle = object.skill.getIconResourceHandle();
		
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
	}

	drawDescriptionLine(x?, y?) {
	}

	playSelectSound() {
	}

	getObjectWidth() {
		return GraphicsFormat.ICON_WIDTH + 6;
	}

	getObjectHeight() {
		return GraphicsFormat.ICON_HEIGHT;
	}
}

class BaseInteraction extends BaseObject {

	_isHelpMode: any = false;

	_scrollbar: any = null;

	_window: any = null;

	moveInteraction() {
		var input, index;
		
		if (this._isHelpMode) {
			input = this._scrollbar.moveInput();
			if (input === ScrollbarInput.CANCEL) {
				this.cancelInteraction();
			}
			else {
				if (this._scrollbar.checkAndUpdateIndex()) {
					this._changeTopic();
				}
			}
			
			if (this._window !== null) {
				this._window.moveWindow();
			}
		}
		else {
			index = this._getTracingIndex();
			if (index !== -1) {
				this._scrollbar.setIndex(index);
				this._changeTopic();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	checkInitialTopic() {
		var index = MouseControl.getIndexFromMouse(this._scrollbar);
		
		if (index !== -1) {
			this._scrollbar.setIndex(index);
			this._changeTopic();
		}
		
		this._scrollbar.resetPreviousIndex();
	}

	cancelInteraction() {
		this._isHelpMode = false;
		this._scrollbar.setActive(false);
	}

	isInteraction() {
		return this.isHelpMode() || this.isTracingHelp();
	}

	isHelpMode() {
		return this._isHelpMode;
	}

	isTracingHelp() {
		return MouseControl.getIndexFromMouse(this._scrollbar) !== -1;
	}

	isHelpAvailable() {
		return this._scrollbar.getObjectCount() > 0;
	}

	setHelpMode() {
		if (!this.isHelpAvailable()) {
			return false;
		}
		
		this._isHelpMode = true;
		this._scrollbar.setActive(true);
		this._playHelpSelectSound();
		
		return true;	
	}

	getHelpText() {
		var item = this._scrollbar.getObject();
		
		return item.getDescription();
	}

	getInteractionScrollbar() {
		return this._scrollbar;
	}

	getInteractionWindow() {
		return this._window;
	}

	_changeTopic() {
	}

	_getTracingIndex() {
		return MouseControl.pointMouse(this._scrollbar);
	}

	_playHelpSelectSound() {
		MediaControl.soundDirect('commandselect');
	}
}

class ItemInteraction extends BaseInteraction {

	_textui: any = null;

	initialize() {
		this._scrollbar = createScrollbarObject(ItemDropListScrollbar, this);
		this._scrollbar.setScrollFormation(1, DefineControl.getVisibleUnitItemCount());
		
		this._window = createWindowObject(ItemInfoWindow, this);
	}

	setData(unit?) {
		this._scrollbar.setUnitItemFormation(unit);
		this._scrollbar.resetDropMark();
	}

	getWindowTextUI() {
		return this._textui;
	}

	setWindowTextUI(textui?) {
		this._textui = textui;
	}

	_changeTopic() {
		var item = this._scrollbar.getObject();
		
		this._window.setInfoItem(item);
	}
}

class SkillInteraction extends BaseInteraction {

	initialize() {
		this._scrollbar = createScrollbarObject(IconItemScrollbar, this);
		this._scrollbar.setScrollFormation(7, 1);
		this._window = createWindowObject(SkillInfoWindow, this);
	}

	setSkillArray(arr?) {
		this._scrollbar.setObjectArray(arr);
	}

	getHelpText() {
		var skillEntry = this._scrollbar.getObject();
		
		return skillEntry.skill.getDescription();
	}

	_changeTopic() {
		var skillEntry = this._scrollbar.getObject();
		
		this._window.setSkillInfoData(skillEntry.skill, skillEntry.objecttype);
	}
}

class SkillInteractionLong extends SkillInteraction {

	initialize() {
		this._scrollbar = createScrollbarObject(IconItemScrollbar, this);
		this._scrollbar.setScrollFormation(7, 1);
		this._window = createWindowObject(SkillInfoWindowLong, this);
	}
}
