
class ForceBattleMode {

	static LIGHT: any = 0;

	static BATTLE: any = 1;
}

class ForceBattleEventCommand extends BaseEventCommand {

	_obj: any = null;

	_unitSrc: any = null;

	_unitDest: any = null;

	_fusionData: any = null;

	_isBattleOnly: any = false;

	_preAttack: any = null;

	_lockonCursor: any = null;

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
		
		if (mode === ForceBattleMode.LIGHT) {
			result = this._moveLight();
		}
		else if (mode === ForceBattleMode.BATTLE) {
			result = this._moveBattle();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ForceBattleMode.LIGHT) {
			this._drawLight();
		}
		else if (mode === ForceBattleMode.BATTLE) {
			this._drawBattle();
		}
	}

	backEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ForceBattleMode.BATTLE) {
			this._preAttack.backPreAttackCycle();
		}
	}

	isEventCommandSkipAllowed() {
		// The battle skip detection is done by CoreAttack, so is not allowed with this method.
		return false;
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._obj = eventCommandData;
		this._unitSrc = eventCommandData.getForceSrc();
		this._unitDest = eventCommandData.getForceDest();
		this._fusionData = eventCommandData.getFusionData();
		this._isBattleOnly = false;
		this._preAttack = createObject(PreAttack);
		this._lockonCursor = createObject(LockonCursor);
		
		// Initialize for times when battles cannot occur.
		this.changeCycleMode(ForceBattleMode.LIGHT);
	}

	_checkEventCommand() {
		var attackParam, result;
		
		if (!this._isAttackAllowed(this._unitSrc, this._unitDest)) {
			return false;
		}
		
		// Before entering the battle, delete the message which is possibly displayed already.
		EventCommandManager.eraseMessage(MessageEraseFlag.ALL);
		
		if (this.isSystemSkipMode()) {
			attackParam = this._createAttackParam();
			result = this._preAttack.enterPreAttackCycle(attackParam);
			if (result === EnterResult.NOTENTER) {
				// If the skip battle has ended without problem, return false so as not to enter the cycle.
				return false;
			}
			else {
				this._isBattleOnly = true;
			}
		}
		
		return true;
	}

	_completeEventCommandMemberData() {
		if (this._isBattleOnly) {
			this.changeCycleMode(ForceBattleMode.BATTLE);
		}
		else {
			this._lockonCursor.setPos(this._unitDest.getMapX(), this._unitDest.getMapY());
			this.changeCycleMode(ForceBattleMode.LIGHT);
		}
		
		return EnterResult.OK;
	}

	_createAttackParam() {
		var attackParam = StructureBuilder.buildAttackParam();
		
		attackParam.unit = this._unitSrc;
		attackParam.targetUnit = this._unitDest;
		attackParam.attackStartType = AttackStartType.FORCE;
		attackParam.forceBattleObject = this._obj;
		
		if (this._fusionData !== null && this._fusionData.getFusionType() === FusionType.ATTACK) {
			attackParam.fusionAttackData = this._fusionData;
		}
		
		return attackParam;
	}

	_moveLight() {
		var attackParam, result;
		
		if (this.isSystemSkipMode() || this._lockonCursor.moveCursor() !== MoveResult.CONTINUE) {
			this._lockonCursor.endCursor();
			
			attackParam = this._createAttackParam();
			result = this._preAttack.enterPreAttackCycle(attackParam);
			if (result === EnterResult.NOTENTER) {
				return MoveResult.END;
			}
			
			this.changeCycleMode(ForceBattleMode.BATTLE);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveBattle() {
		return this._preAttack.movePreAttackCycle();
	}

	_drawLight() {
		this._lockonCursor.drawCursor();
	}

	_drawBattle() {
		this._preAttack.drawPreAttackCycle();
	}

	_isAttackAllowed(unitSrc?, unitDest?) {
		if (unitSrc === null || unitDest === null) {
			return false;
		}
		
		// If the attacker is not equipped with items, no battle starts.
		if (ItemControl.getEquippedWeapon(unitSrc) === null) {
			return false;
		}
		
		// If the attacker and those who are attacked are identical, no battle starts.
		if (unitSrc === unitDest) {
			return false;
		}
		
		// If the unit is died, no battle starts.
		if (unitSrc.getAliveState() !== AliveType.ALIVE || unitDest.getAliveState() !== AliveType.ALIVE) {
			return false;
		}
		
		return true;
	}
}
