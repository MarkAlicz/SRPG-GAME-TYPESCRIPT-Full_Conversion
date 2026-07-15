
class UnitMetamorphozeEventCommand extends BaseEventCommand {

	_targetUnit: any = null;

	_metamorphozeData: any = null;

	_metamorphozeActionType: any = null;

	_dynamicAnime: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		this._dynamicAnime.drawDynamicAnime();
	}

	mainEventCommand() {
		if (this._metamorphozeActionType === MetamorphozeActionType.CHANGE) {
			MetamorphozeControl.startMetamorphoze(this._targetUnit, this._metamorphozeData);
		}
		else {
			MetamorphozeControl.clearMetamorphoze(this._targetUnit);
		}
	}

	_prepareEventCommandMemberData() {
		this._targetUnit = root.getEventCommandObject().getTargetUnit();
		this._metamorphozeData = root.getEventCommandObject().getMetamorphozeData();
		this._metamorphozeActionType = root.getEventCommandObject().getMetamorphozeActionType();
		this._dynamicAnime = createObject(DynamicAnime);
		
		if (this._targetUnit !== null && this._metamorphozeActionType === MetamorphozeActionType.CANCEL) {
			this._metamorphozeData = MetamorphozeControl.getMetamorphozeData(this._targetUnit);
		}
	}

	_checkEventCommand() {
		if (this._targetUnit === null || this._metamorphozeData === null) {
			return false;
		}
		
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var x = LayoutControl.getPixelX(this._targetUnit.getMapX());
		var y = LayoutControl.getPixelY(this._targetUnit.getMapY());
		var anime = this._metamorphozeActionType === MetamorphozeActionType.CHANGE ? this._metamorphozeData.getChangeAnime() : this._metamorphozeData.getCancelAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
		
		return EnterResult.OK;
	}
}
