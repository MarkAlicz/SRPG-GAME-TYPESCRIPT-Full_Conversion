
class ClassChangeMode {

	static ANIME: any = 0;
}

class ClassChangeEventCommand extends BaseEventCommand {

	_targetUnit: any = null;

	_targetClass: any = null;

	_dynamicAnime: any = null;

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
		
		if (mode === ClassChangeMode.ANIME) {
			result = this._moveAnime();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ClassChangeMode.ANIME) {
			this._drawAnime();
		}
	}

	mainEventCommand() {
		var count;
		var mhpPrev = ParamBonus.getMhp(this._targetUnit);
		
		Miscellaneous.changeClass(this._targetUnit, this._targetClass);
		Miscellaneous.changeHpBonus(this._targetUnit, mhpPrev);
		
		// Increase the number of class changed.
		count = this._targetUnit.getClassUpCount();
		this._targetUnit.setClassUpCount(count + 1);
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._targetUnit = eventCommandData.getTargetUnit();
		this._targetClass = eventCommandData.getTargetClass();
		this._dynamicAnime = createObject(DynamicAnime);
	}

	_checkEventCommand() {
		if (this._targetUnit === null || this._targetClass === null) {
			return false;
		}
		
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		this._startClassChangeAnime();
		this.changeCycleMode(ClassChangeMode.ANIME);
		
		return EnterResult.OK;
	}

	_moveAnime() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawAnime() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_startClassChangeAnime() {
		var x, y, size, pos;
		var anime = root.queryAnime('classchange');
		
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
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}
}
