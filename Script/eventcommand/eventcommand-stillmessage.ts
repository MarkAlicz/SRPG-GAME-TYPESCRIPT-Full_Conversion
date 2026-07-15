
class StillMessageEventCommand extends BaseEventCommand {

	_messageView: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._messageView.moveMessageView() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		if (this._messageView !== null) {
			this._messageView.drawMessageView();
		}
	}

	mainEventCommand() {
		if (this._messageView !== null) {
			this._messageView.endMessageView();
		}
	}

	_prepareEventCommandMemberData() {
		this._messageView = createObject(StillView);
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var messageViewParam = this._createMessageViewParam();
		
		this._messageView.setupMessageView(messageViewParam);
		
		return EnterResult.OK;
	}

	_createMessageViewParam() {
		var eventCommandData = root.getEventCommandObject();
		var messageViewParam = StructureBuilder.buildMessageViewParam();
		
		messageViewParam.messageLayout = this._getMessageLayout();
		messageViewParam.text = eventCommandData.getText();
		messageViewParam.pos = MessagePos.BOTTOM;
		messageViewParam.speakerType = eventCommandData.getSpeakerType();
		messageViewParam.unit = eventCommandData.getUnit();
		messageViewParam.npc = eventCommandData.getNpc();
		messageViewParam.facialExpressionId = eventCommandData.getFacialExpressionId();
		
		return messageViewParam;
	}

	_getMessageLayout() {
		return root.getDefaultMessageLayout(MessageLayout.STILL);
	}
}
