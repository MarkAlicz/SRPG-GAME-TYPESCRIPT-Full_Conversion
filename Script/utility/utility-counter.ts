
class CycleCounter extends BaseObject {

	_max: any = 0;

	_incrementValue: any = 0;

	_counterValue: any = 0;

	_isGameAccelerationDisabled: any = false;

	
	// Recommend that max is even number.
	setCounterInfo(max?) {
		this._max = max + 2;
		this._incrementValue = 1;
		this._counterValue = 0;
		
		// If it's 30FPS, a value to increase is double.
		if (!DataConfig.isHighPerformance()) {
			this._incrementValue *= 2;
		}
	}

	disableGameAcceleration() {
		// Disable to speed up.
		this._isGameAccelerationDisabled = true;
	}

	moveCycleCounter() {
		var result;
		
		// If speed up by pressing the cancel key, end immediately.
		if (!this._isGameAccelerationDisabled && Miscellaneous.isGameAcceleration()) {
			return MoveResult.END;
		}
		
		this._counterValue += this._incrementValue;
		if (this._counterValue >= this._max) {
			this._counterValue = 0;
			result = MoveResult.END;
		}
		else {
			result = MoveResult.CONTINUE;
		}
		
		return result;
	}

	
	// _counterValue can get larger until a value which was specified at setCounterInfo.
	getCounter() {
		return this._counterValue;
	}

	resetCounterValue() {
		this._counterValue = 0;
	}
}

class IdleCounter extends BaseObject {

	_counter: any = null;

	_nextmode: any = 0;

	initialize() {
		this._counter = createObject(CycleCounter);
	}

	setIdleInfo(max?, nextmode?) {
		this._nextmode = nextmode;
		this._counter.setCounterInfo(max);
	}

	moveIdleCounter() {
		return this._counter.moveCycleCounter();
	}

	getCounter() {
		return this._counter.getCounter();
	}

	getNextMode() {
		return this._nextmode;
	}
}

class EraseCounter extends BaseObject {

	_counter: any = null;

	_isFirst: any = true;

	initialize() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(26);
	}

	moveEraseCounter() {
		if (this._isFirst) {
			this._playEraseSound();
			this._isFirst = false;
		}
	
		return this._counter.moveCycleCounter();
	}

	getEraseAlpha() {
		var alpha = 255 - (this._counter.getCounter() * 10);
		
		if (alpha < 0) {
			alpha = 0;
		}
		
		return alpha;	
	}

	_playEraseSound() {
		MediaControl.soundDirect('uniterase');
	}
}

class UnitCounter extends BaseObject {

	_counter: any = null;

	_counter2: any = null;

	_unitAnimationIndex: any = 0;

	_unitAnimationIndex2: any = 0;

	initialize() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(14);
		this._counter.disableGameAcceleration();
		
		// Process for character chip which is consisted of 2 columns, not 3 columns.
		this._counter2 = createObject(CycleCounter);
		this._counter2.setCounterInfo(34);
		this._counter2.disableGameAcceleration();
	}

	moveUnitCounter() {
		var result = this._counter.moveCycleCounter();
		
		if (result !== MoveResult.CONTINUE) {
			if (++this._unitAnimationIndex === this._getAnimationArray().length) {
				this._unitAnimationIndex = 0;
			}
		}
		
		result = this._counter2.moveCycleCounter();
		if (result !== MoveResult.CONTINUE) {
			if (++this._unitAnimationIndex2 === 2) {
				this._unitAnimationIndex2 = 0;
			}
		}
	
		return result;
	}

	getAnimationIndex() {
		var arr = this._getAnimationArray();
		
		return arr[this._unitAnimationIndex];
	}

	getAnimationIndex2() {
		return this._unitAnimationIndex2;
	}

	getAnimationIndexFromUnit(unit?) {
		var index = 0;
		var type = unit.getClass().getCharChipLoopType();
		
		if (type === CharChipLoopType.NORMAL) {
			index = this.getAnimationIndex();
		}
		else if (type === CharChipLoopType.DOUBLE) {
			index = this.getAnimationIndex2();
		}
	
		return index;
	}

	_getAnimationArray() {
		return [0, 1, 2, 1];
	}
}

class VolumeCounter extends BaseObject {

	_volume: any = 0;

	_max: any = 0;

	_min: any = 0;

	_isUp: any = false;

	_roundCount: any = 0;

	_speed: any = 0;

	_isGameAccelerationDisabled: any = false;

	initialize() {
		this.setChangeSpeed(3);
	}

	disableGameAcceleration() {
		this._isGameAccelerationDisabled = true;
	}

	setChangeSpeed(speed?) {
		this._speed = speed;
		
		if (!DataConfig.isHighPerformance()) {
			this._speed *= 2;
		}
	}

	setVolumeRange(max?, min?, volume?, isUp?) {
		this._max = max;
		this._min = min;
		this._volume = volume;
		this._isUp = isUp;
		
		this._roundCount = 0;
	}

	moveVolumeCounter() {
		var d = this._speed;
		
		if (!this._isGameAccelerationDisabled && Miscellaneous.isGameAcceleration()) {
			d *= 4;
		}
		
		if (this._isUp) {
			this._volume += d;
			if (this._volume >= this._max) {
				this._volume = this._max;
				this._isUp = false;
				this._roundCount++;
			}
		}
		else {
			this._volume -= d;
			if (this._volume < this._min) {
				this._volume = this._min;
				this._isUp = true;
				this._roundCount++;
			}
		}
		
		if (this._roundCount === 3) {
			this._roundCount = 2;
		}
	
		return true;
	}

	getVolume() {
		return this._volume;
	}

	setVolume(volume?) {
		this._volume = volume;
	}

	isUp() {
		return this._isUp;
	}

	getRoundCount() {
		return this._roundCount;
	}
}
