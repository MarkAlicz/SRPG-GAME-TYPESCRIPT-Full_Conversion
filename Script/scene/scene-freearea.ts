
class FreeAreaMode {

	static TURNSTART: any = 0;

	static TURNEND: any = 1;

	static MAIN: any = 2;
}

class FreeAreaScene extends BaseScene {
	_isLoad: any;


	_turnChangeStart: any = null;

	_turnChangeEnd: any = null;

	_playerTurnObject: any = null;

	_enemyTurnObject: any = null;

	_partnerTurnObject: any = null;

	setSceneData() {
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	}

	moveSceneCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		MapLayer.moveMapLayer();
		
		if (mode === FreeAreaMode.TURNSTART) {
			result = this._moveTurnStart();
		}
		else if (mode === FreeAreaMode.TURNEND) {
			result = this._moveTurnEnd();
		}
		else if (mode === FreeAreaMode.MAIN) {
			result = this._moveMain();
		}
		
		return result;
	}

	drawSceneCycle() {
		var mode = this.getCycleMode();
		
		if (mode === FreeAreaMode.TURNSTART) {
			this._drawTurnStart();
		}
		else if (mode === FreeAreaMode.TURNEND) {
			this._drawTurnEnd();
		}
		else if (mode === FreeAreaMode.MAIN) {
			this._drawMain();
		}
	}

	moveBackSceneCycle() {
		var preAttack = AttackControl.getPreAttackObject();
		
		MapLayer.moveMapLayer();
		
		if (preAttack !== null) {
			preAttack.getCoreAttack().backCoreAttackCycle();
		}
		
		return MoveResult.CONTINUE;
	}

	getTurnObject() {
		var obj = null;
		var type = root.getCurrentSession().getTurnType();
		
		if (type === TurnType.PLAYER) {
			obj = this._playerTurnObject;
		}
		else if (type === TurnType.ENEMY) {
			obj = this._enemyTurnObject;
		}
		else if (type === TurnType.ALLY) {
			obj = this._partnerTurnObject;
		}
		
		return obj;
	}

	turnEnd() {
		this._processMode(FreeAreaMode.TURNEND);
	}

	notifyLoadGame() {
		this._isLoad = true;
	}

	notifyAutoEventCheck() {
		this.getTurnObject().notifyAutoEventCheck();
	}

	isDebugMouseActionAllowed() {
		var type = root.getCurrentSession().getTurnType();
		
		if (type !== TurnType.PLAYER) {
			return false;
		}
		
		return this.getTurnObject().isDebugMouseActionAllowed();
	}

	_prepareSceneMemberData() {
		this._turnChangeStart = createObject(TurnChangeStart);
		this._turnChangeEnd = createObject(TurnChangeEnd);
		this._playerTurnObject = createObject(PlayerTurn);
		this._enemyTurnObject = createObject(EnemyTurn);
		this._partnerTurnObject = createObject(EnemyTurn);
	}

	_completeSceneMemberData() {
		// If this screen is displayed by loading the save file, exclude the starting turn process.
		if (root.getSceneController().isActivatedFromSaveFile()) {
			this._initializeNewMap();
			this._playTurnMusic();
			this._processMode(FreeAreaMode.MAIN);
		}
		else {
			this._processMode(FreeAreaMode.TURNSTART);
		}
	}

	_moveTurnStart() {
		if (this._turnChangeStart.moveTurnChangeCycle() !== MoveResult.CONTINUE) {
			this._processMode(FreeAreaMode.MAIN);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTurnEnd() {
		if (this._turnChangeEnd.moveTurnChangeCycle() !== MoveResult.CONTINUE) {
			this._processMode(FreeAreaMode.TURNSTART);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveMain() {
		this.getTurnObject().moveTurnCycle();
		
		// The scene is changed by "Victory Map" of the event command,
		// so this method can always return MoveResult.CONTINUE.
		return MoveResult.CONTINUE;
	}

	_drawTurnStart() {
		MapLayer.drawUnitLayer();
		this._turnChangeStart.drawTurnChangeCycle();
	}

	_drawTurnEnd() {
		MapLayer.drawUnitLayer();
		this._turnChangeEnd.drawTurnChangeCycle();
	}

	_drawMain() {
		this.getTurnObject().drawTurnCycle();
	}

	_initializeNewMap() {
		// When entering the new map, reset the previous map setting.
		SceneManager.resetCurrentMap();
		
		MapHpControl.updateHpAll();
		
		// Restore the screen which may be painted.
		SceneManager.setEffectAllRange(false);
		
		if (root.getCurrentSession().getTurnType() === TurnType.PLAYER) {
			this.getTurnObject().setAutoCursorSave(true);
		}
	}

	_playTurnMusic() {
		var handle;
		var map = root.getCurrentSession().getCurrentMapInfo();
		var type = root.getCurrentSession().getTurnType();
		
		if (type === TurnType.PLAYER) {
			handle = map.getPlayerTurnMusicHandle();
		}
		else if (type === TurnType.ALLY) {
			handle = map.getAllyTurnMusicHandle();
		}
		else {
			handle = map.getEnemyTurnMusicHandle();
		}
		
		MediaControl.clearMusicCache();
		MediaControl.musicPlayNew(handle);
	}

	_processMode(mode?) {
		if (mode === FreeAreaMode.TURNSTART) {
			if (this._turnChangeStart.enterTurnChangeCycle() === EnterResult.NOTENTER) {
				this._processMode(FreeAreaMode.MAIN);
			}
			else {
				this.changeCycleMode(mode);
			}
		}
		else if (mode === FreeAreaMode.TURNEND) {
			if (this._turnChangeEnd.enterTurnChangeCycle() === EnterResult.NOTENTER) {
				this._processMode(FreeAreaMode.TURNSTART);
			}
			else {
				this.changeCycleMode(mode);
			}
		}
		else if (mode === FreeAreaMode.MAIN) {
			// With this processing, when checking the auto event of objA and objB,
			// "Start and End" as an event condition is ignored.
			root.getCurrentSession().setStartEndType(StartEndType.NONE);
			
			this.getTurnObject().openTurnCycle();
			
			this.changeCycleMode(mode);
		}
	}
}
