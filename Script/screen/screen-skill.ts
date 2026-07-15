
class SkillScreenMode {

	static SKILLSIDE: any = 0;

	static OWNERSIDE: any = 1;
}

class SkillScreen extends BaseScreen {

	_skillListWindow: any = null;

	_skillInfoWindow: any = null;

	_ownerListWindow: any = null;

	_unitSimpleWindow: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === SkillScreenMode.SKILLSIDE) {
			result = this._moveSkillSide();
		}
		else if (mode === SkillScreenMode.OWNERSIDE) {
			result = this._moveOwnerSide();
		}
		
		this._unitSimpleWindow.moveWindow();
		
		return result;
	}

	drawScreenCycle() {
		var height = this._skillListWindow.getWindowHeight();
		var width = this._skillInfoWindow.getWindowWidth() + this._skillListWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._skillListWindow.drawWindow(x, y);
		this._ownerListWindow.drawWindow(x + this._skillListWindow.getWindowWidth(), y);
		this._skillInfoWindow.drawWindow(x + this._skillListWindow.getWindowWidth(), y + (height - this._skillInfoWindow.getWindowHeight()));
			
		this._drawOwnerTitle(x + this._skillListWindow.getWindowWidth(), y);
		
		if (this.getCycleMode() === SkillScreenMode.OWNERSIDE) {
			this._unitSimpleWindow.drawWindow(x, y + (height - this._unitSimpleWindow.getWindowHeight()));
		}
	}

	drawScreenBottomText(textui?) {
		var description = '';
		var skill = this._skillInfoWindow.getSkill();
		
		if (skill !== null) {
			description = skill.getDescription();
		}
		
		TextRenderer.drawScreenBottomText(description, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('SkillList');
	}

	changeSkill(obj?) {
		this._skillInfoWindow.setSkillInfoData(obj.skill, ObjectType.NULL);
		this._ownerListWindow.setOwnerArray(obj.unitArray);
	}

	changeUnit(unit?) {
		this._unitSimpleWindow.setFaceUnitData(unit);
	}

	_prepareScreenMemberData(screenParam?) {
		this._skillListWindow = createWindowObject(SkillListWindow, this);
		this._skillInfoWindow = createWindowObject(SkillInfoWindow, this);
		this._ownerListWindow = createWindowObject(OwnerListWindow, this);
		this._unitSimpleWindow = createWindowObject(UnitSimpleWindow, this);
	}

	_completeScreenMemberData(screenParam?) {
		var arr = this._getArray();
		
		this._skillListWindow.setWindowData();
		this._skillListWindow.setSkillArray(arr);
		
		this._skillInfoWindow.setSkillInfoData(arr[0].skill, ObjectType.NULL);
		
		this._ownerListWindow.setWindowData();
		this._ownerListWindow.setOwnerArray(arr[0].unitArray);
	}

	_moveSkillSide() {
		var input = this._skillListWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			if (this._ownerListWindow.getOwnerCount() > 0) {
				this._changeActiveWindow();
				this.changeCycleMode(SkillScreenMode.OWNERSIDE);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		else {
			if (this._skillListWindow.isIndexChanged()) {
				this.changeSkill(this._skillListWindow.getSkillObject());
			}
		}
		
		return result;
	}

	_moveOwnerSide() {
		var input = this._ownerListWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.CANCEL) {
			this._changeActiveWindow();
			this.changeCycleMode(SkillScreenMode.SKILLSIDE);
		}
		else {
			if (this._ownerListWindow.isIndexChanged()) {
				this.changeUnit(this._ownerListWindow.getUnit());
			}
		}
		
		return result;
	}

	_drawOwnerTitle(x?, y?) {
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = StringTable.SkillList_Owner;
		var titleCount = this._getTitlePartsCount();
		var width = this._ownerListWindow.getWindowWidth() - (TitleRenderer.getTitlePartsWidth() * (titleCount + 2));
		
		width = Math.floor(width / 2);
		TextRenderer.drawFixedTitleText(x + width, y - 38, text, color, font, TextFormat.CENTER, pic, titleCount);
	}

	_getTitlePartsCount() {
		return 4;
	}

	_changeActiveWindow() {
		if (this.getCycleMode() === SkillScreenMode.SKILLSIDE) {
			this._ownerListWindow.setActive(true);
			this._skillListWindow.setActive(false);
		}
		else {
			this._ownerListWindow.setActive(false);
			this._skillListWindow.setActive(true);
		}
	}

	_getArray() {
		var i, skill, obj;
		var list = root.getBaseData().getSkillList();
		var count = list.getCount();
		var arr = [];
		var unitSkillArray = this._getUnitSkillArray();
		
		for (i = 0; i < count; i++) {
			skill = list.getData(i);
			if (!this._isSkillAllowed(skill)) {
				continue;
			}
			
			obj = {};
			obj.skill = skill;
			obj.unitArray = this._getUnitArray(skill, unitSkillArray);
			arr.push(obj);
		}
		
		return arr;
	}

	_getUnitSkillArray() {
		var i, count, list, unit, skillArray, obj;
		var arr = [];
		
		if (root.getCurrentScene() === SceneType.BATTLESETUP) {
			list = PlayerList.getAliveList();
		}
		else {
			list = PlayerList.getSortieList();
		}
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			skillArray = SkillControl.getSkillObjectArray(unit, ItemControl.getEquippedWeapon(unit), -1, '', this._getObjectFlag());
			
			obj = {};
			obj.unit = unit;
			obj.skillArray = skillArray;
			arr.push(obj);
		}
		
		return arr;
	}

	_getUnitArray(skill?, unitSkillArray?) {
		var i, j, count2;
		var count = unitSkillArray.length;
		var arr = [];
		
		for (i = 0; i < count; i++) {
			count2 = unitSkillArray[i].skillArray.length;
			for (j = 0; j < count2; j++) {
				if (unitSkillArray[i].skillArray[j].skill === skill) {
					arr.push(unitSkillArray[i].unit);
					break;
				}
			}
		}
		
		return arr;
	}

	_getObjectFlag() {
		// If only the unit skill is a target, return ObjectFlag.UNIT only.
		return ObjectFlag.UNIT | ObjectFlag.CLASS | ObjectFlag.WEAPON | ObjectFlag.ITEM | ObjectFlag.STATE | ObjectFlag.TERRAIN | ObjectFlag.FUSION;
	}

	_isSkillAllowed(skill?) {
		// The blank is supposed to be a space on the data setting and not treated as a skill.
		return skill.getName() !== '';
	}

	_getTitleTextUI() {
		return root.queryTextUI('objective_title');
	}
}

class SkillListWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(SkillScrollbar, this);
		this._scrollbar.setActive(true);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.enablePageChange();
	}

	setSkillArray(objectArray?) {
		this._scrollbar.setObjectArray(objectArray);
	}

	setActive(isActive?) {
		this._scrollbar.setActive(isActive);
		
		if (isActive) {
			this._scrollbar.setForceSelect(-1);
		}
		else {
			this._scrollbar.setForceSelect(this._scrollbar.getIndex());
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

	getListIndex() {
		return this._scrollbar.getIndex();
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	getSkillObject() {
		return this._scrollbar.getObject();
	}
}

class SkillScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		this._drawIcon(x, y, object, isSelect, index);
		this._drawName(x, y, object, isSelect, index);
	}

	getObjectWidth() {
		return ItemRenderer.getItemWidth();
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_drawIcon(x?, y?, object?, isSelect?, index?) {
		if (this._isVisible(object)) {
			GraphicsRenderer.drawImage(x, y, object.skill.getIconResourceHandle(), GraphicsType.ICON);
		}
	}

	_drawName(x?, y?, object?, isSelect?, index?) {
		var name;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._isVisible(object)) {
			name = object.skill.getName();
		}
		else {
			name = StringTable.HideData_Question;
		}
		
		x += GraphicsFormat.ICON_WIDTH + 10;
		TextRenderer.drawKeywordText(x, y, name, length, color, font);
	}

	_isVisible(object?) {
		return true;
	//	return object.unitArray.length !== 0;
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}

class OwnerListWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 5);
		
		this._scrollbar = createScrollbarObject(OwnerListScrollbar, this);
		this._scrollbar.setActive(false);
		this._scrollbar.setScrollFormation(1, count);
	}

	setOwnerArray(objectArray?) {
		this._scrollbar.setObjectArray(objectArray);
	}

	setActive(isActive?) {
		this._scrollbar.setActive(isActive);
		if (isActive) {
			this.getParentInstance().changeUnit(this._scrollbar.getObject());
		}
	}

	getOwnerCount() {
		return this._scrollbar.getObjectCount();
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

	getRecentlyInputType() {
		return this._scrollbar.getRecentlyInputType();
	}

	getListIndex() {
		return this._scrollbar.getIndex();
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	getUnit() {
		return this._scrollbar.getObject();
	}
}

class OwnerListScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		this._drawName(x, y, object, isSelect, index);
	}

	getObjectWidth() {
		return 240 - (this.getParentInstance().getWindowXPadding() * 2);
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_drawName(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, object.getName(), length, color, font);
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}
