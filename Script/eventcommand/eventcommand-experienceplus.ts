
class ExperiencePlusMode {

	static EXP: any = 0;

	static LEVEL: any = 1;
}

class ExperiencePlusType {

	static VALUE: any = 0;

	static LEVEL: any = 1;
}

// Even if the unit has a skill to increase the exp, ignore it at this event.

class ExperiencePlusEventCommand extends BaseEventCommand {

	_getExp: any = 0;

	_type: any = 0;

	_targetUnit: any = null;

	_levelupView: any = null;

	_experienceNumberView: any = null;

	_growthArray: any = null;

	_isMaxLv: any = false;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ExperiencePlusMode.EXP) {
			result = this._moveExp();
		}
		else if (mode === ExperiencePlusMode.LEVEL) {
			result = this._moveLevel();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ExperiencePlusMode.EXP) {
			this._drawExp();
		}
		else if (mode === ExperiencePlusMode.LEVEL) {
			this._drawLevel();
		}
	}

	mainEventCommand() {
		var i, levelCount;
		
		if (this._type === ExperiencePlusType.VALUE) {
			if (this._growthArray !== null) {
				ExperienceControl.plusGrowth(this._targetUnit, this._growthArray);
				ExperienceControl.obtainData(this._targetUnit);
			}
		}
		else {
			levelCount = this._getExp;
			for (i = 0; i < levelCount; i++) {
				ExperienceControl.directGrowth(this._targetUnit, 100);
				if (this._targetUnit.getLv() >= Miscellaneous.getMaxLv(this._targetUnit)) {
					break;
				}
			}
			
			ExperienceControl.obtainData(this._targetUnit);
		}
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._getExp = eventCommandData.getExperienceValue();
		this._type = eventCommandData.getExperiencePlusType();
		this._targetUnit = eventCommandData.getTargetUnit();
		this._levelupView = createObject(LevelupView);
		this._experienceNumberView = createWindowObject(ExperienceNumberView, this);
		this._growthArray = null;
		this._isMaxLv = false;
		
		if (this._targetUnit !== null) {
			this._isMaxLv = this._targetUnit.getLv() >= Miscellaneous.getMaxLv(this._targetUnit);
			if (!this._isMaxLv && this._type === ExperiencePlusType.VALUE) {
				this._growthArray = ExperienceControl.obtainExperience(this._targetUnit, this._getExp);
			}
		}
	}

	_checkEventCommand() {
		if (this._targetUnit === null || this._isMaxLv) {
			return false;
		}
		
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		this._experienceNumberView.setExperienceNumberData(this._targetUnit, this._getExp);
		
		this.changeCycleMode(ExperiencePlusMode.EXP);
		
		return EnterResult.OK;
	}

	_moveExp() {
		var levelupViewParam;
		
		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			if (this._growthArray !== null) {
				levelupViewParam = this._createLevelupViewParam();
				this._levelupView.enterLevelupViewCycle(levelupViewParam);
				
				this.changeCycleMode(ExperiencePlusMode.LEVEL);
			}
			else {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveLevel() {
		if (this._levelupView.moveLevelupViewCycle() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawExp() {
		var x = LayoutControl.getCenterX(-1, this._experienceNumberView.getNumberViewWidth());
		var y = LayoutControl.getCenterY(-1, this._experienceNumberView.getNumberViewHeight());
		
		if (!Miscellaneous.isPrepareScene()) {
			y = LayoutControl.getNotifyY();
		}
		
		this._experienceNumberView.drawNumberView(x, y);
	}

	_drawLevel() {
		this._levelupView.drawLevelupViewCycle();
	}

	_createLevelupViewParam() {
		var x, y, size, pos;
		var anime = root.queryAnime('easylevelup');
		var levelupViewParam = StructureBuilder.buildLevelupViewParam();
		
		if (Miscellaneous.isPrepareScene()) {
			size = Miscellaneous.getFirstKeySpriteSize(anime, 0);
			x = LayoutControl.getCenterX(-1, size.width);
			y = LayoutControl.getCenterY(-1, size.height);
			pos = createPos(x, y);
		}
		else {
			x = LayoutControl.getPixelX(this._targetUnit.getMapX());
			y = LayoutControl.getPixelY(this._targetUnit.getMapY());
			pos = LayoutControl.getMapAnimationPos(x, y, anime);
		}
		
		levelupViewParam.targetUnit = this._targetUnit;
		levelupViewParam.getExp = this._getExp;
		levelupViewParam.xAnime = pos.x;
		levelupViewParam.yAnime = pos.y;
		levelupViewParam.anime = anime;
		levelupViewParam.growthArray = this._growthArray;
		
		return levelupViewParam;
	}
}

class LevelupViewMode {

	static ANIME: any = 0;

	static GROWTH: any = 1;

	static FLOW: any = 2;
}

class LevelupView extends BaseObject {

	_targetUnit: any = null;

	_getExp: any = null;

	_xAnime: any = 0;

	_yAnime: any = 0;

	_anime: any = 0;

	_growthArray: any = null;

	_experienceParameterWindow: any = null;

	_dynamicAnime: any = null;

	_straightFlow: any = null;

	enterLevelupViewCycle(levelupViewParam?) {
		this._prepareMemberData(levelupViewParam);
		this._completeMemberData(levelupViewParam);
		
		return EnterResult.OK;
	}

	moveLevelupViewCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === LevelupViewMode.ANIME) {
			result = this._moveAnime();
		}
		else if (mode === LevelupViewMode.GROWTH) {
			result = this._moveGrowth();
		}
		else if (mode === LevelupViewMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	}

	drawLevelupViewCycle() {
		var mode = this.getCycleMode();
		
		if (mode === LevelupViewMode.ANIME) {
			this._drawAnime();
		}
		else if (mode === LevelupViewMode.GROWTH) {
			this._drawGrowth();
		}
		else if (mode === LevelupViewMode.FLOW) {
			this._drawFlow();
		}
	}

	_prepareMemberData(levelupViewParam?) {
		this._targetUnit = levelupViewParam.targetUnit;
		this._getExp = levelupViewParam.getExp;
		this._xAnime = levelupViewParam.xAnime;
		this._yAnime = levelupViewParam.yAnime;
		this._anime = levelupViewParam.anime;
		this._growthArray = levelupViewParam.growthArray;
		this._experienceParameterWindow = createWindowObject(ExperienceParameterWindow, this);
		this._dynamicAnime = createObject(DynamicAnime);
		this._straightFlow = createObject(StraightFlow);
	}

	_completeMemberData(levelupViewParam?) {
		this._straightFlow.setStraightFlowData(levelupViewParam);
		this._pushFlowEntries(this._straightFlow);
		
		this._experienceParameterWindow.setExperienceParameterData(this._targetUnit, this._growthArray);
		this._dynamicAnime.startDynamicAnime(this._anime, this._xAnime, this._yAnime);
		this.changeCycleMode(LevelupViewMode.ANIME);
	}

	_moveAnime() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(LevelupViewMode.GROWTH);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveGrowth() {
		if (this._experienceParameterWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._straightFlow.enterStraightFlow() === EnterResult.NOTENTER) {
				return MoveResult.END;
			}
			this.changeCycleMode(LevelupViewMode.FLOW);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveFlow() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawAnime() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_drawGrowth() {
		var x = LayoutControl.getCenterX(-1, this._experienceParameterWindow.getWindowWidth());
		var y = LayoutControl.getNotifyY();
		
		this._experienceParameterWindow.drawWindow(x, y);
	}

	_drawFlow() {
		this._straightFlow.drawStraightFlow();
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(NewSkillFlowEntry);
	}
}

class NewSkillFlowEntry extends BaseFlowEntry {

	_unit: any = null;

	_skillChangeView: any = null;

	_skillIndex: any = 0;

	enterFlowEntry(levelupViewParam?) {
		this._unit = levelupViewParam.targetUnit;
		
		if (this.isFlowSkip()) {
			SkillChecker.addAllNewSkill(this._unit);
			return EnterResult.NOTENTER;
		}
		
		this._skillChangeView = createWindowObject(SkillChangeNoticeView, this);
		
		if (!this._checkNewSkill()) {
			return EnterResult.NOTENTER;
		}
		
		return EnterResult.OK;
	}

	moveFlowEntry() {
		if (this._skillChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			if (!this._checkNewSkill()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		var x = LayoutControl.getCenterX(-1, this._skillChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._skillChangeView.getNoticeViewHeight());
		
		this._skillChangeView.drawNoticeView(x, y);
	}

	_checkNewSkill() {
		var i, newSkill;
		var count = this._unit.getNewSkillCount();
		
		for (i = this._skillIndex; i < count; i++) {
			newSkill = this._unit.getNewSkill(i);
			if (SkillChecker.addNewSkill(this._unit, newSkill)) {
				if (newSkill.getNewSkillType() === NewSkillType.NEW) {
					this._skillChangeView.setNoticeText(StringTable.GetTitle_NewSkill);
				}
				else {
					this._skillChangeView.setNoticeText(StringTable.GetTitle_PowerupSkill);
				}
				this._skillChangeView.setSkillChangeData(newSkill.getSkill(), IncreaseType.INCREASE);
				break;
			}
		}
		
		if (i === count) {
			return false;
		}
		
		this._skillIndex = i + 1;
		
		return true;
	}
}

class ExperienceNumberMode {

	static COUNT: any = 0;

	static WAIT: any = 1;
}

class ExperienceNumberView extends BaseObject {

	_unit: any = null;

	_exp: any = 0;

	_balancer: any = null;

	_counter: any = null;

	setExperienceNumberData(unit?, exp?) {
		var max;
		
		if (exp === 1) {
			// Even if the obtained exp is 1, play the sound.
			max = 0;
		}
		else {
			max = 2;
		}
		
		this._unit = unit;
		this._exp = exp;
		
		this._balancer = createObject(SimpleBalancer);
		this._balancer.setBalancerInfo(0, 100);
		this._balancer.setBalancerSpeed(10);
		this._balancer.startBalancerMove(exp);
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(max);
		this.changeCycleMode(ExperienceNumberMode.COUNT);
	}

	moveNumberView() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ExperienceNumberMode.COUNT) {
			result = this._moveCount();	
		}
		else if (mode === ExperienceNumberMode.WAIT) {
			result = this._moveWait();
		}
		
		return result;
	}

	drawNumberView(x?, y?) {
		this._drawExp(x, y);
	}

	getNumberViewWidth() {
		return (this._getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth();
	}

	getNumberViewHeight() {
		return TitleRenderer.getTitlePartsHeight();
	}

	_moveCount() {
		this._playNumberCount();
	
		if (this._balancer.moveBalancer() !== MoveResult.CONTINUE) {
			this._counter.setCounterInfo(30);
			this.changeCycleMode(ExperienceNumberMode.WAIT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveWait() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawExp(x?, y?) {
		var pos;
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = this._getTitlePartsCount();
		var exp = this._balancer.getCurrentValue();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		pos = this._getExpPos();
		NumberRenderer.drawAttackNumber(x + pos.x, y + pos.y, exp);
		
		pos = this._getTextPos();
		TextRenderer.drawText(x + pos.x, y + pos.y, StringTable.GetTitle_ExperiencePlus, -1, color, font);
	}

	_getTitleTextUI() {
		return root.queryTextUI('support_title');
	}

	_getTitlePartsCount() {
		return 6;
	}

	_getExpPos() {
		return createPos(55, 18);
	}

	_getTextPos() {
		return createPos(130, 23);
	}

	_playNumberCount() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			MediaControl.soundDirect('numbercount');
		}
	}
}

class ExperienceParameterWindow extends BaseWindow {

	_scrollbar: any = null;

	setExperienceParameterData(targetUnit?, growthArray?) {
		var i;
		var count = growthArray.length;
		var arr = [];
		
		for (i = 0; i < count; i++) {
			arr[i] = growthArray[i];
		}
		
		this._scrollbar = createScrollbarObject(StatusScrollbar, this);
		this._scrollbar.enableStatusBonus(true);
		this._scrollbar.setStatusFromUnit(targetUnit);
		this._scrollbar.setStatusBonus(arr);
	}

	moveWindowContent() {
		// If decide with this._scrollbar.moveInput() === ScrollbarInput.SELECT, detect the decision sound.
		this._scrollbar.moveScrollbarCursor();
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
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
}
