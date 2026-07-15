
class ScriptExecuteEventCommand extends BaseEventCommand {

	_activeEventCommand: any = null;

	_eventCommandArray: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._activeEventCommand.moveEventCommandCycle() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		if (this._activeEventCommand !== null) {
			this._activeEventCommand.drawEventCommandCycle();
		}
	}

	isEventCommandSkipAllowed() {
		return this._activeEventCommand.isEventCommandSkipAllowed();
	}

	mainEventCommand() {
		if (this._activeEventCommand !== null) {
			this._activeEventCommand.mainEventCommand();
		}
	}

	_prepareEventCommandMemberData() {
		if (this._eventCommandArray === null) {
			this._eventCommandArray = [];
			this._configureOriginalEventCommand(this._eventCommandArray);
		}
	}

	_checkEventCommand() {
		this._activeEventCommand = this._findEventObject(root.getEventCommandObject().getEventCommandName());
		if (this._activeEventCommand === null) {
			return false;
		}
		
		return true;
	}

	_completeEventCommandMemberData() {
		return this._activeEventCommand.enterEventCommandCycle();
	}

	_findEventObject(name?) {
		var i;
		var count = this._eventCommandArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._eventCommandArray[i].getEventCommandName() === name) {
				return this._eventCommandArray[i];
			}
		}
		
		return null;
	}

	_configureOriginalEventCommand(groupArray?) {
	}
}
