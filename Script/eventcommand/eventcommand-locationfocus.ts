
class LocationFocusMode {

	static SCROLL: any = 0;

	static CURSOR: any = 1;
}

class LocationFocusEventCommand extends BaseEventCommand {

	_counter: any = null;

	_focusCursor: any = null;

	_mapLineScroll: any = null;

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
		
		if (mode === LocationFocusMode.SCROLL) {
			result = this._moveScroll();
		}
		else if (mode === LocationFocusMode.CURSOR) {
			result = this._moveCursor();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === LocationFocusMode.SCROLL) {
			this._drawScroll();
		}
		else if (mode === LocationFocusMode.CURSOR) {
			this._drawCursor();
		}
	}

	mainEventCommand() {
		var pos = this._getFocusPos();
		
		if (pos.x !== -1 && pos.y !== -1) {
			this._checkFocusPos(pos);
		}
	}

	_prepareEventCommandMemberData() {
		this._counter = createObject(CycleCounter);
		this._focusCursor = createObject(FocusCursor);
		this._mapLineScroll = createObject(MapLineScroll);
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var pos = this._getFocusPos();
		
		if (pos.x === -1 || pos.y === -1) {
			return EnterResult.NOTENTER;
		}
		
		this._counter.setCounterInfo(94);
		
		// If "Scroll Speed" is not high speed, startLineScroll scrolls until the specified position.
		// So no need to execute "Screen Scroll" before "Focus on Location".
		this._mapLineScroll.startLineScroll(pos.x, pos.y);
		this.changeCycleMode(LocationFocusMode.SCROLL);
		
		return EnterResult.OK;
	}

	_moveCursor() {
		this._focusCursor.moveCursor();
		
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._focusCursor.endCursor();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawCursor() {
		this._focusCursor.drawCursor();
	}

	_moveScroll() {
		var pos;
		
		if (this._mapLineScroll.moveLineScroll() !== MoveResult.CONTINUE) {
			pos = this._getFocusPos();
			this._focusCursor.setPos(pos.x, pos.y);
			this.changeCycleMode(LocationFocusMode.CURSOR);
		}
		
		return MoveResult.CONTINUE;
	}

	_drawScroll() {
	}

	_checkFocusPos(pos?) {
		this._focusCursor.setPos(pos.x, pos.y);
		MapView.setScroll(pos.x, pos.y);
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
