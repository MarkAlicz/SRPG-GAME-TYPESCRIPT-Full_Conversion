
class SkillChangeEventCommand extends BaseEventCommand {

	_targetUnit: any = null;

	_targetSkill: any = null;

	_increaseType: any = null;

	_skillChangeView: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._skillChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x = LayoutControl.getCenterX(-1, this._skillChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._skillChangeView.getNoticeViewHeight());
		
		this._skillChangeView.drawNoticeView(x, y);
	}

	mainEventCommand() {
		SkillChecker.arrangeSkill(this._targetUnit, this._targetSkill, this._increaseType);
	}

	_prepareEventCommandMemberData() {
		this._targetUnit = root.getEventCommandObject().getTargetUnit();
		this._targetSkill = root.getEventCommandObject().getTargetSkill();
		this._increaseType = root.getEventCommandObject().getIncreaseValue();
		this._skillChangeView = createWindowObject(SkillChangeNoticeView, this);
	}

	_checkEventCommand() {
		if (this._targetUnit === null || this._targetSkill === null) {
			return false;
		}
		
		if (this._increaseType === IncreaseType.ALLRELEASE) {
			this.mainEventCommand();
			return false;
		}
		
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		this._skillChangeView.setSkillChangeData(this._targetSkill, this._increaseType);
		
		return EnterResult.OK;
	}
}

class SkillChangeNoticeView extends BaseNoticeView {

	_targetSkill: any = null;

	_increaseType: any = 0;

	_titlePartsCount: any = 0;

	_text: any = '';

	setSkillChangeData(skill?, type?) {
		this._targetSkill = skill;
		this._increaseType = type;
		
		this._setTitlePartsCount();
		
		if (this._increaseType === IncreaseType.INCREASE) {
			this._playSkillChangeSound();
		}
	}

	setNoticeText(text?) {
		this._text = text;
	}

	drawNoticeViewContent(x?, y?) {
		var width;
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._text;
		var infoColor = this._increaseType === IncreaseType.INCREASE ? ColorValue.KEYWORD : ColorValue.INFO;
		
		if (text === '') {
			text = this._increaseType === IncreaseType.INCREASE ? StringTable.GetTitle_SkillChange : StringTable.LostTitle_SkillChange;
		}
		width = TextRenderer.getTextWidth(text, font) + 5;
		
		TextRenderer.drawKeywordText(x, y + this._getNoticeOffsetY(), text, -1, infoColor, font);
		SkillRenderer.drawSkill(x + width, y, this._targetSkill, color, font);
	}

	getTitlePartsCount() {
		return this._titlePartsCount;
	}

	_setTitlePartsCount() {
		var font = this.getTitleTextUI().getFont();
		var textWidth = TextRenderer.getTextWidth(this._targetSkill.getName(), font) + this._getNoticeInterval() + (TitleRenderer.getTitlePartsWidth() * 2);
		
		this._titlePartsCount = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
	}

	_playSkillChangeSound() {
		MediaControl.soundDirect('itemget');
	}
}
