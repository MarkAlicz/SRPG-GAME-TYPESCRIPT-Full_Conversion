
class SceneType {

	// Cannot use battle event command at the following scene.
	static TITLE: any = 0;

	static GAMEOVER: any = 1;

	static ENDING: any = 2;

	
	// Can use battle event command at the following scene.
	static BATTLESETUP: any = 3;

	static FREE: any = 4;

	static BATTLERESULT: any = 5;

	static REST: any = 6;

	static EVENTTEST: any = 9;

	
	// Event command to enable to use depends on the caller's scene.
	static EVENT: any = 10;

	
	// Any value between 20 and 50000 can be used as a custom scene.
	static CUSTOM: any = 20;

	static RESERVED: any = 50000;
}

//-----------------------------

class ObjectType {

	static UNIT: any = 0;

	static CLASS: any = 1;

	static WEAPON: any = 2;

	static ITEM: any = 3;

	static SKILL: any = 4;

	static STATE: any = 5;

	static TERRAIN: any = 101;

	static FUSION: any = 218;

	static NULL: any = -1;
}

class UnitType {

	static PLAYER: any = 0;

	static ENEMY: any = 1;

	static ALLY: any = 2;
}

class UnitGroup {

	static PLAYER: any = 0;

	static ENEMY: any = 1;

	static ENEMYEVENT: any = 2;

	static ALLY: any = 3;

	static ALLYEVENT: any = 4;

	static REINFORCE: any = 5;

	static GUEST: any = 6;

	static GUESTEVENT: any = 7;

	static BOOKMARK: any = 8;
}

class AttackTemplateType {

	static FIGHTER: any = 0;

	static ARCHER: any = 1;

	static MAGE: any = 2;

	static FREE: any = -1;
}

class WeaponCategoryType {

	static PHYSICS: any = 0;

	static SHOOT: any = 1;

	static MAGIC: any = 2;
}

class WeaponOption {

	static NONE: any = 0;

	static HPABSORB: any = 1;

	static NOGUARD: any = 2;

	static HPMINIMUM: any = 3;

	static HALVEATTACK: any = 4;

	static HALVEATTACKBREAK: any = 5;

	static SEALATTACK: any = 6;

	static SEALATTACKBREAK: any = 7;
}

class ImportanceType {

	static LEADER: any = 0;

	static SUBLEADER: any = 1;

	static MOB: any = 2;
}

class NewSkillType {

	static NEW: any = 0;

	static POWERUP: any = 1;
}

class PatternType {

	static APPROACH: any = 0;

	static WAIT: any = 1;

	static MOVE: any = 2;

	static CUSTOM: any = 100;

	static ESTIMATE: any = 200;
}

class SkillType {

	// Battle Attack Type
	static FASTATTACK: any = 0;

	static CONTINUOUSATTACK: any = 1;

	static COUNTERATTACKCRITICAL: any = 2;

	static DAMAGEABSORPTION: any = 3;

	static TRUEHIT: any = 4;

	static STATEATTACK: any = 5;

	// Battle Defence Type
	static DAMAGEGUARD: any = 10;

	static SURVIVAL: any = 11;

	// Battle Natural Type
	static ROUNDATTACK: any = 20;

	static CRITICAL: any = 21;

	static INVALID: any = 22;

	static NOWEAPONDECREMENT: any = 23;

	static BATTLERESTRICTION: any = 24;

	static COUNTERATTACK: any = 25;

	
	// Natural Type
	static AUTORECOVERY: any = 30;

	static GROWTH: any = 31;

	static DISCOUNT: any = 32;

	static SUPPORT: any = 33;

	static PARAMBONUS: any = 34;

	// Command Type
	static STEAL: any = 40;

	static QUICK: any = 41;

	static PICKING: any = 42;

	static FUSION: any = 43;

	static METAMORPHOZE: any = 44;

	// Action Type
	static REPEATMOVE: any = 50;

	static REACTION: any = 51;

	// Custom
	static CUSTOM: any = 100;
}

class MatchType {

	static MATCH: any = 0;

	static MISMATCH: any = 1;

	static MATCHALL: any = 2;

	static MISMATCHALL: any = 3;
}

class MoveAIType {

	static MOVEONLY: any = 0;

	static BLOCK: any = 1;

	static APPROACH: any = 2;
}

class MoveGoalType {

	static POS: any = 0;

	static UNIT: any = 1;
}

class LockonType {

	static INCLUDE: any = 0;

	static PRIORITY: any = 1;

	static EXCLUDE: any = 2;

	static NONE: any = -1;
}

class AIDisableFlag {

	static WEAPON: any = 0x01;

	static ITEM: any = 0x02;

	static SKILL: any = 0x04;
}

class DirectionType {

	static LEFT: any = 0;

	static TOP: any = 1;

	static RIGHT: any = 2;

	static BOTTOM: any = 3;

	static NULL: any = 4;

	static COUNT: any = 4;
}

class SpeedType {

	static DIRECT: any = 0;

	static SUPERHIGH: any = 1;

	static HIGH: any = 2;

	static NORMAL: any = 3;

	static LOW: any = 4;

	static SUPERLOW: any = 5;
}

class ParamType {

	static MHP: any = 0;

	static POW: any = 1;

	static MAG: any = 2;

	static SKI: any = 3;

	static SPD: any = 4;

	static LUK: any = 5;

	static DEF: any = 6;

	static MDF: any = 7;

	static MOV: any = 8;

	static WLV: any = 9;

	static BLD: any = 10;

	static COUNT: any = 11;
}

class InvocationType {

	static HP: any = 0;

	static POW: any = 1;

	static MAG: any = 2;

	static SKI: any = 3;

	static SPD: any = 4;

	static LUK: any = 5;

	static DEF: any = 6;

	static MDF: any = 7;

	static MOV: any = 8;

	static WLV: any = 9;

	static BLD: any = 10;

	static LV: any = 11;

	static ABSOLUTE: any = 12;

	static HPDOWN: any = 13;
}

class ItemType {

	static UNUSABLE: any = 0;

	static RECOVERY: any = 1;

	static ENTIRERECOVERY: any = 2;

	static DAMAGE: any = 3;

	static DOPING: any = 4;

	static CLASSCHANGE: any = 5;

	static SKILLGET: any = 6;

	static KEY: any = 7;

	static QUICK: any = 8;

	static TELEPORTATION: any = 9;

	static RESCUE: any = 10;

	static RESURRECTION: any = 11;

	static DURABILITY: any = 12;

	static STEAL: any = 13;

	static STATE: any = 14;

	static STATERECOVERY: any = 15;

	static SWITCH: any = 16;

	static FUSION: any = 17;

	static METAMORPHOZE: any = 18;

	static CUSTOM: any = 100;
}

class RecoveryType {

	static SPECIFY: any = 0;

	static MAX: any = 1;
}

class DamageType {

	static FIXED: any = 0;

	static PHYSICS: any = 1;

	static MAGIC: any = 2;
}

class ResurrectionType {

	static MIN: any = 0;

	static HALF: any = 1;

	static MAX: any = 2;
}

class SelectionRangeType {

	static SELFONLY: any = 0;

	static MULTI: any = 1;

	static ALL: any = 2;
}

class EventType {

	static PLACE: any = 0;

	static AUTO: any = 1;

	static TALK: any = 2;

	static UNIT: any = 3;

	static OPENING: any = 4;

	static ENDING: any = 5;

	static COMMUNICATION: any = 6;

	static RECOLLECTION: any = 7;

	static DYNAMIC: any = 8;

	static MAPCOMMON: any = 9;
}

class PlaceEventType {

	static VILLAGE: any = 0;

	static TREASURE: any = 1;

	static OCCUPATION: any = 2;

	static SHOP: any = 3;

	static GATE: any = 4;

	static WAIT: any = 5;

	static INFORMATION: any = 6;

	static CUSTOM: any = 100;
}

class UnitEventType {

	static DEAD: any = 0;

	static INJURY: any = 1;

	static ACTIVETURN: any = 2;

	static BATTLE: any = 3;

	static COMMAND: any = 4;
}

class CommunicationEventType {

	static INFORMATION: any = 0;

	static TALK: any = 1;

	static TROPHY: any = 2;

	static UNIT: any = 3;

	static PRIVATE: any = 4;
}

class PlaceCustomType {

	static COMMAND: any = 0;

	static KEYWORD: any = 1;
}

class MessagePos {

	static TOP: any = 0;

	static CENTER: any = 1;

	static BOTTOM: any = 2;

	static NONE: any = -1;
}

class BackgroundChangeType {

	static CHANGE: any = 0;

	static NONE: any = 1;

	static END: any = 2;
}

class BackgroundTransitionType {

	static BLACK: any = 0;

	static WHITE: any = 1;

	static NONE: any = 2;
}

class MapType {

	static NORMAL: any = 0;

	static EXTRA: any = 1;

	static QUEST: any = 2;
}

class StartEndType {

	static MAP_START: any = 0;

	static PLAYER_START: any = 1;

	static PLAYER_END: any = 2;

	static ENEMY_START: any = 3;

	static ENEMY_END: any = 4;

	static ALLY_START: any = 5;

	static ALLY_END: any = 6;

	static NONE: any = 7;
}

class TurnType {

	static PLAYER: any = 0;

	static ENEMY: any = 1;

	static ALLY: any = 2;
}

class SortieType {

	static SORTIE: any = 0;

	static UNSORTIE: any = 1;
}

class AliveType {

	static ALIVE: any = 0;

	static ERASE: any = 1;

	static DEATH: any = 2;

	static INJURY: any = 3;
}

class RemoveOption {

	static ERASE: any = 0;

	static DEATH: any = 1;

	static INJURY: any = 2;
}

class PosChooseType {

	static ALL: any = 0;

	static UNIT: any = 1;

	static TERRAIN: any = 2;
}

class MapPosOperationType {

	static ANIME: any = 0;

	static MAPCHIP: any = 1;
}

class BattleType {

	static REAL: any = 0;

	static EASY: any = 1;

	// Even if the following value, it's treated as REAL or EASY in the end.
	static DEFAULT: any = 2;

	static FORCEREAL: any = 3;

	static FORCEEASY: any = 4;
}

class AnimePlayType {

	static SYNC: any = 0;

	static ASYNC: any = 1;

	static LOOP: any = 2;
}

class BadStateFlag {

	static PHYSICS: any = 0x1;

	static MAGIC: any = 0x02;

	static ITEM: any = 0x04;

	static WAND: any = 0x08;
}

class BadStateOption {

	static NONE: any = 0;

	static NOACTION: any = 1;

	static BERSERK: any = 2;

	static AUTO: any = 3;
}

class StateAutoRemovalType {

	static NONE: any = 0;

	static BATTLEEND: any = 1;

	static ACTIVEDAMAGE: any = 2;

	static PASSIVEDAMAGE: any = 3;
}

// If the battle mode is EASY, EASYATTACK is always displayed.
// If the battle mode is EASY, EASYDAMAGE is displayed when the attack hits.
class WeaponEffectAnime {

	static REALDAMAGE: any = 0;

	static EASYDAMAGE: any = 1;

	static REALCRITICAL: any = 2;

	static EASYCRITICAL: any = 3;

	static MAGICINVOCATION: any = 4;

	static MAGICWEAPON: any = 5;

	static FIRSTATTACK: any = 6;

	static EASYATTACK: any = 7;

	static EASYATTACKCRITICAL: any = 8;
}

class WeaponEffectSound {

	static DAMAGE: any = 0;

	static DAMAGEFINISH: any = 1;

	static CRITICAL: any = 2;

	static CRITICALFINISH: any = 3;

	static WEAPONWAVE: any = 4;

	static WEAPONTHROW: any = 5;

	static SHOOTARROW: any = 6;
}

class FusionType {

	static NORMAL: any = 0;

	static ATTACK: any = 1;
}

class FusionActionType {

	static CATCH: any = 0;

	static RELEASE: any = 1;

	static TRADE: any = 2;
}

class FusionReleaseType {

	static NONE: any = 0;

	static WAIT: any = 1;

	static ERASE: any = 2;
}

class SlideType {

	static START: any = 0;

	static END: any = 1;

	static UPDATEEND: any = 2;
}

class MetamorphozeActionType {

	static CHANGE: any = 0;

	static CANCEL: any = 1;
}

class MetamorphozeCancelFlag {

	static AUTO: any = 0x01;

	static MANUAL: any = 0x02;
}

class ClassRank {

	static LOW: any = 0;

	static HIGH: any = 1;
}

//-----------------------------

class TrueHitValue {

	static NONE: any = 0;

	static NOGUARD: any = 1;

	static EFFECTIVE: any = 2;

	static HPMINIMUM: any = 3;

	static FINISH: any = 4;
}

class SurvivalValue {

	static SURVIVAL: any = 0;

	static AVOID: any = 1;
}

class InvalidFlag {

	static CRITICAL: any = 0x01;

	static EFFECTIVE: any = 0x02;

	static SKILL: any = 0x04;

	static BADSTATE: any = 0x08;

	static HALVEATTACKBREAK: any = 0x10;

	static SEALATTACKBREAK: any = 0x20;
}

class BattleRestrictionValue {

	static HALVEATTACK: any = 0;

	static SEALATTACK: any = 1;
}

// Strong effect can make the number higher.
class StealFlag {

	static SPEED: any = 0x01;

	static WEIGHT: any = 0x02;

	static WEAPON: any = 0x04;

	static MULTI: any = 0x08;
}

class QuickValue {

	static ONE: any = 0;

	static SURROUNDINGS: any = 1;
}

//-----------------------------

class AnimeType {

	static MOTION: any = 0;

	static EFFECT: any = 1;
}

class MotionCategoryType {

	static NORMAL: any = 0;

	static APPROACH: any = 1;

	static ATTACK: any = 2;

	static THROW: any = 3;

	static AVOID: any = 4;

	static SHOOT: any = 5;

	static MAGIC: any = 6;

	static DAMAGE: any = 7;

	static MAGICATTACK: any = 8;
}

class WeaponSilhouetteType {

	static SWORD: any = 0;

	static SPEAR: any = 1;

	static AXE: any = 2;
}

class LoopValue {

	static START: any = 0;

	static END: any = 1;

	static NONE: any = 2;

	static MAGICSTART: any = 3;

	static MAGICEND: any = 4;
}

class SpriteType {

	static KEY: any = 0;

	static WEAPON: any = 1;

	static ARROW: any = 2;

	static OPTION: any = 3;
}

class VersusType {

	static NONE: any = 0;

	static SS: any = 1;

	static SM: any = 2;

	static SL: any = 3;

	static MM: any = 4;

	static ML: any = 5;

	static LL: any = 6;
}

class MotionFighter {

	static WAIT: any = 0;

	static MOVE: any = 1;

	static CRITICALMOVE: any = 2;

	static CRITICALFINISHMOVE: any = 3;

	static MOVEATTACK: any = 4;

	static CRITICALMOVEATTACK: any = 5;

	static CRITICALFINISHMOVEATTACK: any = 6;

	static ATTACK1: any = 7;

	static ATTACK2: any = 8;

	static CRITICALATTACK1: any = 9;

	static CRITICALATTACK2: any = 10;

	static CRITICALFINISHATTACK: any = 11;

	static INDIRECTATTACK: any = 12;

	static CRITICALINDIRECTATTACK: any = 13;

	static AVOID1: any = 14;

	static AVOID2: any = 15;

	static DAMAGE: any = 16;

	static FINISHDAMAGE: any = 17;

	static MAGICATTACK: any = 18;

	static CRITICALMAGICATTACK: any = 19;
}

class MotionArcher {

	static WAIT: any = 0;

	static BOW: any = 1;

	static CRITICALBOW: any = 2;

	static AVOID1: any = 3;

	static AVOID2: any = 4;

	static DAMAGE: any = 5;

	static FINISHDAMAGE: any = 6;

	static CRITICALFINISH: any = 7;

	static BOW2: any = 8;
}

class MotionMage {

	static WAIT: any = 0;

	static MAGIC: any = 1;

	static CRITICALMAGIC: any = 2;

	static AVOID1: any = 3;

	static AVOID2: any = 4;

	static DAMAGE: any = 5;

	static FINISHDAMAGE: any = 6;

	static CRITICALFINISH: any = 7;

	static MAGIC2: any = 8;
}

class InterpolationMode {

	static NEARESTNEIGHBOR: any = 0;

	static BILINEAR: any = 1;
}

class OperatorSymbol {

	static NONE: any = 0;

	static ADD: any = 1;

	static SUBTRACT: any = 2;

	static MULTIPLY: any = 3;

	static DIVIDE: any = 4;

	static MOD: any = 5;

	static ASSIGNMENT: any = 6;
}

//-----------------------------

class IncreaseType {

	static INCREASE: any = 0;

	static DECREASE: any = 1;

	static ALLRELEASE: any = 2;

	// not 3
	static ASSIGNMENT: any = 2;
}

class OverUnderType {

	static EQUAL: any = 0;

	static OVER: any = 1;

	static UNDER: any = 2;

	static NOTEQUALSTO: any = 3;

	static NONE: any = 4;
}

class EffectRangeType {

	static MAP: any = 0;

	static MAPANDCHAR: any = 1;

	static ALL: any = 2;

	static NONE: any = 4;
}

class EventExecutedType {

	static FREE: any = 0;

	static EXECUTED: any = 1;

	static UNKNOWN: any = 2;
}

class SpeakerType {

	static UNIT: any = 0;

	static NPC: any = 1;
}

class TrophyTargetType {

	static POOL: any = 0;

	static DROP: any = 1;
}

class SceneChangeType {

	static TITLE: any = 0;

	static GAMEOVER: any = 1;

	static ENDING: any = 2;
}

class MapStateType {

	static DRAWMAP: any = 0;

	static DRAWUNIT: any = 1;

	static ANIMEMAP: any = 2;

	static ANIMEUNIT: any = 3;

	static REINFORCE: any = 4;

	static STOCKSHOW: any = 5;

	static PLAYERFREEACTION: any = 6;

	static PLAYERZEROGAMEOVER: any = 7;

	static GETEXPERIENCE: any = 8;
}

class MusicPlayType {

	static PLAYSAVE: any = 0;

	static PLAY: any = 1;

	static NOLOOP: any = 2;
}

class MusicStopType {

	static BACK: any = 0;

	static STOP: any = 1;

	static PAUSE: any = 2;
}

class ForceEntryType {

	static HIT: any = 0;

	static CRITICAL: any = 1;

	static MISS: any = 2;

	static NONE: any = -1;
}

class CharChipLoopType {

	static NORMAL: any = 0;

	static DOUBLE: any = 1;

	static SINGLE: any = 2;
}

class InfoWindowType {

	static NONE: any = 0;

	static INFORMATION: any = 1;

	static WARNING: any = 2;
}

class ResourceHandleType {

	static ORIGINAL: any = 0;

	static RUNTIME: any = 1;
}

class RepeatMoveType {

	static VILLAGE: any = 0;

	static KEY: any = 1;

	static OCCUPATION: any = 2;

	static SHOP: any = 3;

	static INFRORMATION: any = 4;

	static CUSTOM: any = 5;

	static ATTACK: any = 20;

	static ITEM: any = 21;

	static TRADE: any = 22;

	static STOCK: any = 23;

	static TALK: any = 24;

	static UNITEVENT: any = 40;

	static STEAL: any = 41;

	static QUICK: any = 42;

	static FUSION: any = 50;

	static METAMORPHOZE: any = 51;
}

class SaveCallType {

	static CURRENT: any = 0;

	static COMPLETE: any = 1;
}

class SystemSettingsType {

	static SKIP: any = 0;

	static UNITMOVESOUND: any = 1;

	static ANIMESOUND: any = 2;

	static MARKING: any = 3;

	static MAPGRID: any = 4;

	static MAPHP: any = 5;

	static MAPSYMBOL: any = 6;
}

class RestSaveType {

	static NOSAVE: any = 0;

	static SAVEONLY: any = 1;

	static AREA: any = 2;

	static AREANOSAVE: any = 3;
}

class RestAutoType {

	static TOP: any = 0;

	static QUEST: any = 1;

	static TALK: any = 2;
}

class ClearPointType {

	static CARRYOVER: any = 0;

	static ZERO: any = 1;

	static DEFAULT: any = 2;
}

//-----------------------------

class CommandLayoutType {

	static TITLE: any = 0;

	static BATTLESETUP: any = 1;

	static MAPCOMMAND: any = 2;

	static REST: any = 3;

	static UNITMARSHAL: any = 4;
}

class CommandActionType {

	static NEWGAME: any = 0;

	static CONTINUE: any = 1;

	static ENDGAME: any = 2;

	static UNITSORTIE: any = 10;

	static UNITMARSHAL: any = 11;

	static COMMUNICATION: any = 12;

	static SHOP: any = 13;

	static BONUS: any = 14;

	static BATTLESTART: any = 15;

	static LOAD: any = 16;

	static SAVE: any = 17;

	static CONFIG: any = 20;

	static OBJECTIVE: any = 21;

	static TALKCHECK: any = 22;

	static UNITSUMMARY: any = 23;

	static SKILL: any = 24;

	static SWITCH: any = 25;

	static VARIABLE: any = 26;

	static TURNEND: any = 27;

	static EXTRA: any = 30;

	static RECOLLECTION: any = 31;

	static CHARACTER: any = 32;

	static WORD: any = 33;

	static GALLERY: any = 34;

	static SOUNDROOM: any = 35;

	static QUEST: any = 40;

	static IMAGETALK: any = 41;

	static NEXT: any = 42;

	static SHOPLIST: any = 43;

	static EXPERIENCEDISTRIBUTION: any = 44;
}

class CommandVisibleType {

	static SHOW: any = 0;

	static SWITCH: any = 1;

	static TESTPLAY: any = 2;

	static HIDE: any = 3;
}

//-----------------------------

class MessageLayout {

	static TOP: any = 0;

	static CENTER: any = 1;

	static BOTTOM: any = 2;

	static TEROP: any = 3;

	static STILL: any = 4;
}

class FaceVisualType {

	static VISIBLE: any = 0;

	static INVISIBLE: any = 1;
}

class CharIllustVisualType {

	static LEFT: any = 0;

	static CENTER: any = 1;

	static RIGHT: any = 2;

	static NONE: any = 3;
}

//-----------------------------

class UnitFilterFlag {

	static PLAYER: any = 0x01;

	static ENEMY: any = 0x02;

	static ALLY: any = 0x04;

	static OPTIONAL: any = 0x08;
}

class ClassOptionFlag {

	static WAND: any = 0x01;

	static KEY: any = 0x02;

	static STOCK: any = 0x04;

	static REPEATMOVE: any = 0x08;

	static STATEICONDISABLED: any = 0x10;

	static HPGUAGEDISABLED: any = 0x20;
}

class KeyFlag {

	static TREASURE: any = 0x01;

	static GATE: any = 0x02;

	static ALL: any = 0x03;
}

class TrophyFlag {

	static ITEM: any = 0x01;

	static GOLD: any = 0x02;

	static BONUS: any = 0x04;
}

class DifficultyFlag {

	static ROUNDATTACK: any = 0x1;

	static CRITICAL: any = 0x2;

	static INJURY: any = 0x4;

	static GROWTH: any = 0x8;

	static COUNTERATTACK: any = 0x20;

	static NEWGAMEPLUS: any = 0x40;
}

class ClassMotionFlag {

	static FIGHTER: any = 0x01;

	static ARCHER: any = 0x02;

	static MAGE: any = 0x04;
}

class PlaceEventFilterFlag {

	static VILLAGE: any = 0x01;

	static TREASURE: any = 0x02;

	static OCCUPATION: any = 0x04;

	static SHOP: any = 0x08;

	static GATE: any = 0x10;

	static WAIT: any = 0x20;

	static INFORMATION: any = 0x40;

	static CUSTOM: any = 0x1000;
}

class UnitStateChangeFlag {

	static WAIT: any = 0x01;

	static INVISIBLE: any = 0x02;

	static IMMORTAL: any = 0x04;

	static INJURY: any = 0x08;

	static BADSTATEGUARD: any = 0x10;

	static SORTIE: any = 0x20;

	static DIRECTION: any = 0x100;
}

//----------------------------

class AppScreenMode {

	static WINDOW: any = 0;

	
	// Return value of root.getAppScreenMode.
	static HARDFULLSCREEN: any = 1;

	static SOFTFULLSCREEN: any = 2;

	
	// Argument of root.setAppScreenMode.
	static FULLSCREEN: any = 3;
}

class LanguageCode {

	static JAPANESE: any = 1;

	static ENGLISH: any = 2;

	static SCHINESE: any = 3;

	static SPANISH: any = 4;

	static FRENCH: any = 5;

	static GERMAN: any = 6;

	static TCHINESE: any = 8;
}

//----------------------------

class GradientType {

	static RADIAL: any = 0;

	static LINEAR: any = 1;
}

//----------------------------

class BlendMode {

	static NORMAL: any = -1;

	static MULTIPLY: any = 0;

	static SCREEN: any = 1;

	static DARKEN: any = 2;

	static LIGHTEN: any = 3;

	static DISSOLVE: any = 4;

	static COLOR_BURN: any = 5;

	static LINEAR_BURN: any = 6;

	static DARKER_COLOR: any = 7;

	static LIGHTER_COLOR: any = 8;

	static COLOR_DODGE: any = 9;

	static LINEAR_DODGE: any = 10;

	static OVERLAY: any = 11;

	static SOFT_LIGHT: any = 12;

	static HARD_LIGHT: any = 13;

	static VIVID_LIGHT: any = 14;

	static LINEAR_LIGHT: any = 15;

	static PIN_LIGHT: any = 16;

	static HARD_MIX: any = 17;

	static DIFFERENCE: any = 18;

	static EXCLUSION: any = 19;

	static HUE: any = 20;

	static SATURATION: any = 21;

	static COLOR: any = 22;

	static LUMINOSITY: any = 23;

	static SUBTRACT: any = 24;

	static DIVISION: any = 25;
}

class CompositeMode {

	static SOURCE_OVER: any = 0;

	static DESTINATION_OVER: any = 1;

	static SOURCE_IN: any = 2;

	static DESTINATION_IN: any = 3;

	static SOURCE_OUT: any = 4;

	static DESTINATION_OUT: any = 5;

	static SOURCE_ATOP: any = 6;

	static DESTINATION_ATOP: any = 7;

	static XOR: any = 8;

	static PLUS: any = 9;

	static SOURCE_COPY: any = 10;

	static BOUNDED_SOURCE_COPY: any = 11;

	static MASK_INVERT: any = 12;
}

//----------------------------

class VideoState {

	static PLAY: any = 3;

	static PAUSED: any = 4;

	static STOPPED: any = 5;
}

//----------------------------

class InputDeviceType {

	static DIRECTINPUT: any = 0;

	static XINPUT: any = 1;
}

//----------------------------

class GraphicsType {

	static MAPCHIP: any = 0;

	static CHARCHIP: any = 1;

	static FACE: any = 2;

	static ICON: any = 3;

	static MOTION: any = 4;

	static EFFECT: any = 5;

	static WEAPON: any = 6;

	static BOW: any = 7;

	static THUMBNAIL: any = 8;

	static BATTLEBACK: any = 9;

	static EVENTBACK: any = 10;

	static SCREENBACK: any = 11;

	static WORLDMAP: any = 12;

	static EVENTSTILL: any = 13;

	static CHARILLUST: any = 14;

	static PICTURE: any = 15;
}

class UIType {

	static MENUWINDOW: any = 0;

	static TEXTWINDOW: any = 1;

	static TITLE: any = 2;

	static NUMBER: any = 3;

	static BIGNUMBER: any = 4;

	static GAUGE: any = 5;

	static LINE: any = 6;

	static RISECURSOR: any = 7;

	static MAPCURSOR: any = 8;

	static PAGECURSOR: any = 9;

	static SELECTCURSOR: any = 10;

	static SCROLLBAR: any = 11;

	static PANEL: any = 12;

	static FACEFRAME: any = 13;

	static SCREENFRAME: any = 14;
}

class MediaType {

	static MUSIC: any = 0;

	static SE: any = 1;
}

class GraphicsFormat {

	static MAPCHIP_WIDTH: any = 32;

	static MAPCHIP_HEIGHT: any = 32;

	static CHARCHIP_WIDTH: any = 64;

	static CHARCHIP_HEIGHT: any = 64;

	static FACE_WIDTH: any = 96;

	static FACE_HEIGHT: any = 96;

	static ICON_WIDTH: any = 24;

	static ICON_HEIGHT: any = 24;

	static MOTION_WIDTH: any = 192;

	static MOTION_HEIGHT: any = 192;

	static EFFECT_WIDTH: any = 192;

	static EFFECT_HEIGHT: any = 192;

	static WEAPON_WIDTH: any = 192;

	static WEAPON_HEIGHT: any = 40;

	static BOW_WIDTH: any = 300;

	static BOW_HEIGHT: any = 192;

	static THUMBNAIL_WIDTH: any = 120;

	static THUMBNAIL_HEIGHT: any = 90;

	
	// The following size is the lowest value.
	
	static BATTLEBACK_WIDTH: any = 840;

	static BATTLEBACK_HEIGHT: any = 480;

	static EVENTBACK_WIDTH: any = 640;

	static EVENTBACK_HEIGHT: any = 480;

	static SCREENBACK_WIDTH: any = 640;

	static SCREENBACK_HEIGHT: any = 480;

	static WORLDMAP_WIDTH: any = 640;

	static WORLDMAP_HEIGHT: any = 480;

	static EVENTSTILL_WIDTH: any = 640;

	static EVENTSTILL_HEIGHT: any = 480;

	static CHARILLUST_WIDTH: any = 1;

	static CHARILLUST_HEIGHT: any = 1;

	static PICTURE_WIDTH: any = 1;

	static PICTURE_HEIGHT: any = 1;
}

class UIFormat {

	static MENUWINDOW_WIDTH: any = 128;

	static MENUWINDOW_HEIGHT: any = 64;

	
	// This size is the lowest value.
	static TEXTWINDOW_WIDTH: any = 640;

	static TEXTWINDOW_HEIGHT: any = 110;

	static TITLE_WIDTH: any = 90;

	static TITLE_HEIGHT: any = 60;

	static NUMBER_WIDTH: any = 100;

	static NUMBER_HEIGHT: any = 120;

	static BIGNUMBER_WIDTH: any = 160;

	static BIGNUMBER_HEIGHT: any = 120;

	static GAUGE_WIDTH: any = 30;

	static GAUGE_HEIGHT: any = 56;

	static LINE_WIDTH: any = 24;

	static LINE_HEIGHT: any = 32;

	static RISECURSOR_WIDTH: any = 48;

	static RISECURSOR_HEIGHT: any = 48;

	static MAPCURSOR_WIDTH: any = 64;

	static MAPCURSOR_HEIGHT: any = 32;

	static PAGECURSOR_WIDTH: any = 64;

	static PAGECURSOR_HEIGHT: any = 32;

	static SELECTCURSOR_WIDTH: any = 64;

	static SELECTCURSOR_HEIGHT: any = 64;

	static SCROLLCURSOR_WIDTH: any = 128;

	static SCROLLCURSOR_HEIGHT: any = 64;

	static PANEL_WIDTH: any = 64;

	static PANEL_HEIGHT: any = 32;

	static FACEFRAME_WIDTH: any = 256;

	static FACEFRAME_HEIGHT: any = 128;

	
	// This size is the lowest value.
	static SCREENFRAME_WIDTH: any = 640;

	static SCREENFRAME_HEIGHT: any = 100;
}

//-----------------------------------

class EventResult {

	static OK: any = 0;

	static CANCEL: any = 1;

	static PENDING: any = 2;
}

class CycleResult {

	static CONTINUE: any = true;

	static END: any = false;
}

class EnterResult {

	static OK: any = true;

	static NOTENTER: any = false;
}

class OrderMarkType {

	static FREE: any = 0;

	static EXECUTED: any = 1;
}

class ActionTargetType {

	static UNIT: any = 0;

	static SINGLE: any = 1;

	static KEY: any = 2;

	static ENTIRERECOVERY: any = 3;

	static RESURRECTION: any = 4;
}

class UnitStatusType {

	static NORMAL: any = 0;

	static UNITMENU: any = 1;
}

class AttackStartType {

	static NORMAL: any = 0;

	static FORCE: any = 1;
}

class MoveResult {

	static SELECT: any = 0;

	static CANCEL: any = 1;

	static CONTINUE: any = 200;

	static END: any = 800;
}

class AIValue {

	static MAX_MOVE: any = 500;

	static MIN_SCORE: any = -1;
}

class MessageEraseFlag {

	static TOP: any = 0x01;

	static CENTER: any = 0x02;

	static BOTTOM: any = 0x04;

	static ALL: any = 0x7;
}

class ItemIdValue {

	static BASE: any = 100000;
}

class MapIdValue {

	static COMPLETE: any = -1;
}

class WeaponLimitValue {

	static BROKEN: any = -1;
}

class MotionIdValue {

	static NONE: any = -1;
}

class ChronicInjuryHp {

	static ZERO: any = 0;
}

var XPoint = [-1, 0, 1, 0];

var YPoint = [0, -1, 0, 1];
