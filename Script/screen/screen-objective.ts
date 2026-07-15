
class ObjectiveScreen extends BaseScreen {

	_objectiveWindow: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		return this._objectiveWindow.moveWindow();
	}

	drawScreenCycle() {
		var x = LayoutControl.getCenterX(-1, this._objectiveWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._objectiveWindow.getWindowHeight());
		
		this._objectiveWindow.drawWindow(x, y);
	}

	drawScreenBottomText(textui?) {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		
		TextRenderer.drawScreenBottomText(mapInfo.getDescription(), textui);
	}

	getScreenInteropData() {
		return root.queryScreen('Objective');
	}

	_prepareScreenMemberData(screenParam?) {
		this._objectiveWindow = createWindowObject(ObjectiveWindow, this);
	}

	_completeScreenMemberData(screenParam?) {
		this._objectiveWindow.setObjectiveData();
	}
}

class ObjectiveWindow extends BaseWindow {

	_scrollbarVictory: any = null;

	_scrollbarDefeat: any = null;

	_faceZone: any = null;

	_objectArray: any = null;

	setObjectiveData() {
		this._createVictoryScrollbar();
		this._createDefeatScrollbar();
		
		this._faceZone = createObject(ObjectiveFaceZone);
		
		this._objectArray = [];
		this._configureObjectiveParts(this._objectArray);
	}

	moveWindowContent() {
		if (InputControl.isCancelAction()) {
			this._playCancelSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		this._drawTop(x, y);
		this._faceZone.drawFaceZone(x, y);
		this._drawObjectiveArea(x, y);
		this._drawArea(x, y);
	}

	getWindowWidth() {
		return 560;
	}

	getWindowHeight() {
		return 340;
	}

	_createVictoryScrollbar() {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var text1 = mapInfo.getVictoryCondition(0);
		var text2 = mapInfo.getVictoryCondition(1);
		var text3 = mapInfo.getVictoryCondition(2);
		var objectArray = [text1, text2, text3];
		
		this._scrollbarVictory = createScrollbarObject(ObjectiveScrollbar, this);
		this._scrollbarVictory.setScrollFormation(1, objectArray.length);
		this._scrollbarVictory.setObjectArray(objectArray);
	}

	_createDefeatScrollbar() {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var text1 = mapInfo.getDefeatCondition(0);
		var text2 = mapInfo.getDefeatCondition(1);
		var text3 = mapInfo.getDefeatCondition(2);
		var objectArray = [text1, text2, text3];
		
		this._scrollbarDefeat = createScrollbarObject(ObjectiveScrollbar, this);
		this._scrollbarDefeat.setScrollFormation(1, objectArray.length);
		this._scrollbarDefeat.setObjectArray(objectArray);
	}

	_drawObjectiveArea(x?, y?) {
		var i;
		var text = [StringTable.Objective_Victory, StringTable.Objective_Defeat];
		var scrollbar = [this._scrollbarVictory, this._scrollbarDefeat];
		var count = scrollbar.length;
		var dx = this._scrollbarVictory.getObjectWidth();
		var dy = this._scrollbarVictory.getObjectHeight();
		
		x = LayoutControl.getCenterX(-1, count * dx);
		y += this._getObjectiveAreaStartY();
		
		for (i = 0; i < count; i++) {
			this._drawTitle(x, y, text[i]);
			scrollbar[i].drawScrollbar(x, y + dy);
			
			x += dx;
		}
	}

	_drawTop(x?, y?) {
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var text = ChapterRenderer.getChapterText(mapInfo);
		var titleCount = this._getTitlePartsCount();
		var sx = LayoutControl.getCenterX(-1, TitleRenderer.getTitlePartsWidth() * (titleCount + 2));
		
		text += '  ';
		text += mapInfo.getName();
		
		TextRenderer.drawFixedTitleText(sx, y - 48, text, color, font, TextFormat.CENTER, pic, titleCount);
	}

	_drawArea(x?, y?) {
		var i;
		var dx = this._getObjectivePartsInterval();
		var count = this._objectArray.length;
		
		y += this._getObjectivePartsStartY();
		
		x = LayoutControl.getCenterX(-1, count * dx);
		
		for (i = 0; i < count; i++) {
			this._objectArray[i].drawObjectiveParts(x, y);
			x += dx;
		}
	}

	_drawTitle(x?, y?, text?) {
		var textui = this.getWindowTextUI();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, text, -1, ColorValue.KEYWORD, font);
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}

	_getTitleTextUI() {
		return root.queryTextUI('objective_title');
	}

	_getObjectiveAreaStartY() {
		return 150;
	}

	_getObjectivePartsStartY() {
		return 260;
	}

	_getObjectivePartsInterval() {
		return 140;
	}

	_getTitlePartsCount() {
		return 7;
	}

	_configureObjectiveParts(groupArray?) {
		groupArray.appendObject(ObjectiveParts.Turn);
		groupArray.appendObject(ObjectiveParts.Gold);
	}
}

class ObjectiveScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = object;
		var length = this._getTextLength();
		
		TextRenderer.drawKeywordText(x, y, text, length, color, font);
	}

	getObjectWidth() {
		return 260;
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}

class ObjectiveFaceZone extends BaseObject {

	drawFaceZone(x?, y?) {
		var i, unitType, unit;
		var arr = [UnitType.PLAYER, UnitType.ENEMY, UnitType.ALLY];
		var count = arr.length;
		
		x += 15;
		y -= 10;
		
		for (i = 0; i < count; i++) {
			unitType = arr[i];
			
			unit = this._getLeaderUnit(unitType);
			if (unit !== null) {
				this._drawFaceImage(x, y, unit, unitType);
				this._drawInfo(x, y, unit, unitType);
			}
			
			x += this._getFaceInterval();
		}
	}

	_drawFaceImage(x?, y?, unit?, unitType?) {
		var alpha = 255;
		var picFrame = root.queryUI('objectiveunit_frame');
		var xMargin = 16;
		var yMargin = 16;
		var frameWidth = Math.floor(UIFormat.FACEFRAME_WIDTH / 2);
		var frameHeight = UIFormat.FACEFRAME_HEIGHT;
		
		if (picFrame !== null) {
			picFrame.drawStretchParts(x, y, frameWidth, frameHeight, frameWidth, 0, frameWidth, frameHeight);
		}
		
		if (unit.getHp() === 0) {
			alpha = 128;
		}
		
		ContentRenderer.drawUnitFace(x + xMargin, y + yMargin, unit, false, alpha);
		
		if (picFrame !== null) {
			picFrame.drawStretchParts(x, y, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
		}
	}

	_drawInfo(x?, y?, unit?, unitType?) {
		var textui = this._getTitleTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = [StringTable.UnitType_Player, StringTable.UnitType_Enemy, StringTable.UnitType_Ally];
		var pos = this._getTotalValuePos();
		
		y += this._getInfoY();
		
		TextRenderer.drawFixedTitleText(x, y, text[unitType], color, font, TextFormat.LEFT, pic, this._getTitlePartsCount());
		NumberRenderer.drawNumber(x + pos.x, y + pos.y, this._getTotalValue(unitType));
	}

	_getFaceInterval() {
		return 180;
	}

	_getInfoY() {
		return 102;
	}

	_getTotalValuePos() {
		return {x: 105, y: 17};
	}

	_getTitlePartsCount() {
		return 3;
	}

	_getTotalValue(unitType?) {
		var list;
		
		if (unitType === UnitType.PLAYER) {
			list = PlayerList.getSortieDefaultList();
		}
		else if (unitType === UnitType.ENEMY) {
			list = EnemyList.getAliveDefaultList();
		}
		else {
			list = AllyList.getAliveDefaultList();
		}
		
		return list.getCount();
	}

	_getLeaderUnit(unitType?) {
		var i, list, count;
		var unit = null;
		var firstUnit = null;
		
		if (unitType === UnitType.PLAYER) {
			list = PlayerList.getMainList();
		}
		else if (unitType === UnitType.ENEMY) {
			list = EnemyList.getMainList();
		}
		else {
			list = AllyList.getMainList();
		}
		
		count = list.getCount();
		if (count === 0) {
			return null;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.getSortieState() === SortieType.UNSORTIE) {
				continue;
			}
			
			if (unit.getAliveState() === AliveType.ERASE) {
				continue;
			}
			
			if (firstUnit === null) {
				firstUnit = unit;
			}
			
			if (unit.getImportance() === ImportanceType.LEADER) {
				break;
			}
		}
		
		// A leader cannot be found, so first unit to be found is a target.
		if (i === count) {
			unit = firstUnit;
		}
		
		return unit;
	}

	_getTitleTextUI() {
		return root.queryTextUI('description_title');
	}
}

class BaseObjectiveParts extends BaseObject {

	drawObjectiveParts(x?, y?) {
		var text = this.getObjectivePartsName();
		var textui = this._getTitleTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TitleRenderer.drawTitle(pic, x, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), 2);
		TextRenderer.drawKeywordText(x + 15, y + 14, text, -1, color, font);
		NumberRenderer.drawNumber(x + 100, y + 14, this.getObjectivePartsValue());
	}

	getObjectivePartsName() {
		return '';
	}

	getObjectivePartsValue() {
		return 0;
	}

	_getTitleTextUI() {
		return root.queryTextUI('decoration_title');
	}
}

namespace ObjectiveParts {
export class Turn extends BaseObjectiveParts {

	getObjectivePartsName() {
		return StringTable.Signal_Turn;
	}

	getObjectivePartsValue() {
		return root.getCurrentSession().getTurnCount();
	}
}

export class Gold extends BaseObjectiveParts {

	getObjectivePartsName() {
		return StringTable.Signal_Gold;
	}

	getObjectivePartsValue() {
		return root.getMetaSession().getGold();
	}
}
}
