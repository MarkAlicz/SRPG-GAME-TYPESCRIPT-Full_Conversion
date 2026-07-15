
class MapPosOperationMode {

	static ANIME: any = 0;
}

class MapPosOperationEventCommand extends BaseEventCommand {

	_type: any = 0;

	_pos: any = null;

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
		
		if (mode === MapPosOperationMode.ANIME) {
			result = this._moveAnime();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === MapPosOperationMode.ANIME) {
			this._drawAnime();
		}
	}

	mainEventCommand() {
		if (this._type === MapPosOperationType.MAPCHIP) {
			this._enterMapChip();
		}
	}

	_prepareEventCommandMemberData() {
		this._type = root.getEventCommandObject().getMapPosOperationType();
		this._pos = this._getFocusPos();
		this._dynamicAnime = createObject(DynamicAnime);
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var result = EnterResult.NOTENTER;
		
		if (this._type === MapPosOperationType.ANIME) {
			result = this._enterAnime();
		}
		else if (this._type === MapPosOperationType.MAPCHIP) {
			result = this._enterMapChip();
		}
		
		return result;
	}

	_moveAnime() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawAnime() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_enterAnime() {
		var eventCommandData = root.getEventCommandObject();
		var anime = eventCommandData.getMapAnime();
		var xPixel = LayoutControl.getPixelX(this._pos.x);
		var yPixel = LayoutControl.getPixelY(this._pos.y);
		var pos = LayoutControl.getMapAnimationPos(xPixel, yPixel, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
		
		this.changeCycleMode(MapPosOperationMode.ANIME);
		
		return EnterResult.OK;
	}

	_enterMapChip() {
		var eventCommandData = root.getEventCommandObject();
		var handle = eventCommandData.getMapChipGraphicsHandle();
		
		root.getCurrentSession().setMapChipGraphicsHandle(this._pos.x, this._pos.y, eventCommandData.isTransparentChip(), handle);
		
		return EnterResult.NOTENTER;
	}

	_getFocusPos() {
		var x, y, unit;
		var eventCommandData = root.getEventCommandObject();
		
		if (eventCommandData.isPosBase()) {
			x = eventCommandData.getX();
			y = eventCommandData.getY();
		}
		else {
			unit = eventCommandData.getTargetUnit();
			if (unit !== null) {
				x = unit.getMapX();
				y = unit.getMapY();
			}
			else {
				x = -1;
				y = -1;
			}
		}
		
		return createPos(x, y);
	}
}
