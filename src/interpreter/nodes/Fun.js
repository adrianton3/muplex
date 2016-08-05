exports.Fun = (function () {
	"use strict"

	const Closure = require('./Closure.js').Closure
	const TokenCoords = require('../../tokenizer/TokenCoords.js').TokenCoords

	function Fun (name, pformal, body, tokenCoords) {
		this.name = name
		this.pformal = pformal
		this.body = body
		this.tokenCoords = tokenCoords
	}

	Fun.prototype.ev = function (env, modSet) {
		return new Closure(env, this)
	}

	Fun.prototype.accept = function (visitor, state) {
		return visitor.visitFun(this, state)
	}

	Fun.prototype.toString = function () {
		return '(fun ' + this.name + ' ' + this.pformal + '\n' + this.body + ')'
	}

	return Fun
})()
