"use strict";

function RecordQ(e) {
	this.e = e;
}

RecordQ.prototype.ev = function(env) {
	var eEv = this.e.ev(env);
	
	if(eEv instanceof Record) return new Bool(true);
	else return new Bool(false);
}

RecordQ.prototype.accept = function(visitor, state) {
	return visitor.visitRecordQ(this, state);
}

RecordQ.prototype.toString = function() {
	return '(record? ' + this.e + ')';
}