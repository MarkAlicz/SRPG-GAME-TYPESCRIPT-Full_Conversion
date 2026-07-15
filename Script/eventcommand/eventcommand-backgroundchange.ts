
class BackgroundChangeMode {

	static FADEOUT: any = 0;

	static FADEIN: any = 1;
}

class BackgroundChangeEventCommand extends BaseEventCommand {

	_transition: any = null;

	_isBackgroundChange: any = false;

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
		
		if (mode === BackgroundChangeMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === BackgroundChangeMode.FADEIN) {
			result = this._moveFadein();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === BackgroundChangeMode.FADEOUT || mode === BackgroundChangeMode.FADEIN) {
			if (this._transition !== null) {
				this._transition.drawTransition();
			}
		}
	}

	mainEventCommand() {
		var eventCommandData = root.getEventCommandObject();
		
		if (!this._isBackgroundChange) {
			root.startBackgroundChange();
		}
		
		if (eventCommandData.getBackgroundChangeType() === BackgroundChangeType.END) {
			SceneManager.setEffectAllRange(true);
		}
		else {
			if (this._transition !== null && eventCommandData.getBackgroundTransitionType() !== BackgroundTransitionType.NONE) {
				// Don't keep the fadeout/fadein state.
				this._transition.resetTransition();
			}
		}
	}

	_prepareEventCommandMemberData() {
		this._isBackgroundChange = false;
		this._transition = null;
	}

	_checkEventCommand() {
		if (this.isSystemSkipMode() || root.getEventCommandObject().getBackgroundTransitionType() === BackgroundTransitionType.NONE) {
			this.mainEventCommand();
			return false;
		}
		
		return true;
	}

	_completeEventCommandMemberData() {
		// Make a transition here when transition is set to "None".
		this._transition = createObject(SystemTransition);
		
		if (root.getEventCommandObject().getBackgroundTransitionType() === BackgroundTransitionType.BLACK) {
			this._transition.setFadeSpeed(this._getChangeSpeed());
		}
		else {
			this._transition.setFadeColor(0xffffff);
			this._transition.setFadeSpeed(5);
		}
		
		this._transition.setDestOut();
		this.changeCycleMode(BackgroundChangeMode.FADEOUT);
		
		return EnterResult.OK;
	}

	_moveFadeout() {
		var result = MoveResult.CONTINUE;
		
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			result = this._changeBackground();
		}
		
		return result;
	}

	_moveFadein() {
		return this._transition.moveTransition();
	}

	_changeBackground() {
		var result;
		
		root.startBackgroundChange();
		
		this._isBackgroundChange = true;
		
		if (root.getEventCommandObject().getBackgroundChangeType() === BackgroundChangeType.END) {
			result = MoveResult.END;
		}
		else {
			this._transition.setDestIn();
			this.changeCycleMode(BackgroundChangeMode.FADEIN);
			
			result = MoveResult.CONTINUE;
		}
		
		return result;
	}

	_getChangeSpeed() {
		return root.getEventCommandObject().getBackgroundChangeType() === BackgroundChangeType.END ? 8 : 15;
	}
}
