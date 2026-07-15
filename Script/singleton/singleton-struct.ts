
class ScreenBuilder {

	static buildLoadSave() : any {
		return {
			isLoad: false,
			scene: 0,
			mapId: 0,
			customObject: {}
		};
	}

	static buildUnitMenu() : any {
		return {
			unit: null,
			enummode: 0
		};
	}

	static buildShopLayout() : any {
		return {
			unit: null,
			shopLayout: null,
			itemArray: null,
			inventoryArray: null
		};
	}

	static buildBonusLayout() : any {
		return {
			unit: null,
			shopLayout: null,
			itemArray: null,
			inventoryArray: null,
			bonusArray: null
		};
	}

	static buildMultiClassChange() : any {
		return {
			unit: null,
			isMapCall: false,
			refList: null
		};
	}

	static buildResurrection() : any {
		return {
			filter: 0
		};
	}

	static buildUnitItemTrade() : any {
		return {
			unit: null,
			targetUnit: null
		};
	}

	static buildUnitItemSteal() : any {
		return {
			unit: null,
			targetUnit: null,
			stealFlag: 0,
			lockedItem: null
		};
	}

	static buildStockItemTrade() : any {
		return {
			unit: null,
			unitList: null
		};
	}

	static buildUnitSortie() : any {
		return {};
	}

	static buildMarshal() : any {
		return {
			unit: null
		};
	}

	static buildItemUse() : any {
		return {
			unit: null
		};
	}

	static buildObjective() : any {
		return {};
	}

	static buildConfig() : any {
		return {};
	}

	static buildTalkCheck() : any {
		return {};
	}

	static buildUnitSummary() : any {
		return {
			isMapCall: false
		};
	}

	static buildSwitch() : any {
		return {};
	}

	static buildVariable() : any {
		return {};
	}

	static buildCommunication() : any {
		return {};
	}

	static buildQuest() : any {
		return {};
	}

	static buildImageTalk() : any {
		return {};
	}

	static buildExtra() : any {
		return {};
	}

	static buildScreen() : any {
		return {};
	}
}

class StructureBuilder {

	static buildCostData() : any {
		return {
			posIndex: 0,
			movePoint: 0
		};
	}

	static buildCombination() : any {
		return {
			item: null,
			skill: null,
			targetUnit: null,
			targetPos: null,
			rangeMetrics: null,
			costArray: [],
			cource: [],
			plusScore: 0,
			isPriority: false,
			posIndex: 0,
			movePoint: 0
		};
	}

	static buildRangeMetrics() : any {
		return {
			startRange: 1,
			endRange: 1,
			rangeType: SelectionRangeType.MULTI
		};
	}

	static buildAttackInfo() : any {
		return {
			unitSrc: null,
			unitDest: null,
			terrain: null,
			terrainLayer: null,
			battleType: BattleType.REAL,
			attackStartType: AttackStartType.NORMAL,
			isExperienceEnabled: false,
			isDirectAttack: false,
			isMagicWeaponAttackSrc: false,
			isMagicWeaponAttackDest: false,
			isCounterattack: false,
			isPosBaseAttack: false,
			picBackground: null
		};
	}

	static buildVirtualAttackUnit() : any {
		return {
			unitSelf: null,
			hp: null,
			weapon: null,
			damageTotal: 0,
			weaponUseCount: 0,
			isWeaponLimitless: false,
			isSrc: false,
			isCounterattack: false,
			isInitiative: false,
			attackNumber: 0,
			attackCount: 0,
			roundCount: 0,
			skillFastAttack: null,
			skillContinuousAttack: null,
			motionAttackCount: 0,
			motiondDmageCount: 0,
			motionAvoidCount: 0,
			stateArray: null,
			totalStatus: null,
			isApproach: false
		};
	}

	static buildAttackEntry() : any {
		return {
			isSrc: false,
			isHit: false,
			isCritical: false,
			isFinish: false,
			isItemDecrement: false,
			damageActive: 0,
			damagePassive: 0,
			motionIdActive: 0,
			motionIdPassive: 0,
			motionActionTypeActive: 0,
			motionActionTypePassive: 0,
			moveIdActive: -1, // This property is referenced at getRealInitialPos even in battles where nothing happens (seal attacks).
			moveActionTypeActive: 0,
			skillArrayActive: null,
			skillArrayPassive: null,
			stateArrayActive: null,
			stateArrayPassive: null
		};
	}

	static buildAttackExperience() : any {
		return {
			active: null,
			activeHp: 0,
			activeDamageTotal: 0,
			passive: null,
			passiveHp: 0,
			passiveDamageTotal: 0
		};
	}

	static buildItemTargetInfo() : any {
		return {
			unit: null,
			item: null,
			targetUnit: null,
			targetPos: null,
			targetClass: null,
			targetItem: null,
			targetMetamorphoze: null,
			isPlayerSideCall: false
		};
	}

	static buildDictionaryScrollbarParam() : any {
		return {
			isRecollectionMode: false,
			funcCondition: null
		};
	}

	static buildSortiePos() : any {
		return {
			x: null,
			y: null,
			unit: null
		};
	}

	static buildReinforcementUnit() : any {
		return {
			x: 0,
			y: 0,
			xPixel: 0,
			yPixel: 0,
			direction: 0,
			unit: 0,
			unitCounter: null,
			moveCount: 0,
			isMoveFinal: false
		};
	}

	static buildMessageAnalyzerParam() : any {
		return {
			color: 0,
			font: null,
			voiceSoundHandle: null,
			pageSoundHandle: null,
			messageSpeedType: null,
			maxTextLength: -1
		};
	}

	static buildMessagePagerParam() : any {
		return {
			color: 0,
			font : null,
			picUnderLine: null,
			rowCount: 0,
			isScrollLocked: false
		};
	}

	static buildParserInfo() : any {
		return {
			defaultColor: 0,
			defaultFont: null,
			maxTextLength: 0,
			wait: 0,
			autoWait: 0,
			speed: -1,
			voiceRefId: -1,
			isVoiceIncluded: true
		};
	}

	static buildLevelupViewParam() : any {
		return {
			targetUnit: null,
			getExp: 0,
			xAnime: 0,
			yAnime: 0,
			anime: 0,
			growthArray: null
		};
	}

	static buildMessageViewParam() : any {
		return {
			messageLayout: null,
			text: null,
			pos: 0,
			speakerType: 0,
			handle: null,
			unit: null,
			npc: null,
			facialExpressionId: 0,
			isNameDisplayable: true,
			isWindowDisplayable: true
		};
	}

	static buildAttackParam() : any {
		return {
			unit: null,
			targetUnit: null,
			attackStartType: 0,
			forceBattleObject: null,
			fusionAttackData: null
		};
	}

	static buildFusionParam() : any {
		return {
			parentUnit: null,
			targetUnit: null,
			fusionData: 0,
			direction: null
		};
	}

	static buildScrollTextParam() : any {
		return {
			margin: 0,
			x: 0,
			speed: 0,
			text: null
		};
	}

	static buildMultiClassEntry() : any {
		return {
			name: null,
			isChange: false,
			cls: null
		};
	}

	static buildListEntry() : any {
		return {
			name: null,
			isAvailable: false,
			data: null
		};
	}

	static buildMixSkillEntry() : any {
		return {
			objecttype: 0,
			skill: false
		};
	}

	static buildStatusEntry() : any {
		return {
			type: 0,
			param: 0,
			bonus: 0,
			index: 0,
			isRenderable: false
		};
	}

	static buildUnitRenderParam() : any {
		return {
			animationIndex: 1,
			direction: DirectionType.NULL,
			colorIndex: -1,
			handle: null,
			alpha: 255,
			degree: 0,
			isReverse: false,
			isScroll: false
		};
	}

	static buildGraphicsRenderParam() : any {
		return {
			alpha: 255,
			isReverse: false,
			degree: 0
		};
	}

	static buildMotionParam() : any {
		return {
			animeData: null,
			unit: null,
			x: 0,
			y: 0,
			isRight: false,
			motionColorIndex: 0,
			motionId: -1,
			versusType: VersusType.NONE
		};
	}

	static buildAnimeRenderParam() : any {
		return {
			alpha: 255,
			isRight: false,
			motionColorIndex: 0,
			parentMotion: null,
			offsetX: 0,
			offsetY: 0
		};
	}

	static buildAnimeCoordinates() : any {
		return {
			xBase: 0,
			yBase: 0,
			xCenter: 0,
			yCenter: 0,
			keySpriteWidth: 0,
			keySpriteHeight: 0,
			dx: 0,
			dy: 0
		};
	}

	static buildDataList() : any {
		return {
			_arr: null,
			
			setDataArray: function(arr) {
				this._arr = arr;
			},
			
			getCount: function() {
				return this._arr.length;
			},
			
			getData: function(index) {
				var count = this._arr.length;
				
				if (index < 0 || index > count - 1) {
					return null;
				}
				
				return this._arr[index];
			},
			
			exchangeUnit: function(unitSrc, unitDest) {
				var i;
				var srcIndex = 0;
				var destIndex = 0;
				var count = this._arr.length;
				
				for (i = 0; i < count; i++) {
					if (this._arr[i] === unitSrc) {
						srcIndex = i;
					}
					else if (this._arr[i] === unitDest) {
						destIndex = i;
					}
				}
				
				this._arr[srcIndex] = unitDest;
				this._arr[destIndex] = unitSrc;
			}
		};
	}
}
