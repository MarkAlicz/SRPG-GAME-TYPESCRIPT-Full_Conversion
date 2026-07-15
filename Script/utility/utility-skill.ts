
class SkillProjectorFlag {

	static TEXT: any = 0x01;

	static ANIME: any = 0x02;

	static TEXTANIME: any = 0x03;
}

class SkillProjector extends BaseObject {

	_flag: any = 0;

	_projectorText: any = null;

	_projectorAnime: any = null;

	setupProjector(battleType?, battleObject?) {
		this._flag = this._getProjectorFlag();
		
		if (this._flag & SkillProjectorFlag.TEXT) {
			this._projectorText = createObject(TextSkillProjector);
			this._projectorText.setupProjector(battleType, battleObject);
		}
		
		if (this._flag & SkillProjectorFlag.ANIME) {
			this._projectorAnime = createObject(AnimeSkillProjector);
			this._projectorAnime.setupProjector(battleType, battleObject);
		}
	}

	startProjector(rightSkillArray?, leftSkillArray?, isRight?) {
		if (this._flag & SkillProjectorFlag.TEXT) {
			this._projectorText.startProjector(rightSkillArray, leftSkillArray, isRight);
		}
		
		if (this._flag & SkillProjectorFlag.ANIME) {
			this._projectorAnime.startProjector(rightSkillArray, leftSkillArray, isRight);
		}
	}

	moveProjector() {
		var result1 = MoveResult.END;
		var result2 = MoveResult.END;
		
		if (this._flag & SkillProjectorFlag.TEXT) {
			result1 = this._projectorText.moveProjector();
		}
		
		if (this._flag & SkillProjectorFlag.ANIME) {
			result2 = this._projectorAnime.moveProjector();
		}
		
		return result1 === MoveResult.END && result2 === MoveResult.END ? MoveResult.END : MoveResult.CONTINUE;
	}

	drawProjector() {
		if (this._flag & SkillProjectorFlag.TEXT) {
			this._projectorText.drawProjector();
		}
		
		if (this._flag & SkillProjectorFlag.ANIME) {
			this._projectorAnime.drawProjector();
		}	
	}

	_getProjectorFlag() {
		// return SkillProjectorFlag.TEXTANIME
		return DataConfig.isSkillAnimeEnabled() ? SkillProjectorFlag.ANIME : SkillProjectorFlag.TEXT;
	}
}

class AnimeSkillProjector extends BaseObject {

	_battleType: any = 0;

	_battleObject: any = null;

	_order: any = null;

	_rightSkillArray: any = null;

	_leftSkillArray: any = null;

	_isRight: any = false;

	_rightAnime: any = null;

	_leftAnime: any = null;

	_rightIndex: any = 0;

	_leftIndex: any = 0;

	setupProjector(battleType?, battleObject?) {
		this._battleType = battleType;
		this._battleObject = battleObject;
		this._order = battleObject.getAttackOrder();
	}

	startProjector(rightSkillArray?, leftSkillArray?, isRight?) {
		this._rightSkillArray = rightSkillArray;
		this._leftSkillArray = leftSkillArray;
		this._isRight = isRight;
		this._rightAnime = this._getNextAnime(rightSkillArray, true);
		this._leftAnime = this._getNextAnime(leftSkillArray, false);
	}

	moveProjector() {
		var result = MoveResult.CONTINUE;
		
		if (this._rightAnime !== null) {
			if (this._moveAnime(this._rightAnime) !== MoveResult.CONTINUE) {
				this._rightAnime = this._getNextAnime(this._rightSkillArray, true);
			}
		}
		
		if (this._leftAnime !== null) {
			if (this._moveAnime(this._leftAnime) !== MoveResult.CONTINUE) {
				this._leftAnime = this._getNextAnime(this._leftSkillArray, false);
			}
		}
		
		if (this._rightAnime === null && this._leftAnime === null) {
			result = MoveResult.END;
		}
		
		return result;
	}

	drawProjector() {
		if (this._rightAnime !== null) {
			this._drawAnime(this._rightAnime);
		}
		
		if (this._leftAnime !== null) {
			this._drawAnime(this._leftAnime);
		}
	}

	_getNextAnime(skillArray?, isRight?) {
		var i, anime;
		var index = isRight ? this._rightIndex : this._leftIndex;
		var object = null;
		
		for (i = index; i < skillArray.length; i++) {
			index++;
			if (this._battleType === BattleType.REAL) {
				anime = skillArray[i].getRealAnime();
				if (anime !== null) {
					object = this._createRealSkillEffect(anime, isRight);
					break;
				}
			}
			else {
				anime = skillArray[i].getEasyAnime();
				if (anime !== null) {
					object = this._createEasySkillEffect(anime, isRight);
					break;
				}
			}	
		}
		
		if (isRight) {
			this._rightIndex = index;
		}
		else {
			this._leftIndex = index;
		}
		
		return object;
	}

	_moveAnime(anime?) {
		return anime.isEffectLast() ? MoveResult.END : MoveResult.CONTINUE;
	}

	_drawAnime(anime?) {
	}

	_createRealSkillEffect(anime?, isRight?) {
		var battler = this._battleObject.getBattler(isRight);
		var pos = battler.getEffectPos(anime);
		var x = pos.x;
		var y = pos.y;
		var scrollValue = AttackControl.getBattleObject().getAutoScroll().getScrollX();
		var offset = root.getAnimePreference().getSkillAnimeOffset() + 192;
		
		if (x - scrollValue < 0) {
			x = 0 + offset;
		}
		else if (x - scrollValue > RealBattleArea.WIDTH) {
			x = RealBattleArea.WIDTH - offset;
		}
		
		return this._battleObject.createEffect(anime, x, y, isRight, false);
	}

	_createEasySkillEffect(anime?, isRight?) {
		var battler = this._battleObject.getBattler(isRight);
		var pos = LayoutControl.getMapAnimationPos(battler.getMapUnitX(), battler.getMapUnitY(), anime);
		
		return this._battleObject.createEasyEffect(anime, pos.x, pos.y);
	}
}

class TextSkillProjector extends BaseObject {

	_battleType: any = 0;

	_battleObject: any = null;

	_rightAnime: any = null;

	_leftAnime: any = null;

	setupProjector(battleType?, battleObject?) {
		this._battleType = battleType;
		this._battleObject = battleObject;
	}

	startProjector(rightSkillArray?, leftSkillArray?, isRight?) {
		this._rightAnime = createObject(TextCustomEffect);
		this._rightAnime.setEffectData(rightSkillArray, this._battleObject, this._battleType, isRight, true);
		
		this._leftAnime = createObject(TextCustomEffect);
		this._leftAnime.setEffectData(leftSkillArray, this._battleObject, this._battleType, isRight, false);
		
		this._playSkillInvocationSound();
	}

	moveProjector() {
		var result = MoveResult.CONTINUE;
		
		if (this._rightAnime !== null) {
			if (this._moveAnime(this._rightAnime) !== MoveResult.CONTINUE) {
				this._rightAnime = null;
			}
		}
		
		if (this._leftAnime !== null) {
			if (this._moveAnime(this._leftAnime) !== MoveResult.CONTINUE) {
				this._leftAnime = null;
			}
		}
		
		if (this._rightAnime === null && this._leftAnime === null) {
			result = MoveResult.END;
		}
		
		return result;
	}

	drawProjector() {
		if (this._rightAnime !== null) {
			this._drawAnime(this._rightAnime);
		}
		
		if (this._leftAnime !== null) {
			this._drawAnime(this._leftAnime);
		}
	}

	_moveAnime(anime?) {
		if (this._battleType === BattleType.REAL) {
			return anime.isEffectLast() ? MoveResult.END : MoveResult.CONTINUE;
		}
		else {
			return anime.moveEffect();
		}
	}

	_drawAnime(anime?) {
		if (this._battleType !== BattleType.REAL) {
			anime.drawEffect(0, 0);
		}
	}

	_playSkillInvocationSound() {
		MediaControl.soundDirect('skillinvocation');
	}
}

class TextCustomEffect extends BaseCustomEffect {

	_battleType: any = null;

	_battleObject: any = null;

	_skillArray: any = null;

	_isRight: any = false;

	_isFront: any = false;

	_counter: any = null;

	setEffectData(skillArray?, battleObject?, battleType?, isRight?, isFront?) {
		this._battleType = battleType;
		this._battleObject = battleObject;
		this._skillArray = skillArray;
		this._isFront = isFront;
		this._isRight = isRight;
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(34);
		
		if (this._battleType === BattleType.REAL) {
			this._battleObject.pushCustomEffect(this);
		}
	}

	moveEffect() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.endEffect();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEffect(xScroll?, yScroll?) {
		var active, passive;
		var order = this._battleObject.getAttackOrder();
		
		if (this._isRight) {
			active = order.getActiveUnit();
			passive = order.getPassiveUnit();
		}
		else {
			active = order.getPassiveUnit();
			passive = order.getActiveUnit();
		}
		
		if (this._isFront) {
			this._drawArea(active, passive, this._skillArray, true);
		}
		else {
			this._drawArea(passive, active, this._skillArray, false);
		}
	}

	_drawArea(active?, passive?, skillArray?, isRight?) {
		var x, y, pos, width, max;
		
		if (this._battleType === BattleType.REAL) {	
			pos = this._battleObject.getEffectPosFromUnit(null, active);
			x = pos.x;
			y = pos.y + this._getAreaPlusY();
			
			width = this._getWidth();
			max = RealBattleArea.WIDTH;
			if (x + width > max) {
				x = max - width;
			}
			else if (x < 0) {
				x = 0;
			}
			
			this._drawAreaTitle(x, y, skillArray, active, isRight);
		}
		else {
			if (isRight) {
				y = Miscellaneous.getDyamicWindowY(active, passive, 145);
				x = LayoutControl.getCenterX(-1, this._getWidth() * 2);
			}
			else {
				y = Miscellaneous.getDyamicWindowY(passive, active, 145);
				x = LayoutControl.getCenterX(-1, this._getWidth() * 2) + this._getWidth();
			}
			
			if (y < Math.floor(root.getGameAreaHeight() / 2)) {
				y += this._getAreaPlusY();
			}
			else {
				y -= this._getHeight(skillArray);
			}
			
			this._drawAreaWindow(x, y, skillArray, active, isRight);
		}
	}

	_drawAreaTitle(x?, y?, skillArray?, unit?, isRight?) {
		var i;
		var count = skillArray.length;
		var textui = root.queryTextUI('skill_title');
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var pos = this._getAreaSkillPos();
		
		for (i = 0; i < count; i++) {
			TitleRenderer.drawTitleNoCache(pic, x, y, width, height, this._getTitlePartsCount(skillArray[i], font));
			SkillRenderer.drawSkill(x + pos.x, y + pos.y, skillArray[i], color, font);
			y += this._getAreaTitleVerticalInterval();
		}
	}

	_drawAreaWindow(x?, y?, skillArray?, unit?, isRight?) {
		var i;
		var count = skillArray.length;
		var textui = this._getWindowTextUI(unit);
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var width = this._getWidth();
		var height = this._getHeight(skillArray);
		var range = createRangeObject();
		
		if (count === 0) {
			return;
		}
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += DefineControl.getWindowXPadding();
		y += DefineControl.getWindowYPadding();
		
		for (i = 0; i < count; i++) {
			range.x = x + GraphicsFormat.ICON_WIDTH + 3;
			range.y = y;
			range.width = this._getWidth() - (DefineControl.getWindowXPadding() * 2) - (GraphicsFormat.ICON_WIDTH + 3);
			range.height = GraphicsFormat.ICON_HEIGHT;
			TextRenderer.drawRangeText(range, TextFormat.LEFT, skillArray[i].getName(), -1, color, font);
			
			GraphicsRenderer.drawImage(x, y, skillArray[i].getIconResourceHandle(), GraphicsType.ICON);
			
			y += GraphicsFormat.ICON_HEIGHT + 2;
		}
	}

	_getTitlePartsCount(skill?, font?) {
		var textWidth = TextRenderer.getTextWidth(skill.getName(), font) + (TitleRenderer.getTitlePartsWidth() * 2);
		var count = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
		
		return count > 4 ? count : 4;
	}

	_getHeight(skillArray?) {
		var count = skillArray.length;
		
		return ((count + 1) * GraphicsFormat.ICON_HEIGHT) + 10;
	}

	_getWidth() {
		return 190;
	}

	_getAreaPlusY() {
		return this._battleType === BattleType.REAL ? -40 : 98;
	}

	_getAreaSkillPos() {
		return createPos(42, 18);
	}

	_getAreaTitleVerticalInterval() {
		return 40;
	}

	_getWindowTextUI(unit?) {
		return Miscellaneous.getColorWindowTextUI(unit);
	}
}
