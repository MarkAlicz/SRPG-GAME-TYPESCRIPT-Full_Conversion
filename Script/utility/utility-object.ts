
class SimpleBalancer extends BaseObject {
	_isUp: any;


	_counter: any = null;

	_curValue: any = 0;

	_maxValue: any = 0;

	_speed: any = 0;

	_intervalArray: any = null;

	_limitValue: any = 0;

	_isMoving: any = false;

	initialize() {
		this._counter = createObject(CycleCounter);
	}

	setBalancerInfo(curValue?, maxValue?) {
		this._curValue = curValue;
		this._maxValue = maxValue;
		this._speed = 5;
	}

	setBalancerSpeed(speed?) {
		this._speed = speed;
	}

	moveBalancer() {
		var isLast;
		
		if (this._counter === null) {
			return MoveResult.END;
		}
		
		if (!this._isMoving) {
			return MoveResult.END;
		}
	
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			if (this._isUp) {
				isLast = this._increaseValue();
			}
			else {
				isLast = this._decreaseValue();
			}
			
			// It reached at the limit value. Or check if it raised as it needs.
			if (isLast) {
				this._isMoving = false;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	startBalancerMove(value?) {
		this._isUp = value > 0;
		
		// this._curValue increases and decreases according to the number of value.
		// But it doesn't mean that this._curValue becomes value.
		this._intervalArray = this._calculateInterval(value);
		this._limitValue = this._calculateLimitValue(value);
		
		// Check if the current value and the maximum value are identical, or the rise rate is 0.
		if (this._curValue === this._limitValue || value === 0) {
			this._isMoving = false;
		}
		else {
			this._counter.setCounterInfo(0);
			this._isMoving = true;
		}
	}

	getCurrentValue() {
		return this._curValue;
	}

	setCurrentValue(value?) {
		this._curValue = value;
	}

	getMaxValue() {
		return this._maxValue;
	}

	getLimitValue() {
		return this._limitValue;
	}

	isMoving() {
		return this._isMoving;
	}

	_increaseValue() {
		var d = this._intervalArray[0];
		
		this._intervalArray.shift();
		
		this._curValue += d;
		if (this._curValue >= this._limitValue) {
			this._curValue = this._limitValue;
			return true;
		}
		
		return false;
	}

	_decreaseValue() {
		var d = this._intervalArray[0];
		
		this._intervalArray.shift();
		
		this._curValue -= d;
		if (this._curValue <= this._limitValue) {
			this._curValue = this._limitValue;
			return true;
		}
		
		return false;
	}

	_calculateInterval(value?) {
		var i, interval, mod, arr;
		var count = this._speed;
		
		if (value < 0) {
			value *= -1;
		}
		
		arr = new Array(count);
		
		interval = Math.floor(value / count);
		mod = Math.floor(value % count);
		
		for (i = 0; i < count; i++) {
			arr[i] = interval;
		}
		
		for (i = 0; i < mod; i++) {
			arr[i]++;
		}
			
		return arr;
	}

	_calculateLimitValue(value?) {
		var max, min, limitValue;
		
		if (this._isUp > 0) {
			max = this._curValue + value;
			if (max > this._maxValue) {
				max = this._maxValue;
			}
			limitValue = max;
		}
		else {
			min = this._curValue + value;
			if (min < 0) {
				min = 0;
			}
			limitValue = min;
		}
		
		return limitValue;
	}
}

class GaugeBar extends BaseObject {

	_colorIndex: any = 0;

	_counter: any = null;

	_balancer: any = null;

	_partsCount: any = 0;

	initialize() {
		this._balancer = createObject(SimpleBalancer);
	}

	setGaugeInfo(value?, maxValue?, colorIndex?) {
		this._balancer.setBalancerInfo(value, maxValue);
		this._colorIndex = colorIndex;
		this._partsCount = 11;
	}

	setPartsCount(partsCount?) {
		this._partsCount = partsCount;
	}

	moveGaugeBar() {
		return this._balancer.moveBalancer();
	}

	drawGaugeBar(xBase?, yBase?, pic?) {
		var curValue = this._balancer.getCurrentValue();
		var maxValue = this._balancer.getMaxValue();
		
		ContentRenderer.drawGauge(xBase, yBase, curValue, maxValue, this._colorIndex, this.getGaugeWidth(), pic);
	}

	startMove(value?) {
		this._balancer.startBalancerMove(value);
	}

	
	// Change immediately to the specified value.
	// It's used for cutting animation.
	forceValue(value?) {
		this._balancer.setCurrentValue(value);
		this._balancer.setWaitMode();
	}

	getBalancer() {
		return this._balancer;
	}

	isMoving() {
		return this._balancer.isMoving();
	}

	getGaugeWidth() {
		return this._partsCount * 10;
	}
}

class FadeTransition extends BaseObject {

	_counter: any = null;

	_color: any = 0;

	_maxCount: any = 1;

	initialize() {
		this._counter = createObject(VolumeCounter);
	}

	moveTransition() {
		this._counter.moveVolumeCounter();
		
		if (this._counter.getRoundCount() === this._maxCount) {
			return MoveResult.END;
		}

		return MoveResult.CONTINUE;
	}

	drawTransition() {
		var alpha = this._counter.getVolume();
		var color = this._color;
	
		root.getGraphicsManager().fillRange(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight(), color, alpha);
	}

	
	// Switch from the normal screen state to the specific color.
	setDestOut() {
		this.setVolume(255, 0, 0, true);
		
		if (SceneManager.isScreenFilled()) {
			this._counter.setVolume(255);
		}
	}

	
	// Switch from the specific color screen to the normal one.
	setDestIn() {
		this.setVolume(255, 0, 255, false);
		
		if (!SceneManager.isScreenFilled()) {
			this._counter.setVolume(0);
		}
	}

	setHalfOut() {
		this.setVolume(128, 0, 0, true);
	}

	setHalfIn() {
		this.setVolume(128, 0, 128, false);
	}

	setVolume(max?, min?, cur?, isUp?) {
		this._counter.setVolumeRange(max, min, cur, isUp);
	}

	setFadeSpeed(speed?) {
		this._counter.setChangeSpeed(speed);
	}

	setFadeColor(color?) {
		this._color = color;
	}

	enableDoubleFade() {
		this._maxCount = 2;
	}

	isOneFadeLast() {
		return this._counter.getRoundCount() === 1;
	}
}

// If it links with an image effect of the event command, use obj.
class SystemTransition extends FadeTransition {

	initialize() {
		var effect = root.getScreenEffect();
		
		this._counter = createObject(VolumeCounter);
		
		effect.setColor(this._color);
		effect.setRange(EffectRangeType.ALL);
	}

	setEffectRangeType(effectRangeType?) {
		var effect = root.getScreenEffect();
		
		effect.setRange(effectRangeType);
	}

	moveTransition() {
		var effect = root.getScreenEffect();
		
		this._counter.moveVolumeCounter();
		
		effect.setAlpha(this._counter.getVolume());
		
		if (this._counter.getRoundCount() === this._maxCount) {
			return MoveResult.END;
		}

		return MoveResult.CONTINUE;
	}

	drawTransition() {
	}

	setFadeColor(color?) {
		var effect = root.getScreenEffect();
		
		this._color = color;
		effect.setColor(color);
	}

	resetTransition() {
		var effect = root.getScreenEffect();
		
		effect.setAlpha(0);
	}
}

class SafeClipping extends BaseObject {

	_xPrevViewport: any = 0;

	_yPrevViewport: any = 0;

	saveClipping(clippingArea?) {
		var xNewViewport, yNewViewport;
		
		this._xPrevViewport = root.getViewportX();
		this._yPrevViewport = root.getViewportY();
		
		xNewViewport = clippingArea.getClippingX();
		yNewViewport = clippingArea.getClippingY();
		
		root.setViewportPos(xNewViewport, yNewViewport);
		root.getGraphicsManager().pushClippingArea(clippingArea);
	}

	restoreClipping() {
		root.getGraphicsManager().popClippingArea();
		root.setViewportPos(this._xPrevViewport, this._yPrevViewport);
	}
}

// If processing goes straight, not a branch, StraightFlow is often used, not MODE.
// The object which uses StraightFlow mainly prepares a method called pushFlowEntries,
// and pushes the object which is derived from BaseFlowEntry with pushFlowEntry.
// And it processes the object which was pushed by StraightFlow in order.
// These advantages of the system are that the order to process can be changed depending on the
// order of calling pushFlowEntry, and also that the developer can easily add the new processing.
class StraightFlow extends BaseObject {

	_entryIndex: any = 0;

	_entryArray: any = null;

	_flowData: any = null;

	setStraightFlowData(flowData?) {
		this._entryIndex = 0;
		this._entryArray = [];
		this._flowData = flowData;
		this.resetStraightFlow();
	}

	enterStraightFlow() {
		var i;
		var count = this._entryArray.length;
		
		for (i = this._entryIndex; i < count; i++) {
			if (this._entryArray[i].enterFlowEntry(this._flowData) === EnterResult.OK) {
				return EnterResult.OK;
			}
			
			this._entryIndex++;
		}
		
		return EnterResult.NOTENTER;
	}

	moveStraightFlow() {
		if (this._entryArray.length === 0) {
			return MoveResult.END;
		}
	
		if (this.isFlowLast()) {
			return MoveResult.END;
		}
	
		if (this._entryArray[this._entryIndex].moveFlowEntry() !== MoveResult.CONTINUE) {
			this._entryIndex++;
			// NOTENTER is returned, it means no need to enter the cycle, so end it.
			if (this.enterStraightFlow() === EnterResult.NOTENTER) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawStraightFlow() {
		if (this._entryArray.length === 0) {
			return;
		}
		
		if (this._entryArray.length <= this._entryIndex) {
			return;
		}
		
		this._entryArray[this._entryIndex].drawFlowEntry();
	}

	moveBackStraightFlow() {
		if (this._entryArray.length === 0) {
			return;
		}
		
		if (this._entryArray.length <= this._entryIndex) {
			return;
		}
		
		this._entryArray[this._entryIndex].moveBackFlowEntry();
	}

	resetStraightFlow() {
		this._entryIndex = 0;
	}

	pushFlowEntry(obj?) {
		this._entryArray.push(createObject(obj));
	}

	insertFlowEntry(obj?, index?) {
		this._entryArray.splice(index, 0, createObject(obj));
	}

	isFlowLast() {
		return this._entryArray.length <= this._entryIndex;
	}
}
