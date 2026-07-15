
class UnitFusionMode {

	static SLIDE: any = 0;

	static ANIME: any = 1;
}

class UnitFusionEventCommand extends BaseEventCommand {

	_fusionParam: any = null;

	_fusionAction: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		return this._fusionAction.moveFusionAction();
	}

	drawEventCommandCycle() {
		this._fusionAction.drawFusionAction();
	}

	mainEventCommand() {
		this._fusionAction.skipFusionAction();
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._fusionParam = StructureBuilder.buildFusionParam();
		this._fusionParam.parentUnit = eventCommandData.getUnit();
		this._fusionParam.targetUnit = eventCommandData.getTargetUnit();
		this._fusionParam.fusionData = eventCommandData.getFusionData();
		this._fusionParam.direction = eventCommandData.getDirectionType();
		
		this._fusionAction = this._getFusionAction(eventCommandData.getFusionActionType());
	}

	_checkEventCommand() {
		if (this._fusionParam.parentUnit === null || !this._fusionAction.setFusionParam(this._fusionParam)) {
			return false;
		}
		
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		this._fusionAction.openFusionAction();
		
		return EnterResult.OK;
	}

	_getFusionAction(type?) {
		var fusionAction;
		
		if (type === FusionActionType.CATCH) {
			fusionAction = createObject(CatchFusionAction);
		}
		else if (type === FusionActionType.RELEASE) {
			fusionAction = createObject(ReleaseFusionAction);
		}
		else {
			fusionAction = createObject(UnitTradeFusionAction);
		}
		
		return fusionAction;
	}
}

class FusionCommonMode {

	static SLIDE: any = 0;

	static ANIME: any = 1;

	static ERASE: any = 2;
}

class BaseFusionAction extends BaseObject {

	_parentUnit: any = null;

	_slideUnit: any = null;

	_direction: any = 0;

	_slideObject: any = null;

	_dynamicAnime: any = null;

	setFusionCommonObject() {
		this._slideObject = createObject(SlideObject);
		this._dynamicAnime = createObject(DynamicAnime);
	}

	openFusionAction(fusionParam?) {
	}

	moveFusionAction() {
		return MoveResult.END;
	}

	drawFusionAction() {
		var mode = this.getCycleMode();
		
		if (mode === FusionCommonMode.SLIDE) {
			this._drawSlide();
		}
		else if (mode === FusionCommonMode.ANIME) {
			this._drawAnime();
		}
		else if (mode === FusionCommonMode.ERASE) {
			this._drawErase();
		}
	}

	skipFusionAction() {
	}

	_moveSlide() {
		return this._slideObject.moveSlide();
	}

	_moveAnime() {
		return this._dynamicAnime.moveDynamicAnime();
	}

	_drawSlide() {
		this._slideObject.drawSlide();
	}

	_drawAnime() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_drawErase() {
	}

	_changeSlideMode() {
		var pixelIndex = 3;
		
		this._slideObject.setSlideData(this._slideUnit, this._direction, pixelIndex);
		this._slideObject.openSlide();
		this.changeCycleMode(FusionCommonMode.SLIDE);
	}

	_changeAnimeMode() {
		var x = LayoutControl.getPixelX(this._parentUnit.getMapX());
		var y = LayoutControl.getPixelY(this._parentUnit.getMapY());
		var anime = this._getFusionAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
		
		this.changeCycleMode(FusionCommonMode.ANIME);
	}

	_getFusionAnime() {
		return null;
	}
}

class CatchFusionAction extends BaseFusionAction {

	_fusionData: any = null;

	setFusionParam(fusionParam?) {
		var directionArray = [DirectionType.RIGHT, DirectionType.BOTTOM, DirectionType.LEFT, DirectionType.TOP];
		
		this._parentUnit = fusionParam.parentUnit;
		this._fusionData = fusionParam.fusionData;
		this._slideUnit = fusionParam.targetUnit;
		if (this._isFusionParamDisabled()) {
			return false;
		}
		
		if (!this._checkTargetFusionInfo()) {
			return false;
		}
		
		if (!FusionControl.isControllable(this._parentUnit, this._slideUnit, this._fusionData)) {
			return false;
		}
		
		this._direction = PosChecker.getSideDirection(this._parentUnit.getMapX(), this._parentUnit.getMapY(), this._slideUnit.getMapX(), this._slideUnit.getMapY());
		if (this._direction !== DirectionType.NULL) {
			this._direction = directionArray[this._direction];
		}
		
		return true;
	}

	openFusionAction() {
		this.setFusionCommonObject();
		this._changeSlideMode();
	}

	moveFusionAction() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === FusionCommonMode.SLIDE) {
			if (this._moveSlide() !== MoveResult.CONTINUE) {
				this._slideObject.endSlide();
				this._slideUnit.setInvisible(true);
				this._changeAnimeMode();
			}
		}
		else if (mode === FusionCommonMode.ANIME) {
			if (this._moveAnime() !== MoveResult.CONTINUE) {
				this._doCatchAction();
				result = MoveResult.END;
			}
		}
		
		return result;
	}

	skipFusionAction() {
		this._doCatchAction();
		
		if (this._slideObject !== null) {
			// Suppose "Catch" and "Release" have been set consecutively in an event command and the user pressed the skip key during catch.
			// In this case, if the current slide value is not reset, it will affect the following release processing,
			// so the endSlide method must be called.
			this._slideObject.endSlide();
		}
	}

	_doCatchAction() {
		var metamorphozeData = this._fusionData.getMetamorphozeData();
		
		FusionControl.catchUnit(this._parentUnit, this._slideUnit, this._fusionData);
		
		if (metamorphozeData === null || MetamorphozeControl.getMetamorphozeData(this._parentUnit) !== null) {
			return null;
		}
		
		MetamorphozeControl.startMetamorphoze(this._parentUnit, metamorphozeData);
	}

	_getFusionAnime() {
		var metamorphozeData = this._fusionData.getMetamorphozeData();
		
		if (metamorphozeData === null || MetamorphozeControl.getMetamorphozeData(this._parentUnit) !== null) {
			return null;
		}
		
		return metamorphozeData.getChangeAnime();
	}

	_checkTargetFusionInfo() {
		var fusionAction, fusionParam, result;
		var fusionParent = FusionControl.getFusionParent(this._slideUnit);
		var fusionChild = FusionControl.getFusionChild(this._slideUnit);
		
		// Checks that the target to be caught is not holding someone and is not being held by someone.
		if (fusionParent === null && fusionChild === null) {
			return true;
		}
		
		// Checks whether the target should try to be forcefully caught, even if the target is already holding someone.
		if (!this._isForceCatch()) {
			return false;
		}
		
		fusionParam = StructureBuilder.buildFusionParam();
		
		// Target is holding someone, so first the unit being held needs to be released.
		if (fusionChild !== null) {
			fusionAction = createObject(ReleaseFusionAction);
			
			fusionParam.parentUnit = this._slideUnit;
			fusionParam.targetUnit = null;
			
			// The unit is done being released, so it is acceptable to start catching the target.
			result = true;
		}
		else {
			// The target is being held by someone, so the target needs to be traded from that someone.
			fusionAction = createObject(UnitTradeFusionAction);
			
			fusionParam.parentUnit = FusionControl.getFusionParent(this._slideUnit);
			fusionParam.targetUnit = this._parentUnit;
			
			// There is no need to continue processing since the catch will have taken place during trading.
			result = false;
		}
		
		fusionParam.fusionData = this._fusionData;
		fusionParam.direction = DirectionType.NULL;
		
		fusionAction.setFusionParam(fusionParam);
		fusionAction.skipFusionAction();
		
		return result;
	}

	_isForceCatch() {
		return true;
	}

	_isFusionParamDisabled() {
		return this._fusionData === null || this._slideUnit === null || this._slideUnit.getAliveState() !== AliveType.ALIVE;
	}
}

class ReleaseFusionAction extends BaseFusionAction {

	_fusionData: any = null;

	_counter: any = null;

	_fusionReleaseType: any = 0;

	setFusionParam(fusionParam?) {
		this._parentUnit = fusionParam.parentUnit;
		this._fusionData = FusionControl.getFusionData(this._parentUnit);
		this._slideUnit = FusionControl.getFusionChild(this._parentUnit);
		if (this._fusionData === null || this._slideUnit === null) {
			return false;
		}
		
		this._initFusionReleaseType();
		
		if (this._fusionReleaseType === FusionReleaseType.ERASE) {
			this._direction = fusionParam.direction;
		}
		else {
			this._direction = this._validDirection(fusionParam.direction);
		}
		
		return true;
	}

	openFusionAction() {
		this.setFusionCommonObject();
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(10);
		
		this._changeAnimeMode();
	}

	moveFusionAction() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === FusionCommonMode.ANIME) {
			if (this._moveAnime() !== MoveResult.CONTINUE) {
				this._changeSlideMode();
				this._doReleaseAction();
			}
		}
		else if (mode === FusionCommonMode.SLIDE) {
			if (this._moveSlide() !== MoveResult.CONTINUE) {
				this._slideObject.updateUnitPos();
				this._slideObject.endSlide();
				if (this._fusionReleaseType === FusionReleaseType.ERASE) {
					this._slideUnit.setInvisible(true);
					this.changeCycleMode(FusionCommonMode.ERASE);
				}
				else {
					this._doEndSlideAction();
					result = MoveResult.END;
				}
			}
		}
		else if (mode === FusionCommonMode.ERASE) {
			if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
				this._doEndSlideAction();
				result = MoveResult.END;
			}
		}
		
		return result;
	}

	skipFusionAction() {
		this._doReleaseAction();
		
		if (this._direction !== DirectionType.NULL) {
			this._slideUnit.setMapX(this._parentUnit.getMapX() + XPoint[this._direction]);
			this._slideUnit.setMapY(this._parentUnit.getMapY() + YPoint[this._direction]);
		}
		
		this._doEndSlideAction();
	}

	_doEndSlideAction() {
		var type = this._fusionReleaseType;
		
		if (type === FusionReleaseType.WAIT) {
			if (this._parentUnit.getUnitType() === this._slideUnit.getUnitType() && this._parentUnit.getUnitType() === root.getCurrentSession().getTurnType()) {
				this._slideUnit.setWait(true);
			}
		}
		else if (type === FusionReleaseType.ERASE) {
			DamageControl.setReleaseState(this._slideUnit);
		}
		
		if (this._slideObject !== null) {
			// If the slide value is not initialized in this method, the display position of the unit will be shifted when the user skips.
			this._slideObject.endSlide();
		}
	}

	_drawErase() {
		var unit = this._slideUnit;
		var x = LayoutControl.getPixelX(unit.getMapX());
		var y = LayoutControl.getPixelY(unit.getMapY());
		var alpha = 255 - (this._counter.getCounter() * 22);
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var colorIndex = unit.getUnitType();
		var animationIndex = MapLayer.getAnimationIndexFromUnit(unit);
		
		if (unit.isWait()) {
			colorIndex = 3;
		}
		
		if (unit.isActionStop()) {
			animationIndex = 1;
		}
		
		unitRenderParam.colorIndex = colorIndex;
		unitRenderParam.animationIndex = animationIndex;
		unitRenderParam.alpha = alpha;
		
		UnitRenderer.drawScrollUnit(unit, x, y, unitRenderParam);
	}

	_initFusionReleaseType() {
		this._fusionReleaseType = this._fusionData.getFusionReleaseType();
		
		if (!this._isForceWait()) {
			return;
		}
		
		// If "Fusion Attack" and "Action after Release" are "Remove", the wait mode is set if the target is not an enemy.
		if (this._fusionData.getFusionType() === FusionType.ATTACK && this._fusionReleaseType === FusionReleaseType.ERASE) {
			if (this._slideUnit.getUnitType() !== UnitType.ENEMY) {
				this._fusionReleaseType = FusionReleaseType.WAIT;
			}
		}
	}

	_isForceWait() {
		return true;
	}

	_validDirection(direction?) {
		var pos;
		var x = this._parentUnit.getMapX();
		var y = this._parentUnit.getMapY();
		
		if (direction === DirectionType.NULL) {
			this._slideUnit.setMapX(x);
			this._slideUnit.setMapY(y);
			return DirectionType.NULL;
		}
		
		if (PosChecker.getUnitFromPos(x + XPoint[direction], y + YPoint[direction]) === null) {
			this._slideUnit.setMapX(x);
			this._slideUnit.setMapY(y);
			return direction;
		}
		
		pos = PosChecker.getNearbyPos(this._parentUnit, this._slideUnit);
		if (pos !== null) {
			this._slideUnit.setMapX(pos.x);
			this._slideUnit.setMapY(pos.y);
		}
		
		return DirectionType.NULL;
	}

	_doReleaseAction() {
		FusionControl.releaseChild(this._parentUnit);
		
		if (this._getMetamorphozeData() === null) {
			return;
		}
		
		MetamorphozeControl.clearMetamorphoze(this._parentUnit);
	}

	_getFusionAnime() {
		var metamorphozeData = this._getMetamorphozeData();
		
		if (metamorphozeData === null) {
			return null;
		}
		
		return metamorphozeData.getCancelAnime();
	}

	_getMetamorphozeData() {
		var metamorphozeData = MetamorphozeControl.getMetamorphozeData(this._parentUnit);
		
		if (metamorphozeData === null) {
			return null;
		}
		
		// Check if the metamorphozeData is metamorphosis occurred by a fusion.
		return this._fusionData.getMetamorphozeData() === metamorphozeData ? metamorphozeData : null;
	}
}

class UnitTradeFusionAction extends BaseFusionAction {

	_fusionData: any = null;

	_targetUnit: any = null;

	setFusionParam(fusionParam?) {
		this._parentUnit = fusionParam.parentUnit;
		this._targetUnit = fusionParam.targetUnit;
		this._fusionData = FusionControl.getFusionData(this._parentUnit);
		this._slideUnit = FusionControl.getFusionChild(this._parentUnit);
		if (this._targetUnit === null || this._fusionData === null || this._slideUnit === null) {
			return false;
		}
		
		if (!FusionControl.isControllable(this._targetUnit, this._slideUnit, this._fusionData)) {
			return false;
		}
		
		this._direction = PosChecker.getSideDirection(this._parentUnit.getMapX(), this._parentUnit.getMapY(), this._targetUnit.getMapX(), this._targetUnit.getMapY());
		
		return true;
	}

	openFusionAction() {
		this.setFusionCommonObject();
		
		this._slideUnit.setMapX(this._parentUnit.getMapX());
		this._slideUnit.setMapY(this._parentUnit.getMapY());
		
		this._changeAnimeMode();
	}

	moveFusionAction() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === FusionCommonMode.ANIME) {
			if (this._moveAnime() !== MoveResult.CONTINUE) {
				this._slideUnit.setInvisible(false);
				this._changeSlideMode();
			}
		}
		else if (mode === FusionCommonMode.SLIDE) {
			if (this._moveSlide() !== MoveResult.CONTINUE) {
				this._slideObject.endSlide();
				FusionControl.tradeChild(this._parentUnit, this._targetUnit);
				result = MoveResult.END;
			}
		}
		
		return result;
	}

	skipFusionAction() {
		FusionControl.tradeChild(this._parentUnit, this._targetUnit);
	}
}
