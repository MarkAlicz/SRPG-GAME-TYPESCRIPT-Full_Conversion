// AMBIENT DECLARATIONS FOR THE SRPG STUDIO NATIVE ENGINE SURFACE
// ================================================================
// `root` is the only identifier in the entire 157-file script layer that is genuinely
// external (defined by SRPG Studio's native runtime, not by any script in this project).
// Every method below was discovered by scanning actual `root.xxx(...)` call sites across
// the converted codebase - this is NOT sourced from official SRPG Studio API documentation,
// which this conversion did not have access to. Parameter and return types are intentionally
// `any`: real signatures are unknown without the engine's own type information.
//
// This file exists to (a) stop "cannot find name 'root'" errors across every file, and
// (b) catch typos against known method names. It should be replaced with an authoritative
// version if/when SRPG Studio ships one, or refined by hand as each method's real signature
// becomes known.
//
// The objects root's methods RETURN (session, unit, item, map data, etc.) are native data
// types whose shape isn't visible anywhere in the script layer either - they are not typed
// here at all (they flow through as `any`). That is a second, larger layer of native surface
// this conversion could not recover from usage alone.

	interface RootAPI {
		changeScene(...args: any[]): any;
		closeMap(...args: any[]): any;
		createEmptyHandle(...args: any[]): any;
		createResourceHandle(...args: any[]): any;
		drawAsyncEventData(...args: any[]): any;
		drawCharChipHpGauge(...args: any[]): any;
		drawCharChipStateIcon(...args: any[]): any;
		drawCharChipSymbol(...args: any[]): any;
		drawFadeLight(...args: any[]): any;
		drawMapAll(...args: any[]): any;
		drawWavePanel(...args: any[]): any;
		duplicateItem(...args: any[]): any;
		endEventCommand(...args: any[]): any;
		endGame(...args: any[]): any;
		getAnimePreference(...args: any[]): any;
		getAppScreenMode(...args: any[]): any;
		getBacklogCommand(...args: any[]): any;
		getBacklogCommandCount(...args: any[]): any;
		getBaseData(...args: any[]): any;
		getBaseScene(...args: any[]): any;
		getChainEvent(...args: any[]): any;
		getChainEventCount(...args: any[]): any;
		getCharChipHeight(...args: any[]): any;
		getCharChipWidth(...args: any[]): any;
		getConfigInfo(...args: any[]): any;
		getCurrentScene(...args: any[]): any;
		getCurrentSession(...args: any[]): any;
		getDataEditor(...args: any[]): any;
		getDefaultMessageLayout(...args: any[]): any;
		getEventCommandObject(...args: any[]): any;
		getEventCommandType(...args: any[]): any;
		getEventExitCode(...args: any[]): any;
		getEventGenerator(...args: any[]): any;
		getExternalData(...args: any[]): any;
		getGameAreaHeight(...args: any[]): any;
		getGameAreaWidth(...args: any[]): any;
		getGlobalCustomRenderer(...args: any[]): any;
		getGraphicsManager(...args: any[]): any;
		getHpDecoration(...args: any[]): any;
		getIconDecoration(...args: any[]): any;
		getIconHeight(...args: any[]): any;
		getIconWidth(...args: any[]): any;
		getLargeFaceHeight(...args: any[]): any;
		getLargeFaceWidth(...args: any[]): any;
		getLoadSaveManager(...args: any[]): any;
		getMapChipHeight(...args: any[]): any;
		getMapChipWidth(...args: any[]): any;
		getMaterialManager(...args: any[]): any;
		getMediaManager(...args: any[]): any;
		getMetaSession(...args: any[]): any;
		getMouseX(...args: any[]): any;
		getMouseY(...args: any[]): any;
		getObjectGenerator(...args: any[]): any;
		getRandomNumber(...args: any[]): any;
		getResourceProfiler(...args: any[]): any;
		getRestPreference(...args: any[]): any;
		getSceneController(...args: any[]): any;
		getScreenEffect(...args: any[]): any;
		getStoryPreference(...args: any[]): any;
		getSymbolDecoration(...args: any[]): any;
		getUserExtension(...args: any[]): any;
		getVideoManager(...args: any[]): any;
		getViewportX(...args: any[]): any;
		getViewportY(...args: any[]): any;
		isAbsoluteHit(...args: any[]): any;
		isEventBackgroundVisible(...args: any[]): any;
		isEventSceneActived(...args: any[]): any;
		isEventSkipMode(...args: any[]): any;
		isHighPerfMode(...args: any[]): any;
		isInputAction(...args: any[]): any;
		isInputState(...args: any[]): any;
		isLargeFaceUse(...args: any[]): any;
		isMessageBlackOutEnabled(...args: any[]): any;
		isMessageWindowFixed(...args: any[]): any;
		isMouseAction(...args: any[]): any;
		isOpeningEventSkip(...args: any[]): any;
		isSystemSettings(...args: any[]): any;
		isTestPlay(...args: any[]): any;
		log(...args: any[]): any;
		msg(...args: any[]): any;
		openMap(...args: any[]): any;
		queryAnime(...args: any[]): any;
		queryCommand(...args: any[]): any;
		queryGraphicsHandle(...args: any[]): any;
		queryScreen(...args: any[]): any;
		querySoundHandle(...args: any[]): any;
		queryTextUI(...args: any[]): any;
		queryUI(...args: any[]): any;
		resetConsole(...args: any[]): any;
		resetGame(...args: any[]): any;
		resetVisualEventObject(...args: any[]): any;
		setEventExitCode(...args: any[]): any;
		setEventSkipMode(...args: any[]): any;
		setMousePos(...args: any[]): any;
		setSelfSwitch(...args: any[]): any;
		setViewportPos(...args: any[]): any;
		startBackgroundChange(...args: any[]): any;
	}

declare const root: RootAPI;
