
class MapCommand extends BaseListCommandManager {

	getPositionX() {
		return LayoutControl.getRelativeX(8);
	}

	getPositionY() {
		return LayoutControl.getRelativeY(12);
	}

	getCommandTextUI() {
		return root.queryTextUI('mapcommand_title');
	}

	configureCommands(groupArray?) {
		var mixer = createObject(CommandMixer);
		
		mixer.pushCommand(MapCommand.TurnEnd, CommandActionType.TURNEND);
		
		mixer.mixCommand(CommandLayoutType.MAPCOMMAND, groupArray, BaseListCommand);
	}
}

namespace MapCommand {
export class TurnEnd extends BaseListCommand {

	openCommand() {
		if (root.getBaseScene() === SceneType.FREE) {
			this._saveCursor();
		}
		TurnControl.turnEnd();
	}

	moveCommand() {
		return MoveResult.END;
	}

	drawCommand() {
	}

	_saveCursor() {
		var playerTurnObject = SceneManager.getActiveScene().getTurnObject();
		
		playerTurnObject.setAutoCursorSave(false);
	}
}
}
