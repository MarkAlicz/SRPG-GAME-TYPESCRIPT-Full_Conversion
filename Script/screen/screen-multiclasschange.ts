
class MultiClassChangeMode {

	static TOP: any = 0;

	static HELP: any = 1;

	static CHANGEQUESTION: any = 2;

	static ANIME: any = 3;

	static NOCHANGE: any = 4;
}

class MultiClassChangeScreen extends BaseScreen {

	_unit: any = null;

	_isMapCall: any = false;

	_classInfoWindow: any = null;

	_classParameterWindow: any = null;

	_classSelectWindow: any = null;

	_infoWindow: any = null;

	_questionWindow: any = null;

	_dynamicAnime: any = null;

	_classEntryArray: any = null;

	_currentIndex: any = 0;

	_returnData: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MultiClassChangeMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === MultiClassChangeMode.HELP) {
			result = this._moveHelp();
		}
		else if (mode === MultiClassChangeMode.CHANGEQUESTION) {
			result = this._moveChangeQuestion();
		}
		else if (mode === MultiClassChangeMode.ANIME) {
			result = this._moveAnime();	
		}
		else if (mode === MultiClassChangeMode.NOCHANGE) {
			result = this._moveNoChangeMode();
		}
		
		this._moveInfoParameter();
		
		return result;
	}

	drawScreenCycle() {
		var mode = this.getCycleMode();
		
		if (mode !== MultiClassChangeMode.NOCHANGE) {
			this._drawMainWindow();
		}
		
		this._drawSubWindow();
		
		if (mode === MultiClassChangeMode.ANIME) {
			this._drawAnime();	
		}
	}

	drawScreenBottomText(textui?) {
		var text, classEntry;
		
		if (this._classEntryArray === null) {
			return;
		}
		
		if (this._classInfoWindow.getSkillInteraction().isInteraction()) {
			text = this._classInfoWindow.getSkillInteraction().getHelpText();
		}
		else {
			classEntry = this._classEntryArray[this._currentIndex];
			if (classEntry.isChange) {
				text = classEntry.cls.getDescription();
			}
			else {
				text = '';
			}
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('ClassChange');
	}

	getScreenResult() {
		return this._returnData;
	}

	getTotalWindowHeight() {
		return this._classInfoWindow.getWindowHeight() + this._classParameterWindow.getWindowHeight();
	}

	_prepareScreenMemberData(screenParam?) {
		this._unit = screenParam.unit;
		this._isMapCall = screenParam.isMapCall;
		this._classInfoWindow = createWindowObject(MultiClassInfoWindow, this);
		this._classParameterWindow = createWindowObject(MultiClassParameterWindow, this);
		this._classSelectWindow = createWindowObject(MultiClassSelectWindow, this);
		this._infoWindow = createWindowObject(InfoWindow, this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._dynamicAnime = createObject(DynamicAnime);
		this._classEntryArray = null;
		this._currentIndex = 0;
		this._returnData = null;
	}

	_completeScreenMemberData(screenParam?) {
		var classEntryArray = this._getClassEntryArray(screenParam);
		
		if (classEntryArray.length > 0) {
			this._questionWindow.setQuestionMessage(this._getQuestionMessage());
			this._classSelectWindow.setClassSelectData(this._unit, classEntryArray);
			this._classInfoWindow.setClassInfoData(this._unit, classEntryArray[0]);
			this._classParameterWindow.setClassParameterData(this._unit, classEntryArray[0]);
			
			this._classEntryArray = classEntryArray;
			this.changeCycleMode(MultiClassChangeMode.TOP);
		}
		else {
			// If class group doesn't exist, or class group is blank, class cannot be changed.
			this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChange);
			this.changeCycleMode(MultiClassChangeMode.NOCHANGE);
		}
	}

	_moveTop() {
		var index, input, recentlyInput;
		var result = MoveResult.CONTINUE;
		
		input = this._classSelectWindow.moveWindow();
		if (input === ScrollbarInput.SELECT) {
			if (this._classEntryArray[this._currentIndex].isChange) {
				this._classSelectWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(MultiClassChangeMode.CHANGEQUESTION);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._isMapCall) {
				this._returnData = null;
			}
				
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.NONE) {
			recentlyInput = this._classSelectWindow.getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				this._setHelpMode();
			}
			else {
				index = this._classSelectWindow.getClassEntryIndex();
				if (index !== this._currentIndex) {
					this._currentIndex = index;
					this._classInfoWindow.setClassInfoData(this._unit, this._classEntryArray[index]);
					this._classParameterWindow.setBonusStatus(this._unit, this._classEntryArray[index]);
				}
			}
		}
		
		return result;
	}

	_moveHelp() {
		if (!this._classInfoWindow.getSkillInteraction().isHelpMode()) {
			this._classSelectWindow.enableSelectCursor(true);
			this.changeCycleMode(MultiClassChangeMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveChangeQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				if (this._isMapCall) {
					this._setScreenResult();
					// Class change animation is displayed on the map, so end it here.
					return MoveResult.END;
				}
				
				this._startAnime();
				
				this.changeCycleMode(MultiClassChangeMode.ANIME);
			}
			else {
				this._classSelectWindow.enableSelectCursor(true);
				this.changeCycleMode(MultiClassChangeMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAnime() {
		var cls = this._classEntryArray[this._currentIndex];
		
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this._classInfoWindow.setClass(cls);
			this._classParameterWindow.notifyNewClass(this._unit, cls);
			this._classSelectWindow.enableSelectCursor(true);
			this.changeCycleMode(MultiClassChangeMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveNoChangeMode() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			this._playCancelSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveInfoParameter() {
		var mode = this.getCycleMode();
		
		if (mode !== MultiClassChangeMode.NOCHANGE) {
			this._classInfoWindow.moveWindow();
			this._classParameterWindow.moveWindow();
		}
		
		return MoveResult.CONTINUE;
	}

	_drawAnime() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_drawMainWindow() {
		var width = this._classSelectWindow.getWindowWidth() + this._classParameterWindow.getWindowWidth();
		var height = this._classSelectWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		width = this._classSelectWindow.getWindowWidth();
		height = this._classParameterWindow.getWindowHeight();
		
		this._classSelectWindow.drawWindow(x, y);
		this._classParameterWindow.drawWindow(x + width, y);
		this._classInfoWindow.drawWindow(x + width, y + height);
	}

	_drawSubWindow() {
		var x, y;
		var mode = this.getCycleMode();
		
		if (mode === MultiClassChangeMode.CHANGEQUESTION) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
		else if (mode === MultiClassChangeMode.NOCHANGE) {
			x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
			this._infoWindow.drawWindow(x, y);
		}
	}

	_startAnime() {
		var anime = root.queryAnime('classchange');
		var pos = this._classInfoWindow.getClassChangeAnimePos();
		var width = this._classSelectWindow.getWindowWidth();
		var height =  this._classSelectWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._dynamicAnime.startDynamicAnime(anime, x + pos.x, y + pos.y + this._classParameterWindow.getWindowHeight());
	}

	_setHelpMode() {
		var classEntry;
		
		if (this._classEntryArray === null) {
			return;
		}
		
		classEntry = this._classEntryArray[this._currentIndex];
		if (!classEntry.isChange) {
			return;
		}
		
		if (this._classInfoWindow.getSkillInteraction().setHelpMode()) {
			this._classSelectWindow.enableSelectCursor(false);
			this.changeCycleMode(MultiClassChangeMode.HELP);
		}
	}

	_setScreenResult() {
		this._returnData = this._classEntryArray[this._currentIndex].cls;
	}

	_getClassEntryArray(screenParam?) {
		return ClassChangeChecker.getClassEntryArray(screenParam.unit, screenParam.isMapCall);
	}

	_getQuestionMessage() {
		return StringTable.ClassChange_UnitClassChange;
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}
}

class MultiClassInfoWindowMode {

	static TOP: any = 0;

	static SKILL: any = 1;
}

class MultiClassInfoWindow extends BaseWindow {

	_unit: any = null;

	_targetClass: any = null;

	_motionId: any = 0;

	_isClassDraw: any = false;

	_animeData: any = null;

	_animeSimple: any = null;

	_animeRenderParam: any = null;

	_unitRenderParam: any = null;

	_isHelpMode: any = false;

	_handle: any = null;

	_skillInteraction: any = null;

	initialize() {
		this._skillInteraction = createObject(SkillInteraction);
	}

	setClassInfoData(unit?, classEntry?) {
		this._unit = unit;
		this._targetClass = classEntry.cls;
		this._isClassDraw = classEntry.isChange;
		this._setSkillData();
		this._setBattleMotionGraphics();
		
		this._handle = this._getTargetHandle();
		
		this.changeCycleMode(MultiClassInfoWindowMode.TOP);
	}

	moveWindowContent() {
		this._skillInteraction.moveInteraction();
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		var textui = this._getTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		this._drawWeaponTypeList(x, y, color, font, pic);
		this._drawSkillList(x, y, color, font, pic);
		
		if (this._isClassDraw) {
			this._drawClassGraphics(x, y);
		}
		else {
			TextRenderer.drawText(x + 60, y + 80, StringTable.HideData_Unknown, -1, color, font);
		}
		
		if (this._skillInteraction.isInteraction()) {
			this._skillInteraction.getInteractionWindow().drawWindow(x, y);
		}
	}

	getWindowWidth() {
		return 450;
	}

	getWindowHeight() {
		return 190;
	}

	
	// It's called when class change is executed.
	setClass(classEntry?) {
		if (this._animeRenderParam !== null) {
			this._animeRenderParam.alpha = 255;
		}
		else {
			this._unitRenderParam.alpha = 255;
		}
		
		Miscellaneous.changeClass(this._unit, classEntry.cls);
		this._unit.setHp(ParamBonus.getMhp(this._unit));
	}

	getClassChangeAnimePos() {
		return createPos(-50, 0);
	}

	getSkillInteraction() {
		return this._skillInteraction;
	}

	_setBattleMotionGraphics() {
		var alpha = 255;
		var animeData = BattlerChecker.findBattleAnime(this._targetClass, null);
		
		if (this._unit.getClass() !== this._targetClass) {
			alpha = 128;
		}
		
		if (DataConfig.isMotionGraphicsEnabled() && animeData !== null) {
			this._motionId = this._getMotionId();
			this._animeData = animeData;
			
			this._animeSimple = createObject(NonBattleAnimeSimple);
			this._animeSimple.setAnimeData(animeData);
			this._animeSimple.setMotionId(this._motionId);
			
			this._animeRenderParam = StructureBuilder.buildAnimeRenderParam();
			this._animeRenderParam.alpha = alpha;
			this._animeRenderParam.isRight = true;
			this._animeRenderParam.motionColorIndex = Miscellaneous.getMotionColorIndex(this._unit);
		}
		else {
			this._unitRenderParam = StructureBuilder.buildUnitRenderParam();
			this._unitRenderParam.alpha = alpha;
			this._unitRenderParam.handle = this._getTargetHandle();
		}
	}

	_setSkillData() {
		var i;
		var refList = this._targetClass.getSkillReferenceList();
		var count = refList.getTypeCount();
		var arr = [];
		var skillEntry;
		var data;
		
		for (i = 0; i < count; i++) {
			data = refList.getTypeData(i);
			if (!data.isHidden()) {
				skillEntry = StructureBuilder.buildMixSkillEntry();
				skillEntry.skill = data;
				skillEntry.objecttype = ObjectType.CLASS;
				arr.push(skillEntry);
			}
		}
		
		this._skillInteraction.setSkillArray(arr);
		this._skillInteraction.checkInitialTopic();
	}

	_drawWeaponTypeList(x?, y?, color?, font?, pic?) {
		var pos = this._getWeaponTypeListPos();
		
		x += pos.x;
		y += pos.y;
		
		WeaponTypeRenderer.drawTitle(x, y, color, font, pic);
		if (this._isClassDraw) {
			WeaponTypeRenderer.drawClassWeaponList(x, y + 60, this._targetClass);
		}
	}

	_drawSkillList(x?, y?, color?, font?, pic?) {
		var pos = this._getSkillListPos();
		
		x += pos.x;
		y += pos.y;
		
		SkillRenderer.drawTitle(x, y, color, font, pic);
		if (this._isClassDraw) {
			this._skillInteraction.getInteractionScrollbar().drawScrollbar(x, y + 60);
		}
	}

	_drawClassGraphics(x?, y?) {
		if (this._animeSimple !== null) {
			if (this._isDrawAllSpritesEnabled()) {
				this._drawAllSprites(x, y);
			}
			else {
				this._drawKeySprite(x, y);
			}
		}
		else {
			UnitRenderer.drawDefaultUnit(this._unit, x + 80, y + 85, this._unitRenderParam);
		}
	}

	_drawKeySprite(x?, y?) {
		var frameIndex = 0;
		var spriteIndex = this._animeData.getSpriteIndexFromType(this._motionId, frameIndex, SpriteType.KEY);
		var animeCoordinates = StructureBuilder.buildAnimeCoordinates();
		
		animeCoordinates.xBase = x + 96;
		animeCoordinates.yBase = y + 145;
		this._animeSimple.drawMotion(frameIndex, spriteIndex, this._animeRenderParam, animeCoordinates);
	}

	_drawAllSprites(x?, y?) {
		var i, dx, dy;
		var frameIndex = 0;
		var spriteIndex = this._animeData.getSpriteIndexFromType(this._motionId, frameIndex, SpriteType.KEY);
		var animeCoordinates = StructureBuilder.buildAnimeCoordinates();
		var keyX = this._animeData.getSpriteX(this._motionId, frameIndex, spriteIndex);
		var keyY = this._animeData.getSpriteY(this._motionId, frameIndex, spriteIndex);
		var spriteCount = this._animeData.getSpriteCount(this._motionId, frameIndex);
		
		for (i = 0; i < spriteCount; i++) {
			if (!this._animeData.isSpriteEnabled(this._motionId, frameIndex, i)) {
				continue;
			}
			
			if (this._animeData.getSpriteType(this._motionId, frameIndex, i) === SpriteType.WEAPON) {
				continue;
			}
			
			dx = this._animeData.getSpriteX(this._motionId, frameIndex, i) - keyX;
			dy = this._animeData.getSpriteY(this._motionId, frameIndex, i) - keyY;
			
			animeCoordinates.xBase = x + 96 + dx;
			animeCoordinates.yBase = y + 145 + dy;
			this._animeSimple.drawMotion(frameIndex, i, this._animeRenderParam, animeCoordinates);
		}
	}

	_getTargetHandle() {
		var xSrc, ySrc;
		var handle = this._targetClass.getCharChipResourceHandle();
		var isRuntime = handle.getHandleType() === ResourceHandleType.RUNTIME;
		var id = handle.getResourceId();
		var colorIndex = handle.getColorIndex();
		
		handle = this._unit.getCharChipResourceHandle();
		xSrc = handle.getSrcX();
		ySrc = handle.getSrcY();
		
		return root.createResourceHandle(isRuntime, id, colorIndex, xSrc, ySrc);
	}

	_getMotionId() {
		return MotionIdControl.getWaitId(this._unit, null);
	}

	_getWeaponTypeListPos() {
		return createPos(220, -10);
	}

	_getSkillListPos() {
		return createPos(220, 70);
	}

	_getTextUI() {
		return root.queryTextUI('decoration_title');
	}

	_isDrawAllSpritesEnabled() {
		return false;
	}
}

class MultiClassParameterWindow extends BaseWindow {

	_scrollbar: any = null;

	setClassParameterData(targetUnit?, classEntry?) {
		this._scrollbar = createScrollbarObject(StatusScrollbar, this);
		this._scrollbar.enableStatusBonus(true);
		this._scrollbar.setStatusFromUnit(targetUnit);
		this.setBonusStatus(targetUnit, classEntry);
	}

	moveWindowContent() {
		// Call moveScrollbarContent, not moveScrollbarCursor.
		// Obj MultiClassChangeScreen._classSelectWindow is speed up if the cursor move is occurred.
		this._scrollbar.moveScrollbarContent();
		
		return MoveResult.CONTINUE;
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

	setBonusStatus(unit?, targetClassEntry?) {
		var i, bonusArray, bonusArrayTarget;
		var newBonusArray = [];
		var count = ParamGroup.getParameterCount();
		
		if (targetClassEntry.isChange) {
			bonusArray = this.getClassBonusArray(unit.getClass());
			bonusArrayTarget = this.getClassBonusArray(targetClassEntry.cls);
			for (i = 0; i < count; i++) {
				newBonusArray[i] = bonusArrayTarget[i] - bonusArray[i];
			}
		}
		else {
			for (i = 0; i < count; i++) {
				newBonusArray[i] = 0;
			}
		}
		
		this._scrollbar.setStatusBonus(newBonusArray);
	}

	getClassBonusArray(cls?) {
		var i;
		var count = ParamGroup.getParameterCount();
		var bonusArray = [];
		
		for (i = 0; i < count; i++) {
			bonusArray[i] = ParamGroup.getParameterBonus(cls, i);
		}
		
		return bonusArray;
	}

	notifyNewClass(unit?, cls?) {
		this._scrollbar.setStatusFromUnit(unit);
		this.setBonusStatus(unit, cls);
	}
}

class MultiClassSelectWindow extends BaseWindow {

	_scrollbar: any = null;

	setClassSelectData(unit?, classEntryArray?) {
		var i, count;
		
		this._scrollbar = createScrollbarObject(MultiClassSelectScrollbar, this);
		this._scrollbar.setScrollFormation(1, 7);
		this._scrollbar.resetScrollData();
		
		count = classEntryArray.length;
		for (i = 0; i < count; i++) {
			this._scrollbar.objectSet(classEntryArray[i]);
		}
		
		this._scrollbar.objectSetEnd();
		
		this._scrollbar.setActive(true);
	}

	moveWindowContent() {
		return this._scrollbar.moveInput();
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowWidth() {
		return 160;
	}

	getWindowHeight() {
		return SceneManager.getLastScreen().getTotalWindowHeight();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}

	getRecentlyInputType() {
		return this._scrollbar.getRecentlyInputType();
	}

	getClassEntryIndex() {
		return this._scrollbar.getIndex();
	}
}

class MultiClassSelectScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (!object.isChange) {
			color = ColorValue.DISABLE;
		}
		
		TextRenderer.drawKeywordText(x, y, object.name, length, color, font);
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = true;
		
		if (!object.isChange) {
			isSelect = false;
		}
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
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


//------------------------------------------------------------------


class MetamorphozeScreen extends MultiClassChangeScreen {

	drawScreenBottomText(textui?) {
		var text, classEntry;
		
		if (this._classEntryArray === null) {
			return;
		}
		
		if (this._classInfoWindow.getSkillInteraction().isInteraction()) {
			text = this._classInfoWindow.getSkillInteraction().getHelpText();
		}
		else {
			classEntry = this._classEntryArray[this._currentIndex];
			if (classEntry.isChange && classEntry.metamorphozeData !== null) {
				text = classEntry.metamorphozeData.getDescription();
			}
			else {
				text = '';
			}
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('Metamorphoze');
	}

	_setScreenResult() {
		this._returnData = this._classEntryArray[this._currentIndex].metamorphozeData;
	}

	_getClassEntryArray(screenParam?) {
		var i, classEntry;
		var unit = screenParam.unit;
		var count = screenParam.refList.getTypeCount();
		var classEntryArray = [];
		
		for (i = 0; i < count; i++) {
			classEntry = this._createClassEntry(unit, screenParam.refList.getTypeData(i));
			classEntryArray.push(classEntry);
		}
		
		return classEntryArray;
	}

	_createClassEntry(unit?, metamorphozeData?) {
		var classEntry = StructureBuilder.buildMultiClassEntry();
		
		classEntry.cls = metamorphozeData.getClass();
		classEntry.isChange = MetamorphozeControl.isMetamorphozeAllowed(unit, metamorphozeData);
		if (classEntry.isChange) {
			classEntry.name = metamorphozeData.getName();
		}
		else {
			classEntry.name = StringTable.HideData_Question;
		}
		
		classEntry.metamorphozeData = metamorphozeData;
		
		return classEntry;
	}

	_getQuestionMessage() {
		return StringTable.Metamorphoze_Change;
	}
}
