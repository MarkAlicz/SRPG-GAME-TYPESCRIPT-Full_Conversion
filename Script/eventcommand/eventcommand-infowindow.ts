
class InfoWindowEventCommand extends BaseEventCommand {

	_infoWindow: any = null;

	_xStart: any = 0;

	_yStart: any = 0;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x, y;
		
		if (this._xStart === -1 && this._xStart === -1) {
			x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
		}
		else {
			x = this._xStart;
			y = this._yStart;
		}
		
		this._infoWindow.drawWindow(x, y);
	}

	_prepareEventCommandMemberData() {
		this._infoWindow = createWindowObject(InfoWindow, this);
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._infoWindow.setInfoMessageAndType(eventCommandData.getMessage(), eventCommandData.getInfoType());
		
		if (eventCommandData.isCenterShow()) {
			this._xStart = -1;
			this._yStart = -1;
		}
		else {
			this._xStart = eventCommandData.getX();
			this._yStart = eventCommandData.getY();
		}
		
		return EnterResult.OK;
	}
}
