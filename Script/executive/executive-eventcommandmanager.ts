
class EventCommandType {

	static MESSAGESHOW: any = 0;

	static MESSAGEERASE: any = 1;

	static MESSAGETEROP: any = 2;

	static STILLMESSAGE: any = 3;

	static MESSAGESCROLL: any = 100;

	static MESSAGETITLE: any = 101;

	static INFOWINDOW: any = 102;

	static CHOICESHOW: any = 103;

	static SCREENSCROLL: any = 200;

	static SCREENEFFECT: any = 201;

	static SCREENSTATECHANGE: any = 202;

	static BACKGROUNDCHANGE: any = 203;

	static SCREENSHAKE: any = 204;

	static MUSICPLAY: any = 300;

	static MUSICSTOP: any = 301;

	static SOUNDPLAY: any = 302;

	static SOUNDSTOP: any = 303;

	static VIDEOPLAY: any = 304;

	static GRAPHICSSHOW: any = 400;

	static GRAPHICSHIDE: any = 401;

	static ANIMATIONPLAY: any = 402;

	static ANIMATIONSTOP: any = 403;

	static MOVEOBJECTSHOW: any = 404;

	static MOVEOBJECTHIDE: any = 405;

	static SCENECHANGE: any = 500;

	static SCRIPTEXECUTE: any = 501;

	static WAITACTION: any = 502;

	static SWITCHACTION: any = 503;

	static VARIABLEACTION: any = 504;

	static EVENTSKIP: any = 505;

	static SAVECALL: any = 506;

	static SYSTEMSETTINGS: any = 507;

	static ENVIRONMENTACCESS: any = 508;

	static CONSOLELOG: any = 509;

	static OBJECTADJUST: any = 510;

	static UNITAPPEAR: any = 1000;

	static UNITREMOVE: any = 1001;

	static UNITMOVE: any = 1002;

	static UNITASSIGN: any = 1003;

	static GOLDCHANGE: any = 1100;

	static ITEMCHANGE: any = 1101;

	static PARAMATERCHANGE: any = 1102;

	static SKILLCHANGE: any = 1103;

	static HPRECOVERY: any = 1200;

	static DAMAGEHIT: any = 1201;

	static EXPERIENCEPLUS: any = 1202;

	static CLASSCHANGE: any = 1203;

	static ITEMUSE: any = 1300;

	static FORCEBATTLE: any = 1301;

	static CHAPTERSHOW: any = 1400;

	static VICTORYMAP: any = 1401;

	static LOCATIONFOCUS: any = 1402;

	static MAPCHIPCHANGE: any = 1403;

	static MAPSCROLL: any = 1404;

	static EVENTSTATECHANGE: any = 1500;

	static UNITINFOCHANGE: any = 1501;

	static UNITSTATECHANGE: any = 1502;

	static MAPINFOCHANGE: any = 1503;

	static MAPSTATECHANGE: any = 1504;

	static BONUSCHANGE: any = 1600;

	static TROPHYCHANGE: any = 1601;

	static RELATIVETURNMEASURE: any = 1602;

	static DURABILITYCHANGE: any = 1603;

	static UNITSTATEADDITION: any = 1604;

	static UNITCAPACITYCHANGE: any = 1605;

	static UNITSLIDE: any = 1606;

	static UNITFUSION: any = 1607;

	static UNITMETAMORPHOZE: any = 1608;

	static UNITALLCOMMAND: any = 1609;

	static POSITIONCHOOSE: any = 1700;

	static MAPPOSOPERATION: any = 1701;
}

class EventCommandManager {
	static _dispBackgroundChangeEventCommand: any;
	static _dispBonusChangeEventCommand: any;
	static _dispChapterShowEventCommand: any;
	static _dispChoiceShowEventCommand: any;
	static _dispClassChangeEventCommand: any;
	static _dispDamageHitEventCommand: any;
	static _dispDurabilityChangeEventCommand: any;
	static _dispExperiencePlusEventCommand: any;
	static _dispForceBattleEventCommand: any;
	static _dispGoldChangeEventCommand: any;
	static _dispHpRecoveryEventCommand: any;
	static _dispInfoWindowEventCommand: any;
	static _dispItemChangeEventCommand: any;
	static _dispItemUseEventCommand: any;
	static _dispLocationFocusEventCommand: any;
	static _dispMapPosChooseEventCommand: any;
	static _dispMapPosOperationEventCommand: any;
	static _dispMessageScrollEventCommand: any;
	static _dispMessageShowEventCommand: any;
	static _dispMessageTeropEventCommand: any;
	static _dispMessageTitleEventCommand: any;
	static _dispParameterChangeEventCommand: any;
	static _dispSaveCallEventCommand: any;
	static _dispScriptExecuteEventCommand: any;
	static _dispSkillChangeEventCommand: any;
	static _dispStillMessageEventCommand: any;
	static _dispTrophyChangeEventCommand: any;
	static _dispUnitAllCommandEventCommand: any;
	static _dispUnitFusionEventCommand: any;
	static _dispUnitMetamorphozeEventCommand: any;
	static _dispUnitSlideEventCommand: any;
	static _dispUnitStateAdditionEventCommand: any;


	static _activeEventChecker: any = null;

	static initSingleton() {
		this._dispMessageShowEventCommand = createObject(MessageShowEventCommand);
		this._dispMessageTeropEventCommand = createObject(MessageTeropEventCommand);
		this._dispStillMessageEventCommand = createObject(StillMessageEventCommand);
		this._dispMessageScrollEventCommand = createObject(MessageScrollEventCommand);
		this._dispMessageTitleEventCommand = createObject(MessageTitleEventCommand);
		this._dispInfoWindowEventCommand = createObject(InfoWindowEventCommand);
		this._dispChoiceShowEventCommand = createObject(ChoiceShowEventCommand);
		this._dispBackgroundChangeEventCommand = createObject(BackgroundChangeEventCommand);
		this._dispScriptExecuteEventCommand = createObject(ScriptExecuteEventCommand);
		this._dispSaveCallEventCommand = createObject(SaveCallEventCommand);
		this._dispGoldChangeEventCommand = createObject(GoldChangeEventCommand);
		this._dispItemChangeEventCommand = createObject(ItemChangeEventCommand);
		this._dispParameterChangeEventCommand = createObject(ParameterChangeEventCommand);
		this._dispSkillChangeEventCommand = createObject(SkillChangeEventCommand);
		this._dispHpRecoveryEventCommand = createObject(HpRecoveryEventCommand);
		this._dispDamageHitEventCommand = createObject(DamageHitEventCommand);
		this._dispExperiencePlusEventCommand = createObject(ExperiencePlusEventCommand);
		this._dispClassChangeEventCommand = createObject(ClassChangeEventCommand);
		this._dispForceBattleEventCommand = createObject(ForceBattleEventCommand);
		this._dispItemUseEventCommand = createObject(ItemUseEventCommand);
		this._dispChapterShowEventCommand = createObject(ChapterShowEventCommand);
		this._dispLocationFocusEventCommand = createObject(LocationFocusEventCommand);
		this._dispBonusChangeEventCommand = createObject(BonusChangeEventCommand);
		this._dispTrophyChangeEventCommand = createObject(TrophyChangeEventCommand);
		this._dispDurabilityChangeEventCommand = createObject(DurabilityChangeEventCommand);
		this._dispUnitStateAdditionEventCommand = createObject(UnitStateAdditionEventCommand);
		this._dispUnitSlideEventCommand = createObject(UnitSlideEventCommand);
		this._dispUnitFusionEventCommand = createObject(UnitFusionEventCommand);
		this._dispUnitMetamorphozeEventCommand = createObject(UnitMetamorphozeEventCommand);
		this._dispUnitAllCommandEventCommand = createObject(UnitAllCommandEventCommand);
		this._dispMapPosChooseEventCommand = createObject(MapPosChooseEventCommand);
		this._dispMapPosOperationEventCommand = createObject(MapPosOperationEventCommand);
	}

	static enterEventCommandManagerCycle(commandType?) {
		return EventCommandController.enterEventCommandControllerCycle(this._getEventCommandContainer(commandType));
	}

	static moveEventCommandManagerCycle(commandType?) {
		var result;
		
		result = EventCommandController.moveEventCommandControllerCycle(this._getEventCommandContainer(commandType));
		
		// If the event ends, check if there is auto start event.
		if (!root.isEventSceneActived()) {
			if (this._activeEventChecker !== null) {
				this._activeEventChecker.moveEventChecker();
			}
		}
		
		return result;	
	}

	static drawEventCommandManagerCycle(commandType?) {
		EventCommandController.drawEventCommandControllerCycle(this._getEventCommandContainer(commandType), commandType);
	}

	static backEventCommandManagerCycle(commandType?) {
		EventCommandController.backEventCommandControllerCycle(this._getEventCommandContainer(commandType));
	}

	static setActiveEventChecker(eventChecker?) {
		this._activeEventChecker = eventChecker;
	}

	static returnEnterCode() {
		if (root.getEventExitCode() !== EventResult.PENDING) {
			return EnterResult.NOTENTER;
		}
		
		return EnterResult.OK;
	}

	static eraseMessage(value?) {
		this._dispMessageShowEventCommand.eraseMessage(value);
	}

	static isEventRunning(targetEvent?) {
		var event;
		var count = root.getChainEventCount();
		
		if (count === 0) {
			return false;
		}
		
		event = root.getChainEvent(count - 1);
		
		return event === targetEvent;
	}

	static _getEventCommandContainer(commandType?) {
		var obj = null;
		
		// One object is prepared per one event command.
		// For example, 'Show Message' is MessageShowEventCommand,
		// 'Message Scroll' is MessageScrollEventCommand.
		// These objects are not specified as createObject.
		
		// For enterEventCommandCycle as an object, property is supposed to be initialized properly.
		// Otherwise, the value which has been set at the time of use before will be left over, so bugs more likely occur.
		
		// Regarding the event which specifies null,
		// it means that the event is not supported at the script level in a current version.
		// The implementation of the event is done at the EXE side.
		
		// No problem if the event uses the event inside.
		// For example, ItemUseEventCommand which expresses 'Use Item' uses
		// HpRecoveryEventCommand which expresses 'Hp Recovery' at the time of using recovery items.
		// However, HpRecoveryEventCommand shouldn't be a loop to use ItemUseEventCommand.
		if (commandType === EventCommandType.MESSAGESHOW) {
			obj = this._dispMessageShowEventCommand;
		}
		else if (commandType === EventCommandType.MESSAGEERASE) {
			obj = null;
		}
		else if (commandType === EventCommandType.MESSAGETEROP) {
			obj = this._dispMessageTeropEventCommand;
		}
		else if (commandType === EventCommandType.STILLMESSAGE) {
			obj = this._dispStillMessageEventCommand;
		}
		
		else if (commandType === EventCommandType.MESSAGESCROLL) {
			obj = this._dispMessageScrollEventCommand;
		}
		else if (commandType === EventCommandType.MESSAGETITLE) {
			obj = this._dispMessageTitleEventCommand;
		}
		else if (commandType === EventCommandType.INFOWINDOW) {
			obj = this._dispInfoWindowEventCommand;
		}
		else if (commandType === EventCommandType.CHOICESHOW) {
			obj = this._dispChoiceShowEventCommand;
		}
		
		else if (commandType === EventCommandType.SCREENSCROLL) {
			obj = null;
		}
		else if (commandType === EventCommandType.SCREENEFFECT) {
			obj = null;
		}
		else if (commandType === EventCommandType.SCREENSTATECHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.BACKGROUNDCHANGE) {
			obj = this._dispBackgroundChangeEventCommand;
		}
		else if (commandType === EventCommandType.SCREENSHAKE) {
			obj = null;
		}
		
		else if (commandType === EventCommandType.MUSICPLAY) {
			obj = null;
		}
		else if (commandType === EventCommandType.MUSICSTOP) {
			obj = null;
		}
		else if (commandType === EventCommandType.SOUNDPLAY) {
			obj = null;
		}
		else if (commandType === EventCommandType.SOUNDSTOP) {
			obj = null;
		}
		else if (commandType === EventCommandType.VIDEOPLAY) {
			obj = null;
		}
		
		else if (commandType === EventCommandType.GRAPHICSSHOW) {
			obj = null;
		}
		else if (commandType === EventCommandType.GRAPHICSHIDE) {
			obj = null;
		}
		else if (commandType === EventCommandType.ANIMATIONPLAY) {
			obj = null;
		}
		else if (commandType === EventCommandType.ANIMATIONSTOP) {
			obj = null;
		}
		else if (commandType === EventCommandType.MOVEOBJECTSHOW) {
			obj = null;
		}
		else if (commandType === EventCommandType.MOVEOBJECTHIDE) {
			obj = null;
		}
		
		else if (commandType === EventCommandType.SCENECHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.SCRIPTEXECUTE) {
			obj = this._dispScriptExecuteEventCommand;
		}
		else if (commandType === EventCommandType.WAITACTION) {
			obj = null;
		}
		else if (commandType === EventCommandType.SWITCHACTION) {
			obj = null;
		}
		else if (commandType === EventCommandType.EVENTSKIP) {
			obj = null;
		}
		else if (commandType === EventCommandType.SAVECALL) {
			obj = this._dispSaveCallEventCommand;
		}
		else if (commandType === EventCommandType.SYSTEMSETTINGS) {
			obj = null;
		}
		else if (commandType === EventCommandType.ENVIRONMENTACCESS) {
			obj = null;
		}
		else if (commandType === EventCommandType.CONSOLELOG) {
			obj = null;
		}
		else if (commandType === EventCommandType.OBJECTADJUST) {
			obj = null;
		}
		
		else if (commandType === EventCommandType.UNITAPPEAR) {
			obj = null;
		}
		else if (commandType === EventCommandType.UNITREMOVE) {
			obj = null;
		}
		else if (commandType === EventCommandType.UNITMOVE) {
			obj = null;
		}
		else if (commandType === EventCommandType.UNITASSIGN) {
			obj = null;
		}
		
		else if (commandType === EventCommandType.GOLDCHANGE) {
			obj = this._dispGoldChangeEventCommand;
		}
		else if (commandType === EventCommandType.ITEMCHANGE) {
			obj = this._dispItemChangeEventCommand;
		}
		else if (commandType === EventCommandType.PARAMATERCHANGE) {
			obj = this._dispParameterChangeEventCommand;
		}
		else if (commandType === EventCommandType.SKILLCHANGE) {
			obj = this._dispSkillChangeEventCommand;
		}
		
		else if (commandType === EventCommandType.HPRECOVERY) {
			obj = this._dispHpRecoveryEventCommand;
		}
		else if (commandType === EventCommandType.DAMAGEHIT) {
			obj = this._dispDamageHitEventCommand;
		}
		else if (commandType === EventCommandType.EXPERIENCEPLUS) {
			obj = this._dispExperiencePlusEventCommand;
		}
		else if (commandType === EventCommandType.CLASSCHANGE) {
			obj = this._dispClassChangeEventCommand;
		}
		
		else if (commandType === EventCommandType.FORCEBATTLE) {
			obj = this._dispForceBattleEventCommand;
		}
		else if (commandType === EventCommandType.ITEMUSE) {
			obj = this._dispItemUseEventCommand;
		}
		
		else if (commandType === EventCommandType.CHAPTERSHOW) {
			obj = this._dispChapterShowEventCommand;
		}
		else if (commandType === EventCommandType.VICTORYMAP) {
			obj = null;
		}
		else if (commandType === EventCommandType.LOCATIONFOCUS) {
			obj = this._dispLocationFocusEventCommand;
		}
		else if (commandType === EventCommandType.MAPCHIPCHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.MAPSCROLL) {
			obj = null;
		}
		
		else if (commandType === EventCommandType.UNITINFOCHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.UNITSTATECHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.MAPINFOCHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.MAPSTATECHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.EVENTSTATECHANGE) {
			obj = null;
		}
		
		else if (commandType === EventCommandType.BONUSCHANGE) {
			obj = this._dispBonusChangeEventCommand;
		}
		else if (commandType === EventCommandType.TROPHYCHANGE) {
			obj = this._dispTrophyChangeEventCommand;
		}
		else if (commandType === EventCommandType.RELATIVETURNMEASURE) {
			obj = null;
		}
		else if (commandType === EventCommandType.DURABILITYCHANGE) {
			obj = this._dispDurabilityChangeEventCommand;
		}
		else if (commandType === EventCommandType.UNITSTATEADDITION) {
			obj = this._dispUnitStateAdditionEventCommand;
		}
		else if (commandType === EventCommandType.UNITCAPACITYCHANGE) {
			obj = null;
		}
		else if (commandType === EventCommandType.UNITSLIDE) {
			obj = this._dispUnitSlideEventCommand;
		}
		else if (commandType === EventCommandType.UNITFUSION) {
			obj = this._dispUnitFusionEventCommand;
		}
		else if (commandType === EventCommandType.UNITMETAMORPHOZE) {
			obj = this._dispUnitMetamorphozeEventCommand;
		}
		else if (commandType === EventCommandType.UNITALLCOMMAND) {
			obj = this._dispUnitAllCommandEventCommand;
		}
		else if (commandType === EventCommandType.POSITIONCHOOSE) {
			obj = this._dispMapPosChooseEventCommand;
		}
		else if (commandType === EventCommandType.MAPPOSOPERATION) {
			obj = this._dispMapPosOperationEventCommand;
		}
		
		return obj;
	}
}
