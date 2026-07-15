
class LoadSaveMode {

	static TOP: any = 0;

	static SAVECHECK: any = 1;
}

class LoadSaveScreen extends BaseScreen {

	_screenParam: any = null;

	_isLoadMode: any = false;

	_scrollbar: any = null;

	_questionWindow: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var result = MoveResult.CONTINUE;
		
		if (this._isLoadMode) {
			result = this._moveLoad();
		}
		else {
			result = this._moveSave();
		}
		
		return result;
	}

	drawScreenCycle() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		var mode = this.getCycleMode();
		
		this._scrollbar.drawScrollbar(x, y);
	
		if (mode === LoadSaveMode.SAVECHECK) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
	}

	getScreenInteropData() {
		return root.queryScreen('Load');
	}

	_prepareScreenMemberData(screenParam?) {
		this._screenParam = screenParam;
		this._isLoadMode = screenParam.isLoad;
		this._scrollbar = createScrollbarObject(this._getScrollbarObject(), this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
	}

	_completeScreenMemberData(screenParam?) {
		var count = LayoutControl.getObjectVisibleCount(76, 5);
		
		this._scrollbar.setScrollFormation(this._getFileCol(), count);
		this._scrollbar.setActive(true);
		this._setScrollData(DefineControl.getMaxSaveFileCount(), this._isLoadMode);
		this._setDefaultSaveFileIndex();
		
		this._questionWindow.setQuestionMessage(StringTable.LoadSave_SaveQuestion);
		
		this.changeCycleMode(LoadSaveMode.TOP);
	}

	_setScrollData(count?, isLoadMode?) {
		var i;
		var manager = root.getLoadSaveManager();
		
		for (i = 0; i < count; i++) {
			this._scrollbar.objectSet(manager.getSaveFileInfo(i));
		}
		
		this._scrollbar.objectSetEnd();
		
		this._scrollbar.setLoadMode(isLoadMode);
	}

	_setDefaultSaveFileIndex() {
		var index = root.getExternalData().getActiveSaveFileIndex();
		
		// Point the cursor at the index of the file which is used before.
		if (this._scrollbar.getObjectCount() > index) {
			this._scrollbar.setIndex(index);
		}
	}

	_moveLoad() {
		var input;
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === LoadSaveMode.TOP) {
			input = this._scrollbar.moveInput();
			if (input === ScrollbarInput.SELECT) {
				this._executeLoad();
			}
			else if (input === ScrollbarInput.CANCEL) {
				result = MoveResult.END;
			}
			else {
				this._checkSaveFile();
			}
		}
		
		return result;
	}

	_moveSave() {
		var input;
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === LoadSaveMode.TOP) {
			input = this._scrollbar.moveInput();
			if (input === ScrollbarInput.SELECT) {
				this._scrollbar.enableSelectCursor(false);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(LoadSaveMode.SAVECHECK);
			}
			else if (input === ScrollbarInput.CANCEL) {
				result = MoveResult.END;
			}
			else {
				this._checkSaveFile();
			}
		}
		else if (mode === LoadSaveMode.SAVECHECK) {
			if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
				if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
					this._executeSave();
				}
				
				this._scrollbar.enableSelectCursor(true);
				this.changeCycleMode(LoadSaveMode.TOP);
			}
		}
		
		return result;
	}

	_checkSaveFile() {
	}

	_getScrollbarObject() {
		return LoadSaveScrollbar;
	}

	_getFileCol() {
		return 2;
	}

	_executeLoad() {
		var object = this._scrollbar.getObject();
		
		if (object.isCompleteFile() || object.getMapInfo() !== null) {
			SceneManager.setEffectAllRange(true);
			
			// root.changeScene is called inside and changed to the scene which is recorded at the save file.
			root.getLoadSaveManager().loadFile(this._scrollbar.getIndex());
		}
	}

	_executeSave() {
		var index = this._scrollbar.getIndex();
		
		root.getLoadSaveManager().saveFile(index, this._screenParam.scene, this._screenParam.mapId, this._getCustomObject());
	}

	_getCustomObject() {
		return this._screenParam.customObject;
	}
}

class DataSaveScreen extends LoadSaveScreen {

	getScreenInteropData() {
		return root.queryScreen('Save');
	}
}

class LoadSaveScrollbarContent {

	static CHAPTER: any = 1;

	static PLAYTIME: any = 2;

	static TURNNO: any = 3;

	static DIFFICULTY: any = 4;

	static FILETITLE: any = 5;
}

class LoadSaveScrollbar extends BaseScrollbar {

	_isLoadMode: any = false;

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var width = this.getObjectWidth();
		var height = this.getObjectHeight();
		var pic = this._getWindowTextUI().getUIImage();
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += DefineControl.getWindowXPadding();
		y += DefineControl.getWindowYPadding();
		
		if (object.isCompleteFile() || object.getMapInfo() !== null) {
			this._drawMain(x, y, object, index);
		}
		else {
			this._drawEmptyFile(x, y, index);
		}
		
		this._drawFileTitle(x, y, index);
	}

	drawDescriptionLine(x?, y?) {
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = true;
		
		if (this._isLoadMode) {
			if (!object.isCompleteFile() && object.getMapInfo() === null) {
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

	getSpaceX() {
		return 0;
	}

	getSpaceY() {
		return 0;
	}

	getObjectWidth() {
		return 260;
	}

	getObjectHeight() {
		return 76;
	}

	setLoadMode(isLoadMode?) {
		this._isLoadMode = isLoadMode;
	}

	_drawMain(x?, y?, object?, index?) {
		this._drawChapterNumber(x, y, object);
		this._drawChapterName(x, y, object);
		this._drawPlayTime(x, y, object);
		this._drawTurnNo(x, y, object);
		this._drawDifficulty(x, y, object);
	}

	_drawChapterNumber(xBase?, yBase?, object?) {
		var text;
		var textui = this._getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var x = xBase;
		var y = yBase;
		
		if (object.isCompleteFile()) {
			text = StringTable.Chapter_Rest;
		}
		else {
			text = ChapterRenderer.getChapterText(object.getMapInfo());
		}
		
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	}

	_drawChapterName(xBase?, yBase?, object?) {
		var text;
		var length = this._getTextLength();
		var textui = this._getWindowTextUI();
		var font = textui.getFont();
		var obj = this._getPositionObject(LoadSaveScrollbarContent.CHAPTER);
		var x = xBase + obj.dx;
		var y = yBase;
		
		if (object.isCompleteFile()) {
			text = root.getRestPreference().getCompleteSaveTitle();
		}
		else {
			text = object.getMapInfo().getName();
		}
		
		TextRenderer.drawKeywordText(x, y, text, length, ColorValue.KEYWORD, font);
	}

	_drawPlayTime(xBase?, yBase?, object?) {
		var obj = this._getPositionObject(LoadSaveScrollbarContent.PLAYTIME);
		var x = xBase;
		var y = yBase + obj.dx;
		
		ContentRenderer.drawPlayTime(x, y, object.getPlayTime());
	}

	_drawTurnNo(xBase?, yBase?, object?) {
		var width;
		var textui = this._getWindowTextUI();
		var font = textui.getFont();
		var text = StringTable.Signal_Turn;
		var turn = object.getTurnCount();
		var obj = this._getPositionObject(LoadSaveScrollbarContent.TURNNO);
		var x = xBase + obj.dx;
		var y = yBase + obj.dy;
		
		if (turn > 0) {
			TextRenderer.drawKeywordText(x, y, text, -1, ColorValue.INFO, font);
			width = TextRenderer.getTextWidth(text, font) + 30;
			NumberRenderer.drawNumber(x + width, y, turn);
		}
		else if (object.getSceneType() === SceneType.REST) {
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_Rest, -1, ColorValue.INFO, font);
		}
	}

	_drawDifficulty(xBase?, yBase?, object?) {
		var difficulty = object.getDifficulty();
		var obj = this._getPositionObject(LoadSaveScrollbarContent.DIFFICULTY);
		var x = xBase + obj.dx;
		var y = yBase + obj.dy;
		
		// Prevent the difficulty icons from being hidden in 640×480 thumbnail mode.
		if (this.getCol() === 1 && !DataConfig.isHighResolution()) {
			x -= 34;
			y -= 2;
		}
		
		GraphicsRenderer.drawImage(x, y, difficulty.getIconResourceHandle(), GraphicsType.ICON);
	}

	_drawEmptyFile(xBase?, yBase?, index?) {
		var length = this._getTextLength();
		var textui = this._getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var x = xBase;
		var y = yBase;
		
		if (this._getTitleTextUI().getUIImage() === null) {
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_SaveFileMark + (index + 1), length, color, font);
			
			x += 90;
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_NoData, -1, ColorValue.KEYWORD, font);
		}
		else {
			x += 70;
			y += 10;
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_NoData, -1, ColorValue.KEYWORD, font);
		}
	}

	_drawFileTitle(xBase?, yBase?, index?) {
		var textui = this._getTitleTextUI();
		var obj = this._getPositionObject(LoadSaveScrollbarContent.FILETITLE);
		var x = xBase;
		var y = yBase - 42;
		var width = this.getObjectWidth() - obj.width;
		var n = index + 1;
		var dx = n >= 10 ? 56 : 51;
		
		if (textui.getUIImage() === null) {
			return;
		}
		
		TitleRenderer.drawTitle(textui.getUIImage(), x + width, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), 1);
		NumberRenderer.drawNumberColor(x + width + dx + obj.dx, y + obj.dy, n, this._getNumberColorIndex(), 255);
	}

	_getPositionObject(index?) {
		var obj: any = {};
		
		if (index === LoadSaveScrollbarContent.CHAPTER) {
			obj.dx = 80;
		}
		else if (index === LoadSaveScrollbarContent.PLAYTIME) {
			obj.dx = 25;
		}
		else if (index === LoadSaveScrollbarContent.TURNNO) {
			obj.dx = 80;
			obj.dy = 25;
		}
		else if (index === LoadSaveScrollbarContent.DIFFICULTY) {
			obj.dx = 200;
			obj.dy = 23;
		}
		else if (index === LoadSaveScrollbarContent.FILETITLE) {
			obj.width = 85;
			obj.dx = 0;
			obj.dy = 17;
		}
		
		return obj;
	}

	_getTextLength() {
		return this.getObjectWidth() - 80;
	}

	_getWindowTextUI() {
		return root.queryTextUI('default_window');
	}

	_getTitleTextUI() {
		return root.queryTextUI('savenumber_title');
	}

	_getNumberColorIndex() {
		return 4;
	}
}


//------------------------------------------------------------------


class LoadSaveScreenEx extends LoadSaveScreen {

	_saveFileDetailWindow: any = null;

	drawScreenCycle() {
		var width = this._scrollbar.getObjectWidth() + this._saveFileDetailWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
		this._saveFileDetailWindow.drawWindow(x + this._scrollbar.getObjectWidth(), y);
		
		if (this.getCycleMode() === LoadSaveMode.SAVECHECK) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
	}

	_completeScreenMemberData(screenParam?) {
		super._completeScreenMemberData(screenParam);
		
		this._scrollbar.enablePageChange();
		
		this._saveFileDetailWindow = createWindowObject(SaveFileDetailWindow, this);
		this._saveFileDetailWindow.setSize(Math.floor(this._scrollbar.getScrollbarHeight() * 1.2), this._scrollbar.getScrollbarHeight());
		
		this._checkSaveFile();
	}

	_checkSaveFile() {
		if (this._scrollbar.checkAndUpdateIndex()) {
			this._saveFileDetailWindow.setSaveFileInfo(this._scrollbar.getObject());
		}
	}

	_getScrollbarObject() {
		return LoadSaveScrollbarEx;
	}

	_getFileCol() {
		return 1;
	}

	_executeSave() {
		super._executeSave();
		
		this._saveFileDetailWindow.setSaveFileInfo(this._scrollbar.getObject());
	}

	_getCustomObject() {
		var obj = super._getCustomObject();
		
		this._setLeaderSettings(obj);
		this._setPositionSettings(obj);
		
		return obj;
	}

	_setLeaderSettings(obj?) {
		var handle;
		var unit = this._getLeaderUnit();
		
		if (unit === null) {
			obj.leaderName = 'undefined';
			return;
		}
		
		obj.leaderName = unit.getName();
		obj.leaderLv = unit.getLv();
		
		handle = unit.getCustomCharChipHandle();
		if (handle === null) {
			handle = unit.getCharChipResourceHandle();
		}
		obj.binary = serializeResourceHandle(handle);
	}

	_setPositionSettings(obj?) {
		var area, session, mapInfo;
		
		obj.playerArrayX = [];
		obj.playerArrayY = [];
		obj.enemyArrayX = [];
		obj.enemyArrayY = [];
		obj.allyArrayX = [];
		obj.allyArrayY = [];
		
		if (this._screenParam.scene === SceneType.REST) {
			area = root.getRestPreference().getActiveRestAreaFromMapId(this._screenParam.mapId);
			if (area !== null) {
				obj.areaId = area.getId();
			}
			return;
		}
		else {
			session = root.getCurrentSession();
			if (session === null) {
				return;
			}
			
			mapInfo = session.getCurrentMapInfo();
			if (mapInfo === null || this._screenParam.mapId !== mapInfo.getId()) {
				return;
			}
		}
		
		this._setPositionSettingsInternal(PlayerList.getSortieList(), obj.playerArrayX, obj.playerArrayY);
		this._setPositionSettingsInternal(EnemyList.getAliveList(), obj.enemyArrayX, obj.enemyArrayY);
		this._setPositionSettingsInternal(AllyList.getAliveList(), obj.allyArrayX, obj.allyArrayY);
	}

	_setPositionSettingsInternal(list?, arrayX?, arrayY?) {
		var i, unit;
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (this._isUnitExcluded(unit)) {
				continue;
			}
			
			arrayX.push(unit.getMapX());
			arrayY.push(unit.getMapY());
		}
	}

	_isUnitExcluded(unit?) {
		return unit.isInvisible();
	}

	_getLeaderUnit() {
		var i, count;
		var list = PlayerList.getMainList();
		var unit = null;
		var firstUnit = null;
		
		count = list.getCount();
		if (count === 0) {
			return null;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
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
		
		if (i === count) {
			unit = firstUnit;
		}
		
		return unit;
	}
}

class DataSaveScreenEx extends LoadSaveScreenEx {

	getScreenInteropData() {
		return root.queryScreen('Save');
	}
}

class LoadSaveScrollbarEx extends LoadSaveScrollbar {

	getObjectWidth() {
		return DataConfig.isHighResolution() ? 260 : 220;
	}
}

class SaveFileDetailWindow extends BaseWindow {

	_picCache: any = null;

	_width: any = null;

	_height: any = null;

	_saveFileInfo: any = null;

	_groupArray: any = null;

	setSize(width?, height?) {
		this._width = width;
		this._height = height;
	}

	setSaveFileInfo(saveFileInfo?) {
		var i, count;
		var object = saveFileInfo;
		
		if (object === null) {
			return;
		}
		
		if (!object.isCompleteFile() && object.getMapInfo() === null) {
			this._saveFileInfo = null;
			return;
		}
		
		this._saveFileInfo = saveFileInfo;
		this._picCache = null;
		
		this._groupArray = [];
		this._configureSentence(this._groupArray);
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].setParentWindow(this);
			this._groupArray[i].setSaveFileInfo(this._saveFileInfo);
		}
	}

	moveWindowContent() {
		var i, count;
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].moveQuestSentence();
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		if (this._saveFileInfo === null) {
			return;
		}
		
		if (this._isThumbnailVisible()) {
			this._drawThumbnailMap(x, y);
		}
		
		this._drawMapName(x, y);
		this._drawSentenceZone(x, y);
	}

	getWindowWidth() {
		return this._width;
	}

	getWindowHeight() {
		return this._height;
	}

	getWindowTextUI() {
		return root.queryTextUI('face_window');
	}

	getLoadSaveSentenceSpaceY() {
		return 38;
	}

	getTitlePartsCount() {
		return this.isSentenceLong() ? 8 : 7;
	}

	isSentenceLong() {
		return DataConfig.isHighResolution();
	}

	_isThumbnailVisible() {
		return true;
	}

	_isSceneMap() {
		return this._saveFileInfo.getSceneType() !== SceneType.REST;
	}

	_getBackgroundImage() {
		return this._getRestBackgroundImage();
	}

	_drawThumbnailMap(x?, y?) {
		var cacheWidth, cacheHeight;
		var mapData = null;
		var image = null; 
		var isMap = this._isSceneMap();
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var graphicsManager = root.getGraphicsManager();
		var alpha = this._getMapAlpha();
		
		if (isMap) {
			mapData = this._saveFileInfo.getMapInfo();
			cacheWidth = mapData.getMapWidth() * GraphicsFormat.MAPCHIP_WIDTH;
			cacheHeight = mapData.getMapHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		}
		else {
			image = this._getBackgroundImage();
			if (image === null) {
				return;
			}
			
			cacheWidth = image.getWidth();
			cacheHeight = image.getHeight();
		}
		
		if (this._picCache !== null) {
			if (this._picCache.isCacheAvailable()) {
				this._picCache.setAlpha(alpha);
				this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
				return;
			}
		}
		else {
			this._picCache = graphicsManager.createCacheGraphics(cacheWidth, cacheHeight);
		}
		
		graphicsManager.setRenderCache(this._picCache);
		if (isMap) {
			root.drawMapAll(mapData);
			this._drawUnitMark();
		}
		else {
			image.draw(0, 0);
		}
		graphicsManager.resetRenderCache();
		
		this._picCache.setAlpha(alpha);
		this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
	}

	_drawUnitMark() {
		var obj = this._saveFileInfo.custom;
		var colorArray = this._getMarkColor();
		
		if (typeof obj.playerArrayX === 'undefined') {
			return;
		}
		
		this._drawUnitMarkInternal(obj.playerArrayX, obj.playerArrayY, colorArray[0]);
		this._drawUnitMarkInternal(obj.enemyArrayX, obj.enemyArrayY, colorArray[1]);
		this._drawUnitMarkInternal(obj.allyArrayX, obj.allyArrayY, colorArray[2]);
	}

	_drawUnitMarkInternal(arrayX?, arrayY?, color?) {
		var i;
		var count = arrayX.length;
		var canvas = root.getGraphicsManager().getCanvas();
		var width = GraphicsFormat.MAPCHIP_WIDTH;
		var height = GraphicsFormat.MAPCHIP_HEIGHT;
		
		canvas.setFillColor(color, 210);
		canvas.setStrokeInfo(color, 210, 1, false);
		
		for (i = 0; i < count; i++) {
			canvas.drawEllipse(arrayX[i] * width, arrayY[i] * height, width, height);
		}
	}

	_drawMapName(x?, y?) {
		var text;
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var mapInfo = this._saveFileInfo.getMapInfo();
		var titleCount = this._getTitlePartsCount();
		var width = TitleRenderer.getTitlePartsWidth() * (titleCount + 2);
		var sx = x + Math.floor((this.getWindowWidth() - width) / 2) - this.getWindowXPadding();
		
		if (mapInfo !== null) {
			text = ChapterRenderer.getChapterText(mapInfo);
			text += '  ';
			text += mapInfo.getName();
		}
		else {
			text = root.getRestPreference().getCompleteSaveTitle();
		}
		
		TextRenderer.drawFixedTitleText(sx, y - 48, text, color, font, TextFormat.CENTER, pic, titleCount);
	}

	_drawEmptyMap(x?, y?) {
		var textui = root.queryTextUI('default_window');
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var range = createRangeObject(x, y, width, height);
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, StringTable.HideData_Unknown, -1, color, font);
	}

	_drawSentenceZone(x?, y?) {
		var i;
		var count = this._groupArray.length;
		var width = (this.getTitlePartsCount() + 3) * TitleRenderer.getTitlePartsWidth();
		
		x += Math.floor((this._width - width) / 2);
		y += this._height - (count * this.getLoadSaveSentenceSpaceY()) - 60;
		
		for (i = 0; i < count; i++) {
			this._groupArray[i].drawLoadSaveSentence(x, y);
			y += this._groupArray[i].getLoadSaveSentenceCount() * this.getLoadSaveSentenceSpaceY();
		}
	}

	_getRestBackgroundImage() {
		var area;
		var obj = this._saveFileInfo.custom;
		var list = root.getBaseData().getRestAreaList();
		
		if (typeof obj.areaId === 'undefined') {
			return null;
		}
		
		area = list.getDataFromId(obj.areaId);
		if (area === null) {
			return null;
		}
		
		return area.getBackgroundImage();
	}

	_getMapAlpha() {
		return 255;
	}

	_getMarkColor() {
		return [0x12fcee, 0xef3242, 0x08f511];
	}

	_getTitleTextUI() {
		return root.queryTextUI('objective_title');
	}

	_getTitlePartsCount() {
		return 7;
	}

	_configureSentence(groupArray?) {
		if (typeof this._saveFileInfo.custom.leaderName !== 'undefined') {
			groupArray.appendObject(LoadSaveSentence.Leader);
		}
		
		if (root.getBaseData().getDifficultyList().getCount() > 0) {
			groupArray.appendObject(LoadSaveSentence.Time);
		}
	}
}

class BaseLoadSaveSentence extends BaseObject {

	_detailWindow: any = null;

	setParentWindow(detailWindow?) {
		this._detailWindow = detailWindow;
	}

	setSaveFileInfo(saveFileInfo?) {
	}

	moveLoadSaveSentence() {
		return MoveResult.CONTINUE;
	}

	drawLoadSaveSentence(x?, y?) {
	}

	getLoadSaveSentenceCount() {
		return 1;
	}

	_drawTitle(x?, y?) {
		var textui = this._getSentenceTextUI();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var pic = textui.getUIImage();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, this._detailWindow.getTitlePartsCount());
	}

	_getSentenceTextUI() {
		return root.queryTextUI('saveexplanation_title');
	}
}

namespace LoadSaveSentence {
export class Leader extends BaseLoadSaveSentence {

	_value: any = 0;

	_saveFileInfo: any = null;

	setSaveFileInfo(saveFileInfo?) {
		this._saveFileInfo = saveFileInfo;
	}

	drawLoadSaveSentence(x?, y?) {
		var obj = this._saveFileInfo.custom;
		
		this._drawTitle(x, y);
		this._drawLeaderCharChip(x, y, obj);
		this._drawLeaderName(x, y, obj);
		this._drawLevel(x, y, obj);
	}

	_drawLeaderCharChip(x?, y?, obj?) {
		var unitRenderParam;
		
		if (typeof obj.binary !== 'undefined') {
			unitRenderParam = StructureBuilder.buildUnitRenderParam();
			unitRenderParam.handle = deserializeResourceHandle(obj.binary);
			unitRenderParam.colorIndex = 0;
			UnitRenderer.drawCharChip(x + this._getLeaderOffsetX(), y + this._getLeaderOffsetY() - 10, unitRenderParam);
		}
	}

	_drawLeaderName(x?, y?, obj?) {
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var dy = this._getLeaderOffsetY();
		var length = 130;
		
		if (typeof obj.leaderName !== 'undefined') {
			length += this._detailWindow.isSentenceLong() ? 20 : 0;
			TextRenderer.drawKeywordText(x + 70, y + this._getLeaderOffsetY(), obj.leaderName, length, color, font);
		}
	}

	_drawLevel(x?, y?, obj?) {
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var dy = this._getLeaderOffsetY();
		
		if (typeof obj.leaderLv !== 'undefined') {
			x += this._detailWindow.isSentenceLong() ? 20 : 0;
			TextRenderer.drawKeywordText(x + 180, y + dy, 'Lv', -1, color, font);
			NumberRenderer.drawNumber(x + 210, y + dy, obj.leaderLv);
		}
	}

	_getLeaderOffsetX() {
		return 24;
	}

	_getLeaderOffsetY() {
		return 18;
	}
}

export class Time extends BaseLoadSaveSentence {

	_saveFileInfo: any = 0;

	setSaveFileInfo(saveFileInfo?) {
		this._saveFileInfo = saveFileInfo;
	}

	drawLoadSaveSentence(x?, y?) {
		this._drawTitle(x, y);
		this._drawTurn(x, y);
		this._drawTimeText(x, y);
		this._drawTimeNumber(x, y);
	}

	_drawTurn(x?, y?) {
		var dx, n;
		
		if (this._saveFileInfo.getSceneType() !== SceneType.FREE) {
			return;
		}
		
		n = this._saveFileInfo.getTurnCount();
		if (n >= 100) {
			dx = 18;
		}
		else if (n >= 10) {
			dx = 24;
		}
		else {
			dx = 30;
		}
		
		NumberRenderer.drawAttackNumberColor(x + dx, y + this._getTimeOffsetY() + this._getTurnOffsetY(), n, 1, 255);
	}

	_drawTimeText(x?, y?) {
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x + 70, y + this._getTimeOffsetY(), StringTable.PlayTime, -1, color, font);
	}

	_drawTimeNumber(x?, y?) {
		x += this._detailWindow.isSentenceLong() ? 20 : 0;
		ContentRenderer.drawPlayTime(x + 180, y + this._getTimeOffsetY(), this._saveFileInfo.getPlayTime());
	}

	_getTimeOffsetY() {
		return 18;
	}

	_getTurnOffsetY() {
		return 0;
	}
}
}

class LoadSaveControl {

	static getLoadScreenObject() {
		return DataConfig.isSaveScreenExtended() ? LoadSaveScreenEx : LoadSaveScreen;
	}

	static getSaveScreenObject() {
		return DataConfig.isSaveScreenExtended() ? DataSaveScreenEx : DataSaveScreen;
	}
}
