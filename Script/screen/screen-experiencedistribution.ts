
class ExperienceDistributionScreenMode {

	static TOP: any = 0;

	static INPUT: any = 1;

	static LEVEL: any = 2;

	static HELP: any = 3;
}

class ExperienceDistributionScreen extends BaseScreen {

	_levelupUnitWindow: any = null;

	_itemUserWindow: any = null;

	_bonusPointWindow: any = null;

	_bonusInputWindow: any = null;

	_restrictedLevelupObject: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ExperienceDistributionScreenMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ExperienceDistributionScreenMode.INPUT) {
			result = this._moveInput();
		}
		else if (mode === ExperienceDistributionScreenMode.LEVEL) {
			result = this._moveLevel();
		}
		else if (mode === ExperienceDistributionScreenMode.HELP) {
			result = this._moveHelp();
		}
		
		this._itemUserWindow.moveWindow();
		
		return result;
	}

	drawScreenCycle() {
		var xInfo, yInfo, window;
		var mode = this.getCycleMode();
		var width = this._levelupUnitWindow.getWindowWidth() + this._itemUserWindow.getWindowWidth();
		var height = this._itemUserWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._levelupUnitWindow.drawWindow(x, y);
		this._itemUserWindow.drawWindow(x + this._levelupUnitWindow.getWindowWidth(), y);
		
		xInfo = (x + width) - this._bonusPointWindow.getWindowWidth();
		yInfo = (y - this._bonusPointWindow.getWindowHeight());
		this._bonusPointWindow.drawWindow(xInfo, yInfo);
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			window = this._itemUserWindow.getSkillInteraction().getInteractionWindow();
			// xInfo = (x + this._levelupUnitWindow.getWindowWidth()) - window.getWindowWidth();
			xInfo = x;
			yInfo = (y + height) - window.getWindowHeight();
			window.drawWindow(xInfo, yInfo);
		}
		
		if (mode === ExperienceDistributionScreenMode.INPUT) {
			x = LayoutControl.getCenterX(-1, this._bonusInputWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._bonusInputWindow.getWindowHeight());
			this._bonusInputWindow.drawWindow(x, y);
		}
		
		if (mode === ExperienceDistributionScreenMode.LEVEL) {
			this._restrictedLevelupObject.drawRestrictedLevelupObject();
		}
	}

	drawScreenBottomText(textui?) {
		var text = '';
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			text = this._itemUserWindow.getSkillInteraction().getHelpText();
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('ExperienceDistribution');
	}

	_prepareScreenMemberData(screenParam?) {
		this._levelupUnitWindow = createWindowObject(LevelupUnitWindow, this);
		this._itemUserWindow = createWindowObject(ItemUserWindow, this);
		this._bonusInputWindow = createWindowObject(BonusInputWindow, this);
		this._bonusPointWindow = createWindowObject(BonusPointWindow, this);
		this._restrictedLevelupObject = createObject(RestrictedLevelupObject);
	}

	_completeScreenMemberData(screenParam?) {
		this._levelupUnitWindow.setLevelupUnitData();
		this._itemUserWindow.setItemUserData(this._levelupUnitWindow.getTargetUnit());
		
		this._processMode(ExperienceDistributionScreenMode.TOP);
	}

	_moveTop() {
		var recentlyInput;
		var input = this._levelupUnitWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			if (this._isUnitEnabled(this._levelupUnitWindow.getChildScrollbar().getObject())) {
				this._processMode(ExperienceDistributionScreenMode.INPUT);
			}
			else {
				this._playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			recentlyInput = this._levelupUnitWindow.getChildScrollbar().getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				if (this._itemUserWindow.getSkillInteraction().setHelpMode()) {
					this._processMode(ExperienceDistributionScreenMode.HELP);
				}
			}
			
			if (this._levelupUnitWindow.isIndexChanged()) {
				this._itemUserWindow.setItemUserData(this._levelupUnitWindow.getTargetUnit());
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveInput() {
		if (this._bonusInputWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._bonusInputWindow.getInputExp() === -1) {
				this._processMode(ExperienceDistributionScreenMode.TOP);
			}
			else {
				this._processMode(ExperienceDistributionScreenMode.LEVEL);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveLevel() {
		if (this._restrictedLevelupObject.moveRestrictedLevelupObject() !== MoveResult.CONTINUE) {
			this._itemUserWindow.setItemUserData(this._levelupUnitWindow.getTargetUnit());
			this._processMode(ExperienceDistributionScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveHelp() {
		if (!this._itemUserWindow.getSkillInteraction().isHelpMode()) {
			this._processMode(ExperienceDistributionScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_processMode(mode?) {
		if (mode === ExperienceDistributionScreenMode.TOP) {
			this._levelupUnitWindow.enableSelectCursor(true);
		}
		else if (mode === ExperienceDistributionScreenMode.INPUT) {
			this._levelupUnitWindow.enableSelectCursor(false);
			this._bonusInputWindow.setUnit(this._levelupUnitWindow.getTargetUnit());
		}
		else if (mode === ExperienceDistributionScreenMode.LEVEL) {
			this._restrictedLevelupObject.setUnitAndExp(this._levelupUnitWindow.getTargetUnit(), this._bonusInputWindow.getInputExp());
		}
		else if (mode === ExperienceDistributionScreenMode.HELP) {
			this._levelupUnitWindow.enableSelectCursor(false);
		}
		
		this.changeCycleMode(mode);
	}

	_isUnitEnabled(unit?) {
		return true;
	}

	_playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}
}

class RestrictedLevelupObjectMode {

	static TOP: any = 0;

	static LEVEL: any = 1;
}

class RestrictedLevelupObject extends BaseObject {

	_targetUnit: any = null;

	_exp: any = 0;

	_levelupView: any = null;

	_growthArray: any = null;

	_experienceNumberView: any = null;

	initialize() {
		this._levelupView = createObject(LevelupView);
		this._experienceNumberView = createWindowObject(ExperienceNumberView, this);
	}

	setUnitAndExp(targetUnit?, exp?) {
		this._targetUnit = targetUnit;
		this._exp = exp;
		this._experienceNumberView.setExperienceNumberData(this._targetUnit, this._exp);
		
		this.changeCycleMode(RestrictedLevelupObjectMode.TOP);
	}

	moveRestrictedLevelupObject() {
		var result;
		
		if (this.getCycleMode() === RestrictedLevelupObjectMode.TOP) {
			result = this._moveTop();
		}
		else {
			result = this._moveLevel();
		}
		
		return result;
	}

	drawRestrictedLevelupObject() {
		if (this.getCycleMode() === RestrictedLevelupObjectMode.TOP) {
			this._drawTop();
		}
		else {
			this._drawLevel();
		}
	}

	_moveTop() {
		var levelupViewParam;
		
		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			this._growthArray = RestrictedExperienceControl.obtainExperience(this._targetUnit, this._exp);
			if (this._growthArray === null) {
				return MoveResult.END;
			}
			
			levelupViewParam = this._createLevelupViewParam();
			this._levelupView.enterLevelupViewCycle(levelupViewParam);
			
			this.changeCycleMode(RestrictedLevelupObjectMode.LEVEL);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveLevel() {
		if (this._levelupView.moveLevelupViewCycle() !== MoveResult.CONTINUE) {
			ExperienceControl.plusGrowth(this._targetUnit, this._growthArray);
			ExperienceControl.obtainData(this._targetUnit);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawTop() {
		var x = LayoutControl.getCenterX(-1, this._experienceNumberView.getNumberViewWidth());
		var y = LayoutControl.getCenterY(-1, this._experienceNumberView.getNumberViewHeight());
		
		this._experienceNumberView.drawNumberView(x, y);
	}

	_drawLevel() {
		this._levelupView.drawLevelupViewCycle();
	}

	_createLevelupViewParam() {
		var anime = root.queryAnime('easylevelup');
		var size = Miscellaneous.getFirstKeySpriteSize(anime, 0);
		var levelupViewParam = StructureBuilder.buildLevelupViewParam();
		
		levelupViewParam.targetUnit = this._targetUnit;
		levelupViewParam.getExp = this._exp;
		levelupViewParam.xAnime = LayoutControl.getCenterX(-1, size.width);
		levelupViewParam.yAnime = LayoutControl.getCenterY(-1, size.height);
		levelupViewParam.anime = anime;
		levelupViewParam.growthArray = this._growthArray;
		
		return levelupViewParam;
	}
}

class BonusInputWindowMode {

	static NONE: any = 0;

	static INPUT: any = 1;
}

class BonusInputWindow extends BaseWindow {

	_unit: any = null;

	_isMaxLv: any = false;

	_exp: any = 0;

	_max: any = 0;

	_commandCursor: any = null;

	initialize() {
		this._commandCursor = createObject(CommandCursor);
		this._commandCursor.setCursorUpDown(2);
	}

	setUnit(unit?) {
		var bonus = root.getMetaSession().getBonus();
		
		this._unit = unit;
		this._isMaxLv = unit.getLv() === Miscellaneous.getMaxLv(unit);
		
		if (this._isExperienceValueAvailable()) {
			// At a rate of 10 with 500 bonus, a maximum of 50 Exp can be gained.
			this._max = Math.floor(bonus / this._getRate());
			if (this._max > DefineControl.getBaselineExperience()) {
				this._max = DefineControl.getBaselineExperience();
			}
			
			this._exp = 1;
			this.changeCycleMode(BonusInputWindowMode.INPUT);
		}
		else {
			this._exp = -1;
			this.changeCycleMode(BonusInputWindowMode.NONE);
		}
	}

	moveWindowContent() {
		var result;
		
		if (this.getCycleMode() === BonusInputWindowMode.INPUT) {
			result = this._moveInput();
		}
		else {
			result = this._moveNone();
		}
		
		return result;
	}

	drawWindowContent(x?, y?) {
		if (this.getCycleMode() === BonusInputWindowMode.INPUT) {
			this._drawInput(x, y);
		}
		else {
			this._drawNone(x, y);
		}
	}

	getWindowWidth() {
		return this.getCycleMode() === BonusInputWindowMode.INPUT ? 140 : 260;
	}

	getWindowHeight() {
		return 56;
	}

	getWindowTextUI() {
		return root.queryTextUI('sub_window');
	}

	getInputExp() {
		return this._exp;
	}

	_moveInput() {
		var inputType;
		
		if (InputControl.isSelectAction()) {
			this._changeBonus();
			return MoveResult.END;
		}
		
		if (InputControl.isCancelAction()) {
			this._cancelExp();
			return MoveResult.END;
		}
		
		inputType = this._commandCursor.moveCursor();
		if (inputType === InputType.UP || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			if (++this._exp > this._max) {
				this._exp = 1;
			}
		}
		else if (inputType === InputType.DOWN || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			if (--this._exp < 1) {
				this._exp = this._max;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveNone() {
		if (InputControl.isSelectAction() || InputControl.isCancelAction()) {
			this._cancelExp();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawInput(x?, y?) {
		NumberRenderer.drawAttackNumberCenter(x + 50, y, this._exp);
		
		this._commandCursor.drawCursor(x + 5, y, true, this._getCursorPicture());
	}

	_drawNone(x?, y?) {
		var text = this._getMessage();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var width = this.getWindowWidth() - (this.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (this.getWindowYPadding() * 2);
		var range = createRangeObject(x, y, width, height);
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	}

	_cancelExp() {
		this._exp = -1;
		this._playCancelSound();
	}

	_changeBonus() {
		var bonus = root.getMetaSession().getBonus();
		var n = Math.floor(this._exp * this._getRate());
		
		bonus -= n;
		
		root.getMetaSession().setBonus(bonus);
	}

	
	// Refer to this._unit if the rate is changed for each unit.
	_getRate() {
		// If the rate is 1, 1 bonus can grant 1 Exp.
		// If the rate is 10, 10 bonus can grant 1 Exp.
		return root.getUserExtension().getExperienceRate();
	}

	
	// Exp cannot be granted if bonus in possession is less than rate.
	_isExperienceValueAvailable() {
		// Exp cannot be granted if bonus in possession is less than rate.
		if (root.getMetaSession().getBonus() < this._getRate()) {
			return false;
		}
		
		if (this._isMaxLv) {
			return false;
		}
		
		return true;
	}

	_getMessage() {
		return this._isMaxLv ? StringTable.ExperienceDistribution_CannotLevelup : StringTable.ExperienceDistribution_BonusShortage;
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}

	_getCursorPicture() {
		return root.queryUI('menu_selectCursor');
	}
}

class BonusPointWindow extends BaseWindow {

	moveWindowContent() {
		return MoveResult.END;
	}

	drawWindowContent(x?, y?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, this._getCurrencySign(), -1, color, font);
		
		NumberRenderer.drawNumber(x + 90, y, root.getMetaSession().getBonus());
	}

	getWindowWidth() {
		return 140;
	}

	getWindowHeight() {
		return DefineControl.getCurrencyWindowHeight();
	}

	_getCurrencySign() {
		return StringTable.CurrencySign_Bonus;
	}
}

class LevelupUnitWindow extends BaseWindow {

	_scrollbar: any = null;

	setLevelupUnitData() {
		this._scrollbar = createScrollbarObject(LevelupUnitScrollbar, this);
		this._scrollbar.setScrollFormation(1, DataConfig.isHighResolution() ? 8 : 6);
		this._scrollbar.setDataList(PlayerList.getAliveList());
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

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	getTargetUnit() {
		return this._scrollbar.getObject();
	}
}

class LevelupUnitScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getTextLength();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		
		UnitRenderer.drawDefaultUnit(object, x, y + 4, unitRenderParam);
		TextRenderer.drawKeywordText(x + 60, y + 8, object.getName(), length, color, font);
		
		this._drawLevelInfo(x, y, object);
	}

	getObjectWidth() {
		return 260;
	}

	getObjectHeight() {
		return DataConfig.isHighResolution() ? 46 : 48;
	}

	_drawLevelInfo(x?, y?, object?) {
		var x2 = (x + this.getObjectWidth()) + this._getLevelInfoHorzMargin();
		
		y += 8;
		
		if (this._isLevelDisplayable(object)) {
			TextRenderer.drawSignText(x2, y, StringTable.Status_Level);
			NumberRenderer.drawNumber(x2 + this._getNumberInterval(), y, object.getLv());
		}
		else {
			TextRenderer.drawSignText(x2, y, StringTable.Status_Experience);
			NumberRenderer.drawNumber(x2 + this._getNumberInterval(), y, object.getExp());
			
			if (this._isCursorDisplayable(object)) {
				this._drawCursor(x2, y);
			}
		}
	}

	_drawCursor(x?, y?) {
		var ySrc = 0;
		var pic = root.queryUI('parameter_risecursor');
		var width = UIFormat.RISECURSOR_WIDTH / 2;
		var height = UIFormat.RISECURSOR_HEIGHT / 2;
		
		if (pic !== null) {
			pic.drawParts(x + 38, y - 4, 0, ySrc, width, height);	
		}
	}

	_getNumberInterval() {
		return 36;
	}

	_getLevelInfoHorzMargin() {
		return -56;
	}

	_getTextLength() {
		return this.getObjectWidth() - 90;
	}

	_isLevelDisplayable(object?) {
		return false;
	}

	_isCursorDisplayable(object?) {
		return object.getExp() >= Math.floor(DefineControl.getBaselineExperience() * 0.9);
	}
}
